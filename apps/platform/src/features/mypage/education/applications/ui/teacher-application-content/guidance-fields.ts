import type { EducationTeacherApplicationGuidance } from '../../model/types'

/**
 * 안내사항 라벨·설명 — form-schema `INSTITUTION_GUIDANCE_FIELDS` /
 * `INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION` SSOT와 동일 문구
 */
export const TEACHER_GUIDANCE_FIELDS: readonly {
  key: keyof Pick<
    EducationTeacherApplicationGuidance,
    'computerInRoom' | 'waitingPlace' | 'meal' | 'otherNotes'
  >
  label: string
  description: string
}[] = [
  {
    key: 'computerInRoom',
    label: '강의 공간 내 컴퓨터 여부',
    description:
      '강의 공간 내 사용 가능한 컴퓨터가 있다면 몇대 있는지, USB 사용 가능 여부 등의 안내사항을 작성해 주세요.',
  },
  {
    key: 'waitingPlace',
    label: '대기 장소 안내',
    description:
      '강사님들이 대기할 수 있는 장소를 상세히 작성해 주세요. (ex. 본관 2층 3학년 연구실)',
  },
  {
    key: 'meal',
    label: '식사 가능 여부 및 안내',
    description:
      '강사님들의 식사 방법과 관련하여 안내사항을 작성해 주세요. (ex. 식사 불가, 인당 4500원 지불 후 급식실에서 식사 가능 등)',
  },
  {
    key: 'otherNotes',
    label: '기타 특이사항(주차, 전달사항 등)',
    description: '주차 안내나 기타 전달사항이 있다면 작성해 주세요.',
  },
]

export const TEACHER_SEX_OFFENSE_CONSENT_INQUIRY_SECTION = {
  title: '성범죄 경력 조회 동의서 조회 방식',
  description:
    '성범죄 경력 조회 동의서의 조회 방식을 선택해 주세요. 범죄경력회보서의 온라인 제출을 희망하는 경우, 기관 ID와 검증번호를 함께 전달해 주세요.\nJA 시스템 내에서 확인 선택 시, 프로그램 및 배정 정보와 함께 JA 홈페이지 상세에서 동의서 확인이 가능합니다. (조회 동의서만 제공하며, 실제 조회는 별도로 진행해 주셔야 합니다.)',
} as const

export const TEACHER_SEX_OFFENSE_CONSENT_METHOD_LABEL =
  TEACHER_SEX_OFFENSE_CONSENT_INQUIRY_SECTION.title

export const TEACHER_SEX_OFFENSE_INQUIRY_METHOD_OPTIONS = [
  { value: 'ja_system' as const, label: 'JA 시스템 내에서 동의서 확인' },
  { value: 'criminal_record_site' as const, label: '범죄경력회보서 사이트 이용' },
]

export const TEACHER_SEX_OFFENSE_SITE_SUBMISSION_OPTIONS = [
  { value: 'direct' as const, label: '직접 제출' },
  { value: 'online' as const, label: '온라인 제출' },
]

export const TEACHER_GUIDANCE_ANSWER_PLACEHOLDER = '답변을 입력해 주세요'
export const TEACHER_GUIDANCE_ANSWER_MAX_LENGTH = 1000
export const TEACHER_GUIDANCE_THANKS_MESSAGE = '작성해 주셔서 감사합니다.'
