import { observer } from "mobx-react";
import { darken, lighten } from "polished";
import React from "react";
import { useTranslation } from "react-i18next";
import styled, { css } from "styled-components";
import { s } from "@shared/styles";
import type { ThinReaction } from "@shared/types";
import { getEmojiId } from "@shared/utils/emoji";
import User from "~/models/User";
import { Emoji } from "~/components/Emoji";
import Flex from "~/components/Flex";
import NudeButton from "~/components/NudeButton";
import Text from "~/components/Text";
import Tooltip from "~/components/Tooltip";
import useCurrentUser from "~/hooks/useCurrentUser";
import { hover } from "~/styles";
import { ReactedUser } from "~/types";

type Props = {
  /** Thin reaction data - contains the emoji & active user ids for this reaction. */
  reaction: ThinReaction;
  /** Data of the users who have reacted using this emoji. */
  reactedUsers: ReactedUser[];
  /** Callback when the user intends to add the reaction. */
  onAddReaction: (emoji: string) => Promise<void>;
  /** Callback when the user intends to remove the reaction. */
  onRemoveReaction: (emoji: string) => Promise<void>;
};

const useTooltipContent = ({
  reactedUsers,
  currUser,
  emoji,
  active,
}: {
  reactedUsers: Props["reactedUsers"];
  currUser: User;
  emoji: string;
  active: boolean;
}) => {
  const { t } = useTranslation();

  if (!reactedUsers.length) {
    return;
  }

  switch (reactedUsers.length) {
    case 1: {
      return t("{{ username }} reacted with {{ emoji }}", {
        username: active ? t("You") : reactedUsers[0].name,
        emoji: `:${getEmojiId(emoji)}:`,
      });
    }

    case 2: {
      const firstUsername = active ? t("You") : reactedUsers[0].name;
      const secondUsername = active
        ? reactedUsers.find((user) => user.id !== currUser.id)?.name
        : reactedUsers[1].name;

      return t(
        "{{ firstUsername }} and {{ secondUsername }} reacted with {{ emoji }}",
        {
          firstUsername,
          secondUsername,
          emoji: `:${getEmojiId(emoji)}:`,
        }
      );
    }

    case 3: {
      const firstUsername = active ? t("You") : reactedUsers[0].name;

      const otherUsers = active
        ? reactedUsers.filter((user) => user.id !== currUser.id)
        : reactedUsers.slice(1);

      const secondUsername = otherUsers[0].name;
      const thirdUsername = otherUsers[1].name;

      return t(
        "{{ firstUsername }}, {{ secondUsername }} and {{ thirdUsername }} reacted with {{ emoji }}",
        {
          firstUsername,
          secondUsername,
          thirdUsername,
          emoji: `:${getEmojiId(emoji)}:`,
        }
      );
    }

    default: {
      const firstUsername = active ? t("You") : reactedUsers[0].name;

      const otherUsers = active
        ? reactedUsers.filter((user) => user.id !== currUser.id)
        : reactedUsers.slice(1);

      const secondUsername = otherUsers[0].name;
      const thirdUsername = otherUsers[1].name;

      const count = reactedUsers.length - 3;

      return t(
        "{{ firstUsername }}, {{ secondUsername }}, {{ thirdUsername }} and {{ count }} others reacted with {{ emoji }}",
        {
          firstUsername,
          secondUsername,
          thirdUsername,
          count,
          emoji: `:${getEmojiId(emoji)}:`,
        }
      );
    }
  }
};

const Reaction: React.FC<Props> = ({
  reaction,
  reactedUsers,
  onAddReaction,
  onRemoveReaction,
}) => {
  const user = useCurrentUser();

  const active = reaction.userIds.includes(user.id);

  const tooltipContent = useTooltipContent({
    reactedUsers,
    currUser: user,
    emoji: reaction.emoji,
    active,
  });

  const handleClick = React.useCallback(
    (event: React.SyntheticEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      active
        ? void onRemoveReaction(reaction.emoji)
        : void onAddReaction(reaction.emoji);
    },
    [reaction, active, onAddReaction, onRemoveReaction]
  );

  const DisplayedEmoji = React.useMemo(
    () => (
      <EmojiButton $active={active} onClick={handleClick}>
        <Flex gap={6} justify="center" align="center">
          <Emoji size={13}>{reaction.emoji}</Emoji>
          <Count weight="bold">{reaction.userIds.length}</Count>
        </Flex>
      </EmojiButton>
    ),
    [reaction.emoji, reaction.userIds, active, handleClick]
  );

  return tooltipContent ? (
    <Tooltip content={tooltipContent} delay={250} placement="bottom">
      {DisplayedEmoji}
    </Tooltip>
  ) : (
    <>{DisplayedEmoji}</>
  );
};

const EmojiButton = styled(NudeButton)<{ $active: boolean }>`
  width: auto;
  height: 28px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: ${s("backgroundTransition")};

  ${({ $active, theme }) =>
    $active
      ? theme.isDark
        ? css`
            background-color: ${darken(0.1, theme.accent)};
            border-color: ${darken(0.08, theme.accent)};

            &: ${hover} {
              background-color: ${darken(0.2, theme.accent)};
            }
          `
        : css`
            background-color: ${lighten(0.38, theme.accent)};
            border-color: ${lighten(0.34, theme.accent)};

            &: ${hover} {
              background-color: ${lighten(0.3, theme.accent)};
            }
          `
      : css`
          background-color: ${s("listItemHoverBackground")};
          border-color: ${s("buttonNeutralBorder")};

          &: ${hover} {
            background-color: ${s("buttonNeutralBackground")};
          }
        `}
`;

const Count = styled(Text)`
  font-size: 11px;
`;

export default observer(Reaction);
