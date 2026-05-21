import type { TextbookDeliveryStatus } from '@/shared/components/delivery-status-badge'
import type {
  UjatInstitutionApplicationClassTimeRowDetail,
  UjatInstitutionApplicationGradeBlockDetail,
  UjatInstitutionApplicationTeacherContact,
} from '../detail/detail-types'
import type { UjatInstitutionScheduleConfirmStatus } from './types'

export type ScheduleConfirmTextbookInfo = {
  textbookName: string
  kitSummary: string
  deliveryStatus: TextbookDeliveryStatus
}

export type ScheduleConfirmGradeEducationBlock = UjatInstitutionApplicationGradeBlockDetail & {
  textbook: ScheduleConfirmTextbookInfo
}

export type UjatScheduleConfirmEducationScheduleDay = {
  dateLabel: string
  classLabels: string[]
}

export type UjatScheduleConfirmGuidanceNotes = {
  searchDeviceGrade6: string
  waitingArea: string
  textbookDisposalLocation: string
  otherSpecialNotes: string
  snackAvailability: string
  sexOffenderCheck: string
}

export type UjatScheduleConfirmConfirmedDetail = {
  scheduleConfirmStatus: UjatInstitutionScheduleConfirmStatus
  institutionName: string
  regionLabel: string
  address: string
  addressDetail: string
  teacherContact: UjatInstitutionApplicationTeacherContact
  otherRequests: string
  gradeEducationBlocks: ScheduleConfirmGradeEducationBlock[]
  classTimeRows: UjatInstitutionApplicationClassTimeRowDetail[]
  educationScheduleDays: UjatScheduleConfirmEducationScheduleDay[]
  guidanceNotes: UjatScheduleConfirmGuidanceNotes
}

export type UjatScheduleConfirmConfirmedDetailExtras = {
  gradeTextbooks?: Partial<Record<string, ScheduleConfirmTextbookInfo>>
  guidanceNotes?: Partial<UjatScheduleConfirmGuidanceNotes>
}
