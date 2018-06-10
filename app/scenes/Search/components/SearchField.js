// @flow
import * as React from 'react';
import styled from 'styled-components';
import { SearchIcon } from 'outline-icons';
import Flex from 'shared/components/Flex';

type Props = {
  onChange: string => *,
};

class SearchField extends React.Component<Props> {
  input: HTMLInputElement;

  handleChange = (ev: SyntheticEvent<*>) => {
    this.props.onChange(ev.currentTarget.value ? ev.currentTarget.value : '');
  };

  focusInput = (ev: SyntheticEvent<*>) => {
    this.input.focus();
  };

  setRef = (ref: HTMLInputElement) => {
    this.input = ref;
  };

  render() {
    return (
      <Flex align="center">
        <StyledIcon
          type="Search"
          size={46}
          color={color.slateLight}
          onClick={this.focusInput}
        />
        <StyledInput
          {...this.props}
          innerRef={this.setRef}
          onChange={this.handleChange}
          spellCheck="false"
          placeholder="search…"
          autoFocus
        />
      </Flex>
    );
  }
}

const StyledInput = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 48px;
  font-weight: 400;
  outline: none;
  border: 0;

  ::-webkit-input-placeholder,
  :-moz-placeholder,
  ::-moz-placeholder,
  :-ms-input-placeholder {
    color: ${props => props.theme.slateLight};
  }
`;

const StyledIcon = styled(SearchIcon)`
  position: relative;
  top: 4px;
`;

export default SearchField;
