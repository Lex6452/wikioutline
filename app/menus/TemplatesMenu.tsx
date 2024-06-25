import { observer } from "mobx-react";
import { DocumentIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { MenuButton, useMenuState } from "reakit/Menu";
import Document from "~/models/Document";
import Button from "~/components/Button";
import ContextMenu from "~/components/ContextMenu";
import Template from "~/components/ContextMenu/Template";
import Icon from "~/components/Icon";
import useCurrentUser from "~/hooks/useCurrentUser";
import useStores from "~/hooks/useStores";
import { MenuItem } from "~/types";
import { replaceTitleVariables } from "~/utils/date";

type Props = {
  document: Document;
  onSelectTemplate: (template: Document) => void;
};

function TemplatesMenu({ onSelectTemplate, document }: Props) {
  const menu = useMenuState({
    modal: true,
  });
  const user = useCurrentUser();
  const { documents } = useStores();
  const { t } = useTranslation();

  const templateToMenuItem = React.useCallback(
    (tmpl: Document): MenuItem => ({
      type: "button",
      title: replaceTitleVariables(tmpl.titleWithDefault, user),
      icon: tmpl.icon ? (
        <Icon value={tmpl.icon} color={tmpl.color ?? undefined} />
      ) : (
        <DocumentIcon />
      ),
      onClick: () => onSelectTemplate(tmpl),
    }),
    [user, onSelectTemplate]
  );

  const templates = documents.templates.filter((tmpl) => tmpl.publishedAt);

  const workspaceTemplates = templates
    .filter((tmpl) => tmpl.isWorkspaceTemplate)
    .map(templateToMenuItem);

  const templatesInCollection = templates
    .filter(
      (tmpl) =>
        !tmpl.isWorkspaceTemplate && tmpl.collectionId === document.collectionId
    )
    .map(templateToMenuItem);

  const otherTemplates = templates
    .filter(
      (tmpl) =>
        !tmpl.isWorkspaceTemplate && tmpl.collectionId !== document.collectionId
    )
    .map(templateToMenuItem);

  const workspaceItems: MenuItem[] = React.useMemo(
    () =>
      workspaceTemplates.length
        ? [{ type: "heading", title: t("Workspace") }, ...workspaceTemplates]
        : [],
    [t, workspaceTemplates]
  );

  const collectionItemsWithHeader: MenuItem[] = React.useMemo(
    () =>
      templatesInCollection.length
        ? [
            { type: "separator" },
            { type: "heading", title: t("This collection") },
            ...templatesInCollection,
          ]
        : [],
    [t, templatesInCollection]
  );

  const otherItemsWithHeader: MenuItem[] = React.useMemo(
    () =>
      otherTemplates.length
        ? [
            { type: "separator" },
            { type: "heading", title: t("Other collections") },
            ...otherTemplates,
          ]
        : [],
    [t, otherTemplates]
  );

  const items: MenuItem[] = [
    ...workspaceItems,
    ...collectionItemsWithHeader,
    ...otherItemsWithHeader,
  ];

  if (!items.length) {
    return null;
  }

  return (
    <>
      <MenuButton {...menu}>
        {(props) => (
          <Button {...props} disclosure neutral>
            {t("Templates")}
          </Button>
        )}
      </MenuButton>
      <ContextMenu {...menu} aria-label={t("Templates")}>
        <Template {...menu} items={items} />
      </ContextMenu>
    </>
  );
}

export default observer(TemplatesMenu);
