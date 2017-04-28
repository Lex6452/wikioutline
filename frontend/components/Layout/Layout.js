import React from 'react';
import { browserHistory, Link } from 'react-router';
import Helmet from 'react-helmet';
import { observer, inject } from 'mobx-react';
import { injectOffline } from 'components/Offline';
import keydown from 'react-keydown';
import _ from 'lodash';

import DropdownMenu, { MenuItem } from 'components/DropdownMenu';
import { Flex } from 'reflexbox';
import LoadingIndicator from 'components/LoadingIndicator';
import Alert from 'components/Alert';
import { Avatar } from 'rebass';

import styles from './Layout.scss';
import classNames from 'classnames/bind';
const cx = classNames.bind(styles);

@inject('user')
@observer
@injectOffline
class Layout extends React.Component {
  static propTypes = {
    children: React.PropTypes.node,
    actions: React.PropTypes.node,
    title: React.PropTypes.node,
    titleText: React.PropTypes.node,
    loading: React.PropTypes.bool,
    user: React.PropTypes.object.isRequired,
    search: React.PropTypes.bool,
    offline: React.PropTypes.bool,
    notifications: React.PropTypes.node,
  };

  static defaultProps = {
    search: true,
  };

  @keydown(['/', 't'])
  search() {
    // if (!this.props.user) return;
    _.defer(() => browserHistory.push('/search'));
  }

  @keydown(['d'])
  dashboard() {
    // if (!this.props.user) return;
    _.defer(() => browserHistory.push('/'));
  }

  render() {
    const user = this.props.user;

    return (
      <div className={ styles.container }>
        <Helmet
          title={ this.props.titleText ? `${this.props.titleText} - Atlas` : 'Atlas'
          }
        />

        {this.props.loading && <LoadingIndicator />}

        {this.props.offline &&
          <Alert offline>
            It looks like you're offline. Reconnect to restore access to all of your documents 📚
          </Alert>}

        {this.props.notifications}

        <div className={ cx(styles.header) }>
          <div className={ styles.headerLeft }>
            <Link to="/" className={ styles.team }>Atlas</Link>
            <span className={ styles.title }>
              {this.props.title}
            </span>
          </div>
          <Flex className={ styles.headerRight }>
            <Flex>
              <Flex align="center" className={ styles.actions }>
                {this.props.actions}
              </Flex>
              {user.user &&
                <Flex>
                  {this.props.search &&
                    <Flex>
                      <div
                        onClick={ this.search }
                        className={ styles.search }
                        title="Search (/)"
                      >
                        <img
                          src={ require('assets/icons/search.svg') }
                          alt="Search"
                        />
                      </div>
                    </Flex>}
                  <DropdownMenu
                    label={ <Avatar circle size={ 24 } src={ user.user.avatarUrl } /> }
                  >
                    <MenuItem to="/settings">Settings</MenuItem>
                    <MenuItem to="/keyboard-shortcuts">
                      Keyboard shortcuts
                    </MenuItem>
                    <MenuItem to="/developers">API</MenuItem>
                    <MenuItem onClick={ user.logout }>Logout</MenuItem>
                  </DropdownMenu>
                </Flex>}
            </Flex>
          </Flex>
        </div>

        <div className={ cx(styles.content) }>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Layout;
