// @flow
import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MenuButton, useMenuState } from "reakit/Menu";
import Button from "components/Button";
import CollectionIcon from "components/CollectionIcon";
import ContextMenu from "components/ContextMenu";
import Header from "components/ContextMenu/Header";
import Template from "components/ContextMenu/Template";
import useStores from "hooks/useStores";
import { newDocumentUrl } from "utils/routeHelpers";

function NewDocumentMenu() {
  const menu = useMenuState();
  const { t } = useTranslation();
  const { collections, policies } = useStores();
  const singleCollection = collections.orderedData.length === 1;

  if (singleCollection) {
    return (
      <Button
        as={Link}
        to={newDocumentUrl(collections.orderedData[0].id)}
        icon={<PlusIcon />}
        small
      >
        {t("New doc")}
      </Button>
    );
  }

  return (
    <>
      <MenuButton {...menu}>
        {(props) => (
          <Button icon={<PlusIcon />} {...props} small>
            {`${t("New doc")}…`}
          </Button>
        )}
      </MenuButton>
      <ContextMenu {...menu} aria-label={t("New document")}>
        <Header>{t("Choose a collection")}</Header>
        <Template
          {...menu}
          items={collections.orderedData.map((collection) => ({
            to: newDocumentUrl(collection.id),
            disabled: !policies.abilities(collection.id).update,
            title: (
              <>
                <CollectionIcon collection={collection} />
                &nbsp;{collection.name}
              </>
            ),
          }))}
        />
      </ContextMenu>
    </>
  );
}

export default observer(NewDocumentMenu);
