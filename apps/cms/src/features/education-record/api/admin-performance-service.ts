import { fetchPerformanceRecordsRemote } from '@/features/education-record/api/performance-api-client'
import {
  getMockEducationRecordRows,
  mapPerformanceRecordToRow,
} from '@/features/education-record/api/adapters/performance-adapters'
import { shouldUsePerformanceRecordsRemoteApi } from '@/features/education-record/api/performance-remote-capabilities'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'

const DEFAULT_LIST_PAGE = 0
const DEFAULT_LIST_SIZE = 200

export async function getPerformanceRecordList(): Promise<EducationRecordRow[]> {
  if (shouldUsePerformanceRecordsRemoteApi()) {
    const records = await fetchPerformanceRecordsRemote({
      page: DEFAULT_LIST_PAGE,
      size: DEFAULT_LIST_SIZE,
    })
    return records.map(mapPerformanceRecordToRow).filter(row => row.id.length > 0)
  }

  return getMockEducationRecordRows()
}
