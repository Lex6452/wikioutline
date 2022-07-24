import DocumentNotificationEmail from "@server/emails/templates/DocumentNotificationEmail";
import { Event, View, NotificationSetting, Subscription } from "@server/models";
import {
  buildDocument,
  buildCollection,
  buildUser,
} from "@server/test/factories";
import { flushdb } from "@server/test/support";
import NotificationsProcessor from "./NotificationsProcessor";

jest.mock("@server/emails/templates/DocumentNotificationEmail");
const ip = "127.0.0.1";

beforeEach(() => flushdb());
beforeEach(jest.resetAllMocks);

describe("documents.publish", () => {
  test("should not send a notification to author", async () => {
    const user = await buildUser();
    const document = await buildDocument({
      teamId: user.teamId,
      lastModifiedById: user.id,
    });
    await NotificationSetting.create({
      userId: user.id,
      teamId: user.teamId,
      event: "documents.publish",
    });

    const processor = new NotificationsProcessor();
    await processor.perform({
      name: "documents.publish",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: document.createdById,
      data: {
        title: document.title,
      },
      ip,
    });
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should send a notification to other users in team", async () => {
    const user = await buildUser();
    const document = await buildDocument({
      teamId: user.teamId,
    });
    await NotificationSetting.create({
      userId: user.id,
      teamId: user.teamId,
      event: "documents.publish",
    });

    const processor = new NotificationsProcessor();
    await processor.perform({
      name: "documents.publish",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: document.createdById,
      data: {
        title: document.title,
      },
      ip,
    });
    expect(DocumentNotificationEmail.schedule).toHaveBeenCalled();
  });

  test("should not send a notification to users without collection access", async () => {
    const user = await buildUser();
    const collection = await buildCollection({
      teamId: user.teamId,
      permission: null,
    });
    const document = await buildDocument({
      teamId: user.teamId,
      collectionId: collection.id,
    });
    await NotificationSetting.create({
      userId: user.id,
      teamId: user.teamId,
      event: "documents.publish",
    });
    const processor = new NotificationsProcessor();
    await processor.perform({
      name: "documents.publish",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: document.createdById,
      data: {
        title: document.title,
      },
      ip,
    });
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });
});

describe("revisions.create", () => {
  test("should not send notification to other collaborators if unsubscribed", async () => {
    const document = await buildDocument();

    const collaborator = await buildUser({
      teamId: document.teamId,
    });

    document.collaboratorIds = [collaborator.id];

    await document.save();

    await NotificationSetting.create({
      userId: collaborator.id,
      teamId: collaborator.teamId,
      event: "documents.update",
    });

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: collaborator.id,
      modelId: document.id,
      ip,
    });

    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should send a notification for subscriptions, even to collaborator", async () => {
    const document = await buildDocument();

    const collaborator = await buildUser({
      teamId: document.teamId,
    });

    // `subscriber` belongs to `collaborator`'s team.
    const subscriber = await buildUser({ teamId: collaborator.teamId });

    document.collaboratorIds = [collaborator.id, subscriber.id];

    await document.save();

    await NotificationSetting.create({
      userId: collaborator.id,
      teamId: collaborator.teamId,
      event: "documents.update",
    });

    // `subscriber` subscribes to `document`'s changes.
    // Specifically "documents.update" event.
    await Subscription.create({
      userId: subscriber.id,
      documentId: document.id,
      event: "documents.update",
      enabled: true,
    });

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: collaborator.id,
      modelId: document.id,
      ip,
    });

    expect(DocumentNotificationEmail.schedule).toHaveBeenCalled();
  });

  test("should create subscriptions for collaborator", async () => {
    const document = await buildDocument();

    const collaborator0 = await buildUser({
      teamId: document.teamId,
    });

    const collaborator1 = await buildUser({
      teamId: document.teamId,
    });

    const collaborator2 = await buildUser({
      teamId: document.teamId,
    });

    document.collaboratorIds = [
      collaborator0.id,
      collaborator1.id,
      collaborator2.id,
    ];

    await document.save();

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "documents.update",
      documentId: document.id,
      collectionId: document.collectionId,
      createdAt: document.updatedAt.toString(),
      teamId: document.teamId,
      data: { title: document.title, autosave: false, done: true },
      actorId: collaborator2.id,
      ip,
    });

    const events = await Event.findAll();

    // Should emit 3 `subscriptions.create` events.
    expect(events.length).toEqual(3);
    expect(events[0].name).toEqual("subscriptions.create");
    expect(events[1].name).toEqual("subscriptions.create");
    expect(events[2].name).toEqual("subscriptions.create");

    // Each event should point to same document.
    expect(events[0].documentId).toEqual(document.id);
    expect(events[1].documentId).toEqual(document.id);
    expect(events[2].documentId).toEqual(document.id);

    // Events should mention correct `userId`.
    expect(events[0].userId).toEqual(collaborator0.id);
    expect(events[1].userId).toEqual(collaborator1.id);
    expect(events[2].userId).toEqual(collaborator2.id);

    // Should not send email notification just yet.
    // That should be done by `revisions.create` event handler.
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should not create subscriptions if previously unsubscribed", async () => {
    const document = await buildDocument();

    const collaborator0 = await buildUser({
      teamId: document.teamId,
    });

    const collaborator1 = await buildUser({
      teamId: document.teamId,
    });

    const collaborator2 = await buildUser({
      teamId: document.teamId,
    });

    document.collaboratorIds = [
      collaborator0.id,
      collaborator1.id,
      collaborator2.id,
    ];

    await document.save();

    // `collaborator2` created a subscription.
    const subscription2 = await Subscription.create({
      userId: collaborator2.id,
      documentId: document.id,
      event: "documents.update",
    });

    // `collaborator2` would no longer like to be notified.
    await subscription2.destroy();

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "documents.update",
      documentId: document.id,
      collectionId: document.collectionId,
      createdAt: document.updatedAt.toString(),
      teamId: document.teamId,
      data: { title: document.title, autosave: false, done: true },
      actorId: collaborator2.id,
      ip,
    });

    const events = await Event.findAll();

    // Should emit 2 `subscriptions.create` events.
    expect(events.length).toEqual(2);
    expect(events[0].name).toEqual("subscriptions.create");
    expect(events[1].name).toEqual("subscriptions.create");

    // Each event should point to same document.
    expect(events[0].documentId).toEqual(document.id);
    expect(events[1].documentId).toEqual(document.id);

    // Events should mention correct `userId`.
    expect(events[0].userId).toEqual(collaborator0.id);
    expect(events[1].userId).toEqual(collaborator1.id);

    // Should not send email notification just yet.
    // That should be done by `revisions.create` event handler.
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should send a notification for subscriptions to non-collaborators", async () => {
    const document = await buildDocument();

    const collaborator = await buildUser({
      teamId: document.teamId,
    });

    // `subscriber` belongs to `collaborator`'s team,
    const subscriber = await buildUser({
      teamId: document.teamId,
    });

    // `subscriber` hasn't collaborated on `document`.
    document.collaboratorIds = [collaborator.id];

    await document.save();

    await NotificationSetting.create({
      userId: collaborator.id,
      teamId: collaborator.teamId,
      event: "documents.update",
    });

    // `subscriber` subscribes to `document`'s changes.
    // Specifically "documents.update" event.
    await Subscription.create({
      userId: subscriber.id,
      documentId: document.id,
      event: "documents.update",
      enabled: true,
    });

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: collaborator.id,
      modelId: document.id,
      ip,
    });

    expect(DocumentNotificationEmail.schedule).toHaveBeenCalled();
  });

  test("should not send a notification for subscriptions to collaborators if un-subscribed", async () => {
    const document = await buildDocument();

    const collaborator = await buildUser({
      teamId: document.teamId,
    });

    // `subscriber` belongs to `collaborator`'s team,
    const subscriber = await buildUser({
      teamId: document.teamId,
    });

    // `subscriber` has collaborated on `document`.
    document.collaboratorIds = [collaborator.id, subscriber.id];

    await document.save();

    await NotificationSetting.create({
      userId: collaborator.id,
      teamId: collaborator.teamId,
      event: "documents.update",
    });

    // `subscriber` subscribes to `document`'s changes.
    // Specifically "documents.update" event.
    const subscription = await Subscription.create({
      userId: subscriber.id,
      documentId: document.id,
      event: "documents.update",
      enabled: true,
    });

    // `subscriber` proptly unsubscribes.
    subscription.destroy();

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: collaborator.id,
      modelId: document.id,
      ip,
    });

    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should not send a notification for subscriptions to members outside of the team", async () => {
    const document = await buildDocument();

    const collaborator = await buildUser({
      teamId: document.teamId,
    });

    // `subscriber` *does not* belong
    // to `collaborator`'s team,
    const subscriber = await buildUser();

    // `subscriber`  hasn't collaborated on `document`.
    document.collaboratorIds = [collaborator.id];

    await document.save();

    await NotificationSetting.create({
      userId: collaborator.id,
      teamId: collaborator.teamId,
      event: "documents.update",
    });

    // `subscriber` subscribes to `document`'s changes.
    // Specifically "documents.update" event.
    // Not sure how they got hold of this document,
    // but let's just pretend they did!
    await Subscription.create({
      userId: subscriber.id,
      documentId: document.id,
      event: "documents.update",
      enabled: true,
    });

    const processor = new NotificationsProcessor();

    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: collaborator.id,
      modelId: document.id,
      ip,
    });

    // Email should not have been sent.
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should not send a notification if viewed since update", async () => {
    const document = await buildDocument();
    const collaborator = await buildUser({
      teamId: document.teamId,
    });
    document.collaboratorIds = [collaborator.id];
    await document.save();
    await NotificationSetting.create({
      userId: collaborator.id,
      teamId: collaborator.teamId,
      event: "documents.update",
    });
    await View.touch(document.id, collaborator.id, true);

    const processor = new NotificationsProcessor();
    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: collaborator.id,
      modelId: document.id,
      ip,
    });
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });

  test("should not send a notification to last editor", async () => {
    const user = await buildUser();
    const document = await buildDocument({
      teamId: user.teamId,
      lastModifiedById: user.id,
    });
    await NotificationSetting.create({
      userId: user.id,
      teamId: user.teamId,
      event: "documents.update",
    });
    const processor = new NotificationsProcessor();
    await processor.perform({
      name: "revisions.create",
      documentId: document.id,
      collectionId: document.collectionId,
      teamId: document.teamId,
      actorId: user.id,
      modelId: document.id,
      ip,
    });
    expect(DocumentNotificationEmail.schedule).not.toHaveBeenCalled();
  });
});
