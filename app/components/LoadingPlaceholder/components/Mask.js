// @flow
import * as React from 'react';
import styled from 'styled-components';
import { pulsate } from 'shared/styles/animations';
import { randomInteger } from 'shared/random';
import Flex from 'shared/components/Flex';

class Mask extends React.Component<*> {
  width: number;

  shouldComponentUpdate() {
    return false;
  }

  componentWillMount() {
    this.width = randomInteger(75, 100);
  }

  render() {
    return <Redacted width={this.width} {...this.props} />;
  }
}

const Redacted = styled(Flex)`
  width: ${props => (props.header ? props.width / 2 : props.width)}%;
  height: ${props => (props.header ? 28 : 18)}px;
  margin-bottom: ${props => (props.header ? 18 : 12)}px;
  background-color: ${props => props.theme.smokeDark};
  animation: ${pulsate} 1.3s infinite;

  &:last-child {
    margin-bottom: 0;
  }
`;

export default Mask;
