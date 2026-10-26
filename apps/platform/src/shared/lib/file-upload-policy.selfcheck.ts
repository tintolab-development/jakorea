/**
 * Run: node --experimental-strip-types --experimental-transform-types src/shared/lib/file-upload-policy.selfcheck.ts
 */
import {
  FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE,
  FILE_UPLOAD_MAX_BYTES,
  FILE_UPLOAD_MAX_COUNT,
  FILE_UPLOAD_MAX_TOTAL_BYTES,
  FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE,
  FILE_UPLOAD_TOTAL_EXCEEDED_MESSAGE,
  validateUploadBatch,
  validateUploadFileSize,
} from './file-upload-policy.ts'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const MB = 1024 * 1024
const sized = (size: number) => ({ size })

assert(FILE_UPLOAD_MAX_BYTES === 20 * MB, 'per-file limit is 20MB')
assert(FILE_UPLOAD_MAX_TOTAL_BYTES === 100 * MB, 'total limit is 100MB')
assert(FILE_UPLOAD_MAX_COUNT === 10, 'count limit is 10')

assert(validateUploadFileSize(sized(20 * MB)) === null, '20MB exactly allowed')
assert(
  validateUploadFileSize(sized(20 * MB + 1)) === FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE,
  'over 20MB rejected'
)

const tenFiles = Array.from({ length: 10 }, () => sized(10 * MB))
assert(
  validateUploadBatch({ currentCount: 0, currentTotalBytes: 0, incoming: tenFiles }) === null,
  '10 files totalling 100MB allowed'
)
assert(
  validateUploadBatch({ currentCount: 1, currentTotalBytes: 0, incoming: tenFiles }) ===
    FILE_UPLOAD_COUNT_EXCEEDED_MESSAGE,
  '11th file rejected'
)
assert(
  validateUploadBatch({ currentCount: 0, currentTotalBytes: 0, incoming: [sized(21 * MB)] }) ===
    FILE_UPLOAD_SIZE_EXCEEDED_MESSAGE,
  'oversize file in batch rejected'
)
assert(
  validateUploadBatch({
    currentCount: 5,
    currentTotalBytes: 90 * MB,
    incoming: [sized(10 * MB + 1)],
  }) === FILE_UPLOAD_TOTAL_EXCEEDED_MESSAGE,
  'total over 100MB rejected'
)
assert(
  validateUploadBatch({ currentCount: 9, currentTotalBytes: 80 * MB, incoming: [sized(20 * MB)] }) ===
    null,
  'total exactly 100MB allowed'
)

console.log('file-upload-policy.selfcheck: ok')
