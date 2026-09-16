/**
 * 일반 프로그램 상세 — 참여자 모집 정보 표시값
 * SSOT: serviceDetailJson.generalCommonInfo.participantRecruitmentInfo (모집 양식)
 * 교육 대상 / 모집 기간 / 문의처 — 공통정보 Program 폴백 없음. 빈값 '-'
 */

import type { Program } from '@/types/domain'
import {
  formatDateOnly,
  getParticipantRecruitmentLifecycle,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import {
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveProgramParticipantMaxClassCount } from '@/features/template/lib/participant-recruitment-institution-limits'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  formatCountLabel,
  labelBool,
  labelEnum,
  pickDisplayString,
  pickDisplayValue,
} from '@/features/program/general/lib/detail-value-helpers'

type ParticipantRecruitmentInfoLoose = NonNullable<
  NonNullable<Program['generalCommonInfo']>['participantRecruitmentInfo']
> & {
  announcementPublishedLabel?: string
  studentListRequired?: 'required' | 'not_required' | boolean
  studentListRequiredLabel?: string
  preEducationNoticeRequiredLabel?: string
  advanceGuidanceRequired?: boolean
  advanceGuidanceRequiredLabel?: string
  inquiryTel?: string
  inquiryEmail?: string
  tel?: string
  email?: string
  remarks?: string
  educationTarget?: string
  educationTargetDetail?: string
  recruitmentTarget?: string
  recruitmentTargetDetail?: string
  resultAnnouncementLabel?: string
  contactOrganizationName?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
}

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

export function resolveGeneralProgramParticipantRecruitmentDisplay(
  program: Program,
  options?: {
    applicationStartDate?: string
    applicationEndDate?: string
  }
): GeneralProgramParticipantRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.participantRecruitmentInfo as ParticipantRecruitmentInfoLoose | undefined
  const lifecycle = getParticipantRecruitmentLifecycle(program, options)

  const showInstitutionApplicationLimits = isGeneralProgramSchoolInstitutionTarget(program)
  const bridge = resolveInstitutionApplicationProgramBridge(program)
  const showMaxScheduleCountField =
    showInstitutionApplicationLimits &&
    shouldShowInstitutionApplicationMaxScheduleFields(bridge)
  const showMaxSessionsPerDayField =
    showInstitutionApplicationLimits &&
    shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)

  const studentListValue = pickDisplayValue(
    typeof info?.studentListRequired === 'string' ? info.studentListRequired : undefined,
    program.studentListRequired,
    typeof info?.studentListRequired === 'boolean'
      ? info.studentListRequired
        ? 'required'
        : 'not_required'
      : undefined
  )
  const studentListFromEnum = labelEnum(
    typeof studentListValue === 'string' ? studentListValue : undefined,
    {
      required: '제출 필요',
      not_required: '제출 불필요',
    }
  )
  const studentListLabel = pickDisplayString(
    info?.studentListRequiredLabel,
    studentListFromEnum === '-' ? undefined : studentListFromEnum
  )

  const preEducationValue = pickDisplayValue(
    info?.preEducationNoticeRequired,
    info?.advanceGuidanceRequired
  )
  const preEducationNoticeLabel = pickDisplayString(
    info?.preEducationNoticeRequiredLabel,
    info?.advanceGuidanceRequiredLabel,
    labelBool(preEducationValue, '작성', '해당없음')
  )

  const resultDate = program.resultAnnouncementDate
  const resultMethod = program.resultAnnouncementMethod?.trim()
  const finalAnnouncementLabel = pickDisplayString(
    info?.finalAnnouncementLabel,
    info?.resultAnnouncementLabel,
    resultDate
      ? `${formatDateOnly(resultDate)}${resultMethod ? ` | ${resultMethod}` : ''}`
      : undefined
  )

  const certificateIssuanceLabel =
    info?.certificateIssuanceProvided == null
      ? '-'
      : info.certificateIssuanceProvided
        ? '제공'
        : '미제공'

  const interviewEnabled =
    program.generalParticipantInterviewEnabled ?? info?.interviewEnabled ?? undefined
  const interviewEnabledLabel = isGeneralIndividualProgram(program)
    ? interviewEnabled === true
      ? '필요'
      : interviewEnabled === false
        ? '불필요'
        : '-'
    : undefined

  const announcementPublishedLabel = pickDisplayString(
    info?.announcementPublishedLabel,
    labelBool(info?.announcementPublished, '게시', '미게시')
  )

  /** 모집 양식만 — 공통 targetLevels / district 폴백 금지 */
  const targetLabel = pickDisplayString(info?.educationTarget, info?.recruitmentTarget)
  const targetDetailLabel = pickDisplayString(
    info?.educationTargetDetail,
    info?.recruitmentTargetDetail
  )

  const notes = info?.notesNotApplicable
    ? '-'
    : pickDisplayString(info?.remarks)

  const orgName = info?.contactOrganizationName?.trim()
  const personName = info?.contactName?.trim()
  const contactOrganizationName =
    orgName && personName
      ? `${orgName} / ${personName}`
      : pickDisplayString(orgName, personName)

  return {
    interviewEnabledLabel,
    announcementPublishedLabel,
    preEducationNoticeLabel,
    certificateIssuanceLabel,
    showInstitutionApplicationLimits,
    showMaxScheduleCountField,
    showMaxSessionsPerDayField,
    studentListLabel,
    maxClassLabel: formatCountLabel(resolveProgramParticipantMaxClassCount(program), '개'),
    maxInstructorsLabel: formatCountLabel(info?.maxAssignableInstructors, '명'),
    maxSessionsPerDayLabel: formatCountLabel(info?.maxSessionsPerDay, '차시'),
    maxScheduleCountLabel: formatCountLabel(info?.maxScheduleCount, '개'),
    /** 모집 양식 operationPeriodLabel만 — 공통 운영기간(start/end) 폴백 금지 */
    operationPeriodLabel: pickDisplayString(info?.operationPeriodLabel),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    targetLabel,
    targetDetailLabel,
    /** 모집 양식 recruitmentPeriodLabel만 — applicationStart/End(등록 기본값) 폴백 금지 */
    recruitmentPeriodLabel: pickDisplayString(info?.recruitmentPeriodLabel),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalAnnouncementLabel,
    contactOrganizationName,
    contactPhone: pickDisplayString(info?.inquiryTel, info?.tel, info?.contactPhone),
    contactEmail: pickDisplayString(info?.inquiryEmail, info?.email, info?.contactEmail),
    notes,
  }
}
