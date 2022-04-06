import invariant from "invariant";
import revisionCreator from "@server/commands/revisionCreator";
import { APM } from "@server/logging/tracing";
import { Revision, Document, User } from "@server/models";
import { DocumentEvent, RevisionEvent, Event } from "@server/types";
import BaseProcessor from "./BaseProcessor";

@APM.trace()
export default class RevisionsProcessor extends BaseProcessor {
  static applicableEvents: Event["name"][] = ["documents.update.debounced"];

  async perform(event: DocumentEvent | RevisionEvent) {
    switch (event.name) {
      case "documents.update.debounced": {
        const document = await Document.findByPk(event.documentId);
        invariant(document, "Document should exist");
        const previous = await Revision.findLatest(document.id);

        // we don't create revisions if identical to previous revision, this can
        // happen if a manual revision was created from another service or user.
        if (
          previous &&
          document.text === previous.text &&
          document.title === previous.title
        ) {
          return;
        }

        const user = await User.findByPk(event.actorId);
        invariant(user, "User should exist");
        await revisionCreator({
          user,
          document,
        });
        break;
      }

      default:
    }
  }
}
