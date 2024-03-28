import { IntegrationType } from "@shared/types";
import { Integration, User, Team } from "@server/models";
import { AdminRequiredError } from "../errors";
import { allow } from "./cancan";

allow(User, "createIntegration", Team, (actor, team) => {
  if (!team || actor.isGuest || actor.isViewer || actor.teamId !== team.id) {
    return false;
  }
  if (actor.isAdmin) {
    return true;
  }

  throw AdminRequiredError();
});

allow(
  User,
  "read",
  Integration,
  (user, integration) => user.teamId === integration?.teamId
);

allow(User, ["update", "delete"], Integration, (user, integration) => {
  if (
    !integration ||
    user.isGuest ||
    user.isViewer ||
    user.teamId !== integration.teamId
  ) {
    return false;
  }
  if (
    integration.userId === user.id &&
    integration.type === IntegrationType.LinkedAccount
  ) {
    return true;
  }
  if (user.isAdmin) {
    return true;
  }

  throw AdminRequiredError();
});
