/**
 * 일반 프로그램 상세 — 참여자 모집 정보 표시값
 * GET `recruitments[]` 가 있으면 모집기간·운영기간·문의처는 그 행만.
 * 행 필드가 null이면 nested·프로그램 컬럼으로 채우지 않고 `-`.
 * 행이 없을 때만 nested participantRecruitmentInfo. 공통정보 Program 폴백 없음.
 */

import {
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
} from '@jakorea/domain/shared/korean-phone'
import type { Program } from '@/types/domain'
import {
  formatAnnouncementLabel,
  resolveAnnouncement,
} from '@/features/program/shared/lib/announcement-label'
import {
  getParticipantRecruitmentStatus,
  getParticipantRecruitmentLifecycle,
  getRecruitmentStatusLabelForStatus,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import {
  buildInstitutionApplicationRecruitLimitVisibilityBridge,
  getInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
  shouldShowInstitutionApplicationMaxScheduleFields,
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  shouldShowTrainedTeachersInstitutionApplicationMaxSessionsPerDayField,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import { resolveProgramParticipantMaxClassCount } from '@/features/template/lib/participant-recruitment-institution-limits'
import { audienceOperationPeriodLabelFromRecruitmentRow } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import {
  hasRecruitmentWindows,
  operationPeriodLabelFromWindow,
  pickAudienceRecruitmentWindow,
  recruitmentPeriodLabelFromWindow,
} from '@/features/program/shared/lib/hydrate-recruitment-windows'
import {
  formatCountLabel,
  labelBool,
  labelEnum,
  pickDisplayString,
  pickDisplayValue,
} from '@/features/program/general/lib/detail-value-helpers'

const INQUIRY_CONTACT_PREFIX_RE = /^문의처\s*[:：]\s*/i
const INQUIRY_ORG_HINT_RE =
  /은행|기관|센터|학교|재단|협회|회사|조합|교육청|구청|시청|주식회사|유한회사|\bJA\b/i
const INQUIRY_PERSON_NAME_RE = /^[가-힣]{2,4}$/

/** 한글 2~4자 성명. 문의처 한 칸 수정 후 남는 옛 contactName 별칭과 구분한다. */
function looksLikeInquiryPersonName(value: string): boolean {
  if (INQUIRY_ORG_HINT_RE.test(value)) return false
  if (/[/,，\s]/.test(value)) return false
  return INQUIRY_PERSON_NAME_RE.test(value)
}

/**
 * 문의처 표시명. BE는 contactOrganizationName·contactName 을 같은 필드 별칭으로 주기도 한다.
 * 같으면 한 번만. 기관명/담당자가 다를 때만 ` / ` 로 붙인다.
 * 둘 다 사람 이름이면 수정된 문의처명(org)만 — 옛 담당자 별칭을 붙이지 않는다.
 */
export function formatRecruitmentInquiryContactName(
  orgName: string | undefined,
  personName: string | undefined
): string {
  const org = stripInquiryContactPrefix(orgName)
  const person = stripInquiryContactPrefix(personName)
  if (!org && !person) return '-'
  if (!org) return person
  if (!person) return org
  if (org === person) return org
  const orgParts = org
    .split(/\s*\/\s*/)
    .map(part => part.trim())
    .filter(Boolean)
  if (orgParts.includes(person)) return org
  if (looksLikeInquiryPersonName(org) && looksLikeInquiryPersonName(person)) return org
  return `${org} / ${person}`
}

function stripInquiryContactPrefix(value: string | undefined): string {
  return value?.trim().replace(INQUIRY_CONTACT_PREFIX_RE, '').trim() ?? ''
}

/** 수정 폼이 버리는 잘린 번호(`03`)는 조회에도 올리지 않는다. 마스킹(`*`)은 그대로. */
export function formatRecruitmentInquiryPhone(raw: string): string {
  const value = raw.trim()
  if (!value || value === '-') return '-'
  if (value.includes('*')) return value
  if (!isValidKoreanPhoneNumber(value)) return '-'
  return formatKoreanPhoneNumber(value) || value
}

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
  finalAnnouncementDate?: string | Date
  finalAnnouncementMethod?: string
  contactOrganizationName: string
  contactPhone: string
  contactEmail: string
  notes: string
}

/** 프로그램 상세 모집 — 등록 위저드와 동일하게 유형·회차·일정 모드 SSOT만으로 한도 필드 노출 */
function resolveRecruitmentInstitutionLimitsBridge(program: Program) {
  const fromProgram = resolveInstitutionApplicationProgramBridge(program)
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const programMode =
    commonInfo?.educationScheduleMode ?? fromProgram.educationScheduleMode ?? 'date'
  const base = buildInstitutionApplicationRecruitLimitVisibilityBridge({
    educationStructure: fromProgram.educationStructure,
    sessionRound: fromProgram.sessionRound,
    educationScheduleMode: programMode,
  })
  const live = getInstitutionApplicationProgramBridge()
  if (
    live.educationStructure === fromProgram.educationStructure &&
    live.sessionRound === fromProgram.sessionRound &&
    live.educationScheduleMode != null
  ) {
    return buildInstitutionApplicationRecruitLimitVisibilityBridge({
      educationStructure: fromProgram.educationStructure,
      sessionRound: fromProgram.sessionRound,
      educationScheduleMode: live.educationScheduleMode,
    })
  }
  return base
}

function companySchoolParticipantRecruitmentStatusLabel(
  status: Parameters<typeof getRecruitmentStatusLabelForStatus>[0]
): string {
  const label = getRecruitmentStatusLabelForStatus(status)
  return label === '-' ? label : `참여 기관 ${label}`
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
  const row = pickAudienceRecruitmentWindow(program, 'participant')
  const useRow = hasRecruitmentWindows(program)
  const effectiveProgram = {
    ...program,
    applicationStartDate:
      options?.applicationStartDate ??
      (useRow ? (row?.startAt ?? undefined) : program.applicationStartDate),
    applicationEndDate:
      options?.applicationEndDate ??
      (useRow ? (row?.endAt ?? undefined) : program.applicationEndDate),
  }
  const recruitmentStatus = getParticipantRecruitmentStatus(effectiveProgram)
  const lifecycle = getParticipantRecruitmentLifecycle(effectiveProgram)

  const showInstitutionApplicationLimits = isGeneralProgramSchoolInstitutionTarget(program)
  const bridge = resolveRecruitmentInstitutionLimitsBridge(program)
  const showMaxScheduleCountField =
    showInstitutionApplicationLimits && shouldShowInstitutionApplicationMaxScheduleFields(bridge)
  // 교육받은 교사는 커리큘럼 단일 회차도 노출 — Platform TT 「희망 차시」 셀렉 조건과 동일
  const showMaxSessionsPerDayField =
    showInstitutionApplicationLimits &&
    (isTrainedTeachersDetailProgram(program)
      ? shouldShowTrainedTeachersInstitutionApplicationMaxSessionsPerDayField(bridge)
      : shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge))

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

  const finalAnnouncement = resolveAnnouncement({
    labels: [info?.finalAnnouncementLabel, info?.resultAnnouncementLabel],
    column: {
      date: program.resultAnnouncementDate,
      method: program.resultAnnouncementMethod,
    },
  })
  const finalAnnouncementLabel = pickDisplayString(
    formatAnnouncementLabel(finalAnnouncement.date, finalAnnouncement.method)
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
      ? '면접 있음'
      : interviewEnabled === false
        ? '면접 없음'
        : '-'
    : undefined

  const announcementPublishedLabel = pickDisplayString(
    info?.announcementPublishedLabel,
    labelBool(info?.announcementPublished, '게시', '미게시')
  )

  const targetLabel = pickDisplayString(info?.educationTarget, info?.recruitmentTarget)
  const targetDetailLabel = pickDisplayString(
    info?.educationTargetDetail,
    info?.recruitmentTargetDetail
  )

  const notes = info?.notesNotApplicable
    ? '-'
    : pickDisplayString(
        useRow ? row?.remarks : undefined,
        useRow ? undefined : info?.remarks,
        !useRow && isCompanySchoolProgram(program) ? program.remarks : undefined
      )

  const rowContactName = row?.contactName?.trim() || undefined
  const rowContactPhone = row?.contactPhone?.trim() || undefined
  const rowContactEmail = row?.contactEmail?.trim() || undefined
  const contactOrganizationName = formatRecruitmentInquiryContactName(
    useRow ? rowContactName : (rowContactName ?? info?.contactOrganizationName),
    useRow ? undefined : rowContactName ? undefined : info?.contactName
  )

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
      operationPeriodLabelFromWindow(row),
      audienceOperationPeriodLabelFromRecruitmentRow(program, 'participant'),
      useRow ? undefined : info?.operationPeriodLabel
    ),
    // 1사1교 참여 기관 모집 — 시안 4175:101670 「참여 기관 모집 중 / 예정」. 그 외 유형은 「참여자 …」 유지
    recruitmentStatusLabel: isCompanySchoolProgram(program)
      ? companySchoolParticipantRecruitmentStatusLabel(recruitmentStatus)
      : getRecruitmentStatusLabelForStatus(recruitmentStatus, 'participant'),
    recruitmentStatusLifecycle: lifecycle,
    targetLabel,
    targetDetailLabel,
    recruitmentPeriodLabel: pickDisplayString(
      recruitmentPeriodLabelFromWindow(row),
      useRow ? undefined : info?.recruitmentPeriodLabel
    ),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalAnnouncementLabel,
    finalAnnouncementDate: finalAnnouncement.date,
    finalAnnouncementMethod: finalAnnouncement.method,
    contactOrganizationName,
    contactPhone: formatRecruitmentInquiryPhone(
      pickDisplayString(
        rowContactPhone,
        useRow || rowContactPhone
          ? undefined
          : (info?.inquiryTel ?? info?.tel ?? info?.contactPhone)
      )
    ),
    contactEmail: pickDisplayString(
      rowContactEmail,
      useRow || rowContactEmail
        ? undefined
        : (info?.inquiryEmail ?? info?.email ?? info?.contactEmail)
    ),
    notes,
  }
}
