/**
 * 상세 수정(edit) 모집 라디오 초기값 — 서버 값이 비어 있으면 기존 등록분 해석값(게시·면접 있음)을 넣는다.
 *
 * - 수정 화면 라디오는 폼 값을 그대로 그린다(값이 없으면 미선택). 여기서 채운 값이 곧 화면 값이고,
 *   저장(`useProgramDetailInfoSave` → `form.getValues()` 전체 → `detailEditValuesToProgramPatch`)에도 그대로 들어간다.
 *   열기만 해서는 저장하지 않는다(사용자가 수정 저장할 때만 반영).
 * - 탭 판정은 상세 화면과 같은 출처를 쓴다.
 *   · 일반: 참여자(기관/개인) 탭은 항상, 강사·봉사 탭은 `getGeneralParticipantTypes`(detail-meta, LNB·모집 탭 노출 SSOT).
 *     개인/기관 구분은 참여자 모집 화면과 같은 `isGeneralIndividualProgram`.
 *   · 1사1교: 모집 화면이 강사 탭을 항상 보여 주고(`showInstructorTab={!isTrainedTeachersDetail}`) 봉사 탭은 없다.
 *     기관 탭은 등록에서도 미선택 시작이라 채우지 않는다.
 * - 유형 판정: backendProgramType 이 없어도 id·overlay 등으로 UJAT·교육받은 교사·1사1교를 먼저 가려내고,
 *   나머지(유형 미기재 포함)는 일반으로 본다. 알 수 없는 다른 유형 문자열은 건드리지 않는다.
 */
import type { Program } from '@/types/domain'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import {
  isGeneralIndividualProgram,
  isTrainedTeachersProgram,
} from '@/features/program/general/lib/survey-audience'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import {
  isUjatPrimaryCaseUuid,
  isUjatPrimaryProgramId,
} from '@/features/program/ujat/lib/is-ujat-primary-program'
/** 상세 수정 「사전 안내 사항 작성 여부」 화면 기본값 — 등록 `need` 와 같은 뜻 */
export const DETAIL_EDIT_PRE_EDUCATION_REQUIRED_DEFAULT = 'required' as const

export type DetailEditRadioPrefillKind = 'general' | 'companySchool' | 'none'

const GENERAL_BACKEND_TYPES = new Set(['GENERAL', 'GENERAL_ORGANIZATION', 'GENERAL_INDIVIDUAL'])

export function resolveDetailEditRadioPrefillKind(program: Program): DetailEditRadioPrefillKind {
  const type = program.backendProgramType?.trim().toUpperCase() ?? ''
  const id = String(program.id ?? '')
  if (program.ujatRegistrationOverlay != null || type.startsWith('UJAT') || type.includes('GEMINI')) {
    return 'none'
  }
  if (isTrainedTeachersProgram(program)) return 'none'
  if (type === '') {
    // 유형 미기재 — id·필드로 다른 유형을 먼저 가려낸다(18xxxx 같은 넓은 숫자 패턴은 일반과 겹쳐 쓰지 않는다).
    if (
      program.ujatProgressStatus != null ||
      isUjatPrimaryProgramId(id) ||
      isUjatPrimaryCaseUuid(id) ||
      id.startsWith('ujat-')
    ) {
      return 'none'
    }
    if (looksLikeTrainedTeacherProgramId(id)) return 'none'
  }
  if (isCompanySchoolProgram(program)) return 'companySchool'
  if (type === '' || GENERAL_BACKEND_TYPES.has(type)) return 'general'
  return 'none'
}

export type DetailEditRecruitRadioTabs = {
  /** 참여자(기관·개인) 모집 탭 라디오 */
  participant: false | 'institution' | 'individual'
  instructor: boolean
  volunteer: boolean
}

/** 상세 수정 화면에 보이는 모집 탭(라디오 채움 대상) */
export function resolveDetailEditRecruitRadioTabs(program: Program): DetailEditRecruitRadioTabs {
  const kind = resolveDetailEditRadioPrefillKind(program)
  if (kind === 'none') return { participant: false, instructor: false, volunteer: false }
  if (kind === 'companySchool') return { participant: false, instructor: true, volunteer: false }
  const types = getGeneralParticipantTypes(program)
  return {
    participant: isGeneralIndividualProgram(program) ? 'individual' : 'institution',
    instructor: types.includes('teacher_instructor'),
    volunteer: types.includes('volunteer'),
  }
}

export type DetailEditRecruitRadioValues = {
  participantRecruitmentAnnouncementPublished?: 'published' | 'unpublished'
  participantRecruitmentPreEducationRequired?: 'required' | 'not_required'
  participantRecruitmentInterviewEnabled?: 'yes' | 'no'
  instructorRecruitmentAnnouncementPublished?: 'published' | 'unpublished'
  volunteerRecruitmentAnnouncementPublished?: 'published' | 'unpublished'
  volunteerRecruitmentInterviewEnabled?: 'yes' | 'no'
}

/**
 * 이미 등록된 프로그램에서 서버 값이 비었을 때의 해석(상세 보기와 같은 뜻).
 * QA-0121 이전 등록 화면은 「게시」·「면접 있음」을 기본으로 그려 저장했으므로, 빈 값을 등록 기본값(미게시·미선택)으로
 * 바꿔 채우면 수정 저장 한 번에 공개 중인 공고가 내려간다. 그래서 등록 기본값(`recruit-radio-defaults`)과 따로 둔다.
 */
export const DETAIL_EDIT_LEGACY_ANNOUNCEMENT_PUBLISHED = 'published' as const
export const DETAIL_EDIT_LEGACY_INTERVIEW_ENABLED = 'yes' as const

/** 수정 폼 라디오 필드 → 서버 값이 비었을 때 채우는 값 */
export const DETAIL_EDIT_RECRUIT_RADIO_DEFAULTS = {
  participantRecruitmentAnnouncementPublished: DETAIL_EDIT_LEGACY_ANNOUNCEMENT_PUBLISHED,
  participantRecruitmentPreEducationRequired: DETAIL_EDIT_PRE_EDUCATION_REQUIRED_DEFAULT,
  participantRecruitmentInterviewEnabled: DETAIL_EDIT_LEGACY_INTERVIEW_ENABLED,
  instructorRecruitmentAnnouncementPublished: DETAIL_EDIT_LEGACY_ANNOUNCEMENT_PUBLISHED,
  volunteerRecruitmentAnnouncementPublished: DETAIL_EDIT_LEGACY_ANNOUNCEMENT_PUBLISHED,
  volunteerRecruitmentInterviewEnabled: DETAIL_EDIT_LEGACY_INTERVIEW_ENABLED,
} as const satisfies Required<DetailEditRecruitRadioValues>

/** 보이는 탭의 라디오 필드 목록 */
export function listDetailEditRecruitRadioFields(
  program: Program
): (keyof DetailEditRecruitRadioValues)[] {
  const tabs = resolveDetailEditRecruitRadioTabs(program)
  const fields: (keyof DetailEditRecruitRadioValues)[] = []
  if (tabs.participant) {
    fields.push('participantRecruitmentAnnouncementPublished')
    fields.push(
      tabs.participant === 'individual'
        ? 'participantRecruitmentInterviewEnabled'
        : 'participantRecruitmentPreEducationRequired'
    )
  }
  if (tabs.instructor) fields.push('instructorRecruitmentAnnouncementPublished')
  if (tabs.volunteer) {
    fields.push('volunteerRecruitmentAnnouncementPublished', 'volunteerRecruitmentInterviewEnabled')
  }
  return fields
}

/**
 * 상세 수정 폼 초기값 — 보이는 탭의 라디오가 비어 있으면(undefined/null) 기본값을 넣는다. 서버 값은 유지.
 * 바뀐 것이 없으면 같은 객체를 돌려준다.
 */
export function prefillDetailEditRecruitRadioDefaults<T extends DetailEditRecruitRadioValues>(
  program: Program,
  values: T
): T {
  let next = values
  for (const field of listDetailEditRecruitRadioFields(program)) {
    if (values[field] != null) continue
    let value: string = DETAIL_EDIT_RECRUIT_RADIO_DEFAULTS[field]
    if (field === 'volunteerRecruitmentInterviewEnabled') {
      // 스칼라가 비어도 중첩 모집 정보에 값이 있으면 그 값(상세 보기와 같은 출처)을 쓴다.
      const nested = program.generalCommonInfo?.volunteerRecruitmentInfo as
        | { volunteerInterviewEnabled?: boolean; generalVolunteerInterviewEnabled?: boolean }
        | undefined
      const stored = nested?.volunteerInterviewEnabled ?? nested?.generalVolunteerInterviewEnabled
      if (stored === false) value = 'no'
    }
    if (next === values) next = { ...values }
    ;(next as Record<string, unknown>)[field] = value
  }
  return next
}
