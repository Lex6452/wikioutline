import { observer } from "mobx-react";
import { SearchIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import Input from "./Input";
import useBoolean from "hooks/useBoolean";
import useKeyDown from "hooks/useKeyDown";
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'utils/keyboard' or its corresp... Remove this comment to see the full error message
import { isModKey } from "utils/keyboard";
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'utils/routeHelpers' or its cor... Remove this comment to see the full error message
import { searchUrl } from "utils/routeHelpers";

type Props = {
  source: string;
  placeholder?: string;
  label?: string;
  labelHidden?: boolean;
  collectionId?: string;
  value?: string;
  onChange?: (event: React.SyntheticEvent) => unknown;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
};

function InputSearchPage({
  onKeyDown,
  value,
  onChange,
  placeholder,
  label,
  collectionId,
  source,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const history = useHistory();
  const { t } = useTranslation();
  const [isFocused, setFocused, setUnfocused] = useBoolean(false);
  const focus = React.useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useKeyDown("f", (ev: KeyboardEvent) => {
    if (isModKey(ev)) {
      ev.preventDefault();
      focus();
    }
  });

  const handleKeyDown = React.useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        history.push(
          searchUrl(ev.currentTarget.value, {
            collectionId,
            ref: source,
          })
        );
      }

      if (onKeyDown) {
        onKeyDown(ev);
      }
    },
    [history, collectionId, source, onKeyDown]
  );

  return (
    <InputMaxWidth
      ref={inputRef}
      type="search"
      placeholder={placeholder || `${t("Search")}…`}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      icon={
        <SearchIcon
          color={isFocused ? theme.inputBorderFocused : theme.inputBorder}
        />
      }
      label={label}
      onFocus={setFocused}
      onBlur={setUnfocused}
      margin={0}
      labelHidden
    />
  );
}

const InputMaxWidth = styled(Input)`
  max-width: 30vw;
`;

export default observer(InputSearchPage);
