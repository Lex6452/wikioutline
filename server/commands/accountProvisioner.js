// @flow
import invariant from "invariant";
import Sequelize from "sequelize";
import {
  AuthenticationError,
  EmailAuthenticationRequiredError,
  AuthenticationProviderDisabledError,
} from "../errors";
import { sendEmail } from "../mailer";
import { Team, User } from "../models";
import teamCreator from "./teamCreator";
import userCreator from "./userCreator";

type Props = {|
  ip: string,
  user: {|
    name: string,
    email: string,
    isAdmin?: boolean,
    avatarUrl?: string,
  |},
  team: {|
    name: string,
    domain?: string,
    subdomain: string,
    avatarUrl?: string,
  |},
  authenticationProvider: {|
    name: string,
    providerId: string,
  |},
  authentication: {|
    providerId: string,
    scopes: string[],
    accessToken?: string,
    refreshToken?: string,
  |},
|};

export type AccountProvisionerResult = {|
  user: User,
  team: Team,
  isNewTeam: boolean,
  isNewUser: boolean,
|};

export default async function accountProvisioner({
  ip,
  user: userParams,
  team: teamParams,
  authenticationProvider: authenticationProviderParams,
  authentication: authenticationParams,
}: Props): Promise<AccountProvisionerResult> {
  let result;
  try {
    result = await teamCreator({
      name: teamParams.name,
      domain: teamParams.domain,
      subdomain: teamParams.subdomain,
      avatarUrl: teamParams.avatarUrl,
      authenticationProvider: authenticationProviderParams,
    });
  } catch (err) {
    throw new AuthenticationError(err.message);
  }

  invariant(result, "Team creator result must exist");
  const { authenticationProvider, team, isNewTeam } = result;

  if (!authenticationProvider.enabled) {
    throw new AuthenticationProviderDisabledError();
  }

  try {
    const result = await userCreator({
      name: userParams.name,
      email: userParams.email,
      isAdmin: isNewTeam || userParams.isAdmin,
      avatarUrl: userParams.avatarUrl,
      teamId: team.id,
      ip,
      authentication: {
        ...authenticationParams,
        authenticationProviderId: authenticationProvider.id,
      },
    });

    const { isNewUser, user } = result;

    if (isNewUser) {
      sendEmail("welcome", user.email, { teamUrl: team.url });
    }

    if (isNewTeam) {
      await team.provisionFirstCollection(user.id);
    }

    return {
      user,
      team,
      isNewUser,
      isNewTeam,
    };
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      const exists = await User.findOne({
        where: {
          email: userParams.email,
          teamId: team.id,
        },
      });

      if (exists) {
        throw new EmailAuthenticationRequiredError(
          "Email authentication required",
          team.url
        );
      } else {
        throw new AuthenticationError(err.message, team.url);
      }
    }

    throw err;
  }
}
