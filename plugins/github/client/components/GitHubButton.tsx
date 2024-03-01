import * as React from "react";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import env from "~/env";
import { GitHubUtils } from "../../shared/GitHubUtils";

type Props = {
  redirectUri: string;
  state?: string;
  icon?: React.ReactNode;
  label?: string;
};

function GitHubButton({ state = "", redirectUri, label, icon }: Props) {
  const { t } = useTranslation();

  const handleClick = () => {
    if (!env.GITHUB_CLIENT_ID) {
      return;
    }

    window.location.href = GitHubUtils.authUrl(
      state,
      env.GITHUB_CLIENT_ID,
      redirectUri
    );
  };

  return (
    <Button onClick={handleClick} icon={icon} neutral>
      {label || t("Connect GitHub")}
    </Button>
  );
}

export default GitHubButton;