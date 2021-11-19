import invariant from "invariant";
import { sortBy, filter, find, isUndefined } from "lodash";
import { action, computed } from "mobx";
import { client } from "~/utils/ApiClient";
import Share from "../models/Share";
import BaseStore from "./BaseStore";
import RootStore from "./RootStore";

export default class SharesStore extends BaseStore<Share> {
  // @ts-expect-error ts-migrate(2416) FIXME: Property 'actions' in type 'SharesStore' is not as... Remove this comment to see the full error message
  actions = ["info", "list", "create", "update"];

  constructor(rootStore: RootStore) {
    super(rootStore, Share);
  }

  @computed
  get orderedData(): Share[] {
    return sortBy(Array.from(this.data.values()), "createdAt").reverse();
  }

  @computed
  get published(): Share[] {
    return filter(this.orderedData, (share) => share.published);
  }

  @action
  revoke = async (share: Share) => {
    await client.post("/shares.revoke", {
      id: share.id,
    });
    this.remove(share.id);
  };

  @action
  async create(params: Record<string, any>) {
    const item = this.getByDocumentId(params.documentId);
    if (item) return item;
    return super.create(params);
  }

  @action
  async fetch(
    documentId: string,
    // @ts-expect-error ts-migrate(1015) FIXME: Parameter cannot have question mark and initialize... Remove this comment to see the full error message
    options?: Record<string, any> = {}
  ): Promise<any> {
    const item = this.getByDocumentId(documentId);
    if (item && !options.force) return item;
    this.isFetching = true;

    try {
      const res = await client.post(`/${this.modelName}s.info`, {
        documentId,
        apiVersion: 2,
      });
      if (isUndefined(res)) return;
      invariant(res && res.data, "Data should be available");
      this.addPolicies(res.policies);
      return res.data.shares.map(this.add);
    } finally {
      this.isFetching = false;
    }
  }

  // @ts-expect-error ts-migrate(7030) FIXME: Not all code paths return a value.
  getByDocumentParents = (documentId: string): Share | null | undefined => {
    const document = this.rootStore.documents.get(documentId);
    if (!document) return;
    const collection = this.rootStore.collections.get(document.collectionId);
    if (!collection) return;
    const parentIds = collection
      .pathToDocument(documentId)
      .slice(0, -1)
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type 'never'.
      .map((p) => p.id);

    for (const parentId of parentIds) {
      const share = this.getByDocumentId(parentId);

      if (share && share.includeChildDocuments && share.published) {
        return share;
      }
    }
  };

  getByDocumentId = (documentId: string): Share | null | undefined => {
    return find(this.orderedData, (share) => share.documentId === documentId);
  };
}
