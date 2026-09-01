/**
 * 일반 프로그램 상세 — 강사 모집 정보 표시값 (등록 양식·스크린샷 mock)
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  formatDateRange,
  formatInstructorTargetsLabel,
  getInstructorRecruitmentStatus,
  resolveProgramInstructorTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'

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

const JOB담_INSTRUCTOR_RECRUITMENT_MOCK = {
  announcementPublishedLabel: '게시',
  operationPeriodLabel: '2026. 04. 03(금) ~ 2026. 11. 20(금)',
  recruitmentPeriodLabel: '2025. 12. 08(일) ~ 2026. 01. 16(금)',
  finalPassAnnouncementDate: '2026-01-26T00:00:00+09:00',
  finalPassAnnouncementMethod: '홈페이지 공지 및 합격자 개별 안내',
  contactOrganizationName: 'JA Korea',
  contactPhone: '02-6085-6028',
  contactEmail: 'cc@jakorea.org',
  instructorTargetLabel: '성인',
  instructorTargetDetailLabel: '-',
  notes: '-',
} as const

function needOrNotLabel(value: boolean | undefined, yes = '게시', no = '미게시'): string {
  if (value == null) return '-'
  return value ? yes : no
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

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return {
      ...JOB담_INSTRUCTOR_RECRUITMENT_MOCK,
      recruitmentStatusLabel: getProgramLifecycleLabel('recruiting_instructors'),
      recruitmentStatusLifecycle: 'recruiting_instructors',
    }
  }

  const finalPassAnnouncementDate = program.finalPassAnnouncementDate
  const finalPassAnnouncementMethod =
    program.finalPassAnnouncementMethod ?? '홈페이지 공지 및 합격자 개별 안내'

  const notes = (program.otherNotes ?? program.oneLineIntroduction ?? '').trim() || '-'

  return {
    announcementPublishedLabel: needOrNotLabel(info?.announcementPublished),
    operationPeriodLabel:
      info?.operationPeriodLabel ?? formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    instructorTargetLabel: formatInstructorTargetsLabel(resolveProgramInstructorTargets(program)),
    instructorTargetDetailLabel: program.instructorTargetDetail ?? '-',
    recruitmentPeriodLabel:
      info?.recruitmentPeriodLabel ??
      formatDateRange(
        program.instructorApplicationStartDate,
        program.instructorApplicationEndDate
      ),
    finalPassAnnouncementDate,
    finalPassAnnouncementMethod,
    contactOrganizationName:
      info?.contactOrganizationName ?? common?.sponsorDisplayName ?? 'JA Korea',
    contactPhone: program.contactPhone ?? '-',
    contactEmail: program.contactEmail ?? '-',
    notes,
  }
}
