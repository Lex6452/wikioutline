// @flow
import slug from 'slug';
import _ from 'lodash';
import randomstring from 'randomstring';
import MarkdownSerializer from 'slate-md-serializer';
import Plain from 'slate-plain-serializer';

import isUUID from 'validator/lib/isUUID';
import { DataTypes, sequelize } from '../sequelize';
import events from '../events';
import parseTitle from '../../shared/utils/parseTitle';
import Revision from './Revision';

const Markdown = new MarkdownSerializer();
const URL_REGEX = /^[a-zA-Z0-9-]*-([a-zA-Z0-9]{10,15})$/;
const DEFAULT_TITLE = 'Untitled document';

// $FlowIssue invalid flow-typed
slug.defaults.mode = 'rfc3986';
const slugify = text =>
  slug(text, {
    remove: /[.]/g,
  });

const createRevision = doc => {
  // Create revision of the current (latest)
  return Revision.create({
    title: doc.title,
    text: doc.text,
    userId: doc.lastModifiedById,
    documentId: doc.id,
  });
};

const createUrlId = doc => {
  return (doc.urlId = doc.urlId || randomstring.generate(10));
};

const beforeSave = async doc => {
  const { emoji, title } = parseTitle(doc.text);

  // emoji in the title is split out for easier display
  doc.emoji = emoji;

  // ensure document has a title
  if (!title) {
    doc.title = DEFAULT_TITLE;
    doc.text = doc.text.replace(/^.*$/m, `# ${DEFAULT_TITLE}`);
  }

  // calculate collaborators
  let ids = [];
  if (doc.id) {
    ids = await Revision.findAll({
      attributes: [[DataTypes.literal('DISTINCT "userId"'), 'userId']],
      where: {
        documentId: doc.id,
      },
    }).map(rev => rev.userId);
  }

  // add the current user as revision hasn't been generated yet
  ids.push(doc.lastModifiedById);
  doc.collaboratorIds = _.uniq(ids);

  // increment revision
  doc.revisionCount += 1;

  return doc;
};

const Document = sequelize.define(
  'document',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    urlId: { type: DataTypes.STRING, primaryKey: true },
    private: { type: DataTypes.BOOLEAN, defaultValue: true },
    title: DataTypes.STRING,
    text: DataTypes.TEXT,
    revisionCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    parentDocumentId: DataTypes.UUID,
    collaboratorIds: DataTypes.ARRAY(DataTypes.UUID),
  },
  {
    paranoid: true,
    hooks: {
      beforeValidate: createUrlId,
      beforeCreate: beforeSave,
      beforeUpdate: beforeSave,
      afterCreate: createRevision,
      afterUpdate: createRevision,
    },
  }
);

// Class methods

Document.associate = models => {
  Document.belongsTo(models.Collection, {
    as: 'collection',
    foreignKey: 'atlasId',
    onDelete: 'cascade',
  });
  Document.belongsTo(models.User, {
    as: 'createdBy',
    foreignKey: 'createdById',
  });
  Document.belongsTo(models.User, {
    as: 'updatedBy',
    foreignKey: 'lastModifiedById',
  });
  Document.belongsTo(models.User, {
    as: 'pinnedBy',
    foreignKey: 'pinnedById',
  });
  Document.hasMany(models.Revision, {
    as: 'revisions',
    onDelete: 'cascade',
  });
  Document.hasMany(models.Star, {
    as: 'starred',
  });
  Document.hasMany(models.View, {
    as: 'views',
  });
  Document.addScope(
    'defaultScope',
    {
      include: [
        { model: models.Collection, as: 'collection' },
        { model: models.User, as: 'createdBy' },
        { model: models.User, as: 'updatedBy' },
      ],
    },
    { override: true }
  );
  Document.addScope('withViews', userId => ({
    include: [
      { model: models.View, as: 'views', where: { userId }, required: false },
    ],
  }));
  Document.addScope('withStarred', userId => ({
    include: [
      { model: models.Star, as: 'starred', where: { userId }, required: false },
    ],
  }));
};

Document.findById = async id => {
  if (isUUID(id)) {
    return Document.findOne({
      where: { id },
    });
  } else if (id.match(URL_REGEX)) {
    return Document.findOne({
      where: {
        urlId: id.match(URL_REGEX)[1],
      },
    });
  }
};

Document.searchForUser = async (
  user,
  query,
  options = {}
): Promise<Document[]> => {
  const limit = options.limit || 15;
  const offset = options.offset || 0;

  const sql = `
        SELECT *, ts_rank(documents."searchVector", plainto_tsquery('english', :query)) as "searchRanking" FROM documents
        WHERE "searchVector" @@ plainto_tsquery('english', :query) AND
          "teamId" = '${user.teamId}'::uuid AND
          "deletedAt" IS NULL
        ORDER BY "searchRanking" DESC
        LIMIT :limit OFFSET :offset;
        `;

  const ids = await sequelize
    .query(sql, {
      replacements: {
        query,
        limit,
        offset,
      },
      model: Document,
    })
    .map(document => document.id);

  // Second query to get views for the data
  const withViewsScope = { method: ['withViews', user.id] };
  const documents = await Document.scope(
    'defaultScope',
    withViewsScope
  ).findAll({
    where: { id: ids },
  });

  // Order the documents in the same order as the first query
  return _.sortBy(documents, doc => ids.indexOf(doc.id));
};

// Hooks

Document.addHook('afterCreate', model =>
  events.add({ name: 'documents.create', model })
);

Document.addHook('afterDestroy', model =>
  events.add({ name: 'documents.delete', model })
);

Document.addHook('afterUpdate', model =>
  events.add({ name: 'documents.update', model })
);

// Instance methods

Document.prototype.getTimestamp = function() {
  return Math.round(new Date(this.updatedAt).getTime() / 1000);
};

Document.prototype.getSummary = function() {
  const value = Markdown.deserialize(this.text);
  const plain = Plain.serialize(value);
  const lines = _.compact(plain.split('\n'));
  return lines.length >= 1 ? lines[1] : '';
};

Document.prototype.getUrl = function() {
  const slugifiedTitle = slugify(this.title);
  return `/doc/${slugifiedTitle}-${this.urlId}`;
};

Document.prototype.toJSON = function() {
  // Warning: only use for new documents as order of children is
  // handled in the collection's documentStructure
  return {
    id: this.id,
    title: this.title,
    url: this.getUrl(),
    children: [],
  };
};

export default Document;
