import { expectAssignable } from 'tsd'
import {
  hasValibotIssues,
  ResponseSerializationError,
  ValibotFastifyIssue,
  ValiIssues,
} from '../src/error'

const error: unknown = {}
if (hasValibotIssues(error)) {
  expectAssignable<ValibotFastifyIssue>(error.validation[0])

  error.validation.forEach((validationError) => {
    expectAssignable<ValibotFastifyIssue>(validationError)
  })
}

const serializeError: unknown = {}
if (serializeError instanceof ResponseSerializationError) {
  expectAssignable<ValiIssues>(serializeError.issues)
}
