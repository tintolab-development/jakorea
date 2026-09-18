/**
 * 1사1교(economy) 프로그램 등록 위저드 — 필수 필드 검사.
 * 노출되는 입력 항목은 모두 필수(읽기전용·disabled 제외). 기본값 미기록은 기본값으로 간주.
 */

import { INSTITUTION_GUIDANCE_FIELDS } from '@/features/template/lib/institution-guidance-field-definitions'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as RK,
  getApplicantRecruitInstitutionOverlayRecord,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { getGeneralApplicationOverlayRecord } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getInstitutionSexOffenseConsentSubmissionRequest,
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
} from '@/features/program/general/lib/institution-application-form-visibility'
import { hasIncompleteGeneralProgramRecruitmentRequiredFields } from '@/features/program/general/lib/registration-recruitment-required-fields'

const ALL = '__all__'
const DETAILED_MAIN = '__economy_1c1s_main__'

function isEmptyText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function isEmptyStringList(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.every(item => isEmptyText(item))
}

function isRangeSealIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return true
  const row = value as { start?: unknown; end?: unknown }
  return isEmptyText(row.start) || isEmptyText(row.end)
}

function read(overlay: Record<string, unknown>, key: string): unknown {
  return overlay[key]
}

function readText(overlay: Record<string, unknown>, key: string, fallback = ''): string {
  const raw = overlay[key]
  if (raw === undefined) return fallback
  return typeof raw === 'string' ? raw : ''
}

function isNotesIncomplete(overlay: Record<string, unknown>, prefix: string): boolean {
  if (overlay[`${prefix}.notesNotApplicable`] === true) return false
  return isEmptyText(read(overlay, `${prefix}.notes`))
}

function isDayjsLikeEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'object' && value !== null && 'isValid' in value) {
    const d = value as { isValid?: () => boolean }
    return typeof d.isValid !== 'function' || !d.isValid()
  }
  return false
}

/** ——— 공통정보 (registration-economy) ——— */

function hasIncompleteEconomyBasicInfo(
  overlay: Record<string, unknown>,
  participant: ProgramRegistrationParticipantSelection
): boolean {
  const p = 'economyRegistration.basicInfo'
  if (isEmptyText(readText(overlay, `${p}.repKo`, '1사1교 경제금융교육'))) return true
  if (isEmptyText(readText(overlay, `${p}.repEn`, '1 Company 1 School Economics and Finance Education')))
    return true
  if (isEmptyText(read(overlay, `${p}.publicProgramTitle`))) return true
  if (isEmptyText(readText(overlay, `${p}.detailedProgramId`, DETAILED_MAIN))) return true
  if (isRangeSealIncomplete(read(overlay, `${p}.operationRangeSeal`))) return true
  if (!participant.organization && !participant.teacherInstructor) return true
  if (isEmptyText(readText(overlay, `${p}.businessField`, 'economy_finance'))) return true
  if (isEmptyText(readText(overlay, `${p}.sponsorId`, ALL))) return true
  const managerIdsRaw = read(overlay, `${p}.managerContactIds`)
  const managerIds = Array.isArray(managerIdsRaw)
    ? managerIdsRaw.map(String).map(id => id.trim()).filter(Boolean)
    : []
  const managerPrimary = readText(overlay, `${p}.managerContactId`, ALL)
  if (managerIds.length === 0 && isEmptyText(managerPrimary)) return true
  // 설문 — 전부 해제면 미완료 (기본값 전체 선택)
  const survey = read(overlay, `${p}.surveyItems`)
  if (survey != null && typeof survey === 'object') {
    const row = survey as Record<string, unknown>
    const any =
      row.survey === true || row.satisfaction === true || row.lecture_evaluation === true
    if (!any) return true
  }
  if (isEmptyText(readText(overlay, `${p}.educationCourse`, ALL))) return true
  if (isEmptyText(readText(overlay, `${p}.ipOwned`, 'ja'))) return true
  if (isEmptyText(readText(overlay, `${p}.courseDeliveredBy`, 'ja'))) return true
  if (isEmptyText(readText(overlay, `${p}.partnerInvolvement`, 'no'))) return true
  if (isEmptyText(readText(overlay, `${p}.ipsCategory`, 'prepare'))) return true
  return false
}

function hasIncompleteEconomyKpi(overlay: Record<string, unknown>): boolean {
  const p = 'economyRegistration.kpi'
  if (isEmptyNumber(read(overlay, `${p}.participantCount`))) return true
  if (isEmptyNumber(read(overlay, `${p}.instructor`))) return true
  if (isEmptyNumber(read(overlay, `${p}.dispatchedSchool`))) return true
  if (isEmptyNumber(read(overlay, `${p}.dispatchedClass`))) return true
  return false
}

function hasIncompleteEconomyWage(overlay: Record<string, unknown>): boolean {
  const p = 'economyRegistration.wageInfo'
  for (const n of [1, 2, 3] as const) {
    if (isEmptyNumber(read(overlay, `${p}.grade${n}Fee`))) return true
    if (isEmptyNumber(read(overlay, `${p}.grade${n}DistanceFee`))) return true
  }
  const payment = read(overlay, `${p}.paymentItemValues`)
  if (payment === undefined) return false // 기본 [p-1, p-7]
  if (!Array.isArray(payment) || payment.length === 0) return true
  return false
}

function hasIncompleteEconomyCurriculum(overlay: Record<string, unknown>): boolean {
  for (const n of [1, 2] as const) {
    if (isEmptyText(read(overlay, `economyRegistration.educationCurriculum.session${n}.title`))) {
      return true
    }
    if (
      isEmptyText(read(overlay, `economyRegistration.educationCurriculum.session${n}.description`))
    ) {
      return true
    }
  }
  return false
}

function hasIncompleteEconomySchedule(overlay: Record<string, unknown>): boolean {
  return isRangeSealIncomplete(
    read(overlay, 'economyRegistration.educationScheduleSettings.dateRangeSeal')
  )
}

export function hasIncompleteEconomyProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  participant: ProgramRegistrationParticipantSelection
): boolean {
  if (hasIncompleteEconomyBasicInfo(overlay, participant)) return true
  if (hasIncompleteEconomyKpi(overlay)) return true
  if (hasIncompleteEconomyWage(overlay)) return true
  if (hasIncompleteEconomyCurriculum(overlay)) return true
  if (hasIncompleteEconomySchedule(overlay)) return true
  return false
}

/** ——— 모집 (recruitment-economy + 강사 탭) ——— */

function hasIncompleteEconomyInstitutionRecruit(overlay: Record<string, unknown>): boolean {
  if (isEmptyText(readText(overlay, RK.announcementPublished, 'published'))) return true
  // economy 기본 2 / 4 — 미기록이면 기본 통과, 명시 null만 실패하도록 숫자 검사
  const maxI = read(overlay, RK.maxAssignableInstructors)
  if (maxI === undefined) {
    /* default 2 */
  } else if (isEmptyNumber(maxI)) {
    return true
  }
  const maxC = read(overlay, RK.maxClassCount)
  if (maxC === undefined) {
    /* default 4 */
  } else if (isEmptyNumber(maxC)) {
    return true
  }
  if (isRangeSealIncomplete(read(overlay, RK.programRangeSeal))) return true
  if (isEmptyStringList(read(overlay, RK.targetLevels))) return true
  if (isEmptyText(read(overlay, RK.targetLevelDetail))) return true
  if (isRangeSealIncomplete(read(overlay, RK.recruitRangeSeal))) return true
  if (isEmptyText(read(overlay, RK.finalAnnounceIso))) return true
  if (isEmptyText(read(overlay, RK.finalAnnounceMethod))) return true
  if (isEmptyText(read(overlay, RK.inquiryContact))) return true
  if (isEmptyText(read(overlay, RK.inquiryTel))) return true
  if (isEmptyText(read(overlay, RK.inquiryEmail))) return true
  if (isNotesIncomplete(overlay, 'recruit')) return true
  return false
}

function hasIncompleteEconomyRecruitDetail(overlay: Record<string, unknown>): boolean {
  const p = 'economyRecruit.detailInfo'
  if (isEmptyText(read(overlay, `${p}.programDescription`))) return true
  if (isEmptyText(read(overlay, `${p}.recruitmentGuide`))) return true
  if (isEmptyText(read(overlay, `${p}.applicationMethod`))) return true
  if (isEmptyText(read(overlay, `${p}.learningSupportContent`))) return true
  const thumb =
    read(overlay, `${p}.thumbFileName`) ?? read(overlay, `${p}.thumbObjectUrl`)
  if (isEmptyText(thumb)) return true
  return false
}

export function hasIncompleteEconomyProgramRecruitmentRequiredFields(
  participant: ProgramRegistrationParticipantSelection
): boolean {
  if (participant.organization) {
    if (hasIncompleteEconomyInstitutionRecruit(getApplicantRecruitInstitutionOverlayRecord())) {
      return true
    }
    // 상세 정보는 general-recruit overlay에 economyRecruit.detailInfo 키로 저장
    if (hasIncompleteEconomyRecruitDetail(getGeneralRecruitOverlayRecord())) return true
  }
  if (participant.teacherInstructor || participant.individual || participant.volunteer) {
    // 강사·개인·봉사 탭은 일반 모집 필수 검사 재사용 (economy는 봉사 숨김이 일반적)
    if (
      hasIncompleteGeneralProgramRecruitmentRequiredFields({
        participant: {
          individual: participant.individual,
          organization: false,
          teacherInstructor: participant.teacherInstructor,
          volunteer: participant.volunteer,
        },
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationScheduleMode: 'period',
        volunteerExceptionScheduleCount: 0,
      })
    ) {
      return true
    }
  }
  return false
}

/** ——— 신청 (application-economy) ——— */

function isScheduleBlockIncomplete(block: unknown): boolean {
  if (block == null || typeof block !== 'object') return true
  const b = block as {
    date?: unknown
    session?: unknown
    firstClassPeriod?: unknown
    firstStart?: unknown
    firstEnd?: unknown
    secondStart?: unknown
    secondEnd?: unknown
  }
  if (isDayjsLikeEmpty(b.date)) return true
  if (isEmptyText(b.session)) return true
  if (b.session !== '1' && b.session !== '2') return true
  if (isEmptyText(b.firstClassPeriod)) return true
  if (isDayjsLikeEmpty(b.firstStart) || isDayjsLikeEmpty(b.firstEnd)) return true
  if (b.session === '2') {
    if (isDayjsLikeEmpty(b.secondStart) || isDayjsLikeEmpty(b.secondEnd)) return true
  }
  return false
}

export function hasIncompleteEconomyProgramApplicationRequiredFields(
  applicationOverlay: Record<string, unknown> = getGeneralApplicationOverlayRecord()
): boolean {
  const b = 'application.economy.basicInfo'
  if (isEmptyText(read(applicationOverlay, `${b}.applicationGrade`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.detailAddress`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.classCount`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.totalStudents`))) return true
  if (isEmptyText(readText(applicationOverlay, `${b}.educationFormat`, 'online'))) return true
  if (isEmptyText(readText(applicationOverlay, `${b}.educationPlace`, 'inside'))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.educationPlaceDetail`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.teacherTel`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.teacherMobile`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.teacherEmail`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.applicationReason`))) return true
  if (isEmptyText(read(applicationOverlay, `${b}.otherRequests`))) return true

  const guidance = read(applicationOverlay, 'application.economy.guidanceAnswers')
  const guidanceRow =
    guidance != null && typeof guidance === 'object'
      ? (guidance as Record<string, unknown>)
      : {}
  for (const field of INSTITUTION_GUIDANCE_FIELDS) {
    if (isEmptyText(guidanceRow[field.id])) return true
  }

  // 성범죄 제출 요청 — 스토어 기본값 있음. 조회 방식 단락 노출 시 하위 필드 필수
  void getInstitutionSexOffenseConsentSubmissionRequest()
  if (shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) {
    const method = readText(
      applicationOverlay,
      'application.institution.sexOffense.inquiryMethod',
      'criminal_record_site'
    )
    if (isEmptyText(method)) return true
    if (method === 'criminal_record_site') {
      const site = readText(
        applicationOverlay,
        'application.institution.sexOffense.siteSubmission',
        'online'
      )
      if (isEmptyText(site)) return true
      if (site === 'online') {
        if (isEmptyText(read(applicationOverlay, 'application.institution.sexOffense.institutionId'))) {
          return true
        }
        if (
          isEmptyText(read(applicationOverlay, 'application.institution.sexOffense.verificationNumber'))
        ) {
          return true
        }
      }
    }
  }

  const companyType = readText(
    applicationOverlay,
    'application.economy.lessonReply.companyType',
    'partner'
  )
  if (isEmptyText(companyType)) return true
  if (companyType === 'custom') {
    if (isEmptyText(read(applicationOverlay, 'application.economy.lessonReply.customCompanyName'))) {
      return true
    }
  }

  if (isEmptyText(read(applicationOverlay, 'application.economy.previousYearParticipation'))) {
    return true
  }

  if (isScheduleBlockIncomplete(read(applicationOverlay, 'application.economy.schedule.first'))) {
    return true
  }
  if (isScheduleBlockIncomplete(read(applicationOverlay, 'application.economy.schedule.second'))) {
    return true
  }

  return false
}

/** 공통정보 overlay 기준 헬퍼 (에디터 VM용) */
export function hasIncompleteEconomyRegistrationFromStore(
  participant: ProgramRegistrationParticipantSelection
): boolean {
  return hasIncompleteEconomyProgramRegistrationRequiredFields(
    getProgramRegistrationOverlayRecord(),
    participant
  )
}
