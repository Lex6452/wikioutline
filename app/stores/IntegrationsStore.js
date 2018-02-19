// @flow
import { observable, computed, action, runInAction, ObservableMap } from 'mobx';
import { client } from 'utils/ApiClient';
import _ from 'lodash';
import invariant from 'invariant';
import stores from './';
import ErrorsStore from './ErrorsStore';
import BaseStore from './BaseStore';

import Integration from 'models/Integration';
import type { PaginationParams } from 'types';

class IntegrationsStore extends BaseStore {
  @observable data: Map<string, Integration> = new ObservableMap([]);
  @observable isLoaded: boolean = false;
  @observable isFetching: boolean = false;

  errors: ErrorsStore;

  @computed
  get orderedData(): Integration[] {
    return _.sortBy(this.data.values(), 'name');
  }

  @computed
  get slackIntegrations(): Integration[] {
    return _.filter(this.orderedData, { serviceId: 'slack' });
  }

  @action
  fetchPage = async (options: ?PaginationParams): Promise<*> => {
    this.isFetching = true;

    try {
      const res = await client.post('/integrations.list', options);
      invariant(res && res.data, 'Integrations list not available');
      const { data } = res;
      runInAction('IntegrationsStore#fetchPage', () => {
        data.forEach(integration => {
          this.data.set(integration.id, new Integration(integration));
        });
        this.isLoaded = true;
      });
      return res;
    } catch (e) {
      this.errors.add('Failed to load integrations');
    } finally {
      this.isFetching = false;
    }
  };

  @action
  add = (data: Integration): void => {
    this.data.set(data.id, data);
  };

  @action
  remove = (id: string): void => {
    this.data.delete(id);
  };

  getById = (id: string): ?Integration => {
    return this.data.get(id);
  };

  constructor() {
    super();
    this.errors = stores.errors;

    this.on('integrations.delete', (data: { id: string }) => {
      this.remove(data.id);
    });
  }
}

export default IntegrationsStore;
