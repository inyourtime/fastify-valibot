import createError from '@fastify/error'
import { FastifyError } from 'fastify'
import { BaseIssue, IssuePathItem } from 'valibot'

type ValiBaseIssue = BaseIssue<unknown>
type ValiIssues = [BaseIssue<unknown>, ...BaseIssue<unknown>[]]
type ValiPath = [IssuePathItem, ...IssuePathItem[]]

const ValibotFastifyIssueSymbol = Symbol.for('ValibotFastifyIssue')

export interface ValibotFastifyIssue extends ValiBaseIssue {
  [ValibotFastifyIssueSymbol]: true;
  instancePath: string;
}

const isValibotFastifyIssue = (error: unknown): error is ValibotFastifyIssue =>
  typeof error === 'object' &&
  error !== null &&
  ValibotFastifyIssueSymbol in error &&
  error[ValibotFastifyIssueSymbol] === true

export const hasValibotIssues = (
  error: unknown
): error is Omit<FastifyError, 'validation'> & {
  validation: [ValibotFastifyIssue, ...ValibotFastifyIssue[]];
} =>
  typeof error === 'object' &&
  error !== null &&
  'validation' in error &&
  Array.isArray(error.validation) &&
  error.validation[0] !== null &&
  isValibotFastifyIssue(error.validation[0])

export const getValiPath = (path?: ValiPath): string =>
  `/${path?.map((p) => p.key).join('/')}`

export const createValibotFastifyIssues = (
  issues: ValiBaseIssue[]
): ValibotFastifyIssue[] =>
  issues.map((issue) => ({
    [ValibotFastifyIssueSymbol]: true,
    instancePath: getValiPath(issue.path),
    ...issue,
  }))

export class ResponseSerializationError extends createError(
  'FST_ERR_RESPONSE_SERIALIZATION',
  "Response doesn't match the schema",
  500
) {
  constructor (public issues: ValiIssues) {
    super()
  }
}

export const InvalidSchemaError = createError<[string]>(
  'FST_ERR_INVALID_SCHEMA',
  'Invalid schema passed: %s',
  500
)
