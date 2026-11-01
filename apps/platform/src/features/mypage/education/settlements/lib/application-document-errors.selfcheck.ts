import assert from 'node:assert/strict'
import {
  AUDIT_LOG_UNAVAILABLE_CODE,
  getSettlementApplicationDocumentErrorMessage,
  SETTLEMENT_APPLICATION_DOCUMENT_AUDIT_UNAVAILABLE_MESSAGE,
  SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE,
  SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_CODE,
  SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_MESSAGE,
} from './application-document-errors.ts'

import axios from 'axios'

function ax(status: number, code?: string) {
  return new axios.AxiosError(
    'err',
    undefined,
    undefined,
    undefined,
    {
      status,
      statusText: 'x',
      headers: {},
      config: {} as never,
      data: code
        ? { success: false, error: { code, message: 'x' } }
        : { success: false },
    },
  )
}

assert.equal(
  getSettlementApplicationDocumentErrorMessage(
    ax(404, SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_CODE),
  ),
  SETTLEMENT_APPLICATION_DOCUMENT_NOT_FOUND_MESSAGE,
)
assert.equal(
  getSettlementApplicationDocumentErrorMessage(ax(503, AUDIT_LOG_UNAVAILABLE_CODE)),
  SETTLEMENT_APPLICATION_DOCUMENT_AUDIT_UNAVAILABLE_MESSAGE,
)
assert.equal(
  getSettlementApplicationDocumentErrorMessage(ax(503)),
  SETTLEMENT_APPLICATION_DOCUMENT_AUDIT_UNAVAILABLE_MESSAGE,
)
assert.equal(
  getSettlementApplicationDocumentErrorMessage(ax(500)),
  SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE,
)
assert.equal(
  getSettlementApplicationDocumentErrorMessage(new Error('x')),
  SETTLEMENT_APPLICATION_DOCUMENT_LOAD_FAILED_MESSAGE,
)

console.log('application-document-errors.selfcheck: ok')
