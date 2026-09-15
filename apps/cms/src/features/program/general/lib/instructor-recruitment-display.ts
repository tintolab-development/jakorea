/**
 * 일반 프로그램 상세 — 강사 모집 정보 표시값
 * SSOT: generalCommonInfo.instructorRecruitmentInfo (모집 양식)
 * 모집 대상 / 모집 기간 / 문의처 — 공통정보 Program 폴백 없음. 빈값 '-'
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { getInstructorRecruitmentStatus } from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  labelBool,
  pickDisplayString,
} from '@/features/program/general/lib/detail-value-helpers'

type InstructorRecruitmentInfoLoose = NonNullable<
  NonNullable<Program['generalCommonInfo']>['instructorRecruitmentInfo']
> & {
  announcementPublishedLabel?: string
  finalAnnouncementLabel?: string
  resultAnnouncementLabel?: string
  inquiryTel?: string
  inquiryEmail?: string
  tel?: string
  email?: string
  remarks?: string
  recruitmentTarget?: string
  recruitmentTargetDetail?: string
  contactPhone?: string
  contactEmail?: string
}

const INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'instructor_recruitment_planned',
  recruiting: 'recruiting_instructors',
  closed: 'education_completed',
}

export type GeneralProgramInstructorRecruitmentDisplay = {
  announcementPublishedLabel: string
  operationPeriodLabel: string
  recruitmentStatusLabel: string
  recruitmentStatusLifecycle: ProgramLifecycleStatus | null
  instructorTargetLabel: string
  instructorTargetDetailLabel: string
  recruitmentPeriodLabel: string
  finalPassAnnouncementDate?: string | Date
  finalPassAnnouncementMethod?: string
  contactOrganizationName: string
  contactPhone: string
  contactEmail: string
  notes: string
}

function resolveInstructorRecruitmentLifecycle(program: Program): ProgramLifecycleStatus | null {
  const status = getInstructorRecruitmentStatus(program)
  if (status == null) return null
  return INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE[status]
}

export function resolveGeneralProgramInstructorRecruitmentDisplay(
  program: Program
): GeneralProgramInstructorRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.instructorRecruitmentInfo as InstructorRecruitmentInfoLoose | undefined
  const lifecycle = resolveInstructorRecruitmentLifecycle(program)

  const finalPassAnnouncementDate = program.finalPassAnnouncementDate
  const finalPassAnnouncementMethod = pickDisplayString(
    info?.finalAnnouncementLabel,
    info?.resultAnnouncementLabel,
    program.finalPassAnnouncementMethod
  )

  return {
    announcementPublishedLabel: pickDisplayString(
      info?.announcementPublishedLabel,
      labelBool(info?.announcementPublished, '게시', '미게시')
    ),
    operationPeriodLabel: pickDisplayString(info?.operationPeriodLabel),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    instructorTargetLabel: pickDisplayString(info?.recruitmentTarget),
    instructorTargetDetailLabel: pickDisplayString(info?.recruitmentTargetDetail),
    recruitmentPeriodLabel: pickDisplayString(info?.recruitmentPeriodLabel),
    finalPassAnnouncementDate,
    finalPassAnnouncementMethod:
      finalPassAnnouncementMethod === '-' ? undefined : finalPassAnnouncementMethod,
    contactOrganizationName: pickDisplayString(info?.contactOrganizationName),
    contactPhone: pickDisplayString(info?.inquiryTel, info?.tel, info?.contactPhone),
    contactEmail: pickDisplayString(info?.inquiryEmail, info?.email, info?.contactEmail),
    notes: pickDisplayString(info?.remarks),
  }
}
