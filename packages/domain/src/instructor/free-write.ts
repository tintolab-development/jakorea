export const INSTRUCTOR_FREE_WRITE_ITEMS = [
  {
    name: 'freeWrite1' as const,
    label: '1. 자기소개 및 지원동기',
  },
  {
    name: 'freeWrite2' as const,
    label: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.',
  },
  {
    name: 'freeWrite3' as const,
    label:
      '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.',
  },
  {
    name: 'freeWrite4' as const,
    label:
      '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.',
  },
] as const

export type InstructorFreeWriteFieldName = (typeof INSTRUCTOR_FREE_WRITE_ITEMS)[number]['name']
