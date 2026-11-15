import type { EducationTeacherApplicationGuidance } from '../../model/types'

/**
 * 안내사항 조회 라벨 — 마이페이지 신청 내용·신청 정보 팝업 시안 표기.
 * 작성 양식 문구(form-schema `INSTITUTION_GUIDANCE_FIELDS` /
 * `INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_SECTION`)는 그대로 두고 조회 화면 라벨만 시안에 맞춘다.
 */
export const TEACHER_GUIDANCE_FIELDS: readonly {
  key: keyof Omit<EducationTeacherApplicationGuidance, 'sexOffenseConsentMethod'>
  label: string
}[] = [
  { key: 'computerInRoom', label: '강의 공간 내 컴퓨터 여부' },
  { key: 'waitingPlace', label: '대기 장소 안내' },
  { key: 'meal', label: '식사 가능 여부 및 안내' },
  { key: 'otherNotes', label: '기타 특이사항' },
]

export const TEACHER_SEX_OFFENSE_CONSENT_METHOD_LABEL = '성범죄경력 조회 방식'

export const TEACHER_GUIDANCE_ANSWER_PLACEHOLDER = '답변을 입력해 주세요'
export const TEACHER_GUIDANCE_ANSWER_MAX_LENGTH = 1000
