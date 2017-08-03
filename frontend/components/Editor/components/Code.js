// @flow
import React from 'react';
import styled from 'styled-components';
import CopyButton from './CopyButton';
import { color } from 'styles/constants';
import type { Props } from '../types';

export default function Code({ children, node, readOnly, attributes }: Props) {
  return (
    <Container>
      {readOnly && <CopyButton text={node.text} />}
      <Pre>
        <code {...attributes}>
          {children}
        </code>
      </Pre>
    </Container>
  );
}

const Pre = styled.pre`
  padding: .5em 1em;
  background: ${color.smoke};
  border-radius: 4px;
  border: 1px solid ${color.smokeDark};

  code {
    padding: 0;
  }
`;

const Container = styled.div`
  position: relative;

  &:hover {
    > span {
      opacity: 1;
    }
  }
`;
