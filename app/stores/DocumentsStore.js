// @flow
import invariant from "invariant";
import {
  without,
  map,
  find,
  orderBy,
  filter,
  compact,
  omitBy,
  uniq,
} from "lodash";
import { observable, action, computed, runInAction } from "mobx";
import naturalSort from "shared/utils/naturalSort";
import BaseStore from "stores/BaseStore";
import RootStore from "stores/RootStore";
import Document, { type SaveOptions } from "models/Document";
import type { FetchOptions, PaginationParams, SearchResult } from "types";
import { client } from "utils/ApiClient";

type ImportOptions = SaveOptions & {
  file: File,
};

export default class DocumentsStore extends BaseStore<Document> {
  @observable recentlyViewedIds: string[] = [];
  @observable searchCache: Map<string, SearchResult[]> = new Map();
  @observable starredIds: Map<string, boolean> = new Map();
  @observable backlinks: Map<string, string[]> = new Map();

  importFiletypesClient: string[] = ["text/markdown", "text/plain"];
  importFiletypesServer: string[] = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/html",
  ];

  constructor(rootStore: RootStore) {
    super(rootStore, Document);
  }

  @computed
  get all(): Document[] {
    return filter(
      this.orderedData,
      (d) => !d.archivedAt && !d.deletedAt && !d.template
    );
  }

  @computed
  get recentlyViewed(): Document[] {
    return orderBy(
      compact(this.recentlyViewedIds.map((id) => this.data.get(id))),
      "updatedAt",
      "desc"
    );
  }

  @computed
  get recentlyUpdated(): Document[] {
    return orderBy(this.all, "updatedAt", "desc");
  }

  get templates(): Document[] {
    return orderBy(
      filter(
        this.orderedData,
        (d) => !d.archivedAt && !d.deletedAt && d.template
      ),
      "updatedAt",
      "desc"
    );
  }

  createdByUser(userId: string): Document[] {
    return orderBy(
      filter(this.all, (d) => d.createdBy.id === userId),
      "updatedAt",
      "desc"
    );
  }

  inCollection(collectionId: string): Document[] {
    return filter(
      this.all,
      (document) => document.collectionId === collectionId
    );
  }

  templatesInCollection(collectionId: string): Document[] {
    return orderBy(
      filter(
        this.orderedData,
        (d) =>
          !d.archivedAt &&
          !d.deletedAt &&
          d.template === true &&
          d.collectionId === collectionId
      ),
      "updatedAt",
      "desc"
    );
  }

  pinnedInCollection(collectionId: string): Document[] {
    return filter(
      this.recentlyUpdatedInCollection(collectionId),
      (document) => document.pinned
    );
  }

  publishedInCollection(collectionId: string): Document[] {
    return filter(
      this.all,
      (document) =>
        document.collectionId === collectionId && !!document.publishedAt
    );
  }

  leastRecentlyUpdatedInCollection(collectionId: string): Document[] {
    return orderBy(this.inCollection(collectionId), "updatedAt", "asc");
  }

  recentlyUpdatedInCollection(collectionId: string): Document[] {
    return orderBy(this.inCollection(collectionId), "updatedAt", "desc");
  }

  recentlyPublishedInCollection(collectionId: string): Document[] {
    return orderBy(
      this.publishedInCollection(collectionId),
      "publishedAt",
      "desc"
    );
  }

  alphabeticalInCollection(collectionId: string): Document[] {
    return naturalSort(this.inCollection(collectionId), "title");
  }

  searchResults(query: string): SearchResult[] {
    return this.searchCache.get(query) || [];
  }

  get starred(): Document[] {
    return orderBy(
      filter(this.all, (d) => d.isStarred),
      "updatedAt",
      "desc"
    );
  }

  @computed
  get archived(): Document[] {
    return filter(
      orderBy(this.orderedData, "archivedAt", "desc"),
      (d) => d.archivedAt && !d.deletedAt
    );
  }

  @computed
  get deleted(): Document[] {
    return filter(
      orderBy(this.orderedData, "deletedAt", "desc"),
      (d) => d.deletedAt
    );
  }

  @computed
  get starredAlphabetical(): Document[] {
    return naturalSort(this.starred, "title");
  }

  @computed
  get templatesAlphabetical(): Document[] {
    return naturalSort(this.templates, "title");
  }

  @computed
  get drafts(): Document[] {
    return filter(
      orderBy(this.all, "updatedAt", "desc"),
      (doc) => !doc.publishedAt
    );
  }

  @computed
  get active(): ?Document {
    return this.rootStore.ui.activeDocumentId
      ? this.data.get(this.rootStore.ui.activeDocumentId)
      : undefined;
  }

  @action
  fetchBacklinks = async (documentId: string): Promise<?(Document[])> => {
    const res = await client.post(`/documents.list`, {
      backlinkDocumentId: documentId,
    });
    invariant(res && res.data, "Document list not available");
    const { data } = res;
    runInAction("DocumentsStore#fetchBacklinks", () => {
      data.forEach(this.add);
      this.backlinks.set(
        documentId,
        data.map((doc) => doc.id)
      );
    });
  };

  getBacklinedDocuments(documentId: string): Document[] {
    const documentIds = this.backlinks.get(documentId) || [];
    return orderBy(
      compact(documentIds.map((id) => this.data.get(id))),
      "updatedAt",
      "desc"
    );
  }

  @action
  fetchChildDocuments = async (documentId: string): Promise<?(Document[])> => {
    const res = await client.post(`/documents.list`, {
      parentDocumentId: documentId,
    });
    invariant(res && res.data, "Document list not available");
    const { data } = res;
    runInAction("DocumentsStore#fetchChildDocuments", () => {
      data.forEach(this.add);
    });
  };

  @action
  fetchNamedPage = async (
    request: string = "list",
    options: ?PaginationParams
  ): Promise<?(Document[])> => {
    this.isFetching = true;

    try {
      const res = await client.post(`/documents.${request}`, options);
      invariant(res && res.data, "Document list not available");
      runInAction("DocumentsStore#fetchNamedPage", () => {
        res.data.forEach(this.add);
        this.addPolicies(res.policies);
        this.isLoaded = true;
      });
      return res.data;
    } finally {
      this.isFetching = false;
    }
  };

  @action
  fetchArchived = async (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("archived", options);
  };

  @action
  fetchDeleted = async (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("deleted", options);
  };

  @action
  fetchRecentlyUpdated = async (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("list", options);
  };

  @action
  fetchTemplates = async (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("list", { ...options, template: true });
  };

  @action
  fetchAlphabetical = async (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("list", {
      sort: "title",
      direction: "ASC",
      ...options,
    });
  };

  @action
  fetchLeastRecentlyUpdated = async (
    options: ?PaginationParams
  ): Promise<*> => {
    return this.fetchNamedPage("list", {
      sort: "updatedAt",
      direction: "ASC",
      ...options,
    });
  };

  @action
  fetchRecentlyPublished = async (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("list", {
      sort: "publishedAt",
      direction: "DESC",
      ...options,
    });
  };

  @action
  fetchRecentlyViewed = async (options: ?PaginationParams): Promise<*> => {
    const data = await this.fetchNamedPage("viewed", options);

    runInAction("DocumentsStore#fetchRecentlyViewed", () => {
      // $FlowFixMe
      this.recentlyViewedIds.replace(
        uniq(this.recentlyViewedIds.concat(map(data, "id")))
      );
    });
    return data;
  };

  @action
  fetchStarred = (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("starred", options);
  };

  @action
  fetchDrafts = (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("drafts", options);
  };

  @action
  fetchPinned = (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("pinned", options);
  };

  @action
  fetchOwned = (options: ?PaginationParams): Promise<*> => {
    return this.fetchNamedPage("list", options);
  };

  @action
  search = async (
    query: string,
    options: PaginationParams = {}
  ): Promise<SearchResult[]> => {
    // $FlowFixMe
    const compactedOptions = omitBy(options, (o) => !o);
    const res = await client.get("/documents.search", {
      ...compactedOptions,
      query,
    });
    invariant(res && res.data, "Search response should be available");

    // add the documents and associated policies to the store
    res.data.forEach((result) => this.add(result.document));
    this.addPolicies(res.policies);

    // store a reference to the document model in the search cache instead
    // of the original result from the API.
    const results: SearchResult[] = compact(
      res.data.map((result) => {
        const document = this.data.get(result.document.id);
        if (!document) return null;

        return {
          ranking: result.ranking,
          context: result.context,
          document,
        };
      })
    );

    let existing = this.searchCache.get(query) || [];

    // splice modifies any existing results, taking into account pagination
    existing.splice(options.offset || 0, options.limit || 0, ...results);

    this.searchCache.set(query, existing);
    return res.data;
  };

  @action
  prefetchDocument = (id: string) => {
    if (!this.data.get(id) && !this.getByUrl(id)) {
      return this.fetch(id, { prefetch: true });
    }
  };

  @action
  templatize = async (id: string): Promise<?Document> => {
    const doc: ?Document = this.data.get(id);
    invariant(doc, "Document should exist");

    if (doc.template) {
      return;
    }

    const res = await client.post("/documents.templatize", { id });
    invariant(res && res.data, "Document not available");

    this.addPolicies(res.policies);
    this.add(res.data);

    return this.data.get(res.data.id);
  };

  @action
  fetch = async (
    id: string,
    options?: FetchOptions = {}
  ): Promise<?Document> => {
    if (!options.prefetch) this.isFetching = true;

    try {
      const doc: ?Document = this.data.get(id) || this.getByUrl(id);
      const policy = doc ? this.rootStore.policies.get(doc.id) : undefined;
      if (doc && policy && !options.force) {
        return doc;
      }

      const res = await client.post("/documents.info", {
        id,
        shareId: options.shareId,
      });
      invariant(res && res.data, "Document not available");

      this.addPolicies(res.policies);
      this.add(res.data);

      runInAction("DocumentsStore#fetch", () => {
        this.isLoaded = true;
      });

      return this.data.get(res.data.id);
    } finally {
      this.isFetching = false;
    }
  };

  @action
  move = async (
    document: Document,
    collectionId: string,
    parentDocumentId: ?string
  ) => {
    const res = await client.post("/documents.move", {
      id: document.id,
      collectionId,
      parentDocumentId,
    });
    invariant(res && res.data, "Data not available");

    res.data.documents.forEach(this.add);
    res.data.collections.forEach(this.rootStore.collections.add);
    this.addPolicies(res.policies);
  };

  @action
  duplicate = async (document: Document): * => {
    const res = await client.post("/documents.create", {
      publish: !!document.publishedAt,
      parentDocumentId: document.parentDocumentId,
      collectionId: document.collectionId,
      template: document.template,
      title: `${document.title} (duplicate)`,
      text: document.text,
    });
    invariant(res && res.data, "Data should be available");

    const collection = this.getCollectionForDocument(document);
    if (collection) collection.refresh();

    this.addPolicies(res.policies);
    return this.add(res.data);
  };

  @action
  import = async (
    title: string,
    parentDocumentId: string,
    collectionId: string,
    options: ImportOptions
  ) => {
    const formData = new FormData();

    [
      { key: "parentDocumentId", value: parentDocumentId },
      { key: "collectionId", value: collectionId },
      { key: "title", value: title },
    ].map((info) => {
      if (typeof info.value === "string" && info.value) {
        formData.append(info.key, info.value);
      }
    });

    Object.keys(options).forEach((key) =>
      formData.append(
        key,
        options[key] instanceof File
          ? options[key]
          : (options[key] || "").toString()
      )
    );

    const res = await client.post("/documents.import", formData);
    invariant(res && res.data, "Data should be available");

    this.addPolicies(res.policies);
    return this.add(res.data);
  };

  _add = this.add;

  @action
  add = (item: Object) => {
    const document = this._add(item);

    if (item.starred !== undefined) {
      this.starredIds.set(document.id, item.starred);
    }

    return document;
  };

  @action
  removeCollectionDocuments(collectionId: string) {
    const documents = this.inCollection(collectionId);
    const documentIds = documents.map((doc) => doc.id);
    documentIds.forEach((id) => this.remove(id));
  }

  @action
  async update(params: {
    id: string,
    title: string,
    text: string,
    lastRevision: number,
  }) {
    const document = await super.update(params);

    // Because the collection object contains the url and title
    // we need to ensure they are updated there as well.
    const collection = this.getCollectionForDocument(document);
    if (collection) collection.updateDocument(document);
    return document;
  }

  @action
  async delete(document: Document) {
    await super.delete(document);

    runInAction(() => {
      this.recentlyViewedIds = without(this.recentlyViewedIds, document.id);
    });

    // check to see if we have any shares related to this document already
    // loaded in local state. If so we can go ahead and remove those too.
    const share = this.rootStore.shares.getByDocumentId(document.id);
    if (share) {
      this.rootStore.shares.remove(share.id);
    }

    const collection = this.getCollectionForDocument(document);
    if (collection) collection.refresh();
  }

  @action
  archive = async (document: Document) => {
    const res = await client.post("/documents.archive", {
      id: document.id,
    });
    runInAction("Document#archive", () => {
      invariant(res && res.data, "Data should be available");
      document.updateFromJson(res.data);
      this.addPolicies(res.policies);
    });

    const collection = this.getCollectionForDocument(document);
    if (collection) collection.refresh();
  };

  @action
  restore = async (document: Document, options = {}) => {
    const res = await client.post("/documents.restore", {
      id: document.id,
      ...options,
    });
    runInAction("Document#restore", () => {
      invariant(res && res.data, "Data should be available");
      document.updateFromJson(res.data);
      this.addPolicies(res.policies);
    });

    const collection = this.getCollectionForDocument(document);
    if (collection) collection.refresh();
  };

  @action
  unpublish = async (document: Document) => {
    const res = await client.post("/documents.unpublish", {
      id: document.id,
    });

    runInAction("Document#unpublish", () => {
      invariant(res && res.data, "Data should be available");
      document.updateFromJson(res.data);
      this.addPolicies(res.policies);
    });

    const collection = this.getCollectionForDocument(document);
    if (collection) collection.refresh();
  };

  pin = (document: Document) => {
    return client.post("/documents.pin", { id: document.id });
  };

  unpin = (document: Document) => {
    return client.post("/documents.unpin", { id: document.id });
  };

  star = async (document: Document) => {
    this.starredIds.set(document.id, true);

    try {
      return client.post("/documents.star", { id: document.id });
    } catch (err) {
      this.starredIds.set(document.id, false);
    }
  };

  unstar = (document: Document) => {
    this.starredIds.set(document.id, false);

    try {
      return client.post("/documents.unstar", { id: document.id });
    } catch (err) {
      this.starredIds.set(document.id, false);
    }
  };

  getByUrl = (url: string = ""): ?Document => {
    return find(this.orderedData, (doc) => url.endsWith(doc.urlId));
  };

  getCollectionForDocument(document: Document) {
    return this.rootStore.collections.data.get(document.collectionId);
  }
}
