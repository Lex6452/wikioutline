import { onConnectPayload } from "@hocuspocus/server";
import Logger from "@server/logging/logger";
import { User } from "@server/models";

export default class CollaborationLogger {
  async onLoadDocument(data: {
    documentName: string;
    context: {
      // @ts-expect-error ts-migrate(2749) FIXME: 'User' refers to a value, but is being used as a t... Remove this comment to see the full error message
      user: User;
    };
  }) {
    Logger.info("hocuspocus", `Loaded document "${data.documentName}"`, {
      userId: data.context.user.id,
    });
  }

  async onConnect(data: onConnectPayload) {
    Logger.info("hocuspocus", `New connection to "${data.documentName}"`);
  }

  async onDisconnect(data: {
    documentName: string;
    context: {
      // @ts-expect-error ts-migrate(2749) FIXME: 'User' refers to a value, but is being used as a t... Remove this comment to see the full error message
      user: User;
    };
  }) {
    Logger.info("hocuspocus", `Connection to "${data.documentName}" closed `);
  }
}
