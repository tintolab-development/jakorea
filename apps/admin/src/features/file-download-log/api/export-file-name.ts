/**
 * 서버가 기록한 엑셀 다운로드 이력의 영문 파일명을 화면 표시용 한글 규칙명으로 바꾼다.
 * - 규칙: `[JA Korea] 홈페이지 어드민_{파일 이름}_YYMMDD.xlsx` (YYMMDD = 파일명에 포함된 내려받은 날짜)
 * - 표시 전용이다. 서버에 저장된 값은 바꾸지 않으므로 파일명 검색은 서버 값(영문) 기준으로 동작한다.
 * - 목록에 없는 이름은 원본 그대로 둔다. 새 서버 이름이 확인되면 아래 표에 추가한다.
 */
/** 로컬 BE 응답 Content-Disposition 으로 확인한 엑셀 내보내기 이름(2026-11-10 기준) */
const SERVER_EXPORT_LABELS: Record<string, string> = {
  member_login_log: '회원 로그인 이력',
  admin_account_action_log: '관리자 계정 처리 이력',
  file_download_log: '파일 다운로드 이력',
  privacy_access_log: '개인정보 조회 이력',
  system_issue_log: '버그,이슈 이력',
  career_talent_applications: '인재채용 신청 목록',
  talent_applications: '재능기부 신청 목록',
  corporate_consultations: '기업 후원 상담 신청 목록',
}

const SERVER_EXPORT_NAME = /^([a-z][a-z0-9_]*?)_(\d{2})(\d{2})(\d{2})(\d{2})_(\d{6})(\.[A-Za-z0-9]+)$/

export function localizeServerExportFileName(fileName: string): string {
  const match = SERVER_EXPORT_NAME.exec(fileName.trim())
  if (!match) return fileName
  const [, base, , yy, mm, dd, , ext] = match
  const label = SERVER_EXPORT_LABELS[base]
  if (!label) return fileName
  return `[JA Korea] 홈페이지 어드민_${label}_${yy}${mm}${dd}${ext}`
}
