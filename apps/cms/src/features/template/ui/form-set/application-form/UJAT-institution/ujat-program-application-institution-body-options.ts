/** UJAT 프로그램 학교 신청 폼 — `학년 별 신청 정보` 단락 본문·카드 헤더 액션 연동 */
export type UjatProgramApplicationGradeInfoParagraphOptions = {
  /** 블록마다 안정적인 React key 및 삭제 시 올바른 state 유지용 */
  applicationGradeBlockIds: readonly string[]
  applicationGradeByBlockId: Readonly<Record<string, string | undefined>>
  onApplicationGradeByBlockChange: (blockId: string, grade: string | undefined) => void
  onAddApplicationGrade: () => void
  /** 인덱스 1 이상만 제거 가능(첫 블록은 삭제 없음) */
  onRemoveApplicationGradeAtIndex: (index: number) => void
}

/** UJAT 프로그램 학교 신청 폼 — `학년 별 수업 시간` 단락 본문·카드 헤더 액션 연동 */
export type UjatProgramApplicationGradeClassTimeParagraphOptions = {
  classTimeBlockIds: readonly string[]
  onAddClassTimeBlock: () => void
  onRemoveClassTimeBlockAtIndex: (index: number) => void
  /** 신청 정보 단락에서 고른 학년(`1`…`6`)의 정렬·중복 제거 목록. 비면 안내 문구만 노출 */
  applicationGradeValuesForClassTime: readonly string[]
}
