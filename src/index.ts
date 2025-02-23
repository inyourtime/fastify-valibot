import type { BaseSchema, BaseIssue, InferOutput, Config } from 'valibot'
import { safeParse } from 'valibot'
import type {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifySchema,
  FastifySchemaCompiler,
  FastifyTypeProvider,
  RawServerBase,
  RawServerDefault,
} from 'fastify'
import { convertValibotToJsonSchema } from './valibot-to-json'
import type { FastifySerializerCompiler } from 'fastify/types/schema'
import {
  createValibotFastifyIssues,
  InvalidSchemaError,
  ResponseSerializationError,
} from './error'

type ValibotBaseSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>

// export interface ValibotTypeProvider extends FastifyTypeProvider {
//   validator: this['schema'] extends ValibotBaseSchema
//     ? InferOutput<this['schema']>
//     : unknown;
//   serializer: this['schema'] extends ValibotBaseSchema
//     ? InferOutput<this['schema']>
//     : unknown;
// }

export interface ValibotTypeProvider extends FastifyTypeProvider {
  output: this['input'] extends ValibotBaseSchema
    ? InferOutput<this['input']>
    : unknown;
}

interface Schema extends FastifySchema {
  hide?: boolean;
}

type AnyObject = Record<string, any>

export const createJsonSchemaTransform = () => {
  return ({ schema, url }: { schema: Schema; url: string }) => {
    if (!schema) return { schema, url }

    const { headers, querystring, body, params, response, hide, ...meta } =
      schema

    const transformed: AnyObject = {}

    if (hide) {
      transformed.hide = true
      return { schema: transformed, url }
    }

    const schemas: AnyObject = { headers, querystring, body, params }

    for (const key in schemas) {
      const valibotSchema = schemas[key]
      if (valibotSchema) {
        transformed[key] = convertValibotToJsonSchema(valibotSchema)
      }
    }

    if (response) {
      transformed.response = {}

      for (const key in response) {
        // @ts-ignore
        const valibotSchema = resolveSchema(response[key])
        transformed.response[key] = convertValibotToJsonSchema(valibotSchema)
      }
    }

    return {
      schema: {
        ...transformed,
        ...meta,
      },
      url,
    }
  }
}

export const jsonSchemaTransform = createJsonSchemaTransform()

interface ValidatorOptions {
  parseConfig?: Config<BaseIssue<unknown>>;
}

export const createValidatorCompiler =
  (opts: ValidatorOptions = {}): FastifySchemaCompiler<ValibotBaseSchema> =>
    ({ schema }) => {
      return (value) => {
        const result = safeParse(schema, value, opts.parseConfig)

        if (result.success) {
          return { value: result.output }
        }

        return {
          error: createValibotFastifyIssues(result.issues) as unknown as Error,
        }
      }
    }

export const validatorCompiler = createValidatorCompiler()

function isBaseSchema<TInput, TOutput, TIssue extends BaseIssue<unknown>> (
  obj: any
): obj is BaseSchema<TInput, TOutput, TIssue> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.kind === 'schema' &&
    typeof obj.type === 'string' &&
    typeof obj['~run'] === 'function'
  )
}

function resolveSchema (schema: unknown): ValibotBaseSchema {
  if (isBaseSchema(schema)) {
    return schema
  }

  throw new InvalidSchemaError(JSON.stringify(schema))
}

export const serializerCompiler: FastifySerializerCompiler<unknown> = ({
  schema: unknownSchema,
}) => {
  return (data) => {
    const schema = resolveSchema(unknownSchema)

    const result = safeParse(schema, data)

    if (!result.success) {
      throw new ResponseSerializationError(result.issues)
    }

    return JSON.stringify(result.output)
  }
}

export type FastifyPluginCallbackValibot<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault
> = FastifyPluginCallback<Options, Server, ValibotTypeProvider>

export type FastifyPluginAsyncValibot<
  Options extends FastifyPluginOptions = Record<never, never>,
  Server extends RawServerBase = RawServerDefault
> = FastifyPluginAsync<Options, Server, ValibotTypeProvider>
