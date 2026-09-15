/**
 * 일반 프로그램 상세 — 강사 모집 정보 표시값
 * 값 없으면 '-' (mock/하드코드 기본값 없음)
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  formatDateRange,
  formatInstructorTargetsLabel,
  getInstructorRecruitmentStatus,
  resolveProgramInstructorTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'

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

function needOrNotLabel(value: boolean | undefined, yes = '게시', no = '미게시'): string {
  if (value == null) return '-'
  return value ? yes : no
}

function dashOr(value: string | undefined | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
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
  const info = common?.instructorRecruitmentInfo
  const lifecycle = resolveInstructorRecruitmentLifecycle(program)

  return {
    announcementPublishedLabel: needOrNotLabel(info?.announcementPublished),
    operationPeriodLabel:
      info?.operationPeriodLabel?.trim() ||
      formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    instructorTargetLabel: formatInstructorTargetsLabel(resolveProgramInstructorTargets(program)),
    instructorTargetDetailLabel: dashOr(program.instructorTargetDetail),
    recruitmentPeriodLabel:
      info?.recruitmentPeriodLabel?.trim() ||
      formatDateRange(
        program.instructorApplicationStartDate,
        program.instructorApplicationEndDate
      ),
    finalPassAnnouncementDate: program.finalPassAnnouncementDate,
    finalPassAnnouncementMethod: program.finalPassAnnouncementMethod,
    contactOrganizationName: dashOr(
      info?.contactOrganizationName ?? common?.sponsorDisplayName
    ),
    contactPhone: dashOr(program.contactPhone),
    contactEmail: dashOr(program.contactEmail),
    notes: dashOr(program.otherNotes ?? program.oneLineIntroduction),
  }
}
