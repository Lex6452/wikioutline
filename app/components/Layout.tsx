import { observable } from "mobx";
import { observer } from "mobx-react";
import { MenuIcon } from "outline-icons";
import * as React from "react";
import { Helmet } from "react-helmet";
import { withTranslation, WithTranslation } from "react-i18next";
import { Switch, Route } from "react-router-dom";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import RootStore from "~/stores/RootStore";
import ErrorSuspended from "~/scenes/ErrorSuspended";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import { LoadingIndicatorBar } from "~/components/LoadingIndicator";
import RegisterKeyDown from "~/components/RegisterKeyDown";
import Sidebar from "~/components/Sidebar";
import SettingsSidebar from "~/components/Sidebar/Settings";
import SkipNavContent from "~/components/SkipNavContent";
import SkipNavLink from "~/components/SkipNavLink";
import { isModKey } from "~/utils/keyboard";
import {
  searchUrl,
  matchDocumentSlug as slug,
  newDocumentPath,
  settingsPath,
} from "~/utils/routeHelpers";
import history from "../utils/history";
import withStores from "./withStores";

const DocumentHistory = React.lazy(
  () =>
    import(
      /* webpackChunkName: "document-history" */
      "~/components/DocumentHistory"
    )
);
const CommandBar = React.lazy(
  () =>
    import(
      /* webpackChunkName: "command-bar" */
      "~/components/CommandBar"
    )
);

type Props = WithTranslation &
  RootStore & {
    children?: React.ReactNode;
  };

@observer
class Layout extends React.Component<Props> {
  scrollable: HTMLDivElement | null | undefined;

  @observable
  keyboardShortcutsOpen = false;

  goToSearch = (ev: KeyboardEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    history.push(searchUrl());
  };

  goToNewDocument = () => {
    const { activeCollectionId } = this.props.ui;
    if (!activeCollectionId) return;
    const can = this.props.policies.abilities(activeCollectionId);
    if (!can.update) return;
    history.push(newDocumentPath(activeCollectionId));
  };

  render() {
    const { auth, ui } = this.props;
    const { user, team } = auth;
    const showSidebar = auth.authenticated && user && team;
    const sidebarCollapsed = ui.isEditing || ui.sidebarCollapsed;
    if (auth.isSuspended) return <ErrorSuspended />;

    return (
      <Container column auto>
        <RegisterKeyDown trigger="n" handler={this.goToNewDocument} />
        <RegisterKeyDown trigger="t" handler={this.goToSearch} />
        <RegisterKeyDown trigger="/" handler={this.goToSearch} />
        <RegisterKeyDown
          trigger="."
          handler={(event) => {
            if (isModKey(event)) {
              ui.toggleCollapsedSidebar();
            }
          }}
        />
        <Helmet>
          <title>{team && team.name ? team.name : "Outline"}</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Helmet>
        <SkipNavLink />

        {this.props.ui.progressBarVisible && <LoadingIndicatorBar />}

        <MobileMenuButton
          onClick={ui.toggleMobileSidebar}
          icon={<MenuIcon />}
          iconColor="currentColor"
          neutral
        />

        <Container auto>
          {showSidebar && (
            <Switch>
              <Route path={settingsPath()} component={SettingsSidebar} />
              <Route component={Sidebar} />
            </Switch>
          )}

          <SkipNavContent />
          <Content
            auto
            justify="center"
            $isResizing={ui.sidebarIsResizing}
            $sidebarCollapsed={sidebarCollapsed}
            style={
              sidebarCollapsed
                ? undefined
                : {
                    marginLeft: `${ui.sidebarWidth}px`,
                  }
            }
          >
            {this.props.children}
          </Content>

          <React.Suspense fallback={null}>
            <Switch>
              <Route
                path={`/doc/${slug}/history/:revisionId?`}
                component={DocumentHistory}
              />
            </Switch>
          </React.Suspense>
        </Container>
        <CommandBar />
      </Container>
    );
  }
}

const Container = styled(Flex)`
  background: ${(props) => props.theme.background};
  transition: ${(props) => props.theme.backgroundTransition};
  position: relative;
  width: 100%;
  min-height: 100%;
`;

const MobileMenuButton = styled(Button)`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: ${(props) => props.theme.depths.sidebar - 1};

  ${breakpoint("tablet")`
    display: none;
  `};

  @media print {
    display: none;
  }
`;

const Content = styled(Flex)<{
  $isResizing?: boolean;
  $sidebarCollapsed?: boolean;
}>`
  margin: 0;
  transition: ${(props) =>
    props.$isResizing ? "none" : `margin-left 100ms ease-out`};

  @media print {
    margin: 0 !important;
  }

  ${breakpoint("mobile", "tablet")`
    margin-left: 0 !important;
  `}

  ${breakpoint("tablet")`
    ${(props: any) =>
      props.$sidebarCollapsed &&
      `margin-left: ${props.theme.sidebarCollapsedWidth}px;`}
  `};
`;

export default withTranslation()(withStores(Layout));
