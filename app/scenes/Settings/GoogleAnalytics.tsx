import { find } from "lodash";
import { observer } from "mobx-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation, Trans } from "react-i18next";
import { IntegrationType } from "@shared/types";
import Integration from "~/models/Integration";
import Button from "~/components/Button";
import Heading from "~/components/Heading";
import GoogleIcon from "~/components/Icons/GoogleIcon";
import { ReactHookWrappedInput as Input } from "~/components/Input";
import Scene from "~/components/Scene";
import Text from "~/components/Text";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";

type FormData = {
  trackingId: string;
};

function GoogleAnalytics() {
  const { integrations } = useStores();
  const { t } = useTranslation();
  const { showToast } = useToasts();

  const integration = find(integrations.orderedData, {
    type: IntegrationType.Analytics,
    service: "google-analytics",
  }) as Integration<IntegrationType.Analytics> | undefined;

  const {
    register,
    reset,
    handleSubmit: formHandleSubmit,
    formState,
  } = useForm<FormData>({
    mode: "all",
    defaultValues: {
      trackingId: integration?.settings.trackingId,
    },
  });

  React.useEffect(() => {
    integrations.fetchPage({
      type: IntegrationType.Analytics,
    });
  }, [integrations]);

  React.useEffect(() => {
    reset({ trackingId: integration?.settings.trackingId });
  }, [integration, reset]);

  const handleSubmit = React.useCallback(
    async (data: FormData) => {
      try {
        if (data.trackingId) {
          await integrations.save({
            id: integration?.id,
            type: IntegrationType.Analytics,
            service: "google-analytics",
            settings: {
              trackingId: data.trackingId,
            },
          });
        } else {
          await integration?.delete();
        }

        showToast(t("Settings saved"), {
          type: "success",
        });
      } catch (err) {
        showToast(err.message, {
          type: "error",
        });
      }
    },
    [integrations, integration, t, showToast]
  );

  return (
    <Scene
      title={t("Google Analytics")}
      icon={<GoogleIcon color="currentColor" />}
    >
      <Heading>{t("Google Analytics")}</Heading>

      <Text type="secondary">
        <Trans>
          Add a Google Analytics 4 tracking ID to send document views and
          analytics from the workspace to your own Google Analytics account.
        </Trans>
        <form onSubmit={formHandleSubmit(handleSubmit)}>
          <p>
            <Input
              label={t("Tracking ID")}
              placeholder=""
              {...register("trackingId")}
            />
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? `${t("Saving")}…` : t("Save")}
            </Button>
          </p>
        </form>
      </Text>
    </Scene>
  );
}

export default observer(GoogleAnalytics);
