import { IsOptional } from "class-validator";
import { Environment } from "@server/env";
import environment from "@server/utils/environment";
import { CannotUseWithout } from "@server/utils/validators";

class GitHubPluginEnvironment extends Environment {
  /**
   * GitHub OAuth2 client credentials. To enable integration with GitHub.
   */
  @IsOptional()
  @CannotUseWithout("GITHUB_CLIENT_ID")
  public GITHUB_CLIENT_SECRET = this.toOptionalString(
    environment.GITHUB_CLIENT_SECRET
  );

  @IsOptional()
  @CannotUseWithout("GITHUB_APP_PRIVATE_KEY")
  public GITHUB_APP_ID = this.toOptionalString(environment.GITHUB_APP_ID);

  @IsOptional()
  @CannotUseWithout("GITHUB_APP_ID")
  public GITHUB_APP_PRIVATE_KEY = this.toOptionalString(
    environment.GITHUB_APP_PRIVATE_KEY
  );
}

export default new GitHubPluginEnvironment();