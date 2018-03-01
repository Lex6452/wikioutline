// @flow
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import Document from 'models/Document';
import UiStore from 'stores/UiStore';
import MoreIcon from 'components/Icon/MoreIcon';
import { documentMoveUrl } from 'utils/routeHelpers';
import { DropdownMenu, DropdownMenuItem } from 'components/DropdownMenu';

@observer
class DocumentMenu extends Component {
  props: {
    ui: UiStore,
    label?: React$Element<any>,
    history: Object,
    document: Document,
  };

  handleNewChild = () => {
    const { history, document } = this.props;
    history.push(
      `${document.collection.url}/new?parentDocument=${document.id}`
    );
  };

  handleDelete = () => {
    const { document } = this.props;
    this.props.ui.setActiveModal('document-delete', { document });
  };

  handleMove = () => {
    this.props.history.push(documentMoveUrl(this.props.document));
  };

  handlePin = () => {
    this.props.document.pin();
  };

  handleUnpin = () => {
    this.props.document.unpin();
  };

  handleStar = () => {
    this.props.document.star();
  };

  handleUnstar = () => {
    this.props.document.unstar();
  };

  handleExport = () => {
    this.props.document.download();
  };

  render() {
    const { document, label } = this.props;
    const isDraft = !document.publishedAt;

    return (
      <DropdownMenu label={label || <MoreIcon />}>
        {!isDraft && (
          <React.Fragment>
            {document.pinned ? (
              <DropdownMenuItem onClick={this.handleUnpin}>
                Unpin
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={this.handlePin}>Pin</DropdownMenuItem>
            )}
            {document.starred ? (
              <DropdownMenuItem onClick={this.handleUnstar}>
                Unstar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={this.handleStar}>
                Star
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={this.handleNewChild}
              title="Create a new child document for the current document"
            >
              New child
            </DropdownMenuItem>
            <DropdownMenuItem onClick={this.handleMove}>Move…</DropdownMenuItem>
          </React.Fragment>
        )}
        <DropdownMenuItem onClick={this.handleExport}>
          Download
        </DropdownMenuItem>
        <DropdownMenuItem onClick={window.print}>Print</DropdownMenuItem>
        <DropdownMenuItem onClick={this.handleDelete}>Delete…</DropdownMenuItem>
      </DropdownMenu>
    );
  }
}

export default withRouter(inject('ui')(DocumentMenu));
