/**
 * 강의보고서 서버 상태 → 화면 표기(강의 진행 여부·제출 현황·보고서 보기) 단일 해석.
 * 프로그램 상세 `GET /api/admin/programs/{programId}/lecture-reports`와
 * 회원 상세 `GET /api/admin/users/{memberId}/applications/{applicationId}/lecture-reports`가 같이 쓴다.
 *
 * 서버 값 (백엔드 코드 확인 2026-11-09):
 * - reportStatus
 *   - 보고서 행 원값: SUBMITTED(제출 시 생성) · APPROVED · COMPLETED · DRAFT · EXCEPTION_ACCEPTED.
 *     DB 제약 `ck_program_lecture_report_status`상 NOT_SUBMITTED는 보고서 행에 저장될 수 없다.
 *   - EXCEPTION_ACCEPTED(관리자 예외 승인): 백엔드 전이 정책상 DRAFT·NULL 행에서만 가능하고 SUBMITTED에서는 막힌다.
 *     제출 본문이 없을 수 있어 보고서 보기 대상으로 두지 않는다.
 *   - 회원 API 합성값: GAVE_UP(활동 포기·배정 취소, 최우선) · UPCOMING(강의 시작 전 미제출) ·
 *     NOT_SUBMITTED(강의 시작 후이거나 일정이 없는 미제출).
 * - lectureProgressStatus: UPCOMING · COMPLETED (일정 종료 시각 기준 서버 산출 — reportStatus의 UPCOMING과 기준 시각이 다르다).
 *
 * 문자열 포함 검사나 제출일 유무로 제출을 추정하지 않는다
 * (R01: `'NOT_SUBMITTED'.includes('SUBMIT')`가 제출 완료로 읽히던 문제). 정의되지 않은 값은 '-'.
 */

export type LectureReportProgressLabel = '진행 완료' | '진행 예정' | '-'

export type LectureReportSubmissionLabel =
  | '제출 완료'
  | '예외 승인'
  | '미제출'
  | '진행 예정'
  | '활동 포기'
  | '-'

export interface LectureReportSubmissionStatus {
  label: LectureReportSubmissionLabel
  /** 제출된 보고서가 있는 상태 — 보고서 보기 대상 */
  hasSubmittedReport: boolean
}

function normalizeStatus(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? ''
}

export function resolveLectureReportProgressLabel(
  lectureProgressStatus: string | null | undefined
): LectureReportProgressLabel {
  switch (normalizeStatus(lectureProgressStatus)) {
    case 'COMPLETED':
      return '진행 완료'
    case 'UPCOMING':
      return '진행 예정'
    default:
      return '-'
  }
}

export function resolveLectureReportSubmissionStatus(
  reportStatus: string | null | undefined
): LectureReportSubmissionStatus {
  switch (normalizeStatus(reportStatus)) {
    case 'SUBMITTED':
    case 'APPROVED':
    case 'COMPLETED':
      return { label: '제출 완료', hasSubmittedReport: true }
    case 'EXCEPTION_ACCEPTED':
      return { label: '예외 승인', hasSubmittedReport: false }
    case 'NOT_SUBMITTED':
    case 'DRAFT':
      return { label: '미제출', hasSubmittedReport: false }
    case 'UPCOMING':
      return { label: '진행 예정', hasSubmittedReport: false }
    case 'GAVE_UP':
      return { label: '활동 포기', hasSubmittedReport: false }
    default:
      return { label: '-', hasSubmittedReport: false }
  }
}
