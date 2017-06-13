// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { Editor, Plain } from 'slate';
import classnames from 'classnames/bind';
import type { Document, State, Editor as EditorType } from './types';
import ClickablePadding from './components/ClickablePadding';
import Toolbar from './components/Toolbar';
import Markdown from './serializer';
import createSchema from './schema';
import createPlugins from './plugins';
import styles from './Editor.scss';

const cx = classnames.bind(styles);

type Props = {
  text: string,
  onChange: Function,
  onSave: Function,
  onCancel: Function,
  onStar: Function,
  onUnstar: Function,
  onImageUploadStart: Function,
  onImageUploadStop: Function,
  starred: boolean,
  readOnly: boolean,
};

type KeyData = {
  isMeta: boolean,
  key: string,
};

@observer class MarkdownEditor extends Component {
  props: Props;
  editor: EditorType;
  schema: Object;
  plugins: Array<Object>;

  state: {
    state: State,
  };

  constructor(props: Props) {
    super(props);

    this.schema = createSchema({
      onStar: props.onStar,
      onUnstar: props.onUnstar,
    });
    this.plugins = createPlugins({
      onImageUploadStart: props.onImageUploadStart,
      onImageUploadStop: props.onImageUploadStop,
    });

    if (props.text) {
      this.state = { state: Markdown.deserialize(props.text) };
    } else {
      this.state = { state: Plain.deserialize('') };
    }
  }

  getChildContext() {
    return { starred: this.props.starred };
  }

  onChange = (state: State) => {
    this.setState({ state });
  };

  onDocumentChange = (document: Document, state: State) => {
    this.props.onChange(Markdown.serialize(state));
  };

  onKeyDown = (ev: SyntheticKeyboardEvent, data: KeyData, state: State) => {
    if (!data.isMeta) return;

    switch (data.key) {
      case 's':
        ev.preventDefault();
        ev.stopPropagation();
        return this.props.onSave({ redirect: false });
      case 'enter':
        ev.preventDefault();
        ev.stopPropagation();
        this.props.onSave();
        return state;
      case 'escape':
        return this.props.onCancel();
      default:
    }
  };

  focusAtStart = () => {
    const state = this.editor.getState();
    const transform = state.transform();
    transform.collapseToStartOf(state.document);
    transform.focus();
    this.setState({ state: transform.apply() });
  };

  focusAtEnd = () => {
    const state = this.editor.getState();
    const transform = state.transform();
    transform.collapseToEndOf(state.document);
    transform.focus();
    this.setState({ state: transform.apply() });
  };

  render = () => {
    return (
      <span>
        <ClickablePadding onClick={this.focusAtStart} />
        <Toolbar state={this.state.state} onChange={this.onChange} />
        <Editor
          key={this.props.starred}
          ref={ref => (this.editor = ref)}
          placeholder="Start with a title…"
          className={cx(styles.editor, { readOnly: this.props.readOnly })}
          schema={this.schema}
          plugins={this.plugins}
          state={this.state.state}
          onChange={this.onChange}
          onDocumentChange={this.onDocumentChange}
          onKeyDown={this.onKeyDown}
          onSave={this.props.onSave}
          readOnly={this.props.readOnly}
        />
        <ClickablePadding onClick={this.focusAtEnd} grow />
      </span>
    );
  };
}

MarkdownEditor.childContextTypes = {
  starred: PropTypes.bool,
};

export default MarkdownEditor;
