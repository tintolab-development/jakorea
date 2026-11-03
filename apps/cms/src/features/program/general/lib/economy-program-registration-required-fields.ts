/**
 * 1사1교(economy) 프로그램 등록 위저드 — 필수 필드 검사.
 * 노출되는 입력 항목은 모두 필수(읽기전용·disabled 제외). 기본값 미기록은 기본값으로 간주.
 */

import { INSTITUTION_GUIDANCE_FIELDS } from '@/features/template/lib/institution-guidance-field-definitions'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as RK } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { getGeneralApplicationOverlayRecord } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getInstitutionSexOffenseConsentSubmissionRequest,
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
} from '@/features/program/general/lib/institution-application-form-visibility'
import {
  listIncompleteGeneralProgramRecruitmentRequiredFields,
  listIncompleteInstructorRecruitInfo,
  peekSelectedInstitutionRecruitOverlay,
} from '@/features/program/general/lib/registration-recruitment-required-fields'
import { isDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  isAnnouncementPublishedChoiceMissing,
  isAnnouncementUnpublished,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import { serializeCompanySchoolRecruitmentForFormVersion } from '@/features/program/1c-1s/lib/registration-rhf-recruitment'
import {
  serializeCompanySchoolInstructorRecruitmentForFormVersion,
  withCompanySchoolInstructorRecruitCreateDefaults,
} from '@/features/program/1c-1s/lib/registration-rhf-instructor-recruitment'
import { serializeCompanySchoolApplicationForFormVersion } from '@/features/program/1c-1s/lib/registration-rhf-application'
import { instructorRecruitFieldForm } from '@/features/template/ui/form-set/recruit-form/instructor/instructor-recruit-form-rhf'
import { withGeneralRecruitRadioDefaults } from '@/features/program/general/lib/recruit-radio-defaults'

const ALL = '__all__'

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

function pushReason(reasons: string[], condition: boolean, key: string): void {
  if (condition) reasons.push(key)
}

function listIncompleteEconomyBasicInfoReasons(
  overlay: Record<string, unknown>,
  participant: ProgramRegistrationParticipantSelection
): string[] {
  const reasons: string[] = []
  const p = 'economyRegistration.basicInfo'
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.repKo`, '1사1교 경제금융교육')),
    'basicInfo.repKo'
  )
  pushReason(
    reasons,
    isEmptyText(
      readText(overlay, `${p}.repEn`, '1 Company 1 School Economics and Finance Education')
    ),
    'basicInfo.repEn'
  )
  pushReason(reasons, isEmptyText(read(overlay, `${p}.publicProgramTitle`)), 'basicInfo.publicProgramTitle')
  pushReason(
    reasons,
    !isDetailedProgramMasterId(read(overlay, `${p}.detailedProgramId`)),
    'basicInfo.detailedProgramId'
  )
  pushReason(
    reasons,
    isRangeSealIncomplete(read(overlay, `${p}.operationRangeSeal`)),
    'basicInfo.operationRangeSeal'
  )
  pushReason(
    reasons,
    !participant.organization && !participant.teacherInstructor,
    'basicInfo.audience'
  )
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.businessField`, 'economy_finance')),
    'basicInfo.businessField'
  )
  pushReason(reasons, isEmptyText(readText(overlay, `${p}.sponsorId`, ALL)), 'basicInfo.sponsorId')
  const managerIdsRaw = read(overlay, `${p}.managerContactIds`)
  const managerIds = Array.isArray(managerIdsRaw)
    ? managerIdsRaw.map(String).map(id => id.trim()).filter(Boolean)
    : []
  const managerPrimary = readText(overlay, `${p}.managerContactId`, ALL)
  pushReason(
    reasons,
    managerIds.length === 0 && isEmptyText(managerPrimary),
    'basicInfo.managerContact'
  )
  // 설문 진행 항목 — 0개 선택도 완료 (선택)
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.educationCourse`, ALL)),
    'basicInfo.educationCourse'
  )
  pushReason(reasons, isEmptyText(readText(overlay, `${p}.ipOwned`, 'ja')), 'basicInfo.ipOwned')
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.courseDeliveredBy`, 'ja')),
    'basicInfo.courseDeliveredBy'
  )
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.partnerInvolvement`, 'no')),
    'basicInfo.partnerInvolvement'
  )
  pushReason(
    reasons,
    isEmptyText(readText(overlay, `${p}.ipsCategory`, 'prepare')),
    'basicInfo.ipsCategory'
  )
  return reasons
}

function listIncompleteEconomyKpiReasons(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  const p = 'economyRegistration.kpi'
  pushReason(reasons, isEmptyNumber(read(overlay, `${p}.participantCount`)), 'kpi.participantCount')
  pushReason(reasons, isEmptyNumber(read(overlay, `${p}.instructor`)), 'kpi.instructor')
  pushReason(reasons, isEmptyNumber(read(overlay, `${p}.dispatchedSchool`)), 'kpi.dispatchedSchool')
  pushReason(reasons, isEmptyNumber(read(overlay, `${p}.dispatchedClass`)), 'kpi.dispatchedClass')
  return reasons
}

function listIncompleteEconomyWageReasons(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  const p = 'economyRegistration.wageInfo'
  for (const n of [1, 2, 3] as const) {
    pushReason(reasons, isEmptyNumber(read(overlay, `${p}.grade${n}Fee`)), `wage.grade${n}Fee`)
    pushReason(
      reasons,
      isEmptyNumber(read(overlay, `${p}.grade${n}DistanceFee`)),
      `wage.grade${n}DistanceFee`
    )
  }
  const payment = read(overlay, `${p}.paymentItemValues`)
  if (payment !== undefined) {
    pushReason(
      reasons,
      !Array.isArray(payment) || payment.length === 0,
      'wage.paymentItemValues'
    )
  }
  return reasons
}

function listIncompleteEconomyCurriculumReasons(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  for (const n of [1, 2] as const) {
    pushReason(
      reasons,
      isEmptyText(read(overlay, `economyRegistration.educationCurriculum.session${n}.title`)),
      `curriculum.session${n}.title`
    )
    pushReason(
      reasons,
      isEmptyText(
        read(overlay, `economyRegistration.educationCurriculum.session${n}.description`)
      ),
      `curriculum.session${n}.description`
    )
  }
  return reasons
}

function listIncompleteEconomyScheduleReasons(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  pushReason(
    reasons,
    isRangeSealIncomplete(
      read(overlay, 'economyRegistration.educationScheduleSettings.dateRangeSeal')
    ),
    'schedule.dateRangeSeal'
  )
  return reasons
}

/** 1사1교 등록 공통정보 — 미입력 필수 필드 진단 키 목록 */
export function listIncompleteEconomyProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  participant: ProgramRegistrationParticipantSelection
): string[] {
  return [
    ...listIncompleteEconomyBasicInfoReasons(overlay, participant),
    ...listIncompleteEconomyKpiReasons(overlay),
    ...listIncompleteEconomyWageReasons(overlay),
    ...listIncompleteEconomyCurriculumReasons(overlay),
    ...listIncompleteEconomyScheduleReasons(overlay),
  ]
}

/**
 * 1사1교(economy) 프로그램 등록 공통정보 — 어느 필수 필드가 비어 있는지 진단용 reason.
 * `null`이면 완료. 값이 있으면 `<section>.<field>` 형태의 진단 키.
 * 콘솔 디버깅·문의 대응용 — UI 문구에는 노출하지 않는다.
 */
export function describeIncompleteEconomyProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  participant: ProgramRegistrationParticipantSelection
): string | null {
  return listIncompleteEconomyProgramRegistrationRequiredFields(overlay, participant)[0] ?? null
}

export function hasIncompleteEconomyProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  participant: ProgramRegistrationParticipantSelection
): boolean {
  return describeIncompleteEconomyProgramRegistrationRequiredFields(overlay, participant) != null
}

/** ——— 모집 (recruitment-economy + 강사 탭) ———
 * 「상세 정보」단락(economyRecruit.detailInfo)은 schema `requiredMark: false` — phase gate에서 제외.
 * 일반 프로그램 `registration-recruitment-required-fields`와 동일 정책.
 */

function listIncompleteEconomyInstitutionRecruit(overlay: Record<string, unknown>): string[] {
  const reasons: string[] = []
  const p = 'recruit.institution'
  const published = read(overlay, RK.announcementPublished)
  const skipSchedule = isAnnouncementUnpublished(published)
  pushReason(
    reasons,
    isAnnouncementPublishedChoiceMissing(published),
    `${p}.announcementPublished`
  )
  const maxI = read(overlay, RK.maxAssignableInstructors)
  pushReason(
    reasons,
    maxI !== undefined && maxI !== null && isEmptyNumber(maxI),
    `${p}.maxAssignableInstructors`
  )
  const maxC = read(overlay, RK.maxClassCount)
  pushReason(
    reasons,
    maxC !== undefined && maxC !== null && isEmptyNumber(maxC),
    `${p}.maxClassCount`
  )
  if (!skipSchedule) {
    pushReason(reasons, isRangeSealIncomplete(read(overlay, RK.programRangeSeal)), `${p}.programRangeSeal`)
  }
  pushReason(reasons, isEmptyStringList(read(overlay, RK.targetLevels)), `${p}.targetLevels`)
  pushReason(reasons, isEmptyText(read(overlay, RK.targetLevelDetail)), `${p}.targetLevelDetail`)
  if (!skipSchedule) {
    pushReason(reasons, isRangeSealIncomplete(read(overlay, RK.recruitRangeSeal)), `${p}.recruitRangeSeal`)
    pushReason(reasons, isEmptyText(read(overlay, RK.finalAnnounceIso)), `${p}.finalAnnounceIso`)
    pushReason(reasons, isEmptyText(read(overlay, RK.finalAnnounceMethod)), `${p}.finalAnnounceMethod`)
  }
  pushReason(reasons, isEmptyText(read(overlay, RK.inquiryContact)), `${p}.inquiryContact`)
  pushReason(reasons, isEmptyText(read(overlay, RK.inquiryTel)), `${p}.inquiryTel`)
  pushReason(reasons, isEmptyText(read(overlay, RK.inquiryEmail)), `${p}.inquiryEmail`)
  pushReason(reasons, isNotesIncomplete(overlay, 'recruit'), `${p}.notes`)
  return reasons
}

/** 1사1교 모집 단계 — 미입력 필수 필드 진단 키 */
export function listIncompleteEconomyProgramRecruitmentRequiredFields(
  participant: ProgramRegistrationParticipantSelection
): string[] {
  const reasons: string[] = []
  if (participant.organization) {
    const rhf = peekCompanySchoolRegistrationRhf()
    reasons.push(
      ...listIncompleteEconomyInstitutionRecruit(
        rhf != null
          ? serializeCompanySchoolRecruitmentForFormVersion(rhf.getValues().recruitment)
          : peekSelectedInstitutionRecruitOverlay('COMPANY_SCHOOL')
      )
    )
  }
  if (participant.teacherInstructor || participant.individual || participant.volunteer) {
    const rhf = peekCompanySchoolRegistrationRhf()
    const typedInstructor =
      rhf != null
        ? serializeCompanySchoolInstructorRecruitmentForFormVersion(
            withCompanySchoolInstructorRecruitCreateDefaults(rhf.getValues().instructorRecruit)
          )
        : null
    if (participant.teacherInstructor) {
      const fieldForm = {
        ...instructorRecruitFieldForm.peekRecord(null),
        ...instructorRecruitFieldForm.peekRecord('recruitment-instructor'),
        ...instructorRecruitFieldForm.getRecord(),
      }
      const merged: Record<string, unknown> = { ...fieldForm }
      for (const [key, value] of Object.entries(typedInstructor ?? {})) {
        if (value == null) continue
        if (typeof value === 'string' && value.trim() === '') continue
        if (Array.isArray(value) && value.length === 0) continue
        merged[key] = value
      }
      reasons.push(
        ...listIncompleteInstructorRecruitInfo(
          withGeneralRecruitRadioDefaults(merged, {
            individual: false,
            organization: false,
            teacherInstructor: true,
            volunteer: false,
          })
        )
      )
    }
    if (participant.individual || participant.volunteer) {
      reasons.push(
        ...listIncompleteGeneralProgramRecruitmentRequiredFields({
          participant: {
            individual: participant.individual,
            organization: false,
            teacherInstructor: false,
            volunteer: participant.volunteer,
          },
          programType: 'curriculum',
          sessionRoundType: 'single',
          educationScheduleMode: 'period',
          volunteerExceptionScheduleCount: 0,
          registrationProgramType: 'COMPANY_SCHOOL',
        })
      )
    }
  }
  return reasons
}

export function hasIncompleteEconomyProgramRecruitmentRequiredFields(
  participant: ProgramRegistrationParticipantSelection
): boolean {
  return listIncompleteEconomyProgramRecruitmentRequiredFields(participant).length > 0
}

/** ——— 신청 (application-economy) ———
 * 지원자 신청서 fill overlay 검사용. 프로그램 **등록** 위저드 신청 단계는 양식(template) 편집이므로
 * `use-registration-flow` complete gate에 사용하지 않는다 — 일반 프로그램과 동일.
 */

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
  applicationOverlay: Record<string, unknown> = (() => {
    const store = getGeneralApplicationOverlayRecord()
    const rhf = peekCompanySchoolRegistrationRhf()
    if (rhf == null) return store
    return {
      ...store,
      ...serializeCompanySchoolApplicationForFormVersion(rhf.getValues().application),
    }
  })()
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
    const method = readText(applicationOverlay, 'application.institution.sexOffense.inquiryMethod')
    if (isEmptyText(method) || (method !== 'ja_system' && method !== 'criminal_record_site')) {
      return true
    }
    if (method === 'criminal_record_site') {
      const site = readText(applicationOverlay, 'application.institution.sexOffense.siteSubmission')
      if (site !== 'direct' && site !== 'online') return true
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
