import { expect, test } from 'vitest'
import * as v from 'valibot'
import { convertValibotToJsonSchema } from '../src/valibot-to-json'

test('convertValibotToJsonSchema', () => {
  const Schema = v.object({
    name: v.string(),
    age: v.number(),
    email: v.pipe(v.string(), v.email()),
    password: v.pipe(v.string(), v.minLength(8)),
  })

  const schema = convertValibotToJsonSchema(Schema)

  expect(schema).toMatchInlineSnapshot(`
    {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "properties": {
        "age": {
          "type": "number",
        },
        "email": {
          "format": "email",
          "type": "string",
        },
        "name": {
          "type": "string",
        },
        "password": {
          "minLength": 8,
          "type": "string",
        },
      },
      "required": [
        "name",
        "age",
        "email",
        "password",
      ],
      "type": "object",
    }
  `)
})
