// @flow
import React, { Component } from 'react';
import get from 'lodash/get';
import styled from 'styled-components';
import { observer, inject } from 'mobx-react';
import { withRouter, Prompt } from 'react-router';
import Flex from 'components/Flex';
import { layout } from 'styles/constants';

import Document from 'models/Document';
import UiStore from 'stores/UiStore';
import DocumentsStore from 'stores/DocumentsStore';
import Menu from './components/Menu';
import LoadingPlaceholder from 'components/LoadingPlaceholder';
import Editor from 'components/Editor';
import DropToImport from 'components/DropToImport';
import { HeaderAction, SaveAction } from 'components/Layout';
import LoadingIndicator from 'components/LoadingIndicator';
import Collaborators from 'components/Collaborators';
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
    this.setState({ isLoading: true });
    document = await document.save();
    this.setState({ isLoading: false });

    if (redirect || this.props.newDocument) {
      this.props.history.push(document.url);
    } else {
      this.showAsSaved();
    }
  };

  showAsSaved() {
    this.setState({ showAsSaved: true });
    this.savedTimeout = setTimeout(
      () => this.setState({ showAsSaved: false }),
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

  render() {
    const isNew = this.props.newDocument;
    const isEditing = !!this.props.match.params.edit || isNew;
    const isFetching = !this.document;
    const titleText = get(this.document, 'title', '');
    const document = this.document;

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
                readOnly={!isEditing}
              />
              <Meta align="center" justify="flex-end" readOnly={!isEditing}>
                <Flex align="center">
                  {document && !isNew && <Collaborators document={document} />}
                  <HeaderAction>
                    {isEditing
                      ? <SaveAction
                          showCheckmark={this.state.showAsSaved}
                          onClick={this.onSave.bind(this, true)}
                          disabled={!(this.document && this.document.allowSave)}
                          isNew={!!isNew}
                        />
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

export default withRouter(inject('ui', 'user', 'documents')(DocumentScene));
