/**
 * 일반 프로그램 상세 — 강사 모집 정보 표시값
 * SSOT: generalCommonInfo.instructorRecruitmentInfo (모집 양식)
 * 모집 대상 / 모집 기간 / 문의처 — 공통정보 Program 폴백 없음. 빈값 '-'
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  getRecruitmentStatusFromDates,
  getRecruitmentStatusLabelForStatus,
  type RecruitmentStatus,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { resolveAnnouncement } from '@/features/program/shared/lib/announcement-label'
import {
  labelBool,
  pickDisplayString,
} from '@/features/program/general/lib/detail-value-helpers'
import { audienceOperationPeriodLabelFromRecruitmentRow } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { resolveRecruitmentRemarks } from '@/features/program/shared/lib/recruitment-row-copy'
import {
  hasRecruitmentWindows,
  operationPeriodLabelFromWindow,
  pickAudienceRecruitmentWindow,
  recruitmentPeriodLabelFromWindow,
} from '@/features/program/shared/lib/hydrate-recruitment-windows'

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

function resolveInstructorRecruitmentLifecycle(
  status: RecruitmentStatus | null
): ProgramLifecycleStatus | null {
  if (status == null) return null
  return INSTRUCTOR_RECRUITMENT_STATUS_TO_LIFECYCLE[status]
}

export function resolveGeneralProgramInstructorRecruitmentDisplay(
  program: Program
): GeneralProgramInstructorRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.instructorRecruitmentInfo as InstructorRecruitmentInfoLoose | undefined
  const row = pickAudienceRecruitmentWindow(program, 'instructor')
  const useRow = hasRecruitmentWindows(program)
  const recruitmentStatus = getRecruitmentStatusFromDates(
    useRow ? row?.startAt ?? undefined : program.instructorApplicationStartDate,
    useRow ? row?.endAt ?? undefined : program.instructorApplicationEndDate
  )
  const lifecycle = resolveInstructorRecruitmentLifecycle(recruitmentStatus)

  const finalAnnouncement = resolveAnnouncement({
    labels: [info?.finalAnnouncementLabel, info?.resultAnnouncementLabel],
    column: {
      date: program.finalPassAnnouncementDate,
      method: program.finalPassAnnouncementMethod,
    },
  })

  return {
    announcementPublishedLabel: pickDisplayString(
      info?.announcementPublishedLabel,
      labelBool(info?.announcementPublished, '게시', '미게시')
    ),
    operationPeriodLabel: pickDisplayString(
      operationPeriodLabelFromWindow(row),
      audienceOperationPeriodLabelFromRecruitmentRow(program, 'instructor'),
      useRow ? undefined : info?.operationPeriodLabel
    ),
    recruitmentStatusLabel: getRecruitmentStatusLabelForStatus(recruitmentStatus, 'instructor'),
    recruitmentStatusLifecycle: lifecycle,
    instructorTargetLabel: pickDisplayString(info?.recruitmentTarget),
    instructorTargetDetailLabel: pickDisplayString(info?.recruitmentTargetDetail),
    recruitmentPeriodLabel: pickDisplayString(
      recruitmentPeriodLabelFromWindow(row),
      useRow ? undefined : info?.recruitmentPeriodLabel
    ),
    finalPassAnnouncementDate: finalAnnouncement.date,
    finalPassAnnouncementMethod: finalAnnouncement.method,
    contactOrganizationName: pickDisplayString(
      row?.contactName,
      useRow ? undefined : info?.contactOrganizationName
    ),
    contactPhone: pickDisplayString(
      row?.contactPhone,
      useRow ? undefined : info?.inquiryTel,
      useRow ? undefined : info?.tel,
      useRow ? undefined : info?.contactPhone
    ),
    contactEmail: pickDisplayString(
      row?.contactEmail,
      useRow ? undefined : info?.inquiryEmail,
      useRow ? undefined : info?.email,
      useRow ? undefined : info?.contactEmail
    ),
    notes: pickDisplayString(resolveRecruitmentRemarks(program, 'instructor')),
  }
}
