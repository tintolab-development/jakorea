/** 프로그램 참여자 신청 폼 (학교·기관) — 안내 사항 단락 필드 정의 */

export const INSTITUTION_GUIDANCE_SECTION_DESCRIPTION =
  '강사님들에게 제공 또는 요청할 사전 정보를 작성해 주세요.'

export const INSTITUTION_GUIDANCE_ANSWER_PLACEHOLDER = '답변을 입력해 주세요'

export type InstitutionGuidanceFieldId =
  | 'computer-in-room'
  | 'waiting-place'
  | 'meal'
  | 'other-notes'

export type InstitutionGuidanceFieldDefinition = {
  id: InstitutionGuidanceFieldId
  title: string
  description: string
}

export const INSTITUTION_GUIDANCE_FIELDS: readonly InstitutionGuidanceFieldDefinition[] = [
  {
    id: 'computer-in-room',
    title: '강의 공간 내 컴퓨터 여부',
    description:
      '강의 공간 내 사용 가능한 컴퓨터가 있다면 몇대 있는지, USB 사용 가능 여부 등의 안내사항을 작성해 주세요.',
  },
  {
    id: 'waiting-place',
    title: '대기 장소 안내',
    description:
      '강사님들이 대기할 수 있는 장소를 상세히 작성해 주세요. (ex. 본관 2층 3학년 연구실)',
  },
  {
    id: 'meal',
    title: '식사 가능 여부 및 안내',
    description:
      '강사님들의 식사 방법과 관련하여 안내사항을 작성해 주세요. (ex. 식사 불가, 인당 4500원 지불 후 급식실에서 식사 가능 등)',
  },
  {
    id: 'other-notes',
    title: '기타 특이사항(주차, 전달사항 등)',
    description: '주차 안내나 기타 전달사항이 있다면 작성해 주세요.',
  },
] as const
