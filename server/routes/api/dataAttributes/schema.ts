import z from "zod";
import { DataAttributeDataType } from "@shared/models/types";
import { BaseSchema } from "../schema";

const BaseIdSchema = z.object({
  /** Id of the data attribute */
  id: z.string().uuid(),
});

const DataAttributesSortParamsSchema = z.object({
  /** Specifies the attributes by which data attributes will be sorted in the list */
  sort: z
    .string()
    .refine((val) => ["createdAt", "updatedAt"].includes(val))
    .default("createdAt"),

  /** Specifies the sort order with respect to sort field */
  direction: z
    .string()
    .optional()
    .transform((val) => (val !== "ASC" ? "DESC" : val)),
});

export const DataAttributesInfoSchema = BaseSchema.extend({
  body: BaseIdSchema,
});

export type DataAttributesInfoReq = z.infer<typeof DataAttributesInfoSchema>;

export const DataAttributesListSchema = BaseSchema.extend({
  body: DataAttributesSortParamsSchema,
});

export type DataAttributesListReq = z.infer<typeof DataAttributesListSchema>;

export const DataAttributesCreateSchema = BaseSchema.extend({
  body: z
    .object({
      /** Name of the data attribute */
      name: z.string(),

      /** Description of the data attribute */
      description: z.string().optional(),

      /** Type of the data attribute */
      dataType: z.nativeEnum(DataAttributeDataType),

      /** Options for the data attribute (if list type) */
      options: z
        .object({
          values: z.array(z.string()),
        })
        .optional(),

      /** Whether the data attribute is pinned to the top of document */
      pinned: z.boolean().optional(),
    })
    .refine(
      (val) =>
        val.dataType !== DataAttributeDataType.List ||
        (val.dataType === DataAttributeDataType.List && val.options)
    ),
});

export type DataAttributesCreateReq = z.infer<
  typeof DataAttributesCreateSchema
>;