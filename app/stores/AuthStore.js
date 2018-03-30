// @flow
import { observable, action, computed, autorun, runInAction } from 'mobx';
import invariant from 'invariant';
import Cookie from 'js-cookie';
import localForage from 'localforage';
import { client } from 'utils/ApiClient';
import type { User, Team } from 'shared/types';

const AUTH_STORE = 'AUTH_STORE';

class AuthStore {
  @observable user: ?User;
  @observable team: ?Team;
  @observable token: ?string;
  @observable oauthState: string;
  @observable isLoading: boolean = false;
  @observable isSuspended: boolean = false;
  @observable suspendedContactEmail: ?string;

  /* Computed */

  @computed
  get authenticated(): boolean {
    return !!this.token;
  }

  @computed
  get asJson(): string {
    return JSON.stringify({
      user: this.user,
      team: this.team,
      token: this.token,
      oauthState: this.oauthState,
    });
  }

  @action
  fetch = async () => {
    try {
      const res = await client.post('/auth.info');
      invariant(res && res.data, 'Auth not available');

      runInAction('AuthStore#fetch', () => {
        this.user = res.data.user;
        this.team = res.data.team;
      });
    } catch (err) {
      if (err.error.error === 'user_suspended') {
        this.isSuspended = true;
        this.suspendedContactEmail = err.error.data.adminEmail;
      }
    }
  };

  @action
  logout = async () => {
    this.user = null;
    this.token = null;

    Cookie.remove('loggedIn', { path: '/' });
    await localForage.clear();
    window.location.href = BASE_URL;
  };

  @action
  getOauthState = () => {
    const state = Math.random()
      .toString(36)
      .substring(7);
    this.oauthState = state;
    return this.oauthState;
  };

  @action
  authWithSlack = async (code: string, state: string) => {
    // in the case of direct install from the Slack app store the state is
    // created on the server and set as a cookie
    const serverState = Cookie.get('state', { path: '/' });
    if (state !== this.oauthState && state !== serverState) {
      return {
        success: false,
      };
    }

    let res;
    try {
      res = await client.post('/auth.slack', { code });
    } catch (e) {
      return {
        success: false,
      };
    }

    // State can only ever be used once so now's the time to remove it.
    Cookie.remove('state', { path: '/' });

    invariant(
      res && res.data && res.data.user && res.data.team && res.data.accessToken,
      'All values should be available'
    );
    this.user = res.data.user;
    this.team = res.data.team;
    this.token = res.data.accessToken;

    return {
      success: true,
    };
  };

  constructor() {
    // Rehydrate
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(AUTH_STORE) || '{}');
    } catch (_) {
      // no-op Safari private mode
    }
    this.user = data.user;
    this.team = data.team;
    this.token = data.token;
    this.oauthState = data.oauthState;

    autorun(() => {
      try {
        localStorage.setItem(AUTH_STORE, this.asJson);
      } catch (_) {
        // no-op Safari private mode
      }
    });
  }
}

export default AuthStore;
