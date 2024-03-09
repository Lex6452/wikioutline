import { App } from "octokit";
import pluralize from "pluralize";
import { IntegrationService, IntegrationType } from "@shared/types";
import Logger from "@server/logging/Logger";
import { Integration, User } from "@server/models";
import { GitHubUtils } from "../shared/GitHubUtils";
import { GitHub } from "./github";

export const unfurl = async (url: string, actor: User) => {
  if (!(GitHub.appId && GitHub.appPrivateKey)) {
    return;
  }

  const { owner, repo, resourceType, resourceId } = GitHubUtils.parseUrl(url);

  if (!owner) {
    return;
  }

  const integration = (await Integration.findOne({
    where: {
      service: IntegrationService.GitHub,
      userId: actor.id,
      teamId: actor.teamId,
      "settings.github.installation.account.name": owner,
    },
  })) as Integration<IntegrationType.Embed>;

  if (!integration) {
    return;
  }

  const app = new App({
    appId: GitHub.appId,
    privateKey: GitHub.appPrivateKey,
  });

  try {
    const octokit = await app.getInstallationOctokit(
      integration.settings.github!.installation.id
    );
    const { data } = await octokit.request(
      `GET /repos/{owner}/{repo}/${pluralize(resourceType)}/{ref}`,
      {
        owner,
        repo,
        ref: resourceId,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    return {
      url,
      type: pluralize.singular(resourceType),
      title: data.title,
      description: data.body,
      author: {
        name: data.user.login,
        avatarUrl: data.user.avatar_url,
      },
      meta: {
        labels: data.labels.map((label: { name: string; color: string }) => ({
          name: label.name,
          color: label.color,
        })),
        status: { name: data.state },
      },
    };
  } catch (err) {
    return Logger.warn("Failed to fetch resource from GitHub", err);
  }
};