/**
 * 일반 프로그램 상세 — 참여자 모집 정보 표시값 (등록 양식·스크린샷 mock)
 */

import type { Program } from '@/types/domain'

/** 학교/기관 대상 일반 프로그램 — 모집·신청 최대값 필드 노출 */
export function isGeneralProgramSchoolInstitutionTarget(program: Program): boolean {
  if (program.generalProgramAudience === 'organization') return true
  return program.generalParticipantTypes?.includes('school_institution') === true
}
import {
  formatDateOnly,
  formatDateRange,
  getParticipantRecruitmentLifecycle,
  TARGET_LEVEL_LABEL,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'

export type GeneralProgramParticipantRecruitmentDisplay = {
  announcementPublishedLabel: string
  preEducationNoticeLabel: string
  certificateIssuanceLabel: string
  studentListLabel: string
  showInstitutionApplicationLimits: boolean
  maxClassLabel: string
  maxInstructorsLabel: string
  maxSessionsPerDayLabel: string
  maxScheduleCountLabel: string
  operationPeriodLabel: string
  recruitmentStatusLabel: string
  recruitmentStatusLifecycle: ReturnType<typeof getParticipantRecruitmentLifecycle>
  targetLabel: string
  targetDetailLabel: string
  recruitmentPeriodLabel: string
  finalAnnouncementLabel: string
  contactOrganizationName: string
  contactPhone: string
  contactEmail: string
  notes: string
}

const JOB담_PARTICIPANT_RECRUITMENT_MOCK = {
  announcementPublishedLabel: '게시',
  preEducationNoticeLabel: '필요',
  certificateIssuanceLabel: '제공',
  studentListLabel: '필요',
  maxClassLabel: '4개',
  maxInstructorsLabel: '2명',
  maxSessionsPerDayLabel: '8차시',
  maxScheduleCountLabel: '3개',
  operationPeriodLabel: '2026. 04. 03(금) - 2026. 11. 20(금)',
  recruitmentPeriodLabel: '2025. 12. 08(월) - 2026. 01. 16(금)',
  finalAnnouncementLabel: '2026. 01. 26 (금) | 홈페이지 공지 및 담당교사 개별 안내',
  contactOrganizationName: 'JA Korea',
  contactPhone: '02-6085-6028',
  contactEmail: 'cc@jakorea.org',
  notes: '-',
} as const

function needOrNotLabel(value: boolean | undefined, yes = '필요', no = '불필요'): string {
  if (value == null) return '-'
  return value ? yes : no
}

function countLabel(value: number | undefined, suffix: string): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value}${suffix}`
}

export function resolveGeneralProgramParticipantRecruitmentDisplay(
  program: Program,
  options?: {
    applicationStartDate?: string
    applicationEndDate?: string
  }
): GeneralProgramParticipantRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.participantRecruitmentInfo
  const lifecycle = getParticipantRecruitmentLifecycle(program, options)

  const showInstitutionApplicationLimits = isGeneralProgramSchoolInstitutionTarget(program)

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return {
      ...JOB담_PARTICIPANT_RECRUITMENT_MOCK,
      showInstitutionApplicationLimits: true,
      recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '참여자 모집 중',
      recruitmentStatusLifecycle: lifecycle ?? 'recruiting_students',
      targetLabel: program.targetLevel
        ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
        : '고등학교',
      targetDetailLabel: program.district ?? '특성화고등학교 3학년',
      notes: JOB담_PARTICIPANT_RECRUITMENT_MOCK.notes,
    }
  }

  const studentListValue = program.studentListRequired
  const studentListLabel =
    studentListValue === 'required'
      ? '필요'
      : studentListValue === 'not_required'
        ? '불필요'
        : '-'

  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod =
    program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const finalAnnouncementLabel =
    info?.finalAnnouncementLabel ??
    (resultDate
      ? `${formatDateOnly(resultDate)} | ${resultMethod}`
      : '-')

  const certificateIssuanceLabel =
    info?.certificateIssuanceProvided == null
      ? '-'
      : info.certificateIssuanceProvided
        ? '제공'
        : '미제공'

  return {
    announcementPublishedLabel: needOrNotLabel(
      info?.announcementPublished,
      '게시',
      '미게시'
    ),
    preEducationNoticeLabel: needOrNotLabel(info?.preEducationNoticeRequired),
    certificateIssuanceLabel,
    showInstitutionApplicationLimits,
    studentListLabel,
    maxClassLabel: countLabel(
      info?.maxClassCount ?? program.rounds?.[0]?.classCount,
      '개'
    ),
    maxInstructorsLabel: countLabel(info?.maxAssignableInstructors, '명'),
    maxSessionsPerDayLabel: countLabel(info?.maxSessionsPerDay, '차시'),
    maxScheduleCountLabel: countLabel(info?.maxScheduleCount, '개'),
    operationPeriodLabel:
      info?.operationPeriodLabel ?? formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    targetLabel: program.targetLevel
      ? (TARGET_LEVEL_LABEL[program.targetLevel] ?? program.targetLevel)
      : '-',
    targetDetailLabel: program.district ?? '-',
    recruitmentPeriodLabel:
      info?.recruitmentPeriodLabel ??
      formatDateRange(program.applicationStartDate, program.applicationEndDate),
    finalAnnouncementLabel,
    contactOrganizationName:
      info?.contactOrganizationName ?? common?.sponsorDisplayName ?? 'JA Korea',
    contactPhone: program.contactPhone ?? '-',
    contactEmail: program.contactEmail ?? '-',
    notes: (program.oneLineIntroduction ?? '').trim() || '-',
  }
}
