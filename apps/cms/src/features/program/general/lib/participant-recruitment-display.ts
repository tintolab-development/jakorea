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
  formatTargetLevelsLabel,
  getParticipantRecruitmentLifecycle,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'
import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveProgramParticipantMaxClassCount } from '@/features/template/lib/participant-recruitment-institution-limits'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

export function resolveParticipantRecruitmentInterviewEnabled(
  program: Program,
  editInterviewValue?: 'yes' | 'no'
): boolean {
  if (editInterviewValue === 'yes') return true
  if (editInterviewValue === 'no') return false
  const interviewEnabled =
    program.generalParticipantInterviewEnabled ??
    program.generalCommonInfo?.participantRecruitmentInfo?.interviewEnabled
  return interviewEnabled === true
}

export type GeneralProgramParticipantRecruitmentDisplay = {
  /** 개인 프로그램 — 면접 유무 표시 (없으면 undefined) */
  interviewEnabledLabel?: string
  announcementPublishedLabel: string
  preEducationNoticeLabel: string
  certificateIssuanceLabel: string
  studentListLabel: string
  showInstitutionApplicationLimits: boolean
  /** 날짜 선택(기간) + 해당 프로그램 유형일 때만 */
  showMaxScheduleCountField: boolean
  /** 커리큘럼형 + 복수 회차 + 날짜 선택(기간)일 때만 */
  showMaxSessionsPerDayField: boolean
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
  documentPassAnnouncementDate?: string | Date
  documentPassAnnouncementMethod?: string
  interviewStartDate?: string | Date
  interviewEndDate?: string | Date
  interviewMethod?: string
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
  const bridge = resolveInstitutionApplicationProgramBridge(program)
  const showMaxScheduleCountField =
    showInstitutionApplicationLimits &&
    shouldShowInstitutionApplicationMaxScheduleFields(bridge)
  const showMaxSessionsPerDayField =
    showInstitutionApplicationLimits &&
    shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return {
      ...JOB담_PARTICIPANT_RECRUITMENT_MOCK,
      showInstitutionApplicationLimits: true,
      showMaxScheduleCountField,
      showMaxSessionsPerDayField,
      recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '참여자 모집 중',
      recruitmentStatusLifecycle: lifecycle ?? 'recruiting_students',
      targetLabel: formatTargetLevelsLabel(resolveProgramTargetLevels(program)) || '고등학교',
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

  const interviewEnabled =
    program.generalParticipantInterviewEnabled ??
    info?.interviewEnabled ??
    undefined
  const interviewEnabledLabel = isGeneralIndividualProgram(program)
    ? interviewEnabled === true
      ? '필요'
      : interviewEnabled === false
        ? '불필요'
        : '-'
    : undefined

  const documentPassAnnouncementDate = program.documentPassAnnouncementDate
  const documentPassAnnouncementMethod = program.documentPassAnnouncementMethod
  const interviewStartDate = program.interviewStartDate
  const interviewEndDate = program.interviewEndDate
  const interviewMethod = program.interviewMethod

  return {
    interviewEnabledLabel,
    announcementPublishedLabel: needOrNotLabel(
      info?.announcementPublished,
      '게시',
      '미게시'
    ),
    preEducationNoticeLabel: needOrNotLabel(info?.preEducationNoticeRequired),
    certificateIssuanceLabel,
    showInstitutionApplicationLimits,
    showMaxScheduleCountField,
    showMaxSessionsPerDayField,
    studentListLabel,
    maxClassLabel: countLabel(resolveProgramParticipantMaxClassCount(program), '개'),
    maxInstructorsLabel: countLabel(info?.maxAssignableInstructors, '명'),
    maxSessionsPerDayLabel: countLabel(info?.maxSessionsPerDay, '차시'),
    maxScheduleCountLabel: countLabel(info?.maxScheduleCount, '개'),
    operationPeriodLabel:
      info?.operationPeriodLabel ?? formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    targetLabel: formatTargetLevelsLabel(resolveProgramTargetLevels(program)),
    targetDetailLabel: program.district ?? '-',
    recruitmentPeriodLabel:
      info?.recruitmentPeriodLabel ??
      formatDateRange(program.applicationStartDate, program.applicationEndDate),
    documentPassAnnouncementDate,
    documentPassAnnouncementMethod,
    interviewStartDate,
    interviewEndDate,
    interviewMethod,
    finalAnnouncementLabel,
    contactOrganizationName:
      info?.contactOrganizationName ?? common?.sponsorDisplayName ?? 'JA Korea',
    contactPhone: program.contactPhone ?? '-',
    contactEmail: program.contactEmail ?? '-',
    notes: info?.notesNotApplicable
      ? '-'
      : (program.oneLineIntroduction ?? '').trim() || '-',
  }
}
