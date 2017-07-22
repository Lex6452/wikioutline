// @flow
import slug from 'slug';
import randomstring from 'randomstring';
import { DataTypes, sequelize } from '../sequelize';
import Document from './Document';
import _ from 'lodash';

// $FlowIssue invalid flow-typed
slug.defaults.mode = 'rfc3986';

const allowedCollectionTypes = [['atlas', 'journal']];

const Collection = sequelize.define(
  'collection',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    urlId: { type: DataTypes.STRING, unique: true },
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      validate: { isIn: allowedCollectionTypes },
    },
    creatorId: DataTypes.UUID,

    /* type: atlas */
    navigationTree: DataTypes.JSONB, // legacy
    documentStructure: DataTypes.JSONB,
  },
  {
    tableName: 'collections',
    paranoid: true,
    hooks: {
      beforeValidate: collection => {
        collection.urlId = collection.urlId || randomstring.generate(10);
      },
      afterCreate: async collection => {
        const team = await collection.getTeam();
        const collections = await team.getCollections();

        // Don't auto-create for journal types, yet
        if (collection.type !== 'atlas') return;

        if (collections.length < 2) {
          // Create intro document if first collection for team
          const document = await Document.create({
            parentDocumentId: null,
            atlasId: collection.id,
            teamId: collection.teamId,
            userId: collection.creatorId,
            lastModifiedById: collection.creatorId,
            createdById: collection.creatorId,
            title: 'Introduction',
            text: '# Introduction\n\nLets get started...',
          });
          collection.documentStructure = [document.toJSON()];
        } else {
          // Let user create first document
          collection.documentStructure = [];
        }
        await collection.save();
      },
    },
  }
);

// Class methods

Collection.associate = models => {
  Collection.hasMany(models.Document, {
    as: 'documents',
    foreignKey: 'atlasId',
    onDelete: 'cascade',
  });
  Collection.belongsTo(models.Team, {
    as: 'team',
  });
  Collection.addScope('withRecentDocuments', {
    include: [
      {
        as: 'documents',
        limit: 10,
        model: models.Document,
        order: [['updatedAt', 'DESC']],
      },
    ],
  });
};

// Instance methods

Collection.prototype.getUrl = function() {
  // const slugifiedName = slug(this.name);
  // return `/${slugifiedName}-c${this.urlId}`;
  return `/collections/${this.id}`;
};

Collection.prototype.getDocumentsStructure = async function() {
  // Lazy fill this.documentStructure
  if (!this.documentStructure) {
    this.documentStructure = this.navigationTree.children;

    // Remove parent references from all root documents
    await this.navigationTree.children.forEach(async ({ id }) => {
      const document = await Document.findById(id);
      document.parentDocumentId = null;
      await document.save();
    });

    // Remove root document
    const rootDocument = await Document.findById(this.navigationTree.id);
    await rootDocument.destroy();

    await this.save();
  }

  return this.documentStructure;
};

Collection.prototype.addDocumentToStructure = async function(document, index) {
  if (!this.documentStructure) return;

  if (!document.parentDocumentId) {
    this.documentStructure.splice(
      index || this.documentStructure.length,
      0,
      document.toJSON()
    );
    // Sequelize doesn't seem to set the value with splice on JSONB field
    this.documentStructure = this.documentStructure;
  } else {
    this.documentStructure = this.documentStructure.map(childDocument => {
      if (document.parentDocumentId === childDocument.id) {
        childDocument.children.splice(
          index || childDocument.children.length,
          0,
          document.toJSON()
        );
      }
      return childDocument;
    });
  }

  await this.save();
  return this;
};

Collection.prototype.updateDocument = async function(updatedDocument) {
  if (!this.documentStructure) return;
  const { id } = updatedDocument;

  const updateChildren = documents => {
    return documents.map(document => {
      if (document.id === id) {
        document = {
          ...updatedDocument.toJSON(),
          children: document.children,
        };
      } else {
        document.children = updateChildren(document.children);
      }
      return document;
    });
  };

  this.documentStructure = updateChildren(this.documentStructure);
  await this.save();
  return this;
};

Collection.prototype.deleteDocument = async function(document) {
  if (!this.documentStructure) return;

  const deleteFromChildren = (children, id) => {
    if (_.find(children, { id })) {
      _.remove(children, { id });
    } else {
      children = children.map(childDocument => {
        return {
          ...childDocument,
          children: deleteFromChildren(childDocument.children, id),
        };
      });
    }
    return children;
  };

  this.documentStructure = deleteFromChildren(
    this.documentStructure,
    document.id
  );

  await this.save();
  return this;
};

export default Collection;
