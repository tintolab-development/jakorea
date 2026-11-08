/**
 * client 다운로드 감사 로그(`POST /api/admin/logs/file-access/client`)에 함께 보내는 파일 종류·포함 개인정보.
 *
 * - 코드·라벨 목록 정본: apps/cms/docs/api/client-download-kind-catalog.md
 * - 서버 필드 규칙: downloadKind `^[A-Z][A-Z0-9_]*$` 80자 이하, containedPiiTypes 최대 3개(허용 값 외 400 VALIDATION_FAILED)
 * - 백엔드 배포 전에는 보내지 않는다. `VITE_FILE_ACCESS_CLIENT_LOG_META_ENABLED=true` 일 때만 body에 싣는다.
 */

export const FILE_ACCESS_CLIENT_LOG_META_ENV = 'VITE_FILE_ACCESS_CLIENT_LOG_META_ENABLED' as const

export function isFileAccessClientLogMetaEnabled(): boolean {
  return (
    String(import.meta.env.VITE_FILE_ACCESS_CLIENT_LOG_META_ENABLED).trim().toLowerCase() === 'true'
  )
}

/** 서버 허용 값과 같은 순서 */
export const DOWNLOAD_LOG_PII_TYPES = [
  'NAME',
  'RESIDENT_REGISTRATION_NUMBER',
  'ACCOUNT_NUMBER',
] as const

export type DownloadLogPiiType = (typeof DOWNLOAD_LOG_PII_TYPES)[number]

/** 브라우저에서 만드는 파일의 downloadKind 와 이력 화면 라벨 */
export const CLIENT_DOWNLOAD_KIND_LABEL = {
  // 프로그램 (일반·UJAT·제미나이 공통)
  PROGRAM_LIST_EXPORT: '프로그램 목록',
  PROGRAM_MANAGER_LIST_EXPORT: '프로그램 담당자 목록',
  PROGRAM_INSTITUTION_APPLICATION_EXPORT: '기관 신청 목록',
  PROGRAM_INSTITUTION_SCHEDULE_CONFIRM_EXPORT: '기관 일정 확인 목록',
  PROGRAM_INSTRUCTOR_APPLICATION_EXPORT: '강사 신청 목록',
  PROGRAM_INDIVIDUAL_APPLICATION_EXPORT: '개인 신청 목록',
  PROGRAM_VOLUNTEER_APPLICATION_EXPORT: '봉사자 신청 목록',
  PROGRAM_SCREENING_DOC_PASSED_EXPORT: '1차 서류 합격자 목록',
  PROGRAM_SCREENING_INTERVIEW_EXPORT: '2차 면접 대상자 목록',
  PROGRAM_PARTICIPATING_INSTITUTION_LIST_EXPORT: '참여 기관 목록',
  PROGRAM_PARTICIPATING_INSTRUCTOR_LIST_EXPORT: '참여 강사 목록',
  PROGRAM_PARTICIPANT_LIST_EXPORT: '참여자 목록',
  PROGRAM_VOLUNTEER_LIST_EXPORT: '참여 봉사자 목록',
  PROGRAM_STUDENT_LIST_EXPORT: '참여 학생 목록',
  PROGRAM_ATTENDANCE_EXPORT: '출석 관리',
  PROGRAM_ASSIGNMENT_EXPORT: '과제 관리',
  PROGRAM_PERSON_ASSIGNMENT_EXPORT: '개인별 배정 현황',
  PROGRAM_SCHOOL_INSTRUCTOR_ASSIGNMENT_EXPORT: '학교별 강사 배정 목록',
  PROGRAM_INSTITUTION_ASSIGNMENT_EXPORT: '기관별 교육 배정·진행 현황',
  PROGRAM_REGION_ASSIGNMENT_EXPORT: '지역 배정표',
  PROGRAM_SCHEDULE_SHEET_EXPORT: '임시 교육 일정표',
  PROGRAM_PROGRESS_SUMMARY_EXPORT: '교육 진행 요약',
  PROGRAM_LECTURE_REPORT_EXPORT: '강의보고서 제출 현황',
  PROGRAM_SETTLEMENT_EXPORT: '프로그램 정산 내역',
  PROGRAM_SURVEY_RESULT_EXPORT: '설문 결과',
  PROGRAM_EDUCATION_JOURNAL_EXPORT: '교육일지 목록',
  VOLUNTEER_1365_HOURS_EXPORT: '1365 봉사시간 등록 양식',
  GEMINI_APPROVED_TRAINING_LIST_EXPORT: '제미나이 승인 연수 목록',
  GEMINI_TRAINING_PERFORMANCE_EXPORT: '제미나이 연수 실적 목록',
  GEMINI_RECRUITMENT_LIST_EXPORT: '제미나이 모집 공고 목록',
  // 회원·강사
  MEMBER_LIST_EXPORT: '회원 목록',
  MEMBER_PERMISSION_REQUEST_EXPORT: '권한 신청 목록',
  MEMBER_PROGRAM_HISTORY_EXPORT: '회원 프로그램 이력',
  INSTRUCTOR_LIST_EXPORT: '강사 목록',
  INSTRUCTOR_SETTLEMENT_EXPORT: '강사 정산 현황',
  // 정산
  ACCOUNT_PAYMENT_LIST_EXPORT: '계좌 지급 목록',
  PAYMENT_ORDER_LIST_EXPORT: '정산 목록',
  PAYMENT_ORDER_DETAIL_EXPORT: '정산 상세 목록',
  /** 서버 정산 양식과 같은 코드 (대량이체·세금신고 브라우저 생성) */
  SETTLEMENT_EXPORT: '정산 양식(대량이체/세금신고)',
  // 데이터 관리·게시판·로그·양식
  SPONSOR_LIST_EXPORT: '후원사 목록',
  SPONSOR_CONTACT_LIST_EXPORT: '후원사 담당자 목록',
  SPONSOR_PROGRAM_HISTORY_EXPORT: '후원사 프로그램 이력',
  SPONSOR_DONATION_EXPORT: '연도별 후원금',
  DETAILED_PROGRAM_LIST_EXPORT: '세부 프로그램 목록',
  TEXTBOOK_LIST_EXPORT: '교재 목록',
  EDUCATION_REGION_LIST_EXPORT: '교육 지역 목록',
  NOTICE_LIST_EXPORT: '공지사항 목록',
  FAQ_LIST_EXPORT: 'FAQ 목록',
  INQUIRY_LIST_EXPORT: '문의 목록',
  FILE_DOWNLOAD_LOG_EXPORT: '파일 다운로드 이력',
  STUDENT_LIST_TEMPLATE_EXPORT: '참여학생명단 샘플 양식',
} as const

export type ClientDownloadKind = keyof typeof CLIENT_DOWNLOAD_KIND_LABEL

export type DownloadAccessLogMeta = {
  downloadKind?: ClientDownloadKind
  /** 엑셀 컬럼 내용 기준. 빈 배열이면 개인정보 없음 */
  containedPiiTypes?: readonly DownloadLogPiiType[]
}

/** 화면 상태(모드·선택)에 따라 값이 바뀌면 함수로 넘긴다. 다운로드 시점에 한 번 계산한다. */
export type DownloadAccessLogMetaInput = DownloadAccessLogMeta | (() => DownloadAccessLogMeta)

export function resolveDownloadAccessLogMeta(
  input: DownloadAccessLogMetaInput | undefined
): DownloadAccessLogMeta | undefined {
  return typeof input === 'function' ? input() : input
}

export type FileAccessLogMetaBody = {
  downloadKind?: string
  containedPiiTypes?: DownloadLogPiiType[]
}

const MAX_CONTAINED_PII_TYPES = 3

/**
 * client 로그 body에 붙일 필드. 플래그가 꺼져 있거나 값이 없으면 빈 객체(기존 body 그대로).
 * PII는 서버 허용 순서로 중복 없이 최대 3개.
 */
export function buildFileAccessLogMetaBody(
  meta: DownloadAccessLogMeta | undefined
): FileAccessLogMetaBody {
  if (!meta || !isFileAccessClientLogMetaEnabled()) return {}
  const body: FileAccessLogMetaBody = {}
  if (meta.downloadKind) body.downloadKind = meta.downloadKind
  const pii = DOWNLOAD_LOG_PII_TYPES.filter(type => meta.containedPiiTypes?.includes(type)).slice(
    0,
    MAX_CONTAINED_PII_TYPES
  )
  if (pii.length > 0) body.containedPiiTypes = pii
  return body
}
