import type { Context } from "koa";
import Router from "koa-router";
import { IntegrationService, IntegrationType } from "@shared/types";
import { integrationSettingsPath } from "@shared/utils/routeHelpers";
import env from "@server/env";
import auth from "@server/middlewares/authentication";
import { transaction } from "@server/middlewares/transaction";
import validate from "@server/middlewares/validate";
import { IntegrationAuthentication, Integration, Team } from "@server/models";
import { APIContext } from "@server/types";
import * as Github from "../github";
import * as T from "./schema";

const router = new Router();

function redirectOnClient(ctx: Context, url: string) {
  ctx.type = "text/html";
  ctx.body = `
<html>
<head>
<meta http-equiv="refresh" content="0;URL='${url}'"/>
</head>`;
}

router.get(
  "github.callback",
  auth({
    optional: true,
  }),
  validate(T.GithubCallbackSchema),
  transaction(),
  async (ctx: APIContext<T.GithubCallbackReq>) => {
    const { code, state: teamId, error } = ctx.input.query;
    const { user } = ctx.state.auth;
    const { transaction } = ctx.state;

    if (error) {
      ctx.redirect(integrationSettingsPath(`github?error=${error}`));
      return;
    }

    // this code block accounts for the root domain being unable to
    // access authentication for subdomains. We must forward to the appropriate
    // subdomain to complete the oauth flow
    if (!user) {
      if (teamId) {
        try {
          const team = await Team.findByPk(teamId, {
            rejectOnEmpty: true,
          });
          return redirectOnClient(
            ctx,
            `${team.url}/auth/github.callback?${ctx.request.querystring}`
          );
        } catch (err) {
          return ctx.redirect(
            integrationSettingsPath(`github?error=unauthenticated`)
          );
        }
      } else {
        return ctx.redirect(
          integrationSettingsPath(`github?error=unauthenticated`)
        );
      }
    }

    const endpoint = `${env.URL}/auth/github.callback`;
    // validation middleware ensures that code is non-null at this point
    const data = await Github.oauthAccess(code!, endpoint);
    const authentication = await IntegrationAuthentication.create(
      {
        service: IntegrationService.Github,
        userId: user.id,
        teamId: user.teamId,
        token: data.access_token,
      },
      { transaction }
    );
    await Integration.create(
      {
        service: IntegrationService.Github,
        type: IntegrationType.Embed,
        userId: user.id,
        teamId: user.teamId,
        authenticationId: authentication.id,
      },
      { transaction }
    );
    ctx.redirect(integrationSettingsPath("github"));
  }
);

export default router;