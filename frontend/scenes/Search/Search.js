// @flow
import React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Flex } from 'reflexbox';

import SearchField from './components/SearchField';
import styles from './Search.scss';
import SearchStore from './SearchStore';

import Layout from 'components/Layout';
import CenteredContent from 'components/CenteredContent';
import DocumentPreview from 'components/DocumentPreview';

type Props = {
  notFound: ?boolean,
};

@observer class Search extends React.Component {
  props: Props;
  store: SearchStore;

  constructor(props: Props) {
    super(props);
    this.store = new SearchStore();
  }

  render() {
    const search = _.debounce(searchTerm => {
      this.store.search(searchTerm);
    }, 250);

    return (
      <Layout titleText="Search" search={false} loading={this.store.isFetching}>
        <CenteredContent>
          {this.props.notFound &&
            <div>
              <h1>Not Found</h1>
              <p>We're unable to find the page you're accessing.</p>
              <hr />
            </div>}

          <Flex column auto>
            <Flex auto>
              <img
                src={require('assets/icons/search.svg')}
                className={styles.icon}
                alt="Search"
              />
              <SearchField
                searchTerm={this.store.searchTerm}
                onChange={search}
              />
            </Flex>
            {this.store.documents &&
              this.store.documents.map(document => {
                return (
                  <DocumentPreview key={document.id} document={document} />
                );
              })}
          </Flex>
        </CenteredContent>
      </Layout>
    );
  }
}

export default Search;
