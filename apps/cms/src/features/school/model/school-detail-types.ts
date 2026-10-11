/**
 * 학교(교사) 상세 — FE view types
 */

import {
  type ProgramEnrollmentDisplayStatus,
  programEnrollmentDisplayConfig,
} from '@/shared/constants/status'

export interface SchoolDetailStats {
  applicationCount: number
  participationCount: number
}

export interface AffiliatedTeacherRow {
  id: string
  name: string
  gradeInCharge: string
  phone: string
  email: string
  createdAt: string
}

export interface TeacherResumeEducation {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface TeacherResumeCareer {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export interface TeacherResumeQualification {
  name?: string
  year?: string
}

export interface TeacherResumeAward {
  name?: string
  year?: string
}

export interface TeacherDetailData {
  id: string
  name: string
  nameEn: string
  residentNumber: string
  age: number
  gender: string
  militaryStatus: string
  phone: string
  email: string
  address: string
  schoolName: string
  gradeInCharge: string
  bankName: string
  accountNumber: string
  accountHolder: string
  socialAccounts: string[]
  createdAt: string
  personalInfoConsentDate: string
  personalInfoConsent: boolean
  marketingConsentDate: string
  marketingConsent: boolean
  education: string
  resumeEducations: TeacherResumeEducation[]
  resumeCareers: TeacherResumeCareer[]
  resumeQualifications: TeacherResumeQualification[]
  resumeAwards: TeacherResumeAward[]
  university?: string
  freeWriting1?: string
  freeWriting2?: string
  freeWriting3?: string
  freeWriting4?: string
  scheduleChangeCount?: number
  instructorExperience?: string
  isInstructorApplicant?: boolean
  bio?: string
  teachingHistory?: TeachingHistoryRow[]
  settlementOverview?: SettlementOverviewData
}

export type TeachingProgramStatus = ProgramEnrollmentDisplayStatus

export type TeachingSettlementStatus = 'na' | 'pending' | 'partial' | 'completed'

export interface TeachingHistoryRow {
  id: string
  programName: string
  institutionName: string
  lectureDate: string
  programStatus: TeachingProgramStatus
  settlementStatus: TeachingSettlementStatus
}

export const TEACHING_PROGRAM_STATUS_LABELS: Record<TeachingProgramStatus, string> =
  programEnrollmentDisplayConfig.labels

export type SettlementRowStatus = 'pending' | 'reviewing' | 'completed' | 'rejected'

export const SETTLEMENT_ROW_STATUS_LABELS: Record<SettlementRowStatus, string> = {
  pending: '정산 대기',
  reviewing: '정산 검토 중',
  completed: '정산 완료',
  rejected: '정산 반려',
}

export interface SettlementDetailItem {
  label: string
  amount: number
  description?: string
}

export interface SettlementDetail {
  id: string
  programName: string
  institutionName: string
  lectureDate: string
  status: SettlementRowStatus
  items: SettlementDetailItem[]
  totalAmount: number
  withholdingRate?: number
  lectureDuration?: string
  lectureHours?: string | number
  settlementAmount?: number
  remark?: string
}

export interface SettlementRow {
  id: string
  programName: string
  institutionName: string
  lectureDate: string
  status: SettlementRowStatus
  amount: number
  detail?: SettlementDetail
}

export interface SettlementOverviewData {
  rows: SettlementRow[]
  totalAmount: number
  month?: string
  expectedAmount?: number
  completedAmount?: number
}

export const TEACHING_SETTLEMENT_STATUS_LABELS: Record<TeachingSettlementStatus, string> = {
  na: '해당 없음',
  pending: '정산 대기',
  partial: '일부 정산',
  completed: '정산 완료',
}

export interface ProgramParticipationRow {
  id: string
  programName: string
  applicationDate: string
  status: TeachingProgramStatus
}

export function getSchoolDetailStats(_schoolUserId: string): SchoolDetailStats {
  return { applicationCount: 0, participationCount: 0 }
}

export function getAffiliatedTeachers(_schoolUserId: string): AffiliatedTeacherRow[] {
  return []
}

export function getSchoolProgramHistory(_schoolUserId: string): ProgramParticipationRow[] {
  return []
}

export function getTeacherDetail(
  _teacherId: string,
  _schoolUserId: string
): TeacherDetailData | null {
  return null
}
