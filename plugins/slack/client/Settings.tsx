import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
import { IntegrationService, IntegrationType } from "@shared/types";
import Collection from "~/models/Collection";
import Integration from "~/models/Integration";
import Button from "~/components/Button";
import Heading from "~/components/Heading";
import CollectionIcon from "~/components/Icons/CollectionIcon";
import List from "~/components/List";
import ListItem from "~/components/List/Item";
import Notice from "~/components/Notice";
import Scene from "~/components/Scene";
import Text from "~/components/Text";
import env from "~/env";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import usePolicy from "~/hooks/usePolicy";
import useQuery from "~/hooks/useQuery";
import useStores from "~/hooks/useStores";
import { SlackUtils } from "../shared/SlackUtils";
import SlackIcon from "./Icon";
import SlackButton from "./components/SlackButton";
import SlackListItem from "./components/SlackListItem";

function Slack() {
  const team = useCurrentTeam();
  const { collections, integrations } = useStores();
  const { t } = useTranslation();
  const query = useQuery();
  const can = usePolicy(team);
  const error = query.get("error");

  React.useEffect(() => {
    void collections.fetchPage({
      limit: 100,
    });
    void integrations.fetchPage({
      service: IntegrationService.Slack,
      limit: 100,
    });
  }, [collections, integrations]);

  const commandIntegration = integrations.find({
    type: IntegrationType.Command,
    service: IntegrationService.Slack,
  });

  const linkedAccountIntegration = integrations.find({
    type: IntegrationType.LinkedAccount,
    service: IntegrationService.Slack,
  });

  const groupedCollections = collections.orderedData
    .map<[Collection, Integration | undefined]>((collection) => {
      const integration = integrations.find({
        service: IntegrationService.Slack,
        collectionId: collection.id,
      });

      return [collection, integration];
    })
    .sort((a) => (a[1] ? -1 : 1));

  const appName = env.APP_NAME;

  return (
    <Scene title="Slack" icon={<SlackIcon />}>
      <Heading>Slack</Heading>

      <Text as="p" type="secondary">
        <Trans>
          Link your account to Slack to enable searching all the documents you
          have access to in {{ appName }} from within Slack.
        </Trans>
      </Text>

      {linkedAccountIntegration ? (
        <Button onClick={() => linkedAccountIntegration.delete()} neutral>
          {t("Disconnect")}
        </Button>
      ) : (
        <SlackButton
          redirectUri={SlackUtils.connectUrl()}
          state={SlackUtils.createState(team.id, IntegrationType.LinkedAccount)}
          label={t("Connect")}
        />
      )}

      {error === "access_denied" && (
        <Notice>
          <Trans>
            Whoops, you need to accept the permissions in Slack to connect{" "}
            {{ appName }} to your workspace. Try again?
          </Trans>
        </Notice>
      )}
      {error === "unauthenticated" && (
        <Notice>
          <Trans>
            Something went wrong while authenticating your request. Please try
            logging in again.
          </Trans>
        </Notice>
      )}
      {can.update && (
        <>
          <Text as="p" type="secondary">
            <Trans
              defaults="Get rich previews of {{ appName }} links shared in Slack and use the <em>{{ command }}</em> slash command to search for documents without leaving your chat."
              values={{
                command: "/outline",
                appName,
              }}
              components={{
                em: <Code />,
              }}
            />
          </Text>
          <p>
            {commandIntegration ? (
              <Button onClick={() => commandIntegration.delete()} neutral>
                {t("Disconnect")}
              </Button>
            ) : (
              <SlackButton
                scopes={["commands", "links:read", "links:write"]}
                redirectUri={SlackUtils.connectUrl()}
                state={SlackUtils.createState(team.id, IntegrationType.Command)}
                icon={<SlackIcon />}
              />
            )}
          </p>
          <p>&nbsp;</p>

          <h2>{t("Collections")}</h2>
          <Text as="p" type="secondary">
            <Trans>
              Connect {{ appName }} collections to Slack channels. Messages will
              be automatically posted to Slack when documents are published or
              updated.
            </Trans>
          </Text>

          <List>
            {groupedCollections.map(([collection, integration]) => {
              if (integration) {
                return (
                  <SlackListItem
                    key={integration.id}
                    collection={collection}
                    integration={
                      integration as Integration<IntegrationType.Post>
                    }
                  />
                );
              }

              return (
                <ListItem
                  key={collection.id}
                  title={collection.name}
                  image={<CollectionIcon collection={collection} />}
                  actions={
                    <SlackButton
                      scopes={["incoming-webhook"]}
                      redirectUri={SlackUtils.connectUrl()}
                      state={SlackUtils.createState(
                        team.id,
                        IntegrationType.Post,
                        { collectionId: collection.id }
                      )}
                      label={t("Connect")}
                    />
                  }
                />
              );
            })}
          </List>
        </>
      )}
    </Scene>
  );
}

const Code = styled.code`
  padding: 4px 6px;
  margin: 0 2px;
  background: ${(props) => props.theme.codeBackground};
  border-radius: 4px;
`;

export default observer(Slack);
