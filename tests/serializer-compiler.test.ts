import { expect, test, describe } from 'vitest'
import { serializerCompiler } from '../src/index'
import Fastify from 'fastify'
import * as v from 'valibot'
import { ResponseSerializationError } from '../src/error'

describe('serializerCompiler', () => {
  test('should return serialized data', async () => {
    const fastify = Fastify()
      .setSerializerCompiler(serializerCompiler)
      .get(
        '/',
        {
          schema: {
            response: {
              200: v.object({
                a: v.string(),
                b: v.number(),
              }),
            },
          },
        },
        () => ({ a: '1', b: 1 })
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/',
    })

    expect(resp.statusCode).toBe(200)
    expect(resp.json()).toStrictEqual({ a: '1', b: 1 })
  })

  test('should throw InvalidSchemaError', async () => {
    const fastify = Fastify()
      .setSerializerCompiler(serializerCompiler)
      .get(
        '/',
        {
          schema: {
            response: {
              200: {
                a: v.string(),
                b: v.number(),
              },
            },
          },
        },
        () => ({ a: '1', b: 1 })
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/',
    })

    expect(resp.statusCode).toBe(500)
    expect(resp.json()).toHaveProperty('code', 'FST_ERR_INVALID_SCHEMA')
  })

  test('should throw ResponseSerializationError', async () => {
    const fastify = Fastify()
      .setSerializerCompiler(serializerCompiler)
      .get(
        '/',
        {
          schema: {
            response: {
              200: v.object({
                a: v.string(),
                b: v.number(),
              }),
            },
          },
        },
        () => ({ a: '1', b: 'a' })
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/',
    })

    expect(resp.statusCode).toBe(500)
    expect(resp.json()).toHaveProperty(
      'code',
      'FST_ERR_RESPONSE_SERIALIZATION'
    )
  })

  test('should throw custom error on ResponseSerializationError', async () => {
    const fastify = Fastify()
      .setSerializerCompiler(serializerCompiler)
      .setErrorHandler((error, req, reply) => {
        if (error instanceof ResponseSerializationError) {
          reply.code(500).send({
            method: req.method,
            url: req.url,
            cause: v.flatten(error.issues).nested,
          })
        }

        reply.code(500).send(error)
      })
      .get(
        '/',
        {
          schema: {
            response: {
              200: v.object({
                a: v.string(),
                b: v.number(),
              }),
            },
          },
        },
        () => ({ a: '1', b: 'a' })
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/',
    })

    expect(resp.statusCode).toBe(500)
    expect(resp.json()).toMatchInlineSnapshot(`
      {
        "cause": {
          "b": [
            "Invalid type: Expected number but received "a"",
          ],
        },
        "method": "GET",
        "url": "/",
      }
    `)
  })
})
