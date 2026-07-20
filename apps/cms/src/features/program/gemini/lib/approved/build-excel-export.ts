import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { resolveApprovedTrainingStatus } from './resolve-status'
import {
  formatInstructorDisplay,
  formatRegionDisplay,
  formatStatusLabel,
  formatTrainingDatetimeDisplay,
} from './format-display'
import type { GeminiApprovedTrainingRow } from '../../model/approved/types'

export type GeminiApprovedTrainingExcelRow = {
  no: number
  institutionName: string
  region: string
  status: string
  trainingDatetime: string
  studentCount: string
  instructorName: string
  managerName: string
}

export function buildApprovedTrainingExcelRows(
  rows: GeminiApprovedTrainingRow[],
  todayKey: string
): GeminiApprovedTrainingExcelRow[] {
  const referenceDate = dayjs(todayKey)
  return rows.map(row => ({
    no: row.no,
    institutionName: row.institutionName,
    region: formatRegionDisplay(row),
    status: formatStatusLabel(resolveApprovedTrainingStatus(row, referenceDate)),
    trainingDatetime: formatTrainingDatetimeDisplay(row),
    studentCount: `${row.studentCount}명`,
    instructorName: formatInstructorDisplay(row),
    managerName: row.managerName,
  }))
}

export const GEMINI_APPROVED_TRAINING_EXCEL_COLUMNS: ColumnsType<GeminiApprovedTrainingExcelRow> =
  [
    { title: 'No.', dataIndex: 'no', key: 'no' },
    { title: '기관명', dataIndex: 'institutionName', key: 'institutionName' },
    { title: '기관 소재지', dataIndex: 'region', key: 'region' },
    { title: '진행 현황', dataIndex: 'status', key: 'status' },
    { title: '연수일시', dataIndex: 'trainingDatetime', key: 'trainingDatetime' },
    { title: '수강 인원', dataIndex: 'studentCount', key: 'studentCount' },
    { title: '강사', dataIndex: 'instructorName', key: 'instructorName' },
    { title: '기관 담당자명', dataIndex: 'managerName', key: 'managerName' },
  ]
