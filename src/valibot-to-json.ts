import { toJsonSchema } from '@valibot/to-json-schema'
import { BaseIssue, BaseSchema } from 'valibot'

export const convertValibotToJsonSchema = (
  schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>
) => {
  return toJsonSchema(schema)
}
