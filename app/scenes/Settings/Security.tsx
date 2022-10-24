import { debounce } from "lodash";
import { action } from "mobx";
import { observer } from "mobx-react";
import { EmailIcon, PadlockIcon } from "outline-icons";
import { useState } from "react";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import AuthLogo from "~/components/AuthLogo";
import ConfirmationDialog from "~/components/ConfirmationDialog";
import Flex from "~/components/Flex";
import Heading from "~/components/Heading";
import InputSelect from "~/components/InputSelect";
import Scene from "~/components/Scene";
import Switch from "~/components/Switch";
import Text from "~/components/Text";
import env from "~/env";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useRequest from "~/hooks/useRequest";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import isCloudHosted from "~/utils/isCloudHosted";
import DomainManagement from "./components/DomainManagement";
import SettingRow from "./components/SettingRow";

function Security() {
  const { auth, authenticationProviders, dialogs } = useStores();
  const team = useCurrentTeam();
  const { t } = useTranslation();
  const { showToast } = useToasts();
  const [data, setData] = useState({
    sharing: team.sharing,
    documentEmbeds: team.documentEmbeds,
    guestSignin: team.guestSignin,
    defaultUserRole: team.defaultUserRole,
    memberCollectionCreate: team.memberCollectionCreate,
    inviteRequired: team.inviteRequired,
  });

  const { data: providers, loading, request } = useRequest(() =>
    authenticationProviders.fetchPage({})
  );

  React.useEffect(() => {
    if (!providers && !loading) {
      request();
    }
  }, [loading, providers, request]);

  const showSuccessMessage = React.useMemo(
    () =>
      debounce(() => {
        showToast(t("Settings saved"), {
          type: "success",
        });
      }, 250),
    [showToast, t]
  );

  const saveData = React.useCallback(
    async (newData) => {
      try {
        setData(newData);
        await auth.updateTeam(newData);
        showSuccessMessage();
      } catch (err) {
        showToast(err.message, {
          type: "error",
        });
      }
    },
    [auth, showSuccessMessage, showToast]
  );

  const handleChange = React.useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      await saveData({ ...data, [ev.target.id]: ev.target.checked });
    },
    [data, saveData]
  );

  const handleDefaultRoleChange = React.useCallback(
    async (newDefaultRole: string) => {
      await saveData({ ...data, defaultUserRole: newDefaultRole });
    },
    [data, saveData]
  );

  const handleInviteRequiredChange = React.useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const inviteRequired = ev.target.checked;
      const newData = { ...data, inviteRequired };

      if (inviteRequired) {
        dialogs.openModal({
          isCentered: true,
          title: t("Are you sure you want to require invites?"),
          content: (
            <ConfirmationDialog
              onSubmit={async () => {
                await saveData(newData);
              }}
              submitText={t("I’m sure")}
              savingText={`${t("Saving")}…`}
              danger
            >
              <Trans
                defaults="New users will first need to be invited to create an account. <em>Default role</em> and <em>Allowed domains</em> will no longer apply."
                values={{
                  authenticationMethods: team.signinMethods,
                }}
                components={{
                  em: <strong />,
                }}
              />
            </ConfirmationDialog>
          ),
        });
        return;
      }

      await saveData(newData);
    },
    [data, saveData, t, dialogs, team.signinMethods]
  );

  return (
    <Scene title={t("Security")} icon={<PadlockIcon color="currentColor" />}>
      <Heading>{t("Security")}</Heading>
      <Text type="secondary">
        <Trans>
          Settings that impact the access, security, and content of your
          knowledge base.
        </Trans>
      </Text>

      <h2>{t("Sign In")}</h2>
      {authenticationProviders.orderedData.map((provider) => (
        <SettingRow
          key={provider.name}
          label={
            <Flex gap={8} align="center">
              <AuthLogo providerName={provider.name} /> {provider.displayName}
            </Flex>
          }
          name={provider.name}
          description={t("Allow members to sign-in with {{ authProvider }}", {
            authProvider: provider.displayName,
          })}
        >
          <Switch
            id={provider.name}
            checked={provider.isEnabled}
            onChange={action(async () => {
              try {
                provider.isEnabled = !provider.isEnabled;
                await provider.save();
              } catch (err) {
                provider.isEnabled = !provider.isEnabled;
              }
            })}
          />
        </SettingRow>
      ))}
      <SettingRow
        label={
          <Flex gap={8} align="center">
            <EmailIcon color="currentColor" /> {t("Email")}
          </Flex>
        }
        name="guestSignin"
        description={
          env.EMAIL_ENABLED
            ? t("Allow members to sign-in using their email address")
            : t("The server must have SMTP configured to enable this setting")
        }
        border={false}
      >
        <Switch
          id="guestSignin"
          checked={data.guestSignin}
          onChange={handleChange}
          disabled={!env.EMAIL_ENABLED}
        />
      </SettingRow>

      <h2>{t("Access")}</h2>
      {isCloudHosted && (
        <SettingRow
          label={t("Require invites")}
          name="inviteRequired"
          description={t(
            "Require members to be invited to the workspace before they can create an account using SSO."
          )}
        >
          <Switch
            id="inviteRequired"
            checked={data.inviteRequired}
            onChange={handleInviteRequiredChange}
          />
        </SettingRow>
      )}

      {!data.inviteRequired && (
        <DomainManagement onSuccess={showSuccessMessage} />
      )}
      {!data.inviteRequired && (
        <SettingRow
          label={t("Default role")}
          name="defaultUserRole"
          description={t(
            "The default user role for new accounts. Changing this setting does not affect existing user accounts."
          )}
          border={false}
        >
          <InputSelect
            id="defaultUserRole"
            value={data.defaultUserRole}
            options={[
              {
                label: t("Member"),
                value: "member",
              },
              {
                label: t("Viewer"),
                value: "viewer",
              },
            ]}
            onChange={handleDefaultRoleChange}
            ariaLabel={t("Default role")}
            short
          />
        </SettingRow>
      )}

      <h2>{t("Behavior")}</h2>
      <SettingRow
        label={t("Public document sharing")}
        name="sharing"
        description={t(
          "When enabled, documents can be shared publicly on the internet by any member of the workspace"
        )}
      >
        <Switch id="sharing" checked={data.sharing} onChange={handleChange} />
      </SettingRow>
      <SettingRow
        label={t("Rich service embeds")}
        name="documentEmbeds"
        description={t(
          "Links to supported services are shown as rich embeds within your documents"
        )}
      >
        <Switch
          id="documentEmbeds"
          checked={data.documentEmbeds}
          onChange={handleChange}
        />
      </SettingRow>
      <SettingRow
        label={t("Collection creation")}
        name="memberCollectionCreate"
        description={t(
          "Allow members to create new collections within the knowledge base"
        )}
      >
        <Switch
          id="memberCollectionCreate"
          checked={data.memberCollectionCreate}
          onChange={handleChange}
        />
      </SettingRow>
    </Scene>
  );
}

export default observer(Security);
