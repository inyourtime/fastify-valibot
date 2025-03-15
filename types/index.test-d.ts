import Fastify, {
  FastifyInstance,
  RawRequestDefaultExpression,
  RawServerDefault,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
} from 'fastify'
import { expectAssignable, expectType } from 'tsd'
import {
  serializerCompiler,
  ValibotTypeProvider,
  validatorCompiler,
} from '../src/index'
import * as v from 'valibot'

const fastify = Fastify().withTypeProvider<ValibotTypeProvider>()

type FastifyValibotInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
  ValibotTypeProvider
>

expectAssignable<FastifyValibotInstance>(fastify)
expectAssignable<FastifyInstance>(fastify)
expectType<FastifyValibotInstance>(
  fastify.setValidatorCompiler(validatorCompiler)
)
expectType<FastifyValibotInstance>(
  fastify.setSerializerCompiler(serializerCompiler)
)

fastify.post(
  '/',
  {
    schema: {
      headers: v.object({
        'x-api-key': v.string(),
      }),
      querystring: v.object({
        a: v.string(),
        b: v.pipe(v.string(), v.transform(Number), v.number()),
      }),
      params: v.object({
        id: v.string(),
      }),
      body: v.object({
        a: v.string(),
        b: v.boolean(),
        c: v.array(v.string()),
        d: v.object({
          a: v.string(),
          b: v.number(),
        }),
      }),
      response: {
        200: v.object({
          message: v.string(),
        }),
      },
    },
  },
  (req) => {
    expectType<string>(req.headers['x-api-key'])
    expectType<string>(req.query.a)
    expectType<number>(req.query.b)
    expectType<string>(req.params.id)
    expectType<string>(req.body.a)
    expectType<boolean>(req.body.b)
    expectType<string[]>(req.body.c)
    expectType<{ a: string; b: number }>(req.body.d)

    return { message: 'ok' }
  }
)

expectAssignable<FastifyInstance>(Fastify())
