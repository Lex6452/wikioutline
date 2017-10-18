// @flow
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import styled from 'styled-components';

import Collection from 'models/Collection';
import UiStore from 'stores/UiStore';
import Icon from 'components/Icon';
import Flex from 'components/Flex';
import { DropdownMenu, DropdownMenuItem } from 'components/DropdownMenu';

@observer class CollectionMenu extends Component {
  props: {
    label?: React$Element<any>,
    onOpen?: () => void,
    onClose?: () => void,
    onImport?: () => void,
    history: Object,
    ui: UiStore,
    collection: Collection,
  };

  onNewDocument = () => {
    const { collection, history } = this.props;
    history.push(`${collection.url}/new`);
  };

  onEdit = () => {
    const { collection } = this.props;
    this.props.ui.setActiveModal('collection-edit', { collection });
  };

  onDelete = () => {
    const { collection } = this.props;
    this.props.ui.setActiveModal('collection-delete', { collection });
  };

  render() {
    const { collection, label, onShow, onClose, onImport } = this.props;
    const { allowDelete } = collection;

    return (
      <DropdownMenu
        label={label || <MoreIcon type="MoreHorizontal" />}
        onOpen={onOpen}
        onClose={onClose}
      >
        {collection &&
          <Flex column>
            <DropdownMenuItem onClick={this.onNewDocument}>
              New document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport}>
              Import document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={this.onEdit}>Edit</DropdownMenuItem>
          </Flex>}
        {allowDelete &&
          <DropdownMenuItem onClick={this.onDelete}>Delete</DropdownMenuItem>}
      </DropdownMenu>
    );
  }
}

const MoreIcon = styled(Icon)`
  width: 22px;
`;

export default inject('ui')(CollectionMenu);
