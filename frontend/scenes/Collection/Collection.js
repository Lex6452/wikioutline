// @flow
import React from 'react';
import { observer } from 'mobx-react';
import keydown from 'react-keydown';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import _ from 'lodash';
import CollectionStore from './CollectionStore';

import Layout, { Title } from 'components/Layout';
import AtlasPreviewLoading from 'components/AtlasPreviewLoading';
import CenteredContent from 'components/CenteredContent';
import DocumentList from 'components/DocumentList';
import Divider from 'components/Divider';
import { Flex } from 'reflexbox';

import styles from './Collection.scss';

type Props = {
  params: Object,
  history: Object,
  match: Object,
  keydown: Object,
};

@keydown(['c'])
@observer
class Collection extends React.Component {
  props: Props;
  store: CollectionStore;

  constructor(props: Props) {
    super(props);
    this.store = new CollectionStore();
  }

  componentDidMount = () => {
    const { id } = this.props.match.params;
    this.store.fetchCollection(id, data => {
      // Forward directly to root document
      if (data.type === 'atlas') {
        this.props.history.replace(data.navigationTree.url);
      }
    });
  };

  componentWillReceiveProps = (nextProps: Props) => {
    const key = nextProps.keydown.event;
    if (key) {
      if (key.key === 'c') {
        _.defer(this.onCreate);
      }
    }
  };

  onCreate = (event: Event) => {
    if (event) event.preventDefault();
    this.store.collection &&
      this.props.history.push(`${this.store.collection.url}/new`);
  };

  render() {
    const collection = this.store.collection;

    let actions;
    let title;
    let titleText;

    if (collection) {
      actions = (
        <Flex>
          <a onClick={this.onCreate}>
            New document
          </a>
        </Flex>
      );
      title = <Title content={collection.name} />;
      titleText = collection.name;
    }

    return (
      <Layout actions={actions} title={title} titleText={titleText}>
        <CenteredContent>
          <ReactCSSTransitionGroup
            transitionName="fadeIn"
            transitionAppear
            transitionAppearTimeout={0}
            transitionEnterTimeout={0}
            transitionLeaveTimeout={0}
          >
            {this.store.isFetching
              ? <AtlasPreviewLoading />
              : collection &&
                  <div className={styles.container}>
                    <div className={styles.atlasDetails}>
                      <h2>{collection.name}</h2>
                      <blockquote>
                        {collection.description}
                      </blockquote>
                    </div>

                    <Divider />

                    <DocumentList
                      documents={collection.recentDocuments}
                      preview
                    />
                  </div>}
          </ReactCSSTransitionGroup>
        </CenteredContent>
      </Layout>
    );
  }
}
export default Collection;
