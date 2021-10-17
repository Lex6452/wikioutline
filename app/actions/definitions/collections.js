// @flow
import { CollectionIcon, PlusIcon } from "outline-icons";
import * as React from "react";
import stores from "stores";
import CollectionNew from "scenes/CollectionNew";
import DynamicCollectionIcon from "components/CollectionIcon";
import { createAction } from "actions";
import history from "utils/history";

export const openCollection = createAction({
  name: ({ t }) => t("Open collection"),
  section: ({ t }) => t("Collections"),
  shortcut: ["o", "c"],
  icon: <CollectionIcon />,
  children: ({ stores }) => {
    const collections = stores.collections.orderedData;

    return collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      icon: <DynamicCollectionIcon collection={collection} />,
      section: ({ t }) => t("Collections"),
      perform: () => history.push(collection.url),
    }));
  },
});

export const createCollection = createAction({
  name: ({ t }) => `${t("New collection")}…`,
  section: ({ t }) => t("Collections"),
  icon: <PlusIcon />,
  visible: ({ stores }) =>
    stores.policies.abilities(stores.auth.team?.id || "").createCollection,
  perform: ({ t, event }) => {
    event?.preventDefault();
    event?.stopPropagation();

    stores.dialogs.openModal({
      title: t("Create a collection"),
      content: <CollectionNew onSubmit={stores.dialogs.closeAllModals} />,
    });
  },
});

export const rootCollectionActions = [openCollection, createCollection];
