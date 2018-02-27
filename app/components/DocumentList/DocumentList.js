// @flow
import React from 'react';
import Document from 'models/Document';
import DocumentPreview from 'components/DocumentPreview';
import ArrowKeyNavigation from 'boundless-arrow-key-navigation';

class DocumentList extends React.Component {
  props: {
    documents: Document[],
    limit?: number,
  };

  render() {
    const { limit } = this.props;
    const documents = limit
      ? this.props.documents.splice(0, limit)
      : this.props.documents;

    return (
      <ArrowKeyNavigation
        mode={ArrowKeyNavigation.mode.VERTICAL}
        defaultActiveChildIndex={0}
      >
        {documents.map(document => (
          <DocumentPreview key={document.id} document={document} />
        ))}
      </ArrowKeyNavigation>
    );
  }
}

export default DocumentList;
