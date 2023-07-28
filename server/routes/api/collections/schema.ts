import { isUndefined } from "lodash";
import { z } from "zod";
import { randomElement } from "@shared/random";
import { CollectionPermission, FileOperationFormat } from "@shared/types";
import { colorPalette } from "@shared/utils/collections";
import { Collection } from "@server/models";
import { ValidateColor, ValidateIcon, ValidateIndex } from "@server/validation";
import BaseSchema from "../BaseSchema";

export const CollectionsCreateSchema = BaseSchema.extend({
  body: z.object({
    name: z.string(),
    color: z
      .string()
      .regex(ValidateColor.regex, { message: ValidateColor.message })
      .default(randomElement(colorPalette)),
    description: z.string().nullish(),
    permission: z
      .nativeEnum(CollectionPermission)
      .nullish()
      .transform((val) => (isUndefined(val) ? null : val)),
    sharing: z.boolean().default(true),
    icon: z
      .string()
      .max(ValidateIcon.maxLength, {
        message: `Must be ${ValidateIcon.maxLength} or fewer characters long`,
      })
      .optional(),
    sort: z
      .object({
        field: z.union([z.literal("title"), z.literal("index")]),
        direction: z.union([z.literal("asc"), z.literal("desc")]),
      })
      .default(Collection.DEFAULT_SORT),
    index: z
      .string()
      .regex(ValidateIndex.regex, { message: ValidateIndex.message })
      .max(ValidateIndex.maxLength, {
        message: `Must be ${ValidateIndex.maxLength} or fewer characters long`,
      })
      .optional(),
  }),
});

export type CollectionsCreateReq = z.infer<typeof CollectionsCreateSchema>;

export const CollectionsInfoSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
  }),
});

export type CollectionsInfoReq = z.infer<typeof CollectionsInfoSchema>;

export const CollectionsDocumentsSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
  }),
});

export type CollectionsDocumentsReq = z.infer<
  typeof CollectionsDocumentsSchema
>;

export const CollectionsImportSchema = BaseSchema.extend({
  body: z.object({
    attachmentId: z.string().uuid(),
    format: z
      .nativeEnum(FileOperationFormat)
      .default(FileOperationFormat.MarkdownZip),
  }),
});

export type CollectionsImportReq = z.infer<typeof CollectionsImportSchema>;

export const CollectionsAddGroupSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    permission: z
      .nativeEnum(CollectionPermission)
      .default(CollectionPermission.ReadWrite),
  }),
});

export type CollectionsAddGroupsReq = z.infer<typeof CollectionsAddGroupSchema>;

export const CollectionsRemoveGroupSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
  }),
});

export type CollectionsRemoveGroupReq = z.infer<
  typeof CollectionsRemoveGroupSchema
>;

export const CollectionsGroupMembershipsSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
    query: z.string().optional(),
    permission: z.nativeEnum(CollectionPermission).optional(),
  }),
});

export type CollectionsGroupMembershipsReq = z.infer<
  typeof CollectionsGroupMembershipsSchema
>;

export const CollectionsAddUserSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    permission: z.nativeEnum(CollectionPermission).optional(),
  }),
});

export type CollectionsAddUserReq = z.infer<typeof CollectionsAddUserSchema>;

export const CollectionsRemoveUserSchema = BaseSchema.extend({
  body: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
  }),
});

export type CollectionsRemoveUserReq = z.infer<
  typeof CollectionsRemoveUserSchema
>;
