import { PluginManager, PluginType } from "@server/utils/PluginManager";
import config from "../plugin.json";
import router from "./auth/google";
import env from "./env";

PluginManager.register(PluginType.AuthProvider, config.id, router, {
  priority: 10,
  name: config.name,
  description: config.description,
  enabled: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
});
