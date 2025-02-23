import Fastify, { FastifyPluginAsync, FastifyPluginCallback } from 'fastify'
import {
  FastifyPluginAsyncValibot,
  FastifyPluginCallbackValibot,
} from '../src'
import fp from 'fastify-plugin'
import { expectType } from 'tsd'
import { Http2Server } from 'node:http2'
import * as v from 'valibot'

// Ensure the defaults of FastifyPluginAsyncValibot are the same as FastifyPluginAsync
export const pluginAsyncDefaults: FastifyPluginAsync = async (
  fastify,
  options
) => {
  const pluginAsyncValibotDefaults: FastifyPluginAsyncValibot = async (
    fastifyWithValibot,
    optionsValibot
  ) => {
    expectType<(typeof fastifyWithValibot)['server']>(fastify.server)
    expectType<typeof optionsValibot>(options)
  }
  fastify.register(pluginAsyncValibotDefaults)
}

// Ensure the defaults of FastifyPluginCallbackValibot are the same as FastifyPluginCallback
export const pluginCallbackDefaults: FastifyPluginCallback = async (
  fastify,
  options,
  done
) => {
  const pluginCallbackValibotDefaults: FastifyPluginCallbackValibot = async (
    fastifyWithValibot,
    optionsValibot,
    doneTypebox
  ) => {
    expectType<(typeof fastifyWithValibot)['server']>(fastify.server)
    expectType<typeof optionsValibot>(options)
  }

  fastify.register(pluginCallbackValibotDefaults)
}

const asyncPlugin: FastifyPluginAsyncValibot<
  { optionA: string },
  Http2Server
> = async (fastify, options) => {
  expectType<Http2Server>(fastify.server)

  expectType<string>(options.optionA)

  fastify.post(
    '/',
    {
      schema: {
        body: v.object({
          x: v.string(),
          y: v.number(),
          z: v.boolean(),
        }),
      },
    },
    (req) => {
      expectType<boolean>(req.body.z)
      expectType<number>(req.body.y)
      expectType<string>(req.body.x)
    }
  )
}

const callbackPlugin: FastifyPluginCallbackValibot<
  { optionA: string },
  Http2Server
> = (fastify, options, done) => {
  expectType<Http2Server>(fastify.server)

  expectType<string>(options.optionA)

  fastify.post(
    '/',
    {
      schema: {
        body: v.object({
          x: v.string(),
          y: v.number(),
          z: v.boolean(),
        }),
      },
    },
    (req) => {
      expectType<boolean>(req.body.z)
      expectType<number>(req.body.y)
      expectType<string>(req.body.x)
    }
  )
  done()
}

const fastify = Fastify()

fastify.register(asyncPlugin, { optionA: 'a' })
fastify.register(callbackPlugin, { optionA: 'a' })

const asyncPluginHttpDefault: FastifyPluginAsyncValibot<{
  optionA: string;
}> = async () => {}

fp(asyncPlugin)
fp(callbackPlugin)
fp(asyncPluginHttpDefault)
