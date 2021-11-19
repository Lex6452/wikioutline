import { reduce, filter, find, orderBy } from "lodash";
import View from "../models/View";
import BaseStore from "./BaseStore";
import RootStore from "./RootStore";

export default class ViewsStore extends BaseStore<View> {
  // @ts-expect-error ts-migrate(2416) FIXME: Property 'actions' in type 'ViewsStore' is not ass... Remove this comment to see the full error message
  actions = ["list", "create"];

  constructor(rootStore: RootStore) {
    super(rootStore, View);
  }

  inDocument(documentId: string): View[] {
    return orderBy(
      filter(this.orderedData, (view) => view.documentId === documentId),
      "lastViewedAt",
      "desc"
    );
  }

  countForDocument(documentId: string): number {
    const views = this.inDocument(documentId);
    return reduce(views, (memo, view) => memo + view.count, 0);
  }

  touch(documentId: string, userId: string) {
    const view = find(
      this.orderedData,
      (view) => view.documentId === documentId && view.user.id === userId
    );
    if (!view) return;
    view.touch();
  }
}
