import type { GeminiPerformanceUploadRow } from '../../model/performance/types'

export function buildPerformanceDuplicateKey(
  upload: Pick<
    GeminiPerformanceUploadRow,
    'instructorName' | 'contact' | 'trainingDate' | 'trainingLocation' | 'trainingStartTime'
  >
): string {
  return [
    upload.instructorName.trim(),
    upload.contact.trim(),
    upload.trainingDate.trim(),
    upload.trainingLocation.trim(),
    upload.trainingStartTime.trim(),
  ].join('|')
}
