import {
  Select,
  SelectOption,
  useSelectState,
  useSelectPopover,
  SelectPopover,
} from "@renderlesskit/react";
import { CheckmarkIcon } from "outline-icons";
import * as React from "react";
import { VisuallyHidden } from "reakit/VisuallyHidden";
import styled, { css } from "styled-components";
import { s } from "@shared/styles";
import Button, { Inner } from "~/components/Button";
import Text from "~/components/Text";
import useMenuHeight from "~/hooks/useMenuHeight";
import useMobile from "~/hooks/useMobile";
import useOnClickOutside from "~/hooks/useOnClickOutside";
import { fadeAndScaleIn } from "~/styles/animations";
import {
  Position,
  Background as ContextMenuBackground,
  Backdrop,
  Placement,
} from "./ContextMenu";
import { MenuAnchorCSS } from "./ContextMenu/MenuItem";
import { LabelText } from "./Input";

export type Option = {
  label: string | JSX.Element;
  value: string;
  description?: string;
};

export type Props = {
  id?: string;
  name?: string;
  value?: string | null;
  label?: string;
  nude?: boolean;
  ariaLabel: string;
  short?: boolean;
  disabled?: boolean;
  className?: string;
  labelHidden?: boolean;
  icon?: React.ReactNode;
  options: Option[];
  /** @deprecated Removing soon, do not use. */
  note?: React.ReactNode;
  onChange?: (value: string | null) => void;
};

export interface InputSelectRef {
  value: string | null;
  focus: () => void;
  blur: () => void;
}

interface InnerProps extends React.HTMLAttributes<HTMLDivElement> {
  placement: Placement;
}

const getOptionFromValue = (options: Option[], value: string | null) =>
  options.find((option) => option.value === value);

const InputSelect = (props: Props, ref: React.RefObject<InputSelectRef>) => {
  const {
    value = null,
    label,
    className,
    labelHidden,
    options,
    short,
    ariaLabel,
    onChange,
    disabled,
    note,
    icon,
    nude,
    ...rest
  } = props;

  const select = useSelectState({
    gutter: 0,
    modal: true,
    selectedValue: value,
  });

  const popover = useSelectPopover({
    ...select,
    hideOnClickOutside: false,
    preventBodyScroll: true,
    disabled,
  });

  const isMobile = useMobile();
  const previousValue = React.useRef<string | null>(value);
  const selectedRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const minWidth = buttonRef.current?.offsetWidth || 0;
  const margin = 8;
  const menuMaxHeight = useMenuHeight({
    visible: select.visible,
    elementRef: select.unstable_disclosureRef,
    margin,
  });
  const maxHeight = Math.min(
    menuMaxHeight ?? 0,
    window.innerHeight -
      (buttonRef.current?.getBoundingClientRect().bottom ?? 0) -
      margin
  );

  const wrappedLabel = <LabelText>{label}</LabelText>;
  const selectedValueIndex = options.findIndex(
    (option) => option.value === select.selectedValue
  );

  // Custom click outside handling rather than using `hideOnClickOutside` from reakit so that we can
  // prevent event bubbling.
  useOnClickOutside(
    contentRef,
    (event) => {
      if (select.visible) {
        event.stopPropagation();
        event.preventDefault();
        select.hide();
      }
    },
    { capture: true }
  );

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      buttonRef.current?.focus();
    },
    blur: () => {
      buttonRef.current?.blur();
    },
    value: select.selectedValue,
  }));

  React.useEffect(() => {
    previousValue.current = value;
    select.setSelectedValue(value);
  }, [value]);

  React.useEffect(() => {
    if (previousValue.current === select.selectedValue) {
      return;
    }
    previousValue.current = select.selectedValue;

    onChange?.(select.selectedValue);
  }, [onChange, select.selectedValue]);

  React.useLayoutEffect(() => {
    if (select.visible) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = selectedValueIndex * 32;
        }
      });
    }
  }, [select.visible, selectedValueIndex]);

  return (
    <>
      <Wrapper short={short}>
        {label &&
          (labelHidden ? (
            <VisuallyHidden>{wrappedLabel}</VisuallyHidden>
          ) : (
            wrappedLabel
          ))}

        <Select {...select} disabled={disabled} {...rest} ref={buttonRef}>
          {(props) => (
            <StyledButton
              neutral
              disclosure
              className={className}
              icon={icon}
              $nude={nude}
              {...props}
            >
              {getOptionFromValue(options, select.selectedValue)?.label || (
                <Placeholder>Select a {ariaLabel.toLowerCase()}</Placeholder>
              )}
            </StyledButton>
          )}
        </Select>
        <SelectPopover {...select} {...popover} aria-label={ariaLabel}>
          {(props: InnerProps) => {
            const topAnchor = props.style?.top === "0";
            const rightAnchor = props.placement === "bottom-end";

            return (
              <Positioner {...props}>
                <Background
                  dir="auto"
                  ref={contentRef}
                  topAnchor={topAnchor}
                  rightAnchor={rightAnchor}
                  hiddenScrollbars
                  maxWidth={400}
                  style={
                    maxHeight && topAnchor
                      ? {
                          maxHeight,
                          minWidth,
                        }
                      : {
                          minWidth,
                        }
                  }
                >
                  {select.visible
                    ? options.map((option) => {
                        const isSelected =
                          select.selectedValue === option.value;
                        const Icon = isSelected ? CheckmarkIcon : Spacer;
                        return (
                          <StyledSelectOption
                            {...select}
                            value={option.value}
                            key={option.value}
                            ref={isSelected ? selectedRef : undefined}
                          >
                            <Icon />
                            &nbsp;
                            <Text as="span" size="small">
                              {option.label}
                            </Text>
                            {option.description && (
                              <>
                                &nbsp;
                                <Text as="span" type="tertiary" size="small">
                                  – {option.description}
                                </Text>
                              </>
                            )}
                          </StyledSelectOption>
                        );
                      })
                    : null}
                </Background>
              </Positioner>
            );
          }}
        </SelectPopover>
      </Wrapper>
      {note && (
        <Text as="p" type="secondary" size="small">
          {note}
        </Text>
      )}
      {select.visible && isMobile && <Backdrop />}
    </>
  );
};

const Background = styled(ContextMenuBackground)`
  animation: ${fadeAndScaleIn} 200ms ease;
`;

const Placeholder = styled.span`
  color: ${s("placeholder")};
`;

const Spacer = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
`;

const StyledButton = styled(Button)<{ $nude?: boolean }>`
  font-weight: normal;
  text-transform: none;
  margin-bottom: 16px;
  display: block;
  width: 100%;
  cursor: default;

  &:hover:not(:disabled) {
    background: ${s("buttonNeutralBackground")};
  }

  ${(props) =>
    props.$nude &&
    css`
      border-color: transparent;
      box-shadow: none;
    `}

  ${Inner} {
    line-height: 28px;
    padding-left: 12px;
    padding-right: 4px;
  }

  svg {
    justify-self: flex-end;
    margin-left: auto;
  }
`;

export const StyledSelectOption = styled(SelectOption)`
  ${MenuAnchorCSS}
  /* overriding the styles from MenuAnchorCSS because we use &nbsp; here */
  svg:not(:last-child) {
    margin-right: 0px;
  }
`;

const Wrapper = styled.label<{ short?: boolean }>`
  display: block;
  max-width: ${(props) => (props.short ? "350px" : "100%")};
`;

export const Positioner = styled(Position)`
  &.focus-visible {
    ${StyledSelectOption} {
      &[aria-selected="true"] {
        color: ${(props) => props.theme.white};
        background: ${s("accent")};
        box-shadow: none;
        cursor: var(--pointer);

        svg {
          fill: ${(props) => props.theme.white};
        }
      }
    }
  }
`;

export default React.forwardRef(InputSelect);
