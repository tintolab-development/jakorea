import type { ColumnsType } from 'antd/es/table'

export const PARTICIPATING_INDIVIDUAL_VOLUNTEER_ASSIGNED_SCHEDULE_EXCEL_COLUMNS: ColumnsType<{
  no: number
  scheduleLabel: string
}> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '담당 봉사 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
]

export const PARTICIPATING_INDIVIDUAL_VOLUNTEER_WAITING_SCHEDULE_EXCEL_COLUMNS: ColumnsType<{
  no: number
  scheduleLabel: string
  assignmentStatus: string
  assignedVolunteerCountLabel: string
}> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '봉사 진행 희망 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
  { title: '배정 현황', dataIndex: 'assignmentStatus', key: 'assignmentStatus' },
  {
    title: '배정 봉사자 수',
    dataIndex: 'assignedVolunteerCountLabel',
    key: 'assignedVolunteerCountLabel',
  },
]
