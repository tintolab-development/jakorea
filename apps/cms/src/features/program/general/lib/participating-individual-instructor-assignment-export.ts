import type { ColumnsType } from 'antd/es/table'

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_ASSIGNED_SCHEDULE_EXCEL_COLUMNS: ColumnsType<{
  no: number
  role: string
  lectureLocation: string
  distanceFromHome: string
  scheduleLabel: string
}> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '역할', dataIndex: 'role', key: 'role' },
  { title: '출강지', dataIndex: 'lectureLocation', key: 'lectureLocation' },
  { title: '자택과의 거리', dataIndex: 'distanceFromHome', key: 'distanceFromHome' },
  { title: '담당 교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
]

export const PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_SCHEDULE_EXCEL_COLUMNS: ColumnsType<{
  no: number
  lectureLocation: string
  distanceFromHome: string
  scheduleLabel: string
  assignmentStatus: string
  assignedInstructorCountLabel: string
}> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '출강지', dataIndex: 'lectureLocation', key: 'lectureLocation' },
  { title: '자택과의 거리', dataIndex: 'distanceFromHome', key: 'distanceFromHome' },
  { title: '교육 진행 희망 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
  { title: '배정 현황', dataIndex: 'assignmentStatus', key: 'assignmentStatus' },
  {
    title: '배정 강사 수',
    dataIndex: 'assignedInstructorCountLabel',
    key: 'assignedInstructorCountLabel',
  },
]
