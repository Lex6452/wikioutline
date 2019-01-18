// @flow
import * as React from 'react';
import RichMarkdownEditor from 'rich-markdown-editor';
import { uploadFile } from 'utils/uploadFile';
import isInternalUrl from 'utils/isInternalUrl';
import Embed from './Embed';
import embeds from '../../embeds';

type Props = {
  defaultValue?: string,
  readOnly?: boolean,
  disableEmbeds?: boolean,
  forwardedRef: *,
  history: *,
  ui: *,
};

class Editor extends React.Component<Props> {
  componentDidCatch(err) {
    if (err.message.match("Failed to execute 'getRangeAt'")) {
      // known issue that shouldn't affect further editing
      // https://github.com/ianstormtaylor/slate/issues/1237
      return console.warn(err);
    }
    throw err;
  }

  onUploadImage = async (file: File) => {
    const result = await uploadFile(file);
    return result.url;
  };

  onClickLink = (href: string) => {
    // on page hash
    if (href[0] === '#') {
      window.location.href = href;
      return;
    }

    if (isInternalUrl(href)) {
      // relative
      let navigateTo = href;

      // probably absolute
      if (href[0] !== '/') {
        try {
          const url = new URL(href);
          navigateTo = url.pathname + url.hash;
        } catch (err) {
          navigateTo = href;
        }
      }

      this.props.history.push(navigateTo);
    } else {
      window.open(href, '_blank');
    }
  };

  onShowToast = (message: string) => {
    this.props.ui.showToast(message, 'success');
  };

  getLinkComponent = node => {
    if (this.props.disableEmbeds) return;

    const url = node.data.get('href');
    const keys = Object.keys(embeds);

    for (const key of keys) {
      const component = embeds[key];

      for (const host of component.ENABLED) {
        const matches = url.match(host);
        if (matches) return Embed;
      }
    }
  };

  render() {
    return (
      <RichMarkdownEditor
        ref={this.props.forwardedRef}
        uploadImage={this.onUploadImage}
        onClickLink={this.onClickLink}
        onShowToast={this.onShowToast}
        getLinkComponent={this.getLinkComponent}
        {...this.props}
      />
    );
  }
}

// $FlowIssue - https://github.com/facebook/flow/issues/6103
export default React.forwardRef((props, ref) => (
  <Editor {...props} forwardedRef={ref} />
));
