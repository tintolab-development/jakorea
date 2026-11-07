import type { ZodIssue } from 'zod'

/** 프로그램 상세 수정 폼 — Zod path → 화면 라벨 */
export const PROGRAM_DETAIL_EDIT_FIELD_LABELS: Record<string, string> = {
  title: '프로그램명',
  mainTitle: '대표 프로그램명(국문)',
  titleEn: '대표 프로그램명(영문)',
  announcementTitle: '공고용 프로그램명',
  detailedProgramName: '세부 프로그램명',
  detailedProgramId: '세부 프로그램명',
  startDate: '사업 운영 기간',
  endDate: '사업 운영 기간',
  businessArea: '사업 분야',
  sponsorId: '후원사',
  sponsorManagementIds: '후원사',
  sponsorManagerContactIds: '후원사 담당자',
  managerName: '후원사 담당자',
  venueKind: '교육 장소',
  venueDetail: '교육 장소',
  educationProcess: '교육 과정',
  ipOwned: 'IP Owned',
  courseDeliveredBy: 'Course Delivered By',
  partnerInvolvement: 'Partner Involvement',
  surveySurvey: '설문 진행 항목(설문조사)',
  surveySatisfaction: '설문 진행 항목(만족도 조사)',
  surveyLectureEvaluation: '설문 진행 항목(강의평가)',
  educationStructure: '교육 진행 구조',
  sessionRound: '수업 회차 유형',
  educationForm: '교육 형태',
  educationFormScheduleDetail: '교육 형태(일정별)',
  ipsScheduleDetail: 'IPS 유형(일정별)',
  ipsCategory: 'IPS 유형',
  ipsDetail: 'IPS 유형 상세',
  ips: 'IPS 유형',
  educationScheduleLines: '교육 진행 예정일',
  educationScheduleMode: '교육 진행 일정 유형',
  kpiFinalParticipants: '참여자 최종 인원',
  kpiEducatedTeachers: '교육받은 교사 수',
  kpiFinalSchools: '파견 학교 수',
  kpiFinalClasses: '파견 학급 수',
  description: '프로그램 설명',
  learningSupportContent: '학습 지원 내용',
  applicationStartDate: '참여자 모집 시작일',
  applicationEndDate: '참여자 모집 종료일',
  resultAnnouncementDate: '결과 발표일',
  resultAnnouncementMethod: '결과 발표 방법',
  remarks: '비고',
  studentListRequired: '학생 명단 제출 여부',
  educationTargetDetail: '교육 대상 상세',
  participantRecruitmentAnnouncementPublished: '공고 게시 여부',
  participantRecruitmentMaxClassCount: '신청 가능 최대 학급 수',
  participantProgramOperationStartDate: '프로그램 운영 시작일',
  participantProgramOperationEndDate: '프로그램 운영 종료일',
}

function resolveFieldLabel(path: (string | number)[], labels: Record<string, string>): string {
  if (path.length === 0) return '입력값'
  const leaf = String(path[path.length - 1])
  if (labels[leaf]) return labels[leaf]
  const joined = path.map(String).join('.')
  if (labels[joined]) return labels[joined]
  return leaf
}

function formatInvalidTypeMessage(
  issue: Extract<ZodIssue, { code: 'invalid_type' }>,
  fieldLabel: string
): string {
  if (issue.expected === 'boolean' && issue.received === 'null') {
    return `${fieldLabel} 값을 선택해 주세요.`
  }
  if (issue.expected === 'string' && (issue.received === 'null' || issue.received === 'undefined')) {
    return `${fieldLabel}을(를) 입력해 주세요.`
  }
  if (issue.received === 'undefined' || issue.received === 'null') {
    return `${fieldLabel}을(를) 입력해 주세요.`
  }
  return `${fieldLabel} 형식이 올바르지 않습니다.`
}

/** Zod 기본 영문 메시지를 화면 라벨이 포함된 한글 안내로 변환 */
export function formatZodIssueForUser(
  issue: ZodIssue,
  fieldLabels: Record<string, string> = PROGRAM_DETAIL_EDIT_FIELD_LABELS
): string {
  const fieldLabel = resolveFieldLabel(issue.path, fieldLabels)

  if (issue.code === 'custom' || issue.code === 'too_small') {
    return issue.message
  }

  if (issue.code === 'invalid_type') {
    return formatInvalidTypeMessage(issue, fieldLabel)
  }

  if (issue.code === 'invalid_enum_value') {
    return `${fieldLabel} 값을 선택해 주세요.`
  }

  if (issue.message && !/^Expected .+ received/.test(issue.message)) {
    return issue.message
  }

  return `${fieldLabel}을(를) 확인해 주세요.`
}

export function formatZodIssuesForUser(
  issues: ZodIssue[],
  fieldLabels: Record<string, string> = PROGRAM_DETAIL_EDIT_FIELD_LABELS
): string {
  if (issues.length === 0) return '입력값을 확인해 주세요.'
  return formatZodIssueForUser(issues[0], fieldLabels)
}
