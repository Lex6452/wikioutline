// @flow
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import styled from 'styled-components';
import { observer, inject } from 'mobx-react';
import Flex from 'shared/components/Flex';
import { color, layout } from 'shared/styles/constants';

import AccountMenu from 'menus/AccountMenu';
import Scrollable from 'components/Scrollable';
import HomeIcon from 'components/Icon/HomeIcon';
import SearchIcon from 'components/Icon/SearchIcon';
import StarredIcon from 'components/Icon/StarredIcon';
import EditIcon from 'components/Icon/EditIcon';
import Collections from './components/Collections';
import SidebarLink from './components/SidebarLink';
import HeaderBlock from './components/HeaderBlock';

import AuthStore from 'stores/AuthStore';
import DocumentsStore from 'stores/DocumentsStore';
import UiStore from 'stores/UiStore';

type Props = {
  history: Object,
  location: Location,
  auth: AuthStore,
  documents: DocumentsStore,
  ui: UiStore,
};

@observer
class Sidebar extends Component {
  props: Props;

  handleCreateCollection = () => {
    this.props.ui.setActiveModal('collection-new');
  };

  handleEditCollection = () => {
    this.props.ui.setActiveModal('collection-edit');
  };

  render() {
    const { auth, ui, documents } = this.props;
    const { user, team } = auth;
    if (!user || !team) return;

    return (
      <Container column editMode={ui.editMode}>
        <AccountMenu
          label={
            <HeaderBlock
              subheading={user.name}
              teamName={team.name}
              logoUrl={team.avatarUrl}
            />
          }
        />

        <Flex auto column>
          <Scrollable>
            <Section>
              <SidebarLink to="/dashboard" icon={<HomeIcon />}>
                Home
              </SidebarLink>
              <SidebarLink to="/search" icon={<SearchIcon />}>
                Search
              </SidebarLink>
              <SidebarLink to="/starred" icon={<StarredIcon />}>
                Starred
              </SidebarLink>
              <SidebarLink
                to="/drafts"
                icon={<EditIcon />}
                active={
                  documents.active ? !documents.active.publishedAt : undefined
                }
              >
                Drafts
              </SidebarLink>
            </Section>
            <Section>
              <Collections
                history={this.props.history}
                location={this.props.location}
                onCreateCollection={this.handleCreateCollection}
              />
            </Section>
          </Scrollable>
        </Flex>
      </Container>
    );
  }
}

const Container = styled(Flex)`
  position: fixed;
  top: 0;
  bottom: 0;
  left: ${props => (props.editMode ? `-${layout.sidebarWidth}` : 0)};
  width: ${layout.sidebarWidth};
  background: ${color.smoke};
  transition: left 200ms ease-in-out;

  @media print {
    display: none;
    left: 0;
  }
`;

const Section = styled(Flex)`
  flex-direction: column;
  margin: 24px 0;
  padding: 0 24px;
  position: relative;
`;

export default withRouter(inject('user', 'auth', 'ui', 'documents')(Sidebar));
