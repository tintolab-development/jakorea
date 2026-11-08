/**
 * 모집 라디오 화면 기본값 — 등록 필수 검사·등록 저장(create)·상세 수정 초기값이 같은 기본값을 쓴다.
 *
 * 모집 단락은 저장소에 키가 없으면 기본값을 화면에 「보여 주기만」 하고 기록하지 않는다
 * (`useGeneralRecruitField`·`useApplicantRecruitInstitutionOverlayKv`). 검사·저장이 이 기본값을 보지 않으면
 * 「게시」가 선택돼 보이는데 미입력으로 막히거나 저장에서 빠진다. 필드별로 따로 막다가 여러 번 재발해서
 * 일반 모집(기관·개인·강사·봉사) 라디오 기본값을 이 모듈 한 곳에 모은다.
 *
 * 대상 아님(화면도 미선택이라 검사와 이미 같다): 1사1교·교육받은 교사 기관 모집 RHF(`''`), Gemini(`''`),
 * UJAT(RHF 값 그대로 표시).
 *
 * 상세 수정 초기값은 `recruit-radio-edit-prefill.ts` (같은 상수 사용).
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import {
  isOperationalSeedDefaultSuppressed,
  type OperationalSeedDefaultStore,
} from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'

/** 공고 게시 여부 화면 기본값 */
export const RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT = 'published' as const
/** 참여자·봉사자 면접 유무 화면 기본값 */
export const RECRUIT_INTERVIEW_REQUIRED_DEFAULT = 'yes' as const
/** 학생 명단 제출·사전 안내 사항 작성 여부 화면 기본값(일반 기관 모집, limitDefaults 없을 때) */
export const RECRUIT_NEED_OR_NOT_DEFAULT = 'need' as const
/** 강사 모집 대상 화면 기본값 — 라디오는 아니지만 같은 위저드 KV 보정 정책을 쓴다 */
export const RECRUIT_INSTRUCTOR_TARGETS_KEY = 'recruit.instructor.recruitTargets'
export const RECRUIT_INSTRUCTOR_TARGETS_DEFAULT: string[] = ['adult']

/**
 * 모집 단락 라디오 키 → 화면 기본값 (단락·검사·저장·수정이 모두 이 표를 따른다).
 * 회귀 가드: `recruit-radio-defaults-parity.test.ts` 가 모든 키 × 유형을 검사한다.
 */
export const GENERAL_RECRUIT_RADIO_KEYS = {
  institution: {
    announcementPublished: APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.announcementPublished,
    studentListRequired: APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.studentListRequired,
    preguidanceRequired: APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.preguidanceRequired,
  },
  individual: {
    announcementPublished: 'recruit.individual.announcementPublished',
    interviewRequired: 'recruit.individual.interviewRequired',
  },
  instructor: {
    announcementPublished: 'recruit.instructor.announcementPublished',
  },
  volunteer: {
    announcementPublished: 'recruit.volunteer.announcementPublished',
    interviewRequired: 'recruit.volunteer.interviewRequired',
  },
} as const

type RadioDefaultEntry = {
  key: string
  value: string
  store: OperationalSeedDefaultStore
  /**
   * 면접 유무 라디오는 `''`·null 도 「면접 있음」으로 그린다(`isRecruitInterviewRequiredOff`).
   * 공고 게시·명단·사전안내는 `''` 이면 미선택으로 그리므로 키가 없을 때만 기본값이다.
   */
  blankMeansDefault: boolean
}

export type GeneralRecruitRadioDefaultsOptions = {
  /**
   * 일반 위저드 RHF `recruitmentKv` 기준. 이 경로의 화면은 템플릿 변경 시드 억제를 보지 않고 기본값을 그린다.
   * false 면(1사1교 강사·개인·봉사 탭 등 필드 폼 경로) 억제된 키는 화면도 비어 있으므로 채우지 않는다.
   */
  wizardKv?: boolean
  /** 기관 탭 `limitDefaults` — 없으면 'need' */
  institutionDefaults?: {
    studentListRequired?: 'need' | 'none'
    preguidanceRequired?: 'need' | 'none'
  }
}

function listRadioDefaultEntries(
  participant: Pick<
    ProgramRegistrationParticipantSelection,
    'individual' | 'organization' | 'teacherInstructor' | 'volunteer'
  >,
  options: GeneralRecruitRadioDefaultsOptions
): RadioDefaultEntry[] {
  const K = GENERAL_RECRUIT_RADIO_KEYS
  const entries: RadioDefaultEntry[] = []
  if (participant.organization) {
    const store: OperationalSeedDefaultStore = 'institution-recruit'
    entries.push(
      {
        key: K.institution.announcementPublished,
        value: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
        store,
        blankMeansDefault: false,
      },
      {
        key: K.institution.studentListRequired,
        value: options.institutionDefaults?.studentListRequired ?? RECRUIT_NEED_OR_NOT_DEFAULT,
        store,
        blankMeansDefault: false,
      },
      {
        key: K.institution.preguidanceRequired,
        value: options.institutionDefaults?.preguidanceRequired ?? RECRUIT_NEED_OR_NOT_DEFAULT,
        store,
        blankMeansDefault: false,
      }
    )
  }
  const store: OperationalSeedDefaultStore = 'general-recruit'
  if (participant.individual) {
    entries.push(
      {
        key: K.individual.announcementPublished,
        value: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
        store,
        blankMeansDefault: false,
      },
      {
        key: K.individual.interviewRequired,
        value: RECRUIT_INTERVIEW_REQUIRED_DEFAULT,
        store,
        blankMeansDefault: true,
      }
    )
  }
  if (participant.teacherInstructor) {
    entries.push({
      key: K.instructor.announcementPublished,
      value: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
      store,
      blankMeansDefault: false,
    })
  }
  if (participant.volunteer) {
    entries.push(
      {
        key: K.volunteer.announcementPublished,
        value: RECRUIT_ANNOUNCEMENT_PUBLISHED_DEFAULT,
        store,
        blankMeansDefault: false,
      },
      {
        key: K.volunteer.interviewRequired,
        value: RECRUIT_INTERVIEW_REQUIRED_DEFAULT,
        store,
        blankMeansDefault: true,
      }
    )
  }
  return entries
}

type ArrayDefaultEntry = {
  key: string
  value: string[]
  store: OperationalSeedDefaultStore
}

function listArrayDefaultEntries(
  participant: Pick<
    ProgramRegistrationParticipantSelection,
    'individual' | 'organization' | 'teacherInstructor' | 'volunteer'
  >
): ArrayDefaultEntry[] {
  if (!participant.teacherInstructor) return []
  return [
    {
      key: RECRUIT_INSTRUCTOR_TARGETS_KEY,
      value: RECRUIT_INSTRUCTOR_TARGETS_DEFAULT,
      store: 'general-recruit',
    },
  ]
}

function shouldFillWizardArrayDefault(
  raw: unknown,
  entry: ArrayDefaultEntry,
  options: GeneralRecruitRadioDefaultsOptions
): boolean {
  if (raw !== undefined) return false
  if (
    options.wizardKv !== true &&
    isOperationalSeedDefaultSuppressed(entry.store, entry.key)
  ) {
    return false
  }
  return options.wizardKv === true
}

/**
 * 선택된 모집 탭의 라디오 중 화면이 기본값으로 그리는 것만 그 값으로 채운다.
 * 사용자가 고른 값·명시적 빈 값(공고 게시 `''` 등 화면 미선택)은 그대로 둔다. 바뀐 것이 없으면 같은 객체를 돌려준다.
 */
export function withGeneralRecruitRadioDefaults(
  kv: Record<string, unknown>,
  participant: Pick<
    ProgramRegistrationParticipantSelection,
    'individual' | 'organization' | 'teacherInstructor' | 'volunteer'
  >,
  options: GeneralRecruitRadioDefaultsOptions = {}
): Record<string, unknown> {
  let next = kv
  for (const entry of listRadioDefaultEntries(participant, options)) {
    const raw = kv[entry.key]
    const shownAsDefault = entry.blankMeansDefault
      ? raw === undefined || raw === null || raw === ''
      : raw === undefined
    if (!shownAsDefault) continue
    if (
      !entry.blankMeansDefault &&
      options.wizardKv !== true &&
      isOperationalSeedDefaultSuppressed(entry.store, entry.key)
    ) {
      continue
    }
    if (next === kv) next = { ...kv }
    next[entry.key] = entry.value
  }
  for (const entry of listArrayDefaultEntries(participant)) {
    if (!shouldFillWizardArrayDefault(kv[entry.key], entry, options)) continue
    if (next === kv) next = { ...kv }
    next[entry.key] = [...entry.value]
  }
  return next
}
