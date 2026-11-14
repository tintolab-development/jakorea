import type { VolunteerInstitutionGuideField } from '../model/types'

/**
 * 기관 이용안내 표 — Figma 14019:99060 (4행). form-schema `INSTITUTION_GUIDANCE_FIELDS`와 같은 4항목.
 * 성범죄 경력 조회서 요청은 기관 신청서의 별도 단락이라 봉사자 표에 넣지 않는다.
 */
export const VOLUNTEER_INSTITUTION_GUIDE_FIELDS: readonly VolunteerInstitutionGuideField[] = [
  { key: 'computerInRoom', label: '강의 공간 내 컴퓨터 여부' },
  { key: 'waitingPlace', label: '대기 장소 안내' },
  { key: 'meal', label: '식사 가능 여부 및 안내' },
  { key: 'otherNotes', label: '기타 특이사항 (주차, 전달사항 등)' },
]
