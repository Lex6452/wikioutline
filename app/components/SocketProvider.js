// @flow
import * as React from 'react';
import { inject } from 'mobx-react';
import io from 'socket.io-client';
import DocumentsStore from 'stores/DocumentsStore';
import CollectionsStore from 'stores/CollectionsStore';
import AuthStore from 'stores/AuthStore';
import UiStore from 'stores/UiStore';

const SocketContext = React.createContext();

type Props = {
  children: React.Node,
  documents: DocumentsStore,
  collections: CollectionsStore,
  auth: AuthStore,
  ui: UiStore,
};

class SocketProvider extends React.Component<Props> {
  socket;

  componentDidMount() {
    if (!process.env.WEBSOCKETS_ENABLED) return;

    this.socket = io(window.location.origin, {
      path: '/realtime',
    });

    const { auth, ui, documents, collections } = this.props;
    if (!auth.token) return;

    this.socket.on('connect', () => {
      this.socket.emit('authentication', {
        token: auth.token,
      });
      this.socket.on('unauthorized', err => {
        ui.showToast(err.message);
      });
      this.socket.on('entities', event => {
        if (event.documents) {
          event.documents.forEach(documents.add);
        }
        if (event.collections) {
          event.collections.forEach(collections.add);
        }
      });
      this.socket.on('documents.star', event => {
        documents.starredIds.set(event.documentId, true);
      });
      this.socket.on('documents.unstar', event => {
        documents.starredIds.set(event.documentId, false);
      });

      // received a message from the API server that we should request
      // to join a specific room. Forward that to the ws server.
      this.socket.on('join', event => {
        this.socket.emit('join', event);
      });

      // received a message from the API server that we should request
      // to leave a specific room. Forward that to the ws server.
      this.socket.on('leave', event => {
        this.socket.emit('leave', event);
      });
    });
  }

  render() {
    return (
      <SocketContext.Provider value={this.socket}>
        {this.props.children}
      </SocketContext.Provider>
    );
  }
}

export default inject('auth', 'ui', 'documents', 'collections')(SocketProvider);
