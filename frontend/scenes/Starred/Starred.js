// @flow
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import CenteredContent from 'components/CenteredContent';
import { ListPlaceholder } from 'components/LoadingPlaceholder';
import PageTitle from 'components/PageTitle';
import DocumentList from 'components/DocumentList';
import DocumentsStore from 'stores/DocumentsStore';

@observer class Starred extends Component {
  props: {
    documents: DocumentsStore,
  };

  componentDidMount() {
    this.props.documents.fetchStarred();
  }

  render() {
    const { isLoaded, isFetching } = this.props.documents;

    return (
      <CenteredContent column auto>
        <PageTitle title="Starred" />
        <h1>Starred</h1>
        {!isLoaded && isFetching && <ListPlaceholder />}
        <DocumentList documents={this.props.documents.starred} />
      </CenteredContent>
    );
  }
}

export default inject('documents')(Starred);
