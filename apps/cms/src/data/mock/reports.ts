/**
 * 보고서 Mock 데이터
 * Phase 5.9: 보고서 작성 화면용 샘플 데이터
 */

import type { Report, ReportField, ReportType } from '../../types/domain'

// 강의보고서 필드 정의
export const lectureReportFields: ReportField[] = [
  {
    id: 'lecture_content',
    label: '강의 내용',
    type: 'textarea',
    required: true,
    placeholder: '강의에서 다룬 주요 내용을 작성해주세요.',
  },
  {
    id: 'participant_count',
    label: '참여자 수',
    type: 'number',
    required: true,
    validation: {
      min: 1,
      max: 1000,
    },
  },
  {
    id: 'participant_feedback',
    label: '참여자 반응',
    type: 'textarea',
    required: false,
    placeholder: '참여자들의 반응이나 피드백을 작성해주세요.',
  },
  {
    id: 'improvements',
    label: '개선 사항',
    type: 'textarea',
    required: false,
    placeholder: '향후 개선할 점이나 제안사항을 작성해주세요.',
  },
  {
    id: 'additional_notes',
    label: '추가 메모',
    type: 'textarea',
    required: false,
    placeholder: '기타 참고사항을 작성해주세요.',
  },
]

// 교육봉사 활동보고서 필드 정의
export const volunteerReportFields: ReportField[] = [
  {
    id: 'activity_content',
    label: '활동 내용',
    type: 'textarea',
    required: true,
    placeholder: '교육봉사 활동에서 수행한 주요 내용을 작성해주세요.',
  },
  {
    id: 'activity_hours',
    label: '봉사 시간',
    type: 'number',
    required: true,
    validation: {
      min: 1,
      max: 24,
    },
  },
  {
    id: 'participant_count',
    label: '참여자 수',
    type: 'number',
    required: true,
    validation: {
      min: 1,
      max: 1000,
    },
  },
  {
    id: 'activity_impact',
    label: '활동 효과',
    type: 'textarea',
    required: false,
    placeholder: '활동이 참여자들에게 미친 긍정적 효과를 작성해주세요.',
  },
  {
    id: 'challenges',
    label: '어려웠던 점',
    type: 'textarea',
    required: false,
    placeholder: '활동 중 어려웠던 점이나 해결한 문제를 작성해주세요.',
  },
  {
    id: 'additional_notes',
    label: '추가 메모',
    type: 'textarea',
    required: false,
    placeholder: '기타 참고사항을 작성해주세요.',
  },
]

// 프로그램 종료 보고서 필드 정의
export const programReportFields: ReportField[] = [
  {
    id: 'program_summary',
    label: '프로그램 요약',
    type: 'textarea',
    required: true,
    placeholder: '프로그램의 전체적인 요약을 작성해주세요.',
  },
  {
    id: 'total_participants',
    label: '총 참여자 수',
    type: 'number',
    required: true,
    validation: {
      min: 1,
      max: 10000,
    },
  },
  {
    id: 'program_achievements',
    label: '프로그램 성과',
    type: 'textarea',
    required: true,
    placeholder: '프로그램을 통해 달성한 주요 성과를 작성해주세요.',
  },
  {
    id: 'lessons_learned',
    label: '배운 점',
    type: 'textarea',
    required: false,
    placeholder: '프로그램 운영을 통해 배운 점이나 인사이트를 작성해주세요.',
  },
  {
    id: 'recommendations',
    label: '개선 제안',
    type: 'textarea',
    required: false,
    placeholder: '향후 프로그램 개선을 위한 제안사항을 작성해주세요.',
  },
]

// 보고서 제출 가이드
export const reportSubmissionGuides: Record<ReportType, string> = {
  lecture: '강의보고서는 강의 완료 후 반드시 제출해야 하는 필수 절차입니다. 정확한 정보를 기재해주세요.',
  volunteer: '교육봉사 활동보고서는 봉사 활동 완료 후 반드시 제출해야 하는 필수 절차입니다. 활동 내용과 봉사 시간을 정확히 기록해주세요.',
  program: '프로그램 종료 보고서는 프로그램 종료 후 제출하는 공식 문서입니다. 프로그램의 전체적인 성과와 결과를 기록해주세요.',
}

// 제출된 보고서 Mock 데이터
const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

// Mutable 배열로 export (report-service에서 push 가능하도록)
export const mockReports: Report[] = [
  {
    id: 'report-001',
    type: 'lecture',
    activityId: 'lect-001', // 실제 존재하는 activity ID
    fields: {
      lecture_content: '청소년 리더십 워크샵 강의를 진행했습니다. 리더십의 기본 개념과 실전 사례를 다뤘습니다.',
      participant_count: 25,
      participant_feedback: '참여자들이 매우 적극적으로 참여했으며, 실습 활동에 대한 피드백이 긍정적이었습니다.',
      improvements: '다음에는 더 많은 그룹 활동을 포함하면 좋을 것 같습니다.',
      additional_notes: '특별 이슈 없음',
    },
    status: 'submitted',
    submittedAt: getDate(5),
    createdAt: getDate(6),
    updatedAt: getDate(5),
  },
  {
    id: 'report-002',
    type: 'volunteer',
    activityId: 'vol-001', // 실제 존재하는 activity ID
    fields: {
      activity_content: '온라인 과학 탐구 세미나에서 학생들을 지원하는 교육봉사 활동을 진행했습니다.',
      activity_hours: 4,
      participant_count: 30,
      activity_impact: '학생들이 과학 탐구에 대한 흥미를 높일 수 있었습니다.',
      challenges: '온라인 환경에서의 소통에 어려움이 있었지만, 적극적으로 해결했습니다.',
      additional_notes: '학생들의 질문이 많아 예상보다 시간이 소요되었습니다.',
    },
    status: 'reviewing',
    submittedAt: getDate(3),
    createdAt: getDate(4),
    updatedAt: getDate(3),
  },
  {
    id: 'report-003',
    type: 'program',
    programId: 'program-001',
    fields: {
      program_summary: '2025년 상반기 청소년 경제교육 프로그램을 성공적으로 완료했습니다.',
      total_participants: 150,
      program_achievements: '참여 학생들의 경제 이해도가 크게 향상되었습니다.',
      lessons_learned: '다양한 교육 방법론을 시도하여 효과적인 학습 환경을 조성할 수 있었습니다.',
      recommendations: '향후 더 많은 학교와의 협력을 확대하는 것이 좋을 것 같습니다.',
    },
    status: 'approved',
    submittedAt: getDate(10),
    reviewedAt: getDate(8),
    createdAt: getDate(11),
    updatedAt: getDate(8),
  },
  {
    id: 'report-004',
    type: 'lecture',
    activityId: 'lect-002', // 실제 존재하는 activity ID
    fields: {
      lecture_content: '기업가정신 교육 프로그램 강의를 진행했습니다.',
      participant_count: 40,
      participant_feedback: '학생들이 창업에 대한 관심을 보였습니다.',
      improvements: '더 많은 사례 연구를 포함하면 좋을 것 같습니다.',
      additional_notes: '시간 부족으로 일부 내용을 생략했습니다.',
    },
    status: 'rejected',
    submittedAt: getDate(7),
    reviewedAt: getDate(6),
    reviewNotes: '내용이 부족합니다. 보충 제출 필요.',
    createdAt: getDate(8),
    updatedAt: getDate(6),
  },
]

// Map은 매번 새로 생성 (mockReports 변경 시 자동 반영)
export function getMockReportsMap(): Map<string, Report> {
  return new Map(mockReports.map(report => [report.id, report]))
}

