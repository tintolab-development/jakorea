/**
 * 일반 프로그램 상세 — 참여자 모집 정보 표시값
 * 값 없으면 '-' (mock/하드코드 기본값 없음)
 */

import type { Program } from '@/types/domain'
import {
  formatDateOnly,
  formatDateRange,
  formatTargetLevelsLabel,
  getParticipantRecruitmentLifecycle,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveProgramParticipantMaxClassCount } from '@/features/template/lib/participant-recruitment-institution-limits'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'

/** 학교/기관 대상 일반 프로그램 — 모집·신청 최대값 필드 노출 */
export function isGeneralProgramSchoolInstitutionTarget(program: Program): boolean {
  if (program.generalProgramAudience === 'organization') return true
  return program.generalParticipantTypes?.includes('school_institution') === true
}

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

function needOrNotLabel(value: boolean | undefined, yes = '필요', no = '불필요'): string {
  if (value == null) return '-'
  return value ? yes : no
}

function countLabel(value: number | undefined, suffix: string): string {
  if (value == null || Number.isNaN(value)) return '-'
  return `${value}${suffix}`
}

function dashOr(value: string | undefined | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
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

  const studentListValue = program.studentListRequired
  const studentListLabel =
    studentListValue === 'required'
      ? '필요'
      : studentListValue === 'not_required'
        ? '불필요'
        : '-'

  const resultDate = program.resultAnnouncementDate
  const resultMethod = program.resultAnnouncementMethod?.trim()
  const finalAnnouncementLabel =
    info?.finalAnnouncementLabel?.trim() ||
    (resultDate
      ? `${formatDateOnly(resultDate)}${resultMethod ? ` | ${resultMethod}` : ''}`
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
      info?.operationPeriodLabel?.trim() ||
      formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    targetLabel: formatTargetLevelsLabel(resolveProgramTargetLevels(program)),
    targetDetailLabel: dashOr(program.district),
    recruitmentPeriodLabel:
      info?.recruitmentPeriodLabel?.trim() ||
      formatDateRange(program.applicationStartDate, program.applicationEndDate),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalAnnouncementLabel,
    contactOrganizationName: dashOr(
      info?.contactOrganizationName ?? common?.sponsorDisplayName
    ),
    contactPhone: dashOr(program.contactPhone),
    contactEmail: dashOr(program.contactEmail),
    notes: info?.notesNotApplicable
      ? '-'
      : dashOr(program.oneLineIntroduction),
  }
}
