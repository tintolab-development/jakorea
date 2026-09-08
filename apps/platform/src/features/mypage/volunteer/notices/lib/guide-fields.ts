import type { VolunteerInstitutionGuideField } from '../model/types'

/** 기관 신청 안내 사항 라벨 — CMS/form-schema `INSTITUTION_GUIDANCE_FIELDS` + 성범죄 조회 요청 */
export const VOLUNTEER_INSTITUTION_GUIDE_FIELDS: readonly VolunteerInstitutionGuideField[] = [
  { key: 'computerInRoom', label: '강의 공간 내 컴퓨터 여부' },
  { key: 'waitingPlace', label: '대기 장소 안내' },
  { key: 'meal', label: '식사 가능 여부 및 안내' },
  { key: 'otherNotes', label: '기타 특이사항(주차, 전달사항 등)' },
  { key: 'criminalCheckRequest', label: '성범죄 경력 조회서 요청' },
]
