import { IntegrationType } from "@shared/types";
import { IMIntegrationServices } from "@shared/utils/integrations";
import { Integration } from "@server/models";
import BaseProcessor from "@server/queues/processors/BaseProcessor";
import { IntegrationEvent, Event } from "@server/types";
import { CacheHelper } from "@server/utils/CacheHelper";
import { Hook, PluginManager } from "@server/utils/PluginManager";

export default class IntegrationDeletedProcessor extends BaseProcessor {
  static applicableEvents: Event["name"][] = ["integrations.delete"];

  async perform(event: IntegrationEvent) {
    const integration = await Integration.findOne({
      where: {
        id: event.modelId,
      },
      paranoid: false,
    });
    if (!integration) {
      return;
    }

    // IM integrations have their own processor to handle deleted integration.
    if (IMIntegrationServices.includes(integration.service)) {
      return;
    }

    const uninstallHooks = PluginManager.getHooks(Hook.Uninstall);
    for (const hook of uninstallHooks) {
      await hook.value(integration);
    }

    // Clear the cache of unfurled data for the team as it may be stale now.
    if (integration.type === IntegrationType.Embed) {
      await CacheHelper.clearData(CacheHelper.getUnfurlKey(integration.teamId));
    }

    await integration.destroy({ force: true });
  }
}
