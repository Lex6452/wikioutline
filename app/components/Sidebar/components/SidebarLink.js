// @flow
import React, { Component } from 'react';
import { observable, action } from 'mobx';
import { observer } from 'mobx-react';
import { NavLink } from 'react-router-dom';
import { color, fontWeight } from 'shared/styles/constants';
import styled from 'styled-components';
import Flex from 'shared/components/Flex';
import CollapsedIcon from 'components/Icon/CollapsedIcon';

const activeStyle = {
  color: color.black,
  fontWeight: fontWeight.medium,
};

const StyledGoTo = styled(CollapsedIcon)`
  margin-bottom: -4px;
  margin-left: 1px;
  margin-right: -3px;
  ${({ expanded }) => !expanded && 'transform: rotate(-90deg);'};
`;

const IconWrapper = styled.span`
  margin-left: -4px;
  margin-right: 4px;
  height: 24px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  width: 100%;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 0;
  margin-left: ${({ iconVisible }) => (iconVisible ? '-20px;' : '0')};
  color: ${color.slateDark};
  font-size: 15px;
  cursor: pointer;

  &:hover {
    color: ${color.text};
  }
`;

const StyledDiv = StyledNavLink.withComponent('div');

type Props = {
  to?: string,
  onClick?: SyntheticEvent => *,
  children?: React$Element<*>,
  icon?: React$Element<*>,
  expand?: boolean,
  expandedContent?: React$Element<*>,
  hideExpandToggle?: boolean,
  iconColor?: string,
  active?: boolean,
};

@observer
class SidebarLink extends Component {
  props: Props;
  @observable expanded: boolean = false;

  componentDidMount() {
    if (this.props.expand) this.handleExpand();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.expand) this.handleExpand();
  }

  @action
  handleClick = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.expanded = !this.expanded;
  };

  @action
  handleExpand = () => {
    this.expanded = true;
  };

  render() {
    const {
      icon,
      children,
      onClick,
      to,
      expandedContent,
      expand,
      active,
      hideExpandToggle,
    } = this.props;
    const Component = to ? StyledNavLink : StyledDiv;
    const showExpandIcon = expandedContent && !hideExpandToggle;

    return (
      <Flex column>
        <Component
          iconVisible={showExpandIcon}
          activeStyle={activeStyle}
          style={active ? activeStyle : undefined}
          onClick={onClick}
          to={to}
          exact
        >
          {icon && <IconWrapper>{icon}</IconWrapper>}
          {showExpandIcon && (
            <StyledGoTo expanded={this.expanded} onClick={this.handleClick} />
          )}
          <Content onClick={this.handleExpand}>{children}</Content>
        </Component>
        {/* Collection */ expand && hideExpandToggle && expandedContent}
        {/* Document */ this.expanded && !hideExpandToggle && expandedContent}
      </Flex>
    );
  }
}

const Content = styled.div`
  width: 100%;
`;

export default SidebarLink;
