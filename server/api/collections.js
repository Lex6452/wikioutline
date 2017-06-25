import Router from 'koa-router';
import httpErrors from 'http-errors';
import _ from 'lodash';

import auth from './middlewares/authentication';
import pagination from './middlewares/pagination';
import { presentCollection } from '../presenters';
import { Collection } from '../models';

const router = new Router();

router.post('collections.create', auth(), async ctx => {
  const { name, description, type } = ctx.body;
  ctx.assertPresent(name, 'name is required');

  const user = ctx.state.user;

  const atlas = await Collection.create({
    name,
    description,
    type: type || 'atlas',
    teamId: user.teamId,
    creatorId: user.id,
  });

  ctx.body = {
    data: await presentCollection(ctx, atlas, true),
  };
});

router.post('collections.info', auth(), async ctx => {
  const { id } = ctx.body;
  ctx.assertPresent(id, 'id is required');

  const user = ctx.state.user;
  const atlas = await Collection.findOne({
    where: {
      id,
      teamId: user.teamId,
    },
  });

  if (!atlas) throw httpErrors.NotFound();

  ctx.body = {
    data: await presentCollection(ctx, atlas, true),
  };
});

router.post('collections.list', auth(), pagination(), async ctx => {
  const user = ctx.state.user;
  const collections = await Collection.findAll({
    where: {
      teamId: user.teamId,
    },
    order: [['updatedAt', 'DESC']],
    offset: ctx.state.pagination.offset,
    limit: ctx.state.pagination.limit,
  });

  // Collectiones
  let data = [];
  await Promise.all(
    collections.map(async atlas => {
      return data.push(await presentCollection(ctx, atlas, true));
    })
  );

  data = _.orderBy(data, ['updatedAt'], ['desc']);

  ctx.body = {
    pagination: ctx.state.pagination,
    data,
  };
});

export default router;
