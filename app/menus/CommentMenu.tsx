import copy from "copy-to-clipboard";
import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useMenuState } from "reakit/Menu";
import { toast } from "sonner";
import EventBoundary from "@shared/components/EventBoundary";
import Comment from "~/models/Comment";
import ContextMenu from "~/components/ContextMenu";
import OverflowMenuButton from "~/components/ContextMenu/OverflowMenuButton";
import Template from "~/components/ContextMenu/Template";
import { actionToMenuItem } from "~/actions";
import { deleteCommentFactory } from "~/actions/definitions/comments";
import useActionContext from "~/hooks/useActionContext";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import { commentPath, urlify } from "~/utils/routeHelpers";

type Props = {
  /** The comment to associate with the menu */
  comment: Comment;
  /** CSS class name */
  className?: string;
  /** Callback when the "Edit" is selected in the menu */
  onEdit: () => void;
  /** Callback when the comment has been deleted */
  onDelete: () => void;
};

function CommentMenu({ comment, onEdit, onDelete, className }: Props) {
  const menu = useMenuState({
    modal: true,
  });
  const { documents } = useStores();
  const { t } = useTranslation();
  const can = usePolicy(comment);
  const context = useActionContext({ isContextMenu: true });
  const document = documents.get(comment.documentId);

  const handleCopyLink = React.useCallback(() => {
    if (document) {
      copy(urlify(commentPath(document, comment)));
      toast.message(t("Link copied"));
    }
  }, [t, document, comment]);

  return (
    <>
      <EventBoundary>
        <OverflowMenuButton
          aria-label={t("Show menu")}
          className={className}
          {...menu}
        />
      </EventBoundary>
      <ContextMenu {...menu} aria-label={t("Comment options")}>
        <Template
          {...menu}
          showIcons={false}
          items={[
            {
              type: "button",
              title: t("Edit"),
              onClick: onEdit,
              visible: can.update,
            },
            {
              type: "button",
              title: t("Resolve thread"),
              onClick: () => comment.resolve(),
              visible: can.resolve,
            },
            {
              type: "button",
              title: t("Unresolve thread"),
              onClick: () => comment.unresolve(),
              visible: can.unresolve,
            },
            {
              type: "button",
              title: t("Copy link"),
              onClick: handleCopyLink,
            },
            {
              type: "separator",
            },
            actionToMenuItem(
              deleteCommentFactory({ comment, onDelete }),
              context
            ),
          ]}
        />
      </ContextMenu>
    </>
  );
}

export default observer(CommentMenu);
