// @flow
import Router from 'koa-router';
import httpErrors from 'http-errors';
import { Authentication, Document, User } from '../models';
import * as Slack from '../slack';
const router = new Router();

router.post('hooks.unfurl', async ctx => {
  const { challenge, token, event } = ctx.body;
  if (challenge) return (ctx.body = ctx.body.challenge);

  if (token !== process.env.SLACK_VERIFICATION_TOKEN)
    throw httpErrors.BadRequest('Invalid token');

  // TODO: Everything from here onwards will get moved to an async job
  const user = await User.find({ where: { slackId: event.user } });
  if (!user) return;

  const auth = await Authentication.find({
    where: { serviceId: 'slack', teamId: user.teamId },
  });
  if (!auth) {
    await Slack.post('chat.unfurl', {
      token: user.slackAccessToken,
      channel: event.channel,
      ts: event.message_ts,
      user_auth_required: true,
    });
    return;
  }

  // get content for unfurled links
  let unfurls = {};
  for (let link of event.links) {
    const id = link.url.substr(link.url.lastIndexOf('/') + 1);
    const doc = await Document.findById(id);
    if (!doc || doc.teamId !== user.teamId) continue;

    unfurls[link.url] = {
      title: doc.title,
      text: doc.getSummary(),
      color: doc.collection.color || undefined,
    };
  }

  await Slack.post('chat.unfurl', {
    token: auth.token,
    channel: event.channel,
    ts: event.message_ts,
    unfurls,
  });
});

router.post('hooks.slack', async ctx => {
  const { token, user_id, text } = ctx.body;
  ctx.assertPresent(token, 'token is required');
  ctx.assertPresent(user_id, 'user_id is required');
  ctx.assertPresent(text, 'text is required');

  if (token !== process.env.SLACK_VERIFICATION_TOKEN)
    throw httpErrors.BadRequest('Invalid token');

  const user = await User.find({
    where: {
      slackId: user_id,
    },
  });

  if (!user) throw httpErrors.BadRequest('Invalid user');

  const documents = await Document.searchForUser(user, text, {
    limit: 5,
  });

  if (documents) {
    const results = [];
    let number = 1;
    for (const document of documents) {
      results.push(
        `${number}. <${process.env.URL}${document.getUrl()}|${document.title}>`
      );
      number += 1;
    }

    ctx.body = {
      text: 'Search results:',
      attachments: [
        {
          text: results.join('\n'),
          color: '#3AA3E3',
        },
      ],
    };
  } else {
    ctx.body = {
      text: 'No search results',
    };
  }
});

export default router;
