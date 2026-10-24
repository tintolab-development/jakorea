/**
 * 실적 관리 공식 export 연결.
 *
 * 목록에 현재 로드된 행만 엑셀로 조립하지 않는다. 동일한 필터를 BE export API에
 * 전달하고, BE의 권한·감사·동기/비동기 파일 생성 정책을 사용한다.
 */

import type { ColumnsType } from 'antd/es/table'
import type { ExportRecordsParams } from '@/shared/api/generated/performance/schemas'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'
import { exportPerformanceRecordsRemote } from '@/features/education-record/api/performance-api-client'

export async function exportEducationRecordExcel(
  _columns: ColumnsType<EducationRecordRow>,
  _data: EducationRecordRow[],
  filename: string,
  filters: ExportRecordsParams = {}
): Promise<void> {
  await exportPerformanceRecordsRemote(filters, filename)
}
