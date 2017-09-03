// @flow
import React, { Component } from 'react';
import get from 'lodash/get';
import styled from 'styled-components';
import { observer, inject } from 'mobx-react';
import { withRouter, Prompt } from 'react-router';
import Flex from 'components/Flex';
import { layout, color } from 'styles/constants';
import invariant from 'invariant';

import Document from 'models/Document';
import UiStore from 'stores/UiStore';
import DocumentsStore from 'stores/DocumentsStore';
import Menu from './components/Menu';
import LoadingPlaceholder from 'components/LoadingPlaceholder';
import Editor from 'components/Editor';
import DropToImport from 'components/DropToImport';
import { HeaderAction } from 'components/Layout';
import LoadingIndicator from 'components/LoadingIndicator';
import PublishingInfo from 'components/PublishingInfo';
import CenteredContent from 'components/CenteredContent';
import PageTitle from 'components/PageTitle';

const DISCARD_CHANGES = `
You have unsaved changes.
Are you sure you want to discard them?
`;

type Props = {
  match: Object,
  history: Object,
  keydown: Object,
  documents: DocumentsStore,
  newDocument?: boolean,
  ui: UiStore,
};

@observer class DocumentScene extends Component {
  props: Props;
  savedTimeout: number;
  state: {
    newDocument?: Document,
  };
  state = {
    isDragging: false,
    isLoading: false,
    isSaving: false,
    newDocument: undefined,
    showAsSaved: false,
  };

  componentDidMount() {
    this.loadDocument(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.match.params.documentSlug !==
      this.props.match.params.documentSlug
    ) {
      this.loadDocument(nextProps);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.savedTimeout);
    this.props.ui.clearActiveDocument();
  }

  loadDocument = async props => {
    if (props.newDocument) {
      const newDocument = new Document({
        collection: { id: props.match.params.id },
        title: '',
        text: '',
      });
      this.setState({ newDocument });
    } else {
      let document = this.document;
      if (document) {
        this.props.ui.setActiveDocument(document);
      }

      await this.props.documents.fetch(props.match.params.documentSlug);
      document = this.document;

      if (document) {
        this.props.ui.setActiveDocument(document);
        document.view();
      }
    }
  };

  get document() {
    if (this.state.newDocument) return this.state.newDocument;
    return this.props.documents.getByUrl(
      `/doc/${this.props.match.params.documentSlug}`
    );
  }

  onClickEdit = () => {
    if (!this.document) return;
    const url = `${this.document.url}/edit`;
    this.props.history.push(url);
  };

  onSave = async (redirect: boolean = false) => {
    if (this.document && !this.document.allowSave) return;
    let document = this.document;

    if (!document) return;
    this.setState({
      isSaving: true,
      isLoading: true,
    });
    document = await document.save();
    this.setState({ isLoading: false });

    if (redirect || this.props.newDocument) {
      this.props.history.push(document.url);
    } else {
      this.showAsSaved();
    }
  };

  showAsSaved() {
    this.setState({
      isSaving: false,
      showAsSaved: true,
    });
    this.savedTimeout = setTimeout(
      () =>
        this.setState({
          showAsSaved: false,
        }),
      2000
    );
  }

  onImageUploadStart = () => {
    this.setState({ isLoading: true });
  };

  onImageUploadStop = () => {
    this.setState({ isLoading: false });
  };

  onChange = text => {
    if (!this.document) return;
    this.document.updateData({ text }, true);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  onStartDragging = () => {
    this.setState({ isDragging: true });
  };

  onStopDragging = () => {
    this.setState({ isDragging: false });
  };

  renderHeading(isEditing: boolean) {
    invariant(this.document, 'document not available');
    if (this.props.newDocument) return;

    return (
      <InfoWrapper visible={!isEditing}>
        <PublishingInfo
          collaborators={this.document.collaborators}
          document={this.document}
        />
      </InfoWrapper>
    );
  }

  render() {
    const { isSaving, showAsSaved } = this.state;
    const isNew = this.props.newDocument;
    const isEditing = !!this.props.match.params.edit || isNew;
    const isFetching = !this.document;
    const titleText = get(this.document, 'title', '');
    const document = this.document;

    let saveLabel;
    if (isNew) {
      saveLabel = 'Publish';
      if (isSaving) saveLabel = 'Publishing...';
    } else {
      saveLabel = 'Save';
      if (isSaving) saveLabel = 'Saving...';
      if (showAsSaved) saveLabel = 'Saved!';
    }

    return (
      <Container column auto>
        {this.state.isDragging &&
          <DropHere align="center" justify="center">
            Drop files here to import into Atlas.
          </DropHere>}
        {titleText && <PageTitle title={titleText} />}
        {this.state.isLoading && <LoadingIndicator />}
        {isFetching &&
          <CenteredContent>
            <LoadingState />
          </CenteredContent>}
        {!isFetching &&
          document &&
          <StyledDropToImport
            documentId={document.id}
            history={this.props.history}
            onDragEnter={this.onStartDragging}
            onDragLeave={this.onStopDragging}
            onDrop={this.onStopDragging}
            disabled={isEditing}
          >
            <Flex justify="center" auto>
              <Prompt
                when={document.hasPendingChanges}
                message={DISCARD_CHANGES}
              />
              <Editor
                key={document.id}
                text={document.text}
                emoji={document.emoji}
                onImageUploadStart={this.onImageUploadStart}
                onImageUploadStop={this.onImageUploadStop}
                onChange={this.onChange}
                onSave={this.onSave}
                onCancel={this.onCancel}
                heading={this.renderHeading(!!isEditing)}
                readOnly={!isEditing}
              />
              <Meta align="center" justify="flex-end" readOnly={!isEditing}>
                <Flex align="center">
                  <HeaderAction>
                    {isEditing
                      ? <Flex>
                          <ActionLink
                            onClick={this.onSave.bind(this, true)}
                            disabled={
                              !(this.document && this.document.allowSave)
                            }
                            primary
                          >
                            {saveLabel}
                          </ActionLink>
                          <ActionLink onClick={this.onCancel}>
                            Cancel
                          </ActionLink>
                        </Flex>
                      : <a onClick={this.onClickEdit}>Edit</a>}
                  </HeaderAction>
                  {!isEditing && <Menu document={document} />}
                </Flex>
              </Meta>
            </Flex>
          </StyledDropToImport>}
      </Container>
    );
  }
}

const DropHere = styled(Flex)`
  pointer-events: none;
  position: fixed;
  top: 0;
  left: ${layout.sidebarWidth};
  bottom: 0;
  right: 0;
  text-align: center;
  background: rgba(255,255,255,.9);
  z-index: 1;
`;

const Meta = styled(Flex)`
  align-items: flex-start;
  position: absolute;
  top: 0;
  right: 0;
  padding: ${layout.padding};
`;

const InfoWrapper = styled(Flex)`
  opacity: ${({ visible }) => (visible ? '1' : '0')};
  transition: all 100ms ease-in-out;
`;

const Container = styled(Flex)`
  position: relative;
  width: 100%;
`;

const LoadingState = styled(LoadingPlaceholder)`
  margin: 90px 0;
`;

const StyledDropToImport = styled(DropToImport)`
  display: flex;
  flex: 1;
`;

const ActionLink = styled(Flex)`
  margin-right: 25px;
  color: ${({ primary }) => (primary ? color.text : color.slateDark)};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};

  &:last-child {
    margin-right: none;
  }
`;

export default withRouter(inject('ui', 'user', 'documents')(DocumentScene));
