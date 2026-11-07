export type UjatClassAssignmentRow = {
  id: string
  gradeLabel: string
  classLabel: string
  gradeRowSpan: number
  volunteerA: string
  volunteerB: string
  textbookName: string
  textbookQuantityLabel: string
}

export type UjatClassAssignmentScheduleSection = {
  id: string
  dateLabel: string
  attendanceManagerName: string
  totalClassCount: number
  consentDocumentsDownloadPath: string | null
  rows: UjatClassAssignmentRow[]
}
