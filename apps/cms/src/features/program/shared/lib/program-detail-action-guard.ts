import {
  canRevealProgramGeneralPii,
  isUnknownAssignmentRole,
  PROGRAM_CAPABILITY,
  type ProgramMyAssignment,
} from '@/features/program/shared/lib/program-my-assignment'
import {
  canAdminAction,
  isReadOnlyAdminRoleCode,
  type AdminRoleCode,
} from '@/shared/lib/admin-role-policy'

/**
 * 권한 설정 V1.2 — Program Viewer(프로그램 상세)는 기본 화면 조회만 가능하다.
 * 수정·승인·배정·발송·파일 다운로드·개인정보 열람 버튼은 숨기지 않고 노출하며, 클릭하면 접근 불가 안내를 띄운다.
 *
 * 버튼마다 권한 분기를 넣지 않고 프로그램 상세 모달 루트에서 클릭을 가로챈다.
 * 판정 순서: `data-program-action` 속성 → 버튼 라벨(aria-label → 텍스트).
 */
export type ProgramDetailActionKind = 'write' | 'download' | 'pii'

export interface ProgramDetailActionPermissions {
  write: boolean
  download: boolean
  pii: boolean
}

/** 라벨로 판정되지 않는 버튼은 `write|download|pii`로 지정하고, 조회 버튼이 걸리면 `allow`로 뺀다. */
export const PROGRAM_DETAIL_ACTION_ATTRIBUTE = 'data-program-action'

const ACTION_KINDS = new Set<string>(['write', 'download', 'pii'])

/** 수정·등록·삭제·승인·반려·배정·정정·발송 등 쓰기 버튼 라벨(정확히 일치). */
const WRITE_LABELS = new Set<string>([
  // 정보 수정·저장
  '정보 수정',
  '수정',
  '저장',
  '양식 수정',
  '교재 설정 저장',
  '진행 그룹 구분 추가',
  '기본 항목 추가',
  // 등록·추가·삭제
  '등록',
  '신규 등록',
  '추가',
  '추가 등록',
  '삭제',
  '설문 삭제',
  '만족도조사 삭제',
  '담당자 등록',
  '담당자 삭제',
  '강사 등록',
  '참여 강사 등록',
  '강사 삭제',
  '학교 삭제',
  '봉사자 등록',
  '임직원 자원봉사자 등록',
  '학생 추가',
  '학급 추가',
  '데이터 추가',
  '덮어쓰기',
  '게시글 등록',
  '코멘트 작성',
  '피드백 작성',
  '동의서 작성',
  '동의서 수정',
  '모집 공고 등록',
  '연수 보고서 등록',
  '프로그램 삭제',
  // 승인·반려·합격
  '승인',
  '반려',
  '승인 취소',
  '반려 취소',
  '합격',
  '불합격',
  '합격 취소',
  '불합격 취소',
  '서류 승인',
  '서류 반려',
  '신청 반려',
  '임시 반려',
  '임시 반려 취소',
  '면접 평가',
  '면접 합격',
  '면접 불합격',
  '등급 평가',
  '확인 처리',
  '수정 요청',
  '보정 요청',
  // 배정·일정·출결
  '배정',
  '재배정',
  '추가 배정',
  '배정 취소',
  '강사 배정',
  '강의 배정',
  '기관 배정',
  '임시 배정',
  '임시 배정 취소',
  '임시 배정 저장',
  '임시 교육 일정표 확인',
  '면접일 배정',
  '면접일 재배정',
  '교육일 자동 배정',
  '교육일 직접 배정',
  '파트너 및 교육 배정',
  '출결 담당자 설정',
  '참여 불가일 설정',
  '변경',
  '팀 변경',
  '일정 변경',
  '교육 학년 및 학급 변경',
  '희망 일정 변경',
  '희망 일정 확정',
  '확정',
  '정정',
  '출결 정정',
  '합반 처리',
  '활동 포기',
  // 발송·발급
  '알림 발송',
  '알림 재발송',
  '수료증/참가인증서 발급',
  '활동인증서 발급',
])

/** `선택 승인`·`선택 반려`·`선택 배정` 등 선택 행 일괄 처리 버튼. */
const WRITE_LABEL_PREFIX = '선택 '

/** `만족도조사 등록`·`설문조사 공유`·`강의평가 제출하기`·`강사 변경` 등 대상 + 동작 라벨. */
const WRITE_LABEL_SUFFIXES = [
  ' 등록',
  ' 삭제',
  ' 추가',
  ' 공유',
  ' 수정',
  ' 수정하기',
  ' 제출하기',
  ' 발급',
  ' 배정',
  ' 재배정',
  ' 변경',
  ' 정정',
  ' 저장',
  // 메일·문자·알림톡 발송, 테스트 발송, ~ 알림 재발송 (즉시/예약 발송은 라디오라 버튼 판정 대상 아님)
  ' 발송',
  ' 재발송',
] as const

const DOWNLOAD_LABELS = new Set<string>(['1365 봉사시간 등록 양식'])
const DOWNLOAD_LABEL_SUFFIX = '다운로드'

/** 개인정보 열람 — 「동의서 보기」는 「약관 및 동의서 확인」 권한(PII_CONSENT_DOCUMENT) */
const PII_LABELS = new Set<string>(['개인정보 상세보기', '동의서 보기'])

const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"], [role="menuitem"]'

/**
 * 화면 이동(LNB 메뉴·텍스트 탭)은 조회라서 막지 않는다. 「신청 기관 임시 배정」처럼 라벨이 동작어로 끝나는 메뉴가 있다.
 * LNB 하단의 「프로그램 삭제」는 메뉴 항목 클래스가 아니므로 계속 판정한다.
 */
const NAVIGATION_SELECTOR =
  '.detail-fullpage-modal__lnb-item, .detail-fullpage-modal__lnb-child, [role="tab"]'

export function normalizeProgramDetailActionLabel(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, ' ').trim()
}

export function classifyProgramDetailActionLabel(
  raw: string | null | undefined
): ProgramDetailActionKind | null {
  const label = normalizeProgramDetailActionLabel(raw)
  if (!label) return null
  if (PII_LABELS.has(label)) return 'pii'
  if (DOWNLOAD_LABELS.has(label) || label.endsWith(DOWNLOAD_LABEL_SUFFIX)) return 'download'
  if (
    WRITE_LABELS.has(label) ||
    label.startsWith(WRITE_LABEL_PREFIX) ||
    WRITE_LABEL_SUFFIXES.some(suffix => label.endsWith(suffix))
  ) {
    return 'write'
  }
  return null
}

/** 클릭 대상에서 가장 가까운 버튼을 찾아 액션 종류를 돌려준다. 조회·닫기 등은 null. */
export function resolveProgramDetailActionKind(
  target: EventTarget | null
): ProgramDetailActionKind | null {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return null
  const control = target.closest(INTERACTIVE_SELECTOR)
  if (!control) return null
  if (control.closest(NAVIGATION_SELECTOR)) return null
  const explicit = control
    .closest(`[${PROGRAM_DETAIL_ACTION_ATTRIBUTE}]`)
    ?.getAttribute(PROGRAM_DETAIL_ACTION_ATTRIBUTE)
  if (explicit === 'allow') return null
  if (explicit && ACTION_KINDS.has(explicit)) return explicit as ProgramDetailActionKind
  return (
    classifyProgramDetailActionLabel(control.getAttribute('aria-label')) ??
    classifyProgramDetailActionLabel(control.textContent)
  )
}

/**
 * 프로그램 상세 버튼 권한. 프로그램 배정 응답(my-assignment)의 capability가 있으면 그것을 따르고,
 * 없으면(조회 전·원격 미사용·Gemini처럼 배정 개념이 없는 상세) 전역 역할로 판정한다.
 * 쓰기·다운로드는 전역 역할 천장도 함께 적용한다(전역 Program Viewer는 PM 배정이어도 조회만).
 * 개인정보 원문은 BE와 같은 기준(`canRevealProgramGeneralPii`)을 따른다.
 */
export function resolveProgramDetailActionPermissions(input: {
  roleCode: AdminRoleCode | null | undefined
  assignment?: ProgramMyAssignment | null
}): ProgramDetailActionPermissions {
  const { roleCode, assignment } = input
  const global: ProgramDetailActionPermissions = {
    write: canAdminAction({ roleCode, action: 'write' }),
    download: canAdminAction({ roleCode, action: 'download' }),
    // 프로그램 상세 원문은 회원 관리 `pii`와 별개다. 배정 응답이 없을 때만 조회 전용 여부로 판정한다.
    pii: roleCode != null && !isReadOnlyAdminRoleCode(roleCode),
  }
  if (roleCode === 'MASTER' || assignment?.masterBypass === true) {
    return { write: true, download: true, pii: true }
  }
  if (!assignment || isUnknownAssignmentRole(assignment)) return global
  const caps = new Set(
    (assignment.capabilities ?? []).map(item => item.trim().toUpperCase()).filter(Boolean)
  )
  return {
    write: global.write && caps.has(PROGRAM_CAPABILITY.edit),
    download: global.download && caps.has('FILE_DOWNLOAD'),
    pii: canRevealProgramGeneralPii(assignment),
  }
}

export function isProgramDetailActionAllowed(
  kind: ProgramDetailActionKind,
  permissions: ProgramDetailActionPermissions
): boolean {
  return permissions[kind]
}
