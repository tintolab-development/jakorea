/**
 * 일반 프로그램 상세 — 참여자 모집 정보 표시값
 * SSOT: serviceDetailJson.generalCommonInfo.participantRecruitmentInfo (모집 양식)
 * 일반·1사1교: 교육 대상 / 모집 기간 / 문의처 — 공통정보 Program 폴백 없음. 빈값 '-'
 * 교육받은 교사: nested 라벨이 없으면 컬럼(applicationStartDate 등)으로 조회 복원
 */

import type { Program } from '@/types/domain'
import {
  formatDateOnly,
  formatDateRange,
  formatTargetLevelsLabel,
  getParticipantRecruitmentLifecycle,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
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
  // 날짜·방법 중 하나만 입력돼도 표시해야 함 — 날짜 없다고 방법까지 통째로 버리지 않는다.
  // (버그: resultDate가 없으면 resultMethod가 있어도 전체가 undefined → '-' 로 노출되던 문제)
  const finalAnnouncementLabelFromProgram = [
    resultDate ? formatDateOnly(resultDate) : undefined,
    resultMethod || undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' | ')
  const finalAnnouncementLabel = pickDisplayString(
    info?.finalAnnouncementLabel,
    info?.resultAnnouncementLabel,
    finalAnnouncementLabelFromProgram || undefined
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

  /** 일반·1사1교: 모집 양식만. 교육받은 교사: nested 라벨이 비면 컬럼 폴백(저장 라운드트립) */
  const isTrainedTeachers = isTrainedTeachersDetailProgram(program)
  const targetFromLevels = formatTargetLevelsLabel(resolveProgramTargetLevels(program))
  const targetLabel = pickDisplayString(
    info?.educationTarget,
    info?.recruitmentTarget,
    isTrainedTeachers && targetFromLevels !== '-' ? targetFromLevels : undefined
  )
  const targetDetailLabel = pickDisplayString(
    info?.educationTargetDetail,
    info?.recruitmentTargetDetail,
    isTrainedTeachers ? program.educationTargetDetail : undefined
  )

  const notes = info?.notesNotApplicable
    ? '-'
    : pickDisplayString(info?.remarks, isTrainedTeachers ? program.remarks : undefined)

  const orgName = info?.contactOrganizationName?.trim()
  const personName = info?.contactName?.trim()
  const contactOrganizationName =
    orgName && personName
      ? `${orgName} / ${personName}`
      : pickDisplayString(orgName, personName)

  const operationFromProgram = isTrainedTeachers
    ? formatDateRange(program.startDate, program.endDate)
    : undefined
  const recruitmentFromProgram = isTrainedTeachers
    ? formatDateRange(program.applicationStartDate, program.applicationEndDate)
    : undefined

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
    operationPeriodLabel: pickDisplayString(
      info?.operationPeriodLabel,
      operationFromProgram && operationFromProgram !== '-' ? operationFromProgram : undefined
    ),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    targetLabel,
    targetDetailLabel,
    recruitmentPeriodLabel: pickDisplayString(
      info?.recruitmentPeriodLabel,
      recruitmentFromProgram && recruitmentFromProgram !== '-'
        ? recruitmentFromProgram
        : undefined
    ),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalAnnouncementLabel,
    contactOrganizationName,
    contactPhone: pickDisplayString(
      info?.inquiryTel,
      info?.tel,
      info?.contactPhone,
      isTrainedTeachers ? program.contactPhone : undefined
    ),
    contactEmail: pickDisplayString(
      info?.inquiryEmail,
      info?.email,
      info?.contactEmail,
      isTrainedTeachers ? program.contactEmail : undefined
    ),
    notes,
  }
}
