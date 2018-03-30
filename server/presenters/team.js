// @flow
import { Team } from '../models';
import { BILLING_ENABLED } from '../../shared/environment';

function present(ctx: Object, team: Team) {
  ctx.cache.set(team.id, team);

  return {
    id: team.id,
    name: team.name,
    avatarUrl:
      team.avatarUrl || (team.slackData ? team.slackData.image_88 : null),
    userCount: team.userCount,
    isSuspended: BILLING_ENABLED ? team.suspended : undefined,
  };
}

export default present;
