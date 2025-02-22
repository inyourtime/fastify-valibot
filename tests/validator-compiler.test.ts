import { expect, test, describe } from 'vitest'
import { createValidatorCompiler, validatorCompiler } from '../src/index'
import Fastify from 'fastify'
import * as v from 'valibot'
import { hasValibotIssues } from '../src/error'

describe('validatorCompiler', () => {
  test('default validatorCompiler #query', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .get(
        '/',
        {
          schema: {
            querystring: v.object({
              a: v.string(),
              b: v.string(),
              c: v.pipe(v.string(), v.transform(Number), v.number()),
            }),
          },
        },
        (req) => req.query
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/',
      query: { a: '1', b: '2', c: '3' },
    })

    expect(resp.statusCode).toBe(200)
    expect(resp.json()).toStrictEqual({ a: '1', b: '2', c: 3 })
  })

  test('default validatorCompiler #body', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .post(
        '/',
        {
          schema: {
            body: v.object({
              a: v.string(),
              b: v.string(),
              c: v.string(),
            }),
          },
        },
        (req) => req.body
      )

    const resp = await fastify.inject({
      method: 'POST',
      path: '/',
      body: { a: '1', b: '2', c: '3' },
    })

    expect(resp.statusCode).toBe(200)
    expect(resp.json()).toStrictEqual({ a: '1', b: '2', c: '3' })
  })

  test('default validatorCompiler #params', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .get(
        '/:id',
        {
          schema: {
            params: v.object({
              id: v.pipe(v.string(), v.transform(Number), v.number()),
            }),
          },
        },
        (req) => req.params
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/123',
    })

    expect(resp.statusCode).toBe(200)
    expect(resp.json()).toStrictEqual({ id: 123 })
  })

  test('default validatorCompiler #headers', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .get(
        '/',
        {
          schema: {
            headers: v.object({
              a: v.string(),
              b: v.string(),
              c: v.string(),
            }),
          },
        },
        (req) => req.headers
      )

    const resp = await fastify.inject({
      method: 'GET',
      path: '/',
      headers: { a: '1', b: '2', c: '3' },
    })

    expect(resp.statusCode).toBe(200)
    expect(resp.json()).toMatchObject({ a: '1', b: '2', c: '3' })
  })

  test('should return validation error', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .post(
        '/',
        {
          schema: {
            body: v.object({
              a: v.string(),
              b: v.string(),
              c: v.pipe(v.string(), v.transform(Number), v.number()),
            }),
          },
        },
        (req) => req.body
      )

    const resp = await fastify.inject({
      method: 'POST',
      path: '/',
      body: { a: 1, c: '3' },
    })

    expect(resp.statusCode).toBe(400)
    expect(resp.json()).toMatchInlineSnapshot(`
      {
        "code": "FST_ERR_VALIDATION",
        "error": "Bad Request",
        "message": "body/a Invalid type: Expected string but received 1, body/b Invalid key: Expected "b" but received undefined",
        "statusCode": 400,
      }
    `)
  })

  test('should return validation error (abortEarly)', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(
        createValidatorCompiler({ parseConfig: { abortEarly: true } })
      )
      .post(
        '/',
        {
          schema: {
            body: v.object({
              a: v.string(),
              b: v.string(),
              c: v.pipe(v.string(), v.transform(Number), v.number()),
            }),
          },
        },
        (req) => req.body
      )

    const resp = await fastify.inject({
      method: 'POST',
      path: '/',
      body: { a: 1, c: '3' },
    })

    expect(resp.statusCode).toBe(400)
    expect(resp.json()).toMatchInlineSnapshot(`
      {
        "code": "FST_ERR_VALIDATION",
        "error": "Bad Request",
        "message": "body/a Invalid type: Expected string but received 1",
        "statusCode": 400,
      }
    `)
  })

  test('should has valibot issues', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .setErrorHandler((error, _, reply) => {
        if (hasValibotIssues(error)) {
          reply.status(400).send({ hasValibotIssues: true })
        }

        reply.status(500).send(error)
      })
      .post(
        '/',
        {
          schema: {
            body: v.object({
              a: v.string(),
              b: v.string(),
              c: v.pipe(v.string(), v.transform(Number), v.number()),
            }),
          },
        },
        (req) => req.body
      )

    const resp = await fastify.inject({
      method: 'POST',
      path: '/',
      body: { a: 1, c: '3' },
    })

    expect(resp.statusCode).toBe(400)
    expect(resp.json()).toStrictEqual({ hasValibotIssues: true })
  })

  test('should return custom error', async () => {
    const fastify = Fastify()
      .setValidatorCompiler(validatorCompiler)
      .setErrorHandler((error, _, reply) => {
        if (hasValibotIssues(error)) {
          reply.status(400).send({
            in: error.validationContext,
            issues: v.flatten(error.validation).nested,
          })
        }

        reply.status(500).send(error)
      })
      .post(
        '/',
        {
          schema: {
            body: v.object({
              a: v.string(),
              b: v.object({
                c: v.string(),
              })
            }),
          },
        },
        (req) => req.body
      )

    const resp = await fastify.inject({
      method: 'POST',
      path: '/',
      body: { b: {} },
    })

    expect(resp.statusCode).toBe(400)
    expect(resp.json()).toMatchInlineSnapshot(`
      {
        "in": "body",
        "issues": {
          "a": [
            "Invalid key: Expected "a" but received undefined",
          ],
          "b.c": [
            "Invalid key: Expected "c" but received undefined",
          ],
        },
      }
    `)
  })
})
