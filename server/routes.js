// @flow
import React from 'react';
import path from 'path';
import fs from 'fs-extra';
import Koa from 'koa';
import Router from 'koa-router';
import sendfile from 'koa-sendfile';
import serve from 'koa-static';
import _ from 'lodash';
import subdomainRedirect from './middlewares/subdomainRedirect';
import renderpage from './utils/renderpage';
import { slackAuth } from '../shared/utils/routeHelpers';
import { robotsResponse } from './utils/robots';
import { NotFoundError } from './errors';

import Home from './pages/Home';
import About from './pages/About';
import Changelog from './pages/Changelog';
import Privacy from './pages/Privacy';
import Pricing from './pages/Pricing';
import Api from './pages/Api';

const isProduction = process.env.NODE_ENV === 'production';
const koa = new Koa();
const router = new Router();

const renderapp = async ctx => {
  if (isProduction) {
    await sendfile(ctx, path.join(__dirname, '../dist/index.html'));
  } else {
    const data = await fs.readFile(path.join(__dirname, './static/dev.html'));
    const template = _.template(data.toString());
    ctx.body = template();
  }
};

// serve static assets
koa.use(serve(path.resolve(__dirname, '../public')));

router.get('/_health', ctx => (ctx.body = 'OK'));

if (process.env.NODE_ENV === 'production') {
  router.get('/static/*', async ctx => {
    ctx.set({
      'Cache-Control': `max-age=${356 * 24 * 60 * 60}`,
    });

    await sendfile(
      ctx,
      path.join(__dirname, '../dist/', ctx.path.substring(8))
    );
  });
}

// slack direct install
router.get('/auth/slack/install', async ctx => {
  const state = Math.random()
    .toString(36)
    .substring(7);

  ctx.cookies.set('state', state, {
    httpOnly: false,
    expires: new Date('2100'),
  });
  ctx.redirect(slackAuth(state));
});

// static pages
router.get('/about', ctx => renderpage(ctx, <About />));
router.get('/pricing', ctx => renderpage(ctx, <Pricing />));
router.get('/developers', ctx => renderpage(ctx, <Api />));
router.get('/privacy', ctx => renderpage(ctx, <Privacy />));
router.get('/changelog', async ctx => {
  const data = await fs.readFile(path.join(__dirname, '../CHANGELOG.md'));
  const body = data.toString();
  return renderpage(ctx, <Changelog body={body} />);
});

// home page
router.get('/', async ctx => {
  if (ctx.cookies.get('loggedIn')) {
    await renderapp(ctx);
  } else {
    await renderpage(ctx, <Home />);
  }
});

// Other
router.get('/robots.txt', ctx => (ctx.body = robotsResponse(ctx)));

// catch all for react app
router.get('*', async ctx => {
  await renderapp(ctx);
  if (!ctx.status) ctx.throw(new NotFoundError());
});

// middleware
koa.use(subdomainRedirect());
koa.use(router.routes());

export default koa;
