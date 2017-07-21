// @flow
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'mobx-react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import Flex from 'components/Flex';

import stores from 'stores';
import DocumentsStore from 'stores/DocumentsStore';
import CollectionsStore from 'stores/CollectionsStore';
import CacheStore from 'stores/CacheStore';

import 'normalize.css/normalize.css';
import 'styles/base.scss';
import 'styles/fonts.css';
import 'styles/transitions.scss';
import 'styles/prism-tomorrow.scss';
import 'styles/hljs-github-gist.scss';

import Home from 'scenes/Home';
import Dashboard from 'scenes/Dashboard';
import Starred from 'scenes/Starred';
import Collection from 'scenes/Collection';
import Document from 'scenes/Document';
import Search from 'scenes/Search';
import SlackAuth from 'scenes/SlackAuth';
import Flatpage from 'scenes/Flatpage';
import ErrorAuth from 'scenes/ErrorAuth';
import Error404 from 'scenes/Error404';

import ScrollToTop from 'components/ScrollToTop';
import Layout from 'components/Layout';
import RouteSidebarHidden from 'components/RouteSidebarHidden';

import flatpages from 'static/flatpages';

let DevTools;
if (__DEV__) {
  DevTools = require('mobx-react-devtools').default; // eslint-disable-line global-require
}

let authenticatedStores;

type AuthProps = {
  children?: React.Element<any>,
};

const Auth = ({ children }: AuthProps) => {
  if (stores.auth.authenticated && stores.auth.team) {
    // Only initialize stores once. Kept in global scope
    // because otherwise they will get overriden on route
    // change
    if (!authenticatedStores) {
      // Stores for authenticated user
      const user = stores.auth.getUserStore();
      const cache = new CacheStore(user.user.id);
      authenticatedStores = {
        user,
        documents: new DocumentsStore({
          ui: stores.ui,
          cache,
        }),
        collections: new CollectionsStore({
          ui: stores.ui,
          teamId: user.team.id,
          cache,
        }),
      };

      authenticatedStores.collections.fetchAll();
    }

    return (
      <Flex auto>
        <Provider {...authenticatedStores}>
          {children}
        </Provider>
      </Flex>
    );
  } else {
    return <Redirect to="/" />;
  }
};

const notFoundSearch = () => <Search notFound />;
const Api = () => <Flatpage title="API" content={flatpages.api} />;
const DocumentNew = () => <Document newDocument />;
const RedirectDocument = ({ match }: { match: Object }) => (
  <Redirect to={`/doc/${match.params.documentSlug}`} />
);

const matchDocumentSlug = ':documentSlug([0-9a-zA-Z-]*-[a-zA-z0-9]{10,15})';

render(
  <div style={{ display: 'flex', flex: 1, height: '100%' }}>
    <Provider {...stores}>
      <Router>
        <ScrollToTop>
          <Switch>
            <Route exact path="/" component={Home} />

            <Route exact path="/auth/slack" component={SlackAuth} />
            <Route exact path="/auth/slack/commands" component={SlackAuth} />
            <Route exact path="/auth/error" component={ErrorAuth} />

            <Auth>
              <Layout>
                <Switch>
                  <Route exact path="/dashboard" component={Dashboard} />
                  <Route exact path="/starred" component={Starred} />
                  <Route exact path="/collections/:id" component={Collection} />
                  <Route
                    exact
                    path={`/d/${matchDocumentSlug}`}
                    component={RedirectDocument}
                  />
                  <Route
                    exact
                    path={`/doc/${matchDocumentSlug}`}
                    component={Document}
                  />

                  <Route exact path="/search" component={Search} />
                  <Route exact path="/search/:query" component={Search} />
                  <Route exact path="/developers" component={Api} />

                  <Route path="/404" component={Error404} />

                  <RouteSidebarHidden
                    exact
                    path={`/doc/${matchDocumentSlug}/:edit`}
                    component={Document}
                  />
                  <RouteSidebarHidden
                    exact
                    path="/collections/:id/new"
                    component={DocumentNew}
                  />
                  <Route component={notFoundSearch} />
                </Switch>
              </Layout>
            </Auth>
          </Switch>
        </ScrollToTop>
      </Router>
    </Provider>
    {DevTools && <DevTools position={{ bottom: 0, right: 0 }} />}
  </div>,
  document.getElementById('root')
);

window.authenticatedStores = authenticatedStores;
