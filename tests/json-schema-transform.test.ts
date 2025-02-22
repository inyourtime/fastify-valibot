import { expect, test, describe } from 'vitest'
import Fastify from 'fastify'
import fastifySwagger from '@fastify/swagger'
import { jsonSchemaTransform, validatorCompiler } from '../src'
import * as v from 'valibot'
import Swagger from '@apidevtools/swagger-parser'

describe('json-schema-transform', () => {
  test('should generate json-schema correctly', async () => {
    const fastify = Fastify()
    fastify.setValidatorCompiler(validatorCompiler)

    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'OpenAPI Sample',
          description: 'OpenAPI Sample',
          version: '1.0.0',
        },
        servers: [],
      },
      transform: jsonSchemaTransform,
    })

    fastify
      .get(
        '/',
        {
          schema: {
            tags: ['sample'],
            summary: 'Sample',
            response: {
              200: v.object({
                message: v.string(),
              }),
            },
          },
        },
        () => {}
      )
      .post(
        '/:a/:b',
        {
          schema: {
            tags: ['sample'],
            summary: 'Sample',
            description: 'Sample',
            headers: v.object({
              'Content-Type': v.optional(v.string(), 'application/json'),
            }),
            querystring: v.object({
              a: v.pipe(v.string(), v.minLength(3), v.maxLength(10)),
              b: v.number(),
              c: v.optional(v.string()),
            }),
            params: v.object({
              a: v.pipe(
                v.string(),
                v.regex(/^[0-9]+$/),
                v.description('Only numbers')
              ),
              b: v.number(),
            }),
            body: v.object({
              a: v.string(),
              b: v.number(),
              c: v.pipe(v.string(), v.email()),
              d: v.optional(v.string()),
              e: v.object({
                a: v.string(),
                b: v.number(),
              }),
            }),
            response: {
              200: v.object({
                a: v.string(),
                b: v.number(),
                c: v.optional(
                  v.array(
                    v.object({
                      a: v.string(),
                      b: v.number(),
                    })
                  )
                ),
              }),
              400: v.object({
                error: v.string(),
                code: v.number(),
              }),
            },
          },
        },
        (req) => req.body
      )
      .put('/', (req) => req.body)
      .patch(
        '/',
        {
          schema: {
            body: v.object({
              a: v.string(),
            }),
            hide: true,
          },
        },
        (req) => req.body
      )
      .delete(
        '/',
        {
          schema: {
            response: {
              204: v.pipe(v.null(), v.description('No content')),
            },
          },
        },
        (_, reply) => reply.status(204).send()
      )

    await fastify.ready()

    const openapiObject = fastify.swagger()

    expect(openapiObject).toMatchSnapshot()

    await Swagger.validate(openapiObject)
  })
})
