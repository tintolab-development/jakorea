/**
 * 참여하기 목록 카드 — 모집 유형 배지 문구 (QA-0518).
 * 같은 프로그램에 강사·봉사자 모집을 추가하면 목록에 카드가 따로 생기므로,
 * 참여자 모집도 배지로 보여 줘 세 카드를 구분한다. 참여자 모집 배지는 「수강자」(마이페이지 교육 목록과 같은 용어).
 */
export function programListRecruitmentRoleLabel(recruitmentType: string | undefined): string {
  switch ((recruitmentType ?? '').trim().toUpperCase()) {
    case 'INSTRUCTOR':
      return '강사'
    case 'VOLUNTEER':
      return '봉사자'
    case 'ORGANIZATION':
      return '기관'
    default:
      return '수강자'
  }
}
