/** 일정 진행 태그 — 교육일 지나면 예정→완료 */
export type EducationScheduleProgressStatus = 'completed' | 'scheduled'

/** 출석 현황 — 미진행(예정) 건은 null */
export type EducationScheduleAttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused'

/**
 * 과제 제출·피드백 상태 (안내 문구·버튼 분기 SSOT)
 * - not_submitted: 미제출
 * - submitted: 제출 완료 (마감 전 수정 가능)
 * - feedback: 담당자 피드백 있음 → 수정 제출
 * - revision_submitted: 피드백 후 수정 제출 완료
 */
export type EducationAssignmentSubmitStatus =
  | 'not_submitted'
  | 'submitted'
  | 'feedback'
  | 'revision_submitted'

/** form_response.response_status — 미제출이면 null/생략 */
export type EducationAssignmentResponseStatus =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'

/** 커리큘럼형 단일 회차 — 그날 진행하는 전 차시 */
export type EducationCurriculumSession = {
  sessionNo: number
  sessionLabel?: string | null
  title?: string | null
  content?: string | null
}

export type EducationScheduleAssignmentSubmissionKind = 'file' | 'url'

export type EducationScheduleAssignmentFile =
  | {
      id: string
      /** 제출 형식 — 칩 스타일 분기 */
      kind: 'file'
      fileName: string
      /** FILE 제출물 fileObjectId — 있어야 수정 제출 시 개별 삭제 가능 */
      fileObjectId?: number
    }
  | {
      id: string
      /** 제출 형식 — 칩 스타일 분기 */
      kind: 'url'
      /** URL 제출물 — 파일명 필드와 분리한다. */
      url: string
    }

export type EducationScheduleAssignment = {
  /** 과제 제출 시작일 (ISO). 이 시각 이전·진행 예정이면 과제 영역 비노출 */
  submitStartAt: string
  /** 제출 마감 (ISO) */
  submitEndAt: string
  /** 화면용 기한 라벨 (예: 2026년 04월 03일(금) 15:00 ~ 2026년 04월 10일(금) 18:00) */
  periodLabel: string
  status: EducationAssignmentSubmitStatus
  /** 서버 최초 제출 가능 여부. 없으면 상태·기한 안내 규칙으로 판단 */
  canSubmit?: boolean
  /** 서버 수정 제출 가능 여부. 없으면 상태·기한 안내 규칙으로 판단 */
  canResubmit?: boolean
  /**
   * form_response.response_status (BE B1 optional).
   * FEEDBACK + APPROVED 이면 수정 제출 CTA를 숨긴다.
   */
  responseStatus?: EducationAssignmentResponseStatus | null
  files?: EducationScheduleAssignmentFile[]
  /** Wave11 portal GET feedback — 있을 때만 원격 조회 */
  formResponseId?: number
}

export type EducationScheduleItem = {
  id: string
  /** 운영 일정 행 id. API가 `null`이면 일정 미등록(출석·결석 UI 비활성) */
  scheduleId?: number | null
  /** 회차 번호(1-based) — 활동 포기 시 `lastParticipatedSession` 필터 */
  sessionNumber: number
  /** 교육 진행일 (ISO date or datetime). 없으면 빈 문자열 — 날짜 폴백은 Row */
  heldAt: string
  /** 교육 종료 시각 (ISO). 있으면 행 뱃지 완료 판정에 사용 */
  endAt?: string
  /** 공통정보 차시/단원명/일정명. 없으면 '-' (정산·UJAT 등 공용) */
  title: string
  /** 교육일정 카드 라벨 — 커리큘럼형 회차명, 일정형 일정명. 없으면 '-' */
  rowLabel?: string
  attendanceStatus: EducationScheduleAttendanceStatus | null
  /** 사유 불참 시 사유. NOT_REQUIRED 이면 매핑하지 않는다. */
  absenceReason?: string
  /** Portal `absenceReasonStatus` — NOT_REQUIRED | NOT_SUBMITTED | SUBMITTED */
  absenceReasonStatus?: string
  /** 커리큘럼 차시/회차 라벨 (`1차시` / `1회차`) */
  sessionLabel?: string
  /** 일정형 블록 라벨 (`세부 일정 01` / `행사 일정 01`) */
  scheduleLabel?: string
  /** 교육내용 */
  content?: string
  /**
   * 커리큘럼형 단일 회차 — 그날 전 차시.
   * 없거나 [] 이면 sessionLabel/content fallback.
   */
  curriculumSessions?: EducationCurriculumSession[] | null
  /** 진행 시간 표시. 없으면 Row가 heldAt 포맷 */
  progressTimeLabel?: string
  assignment?: EducationScheduleAssignment
  /** Portal `availableActions` — VIEW_ATTENDANCE / CHECK_IN 등. 없으면 액션 없음 */
  availableActions?: readonly string[]
  /** 봉사자 배정 상태. 프로그램 전체 일정과 본인 배정을 구분한다. */
  assignmentStatus?: string | null
  /** 일정 운영 상태. CANCELLED 등은 본인 현재 활동으로 표시하지 않는다. */
  scheduleStatus?: string | null
  classLabel?: string
  locationName?: string
  /** 팀 프로그램 회차 정보 — teamRole 이 있을 때만 카드에 역할·팀명 노출 */
  team?: EducationScheduleTeamInfo
}

export type EducationScheduleTeamInfo = {
  /** 팀장 / 팀원 / 개인 (알 수 없는 코드는 원문) */
  roleLabel: string
  /** 팀명. INDIVIDUAL·라벨 없음이면 생략하고 카드에 팀명 칸을 그리지 않는다. '-' 로 채우지 않는다. */
  teamName?: string
}

export const EDUCATION_SCHEDULE_PAGE_SIZE = 7
