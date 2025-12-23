/**
 * To-do Mock 데이터
 * Phase 5.4: 다양한 To-do 작업 샘플 데이터
 */

import type { Todo } from '../../types/domain'

const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

const todoTemplates: Array<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    type: 'REPORT',
    label: '강의보고서 제출',
    description: '강의 완료 후 강의보고서를 제출해야 합니다. 보고서에는 강의 내용, 참여자 반응, 개선 사항 등을 포함해주세요.',
    expectedResult: '보고서 제출 후 정산 절차가 진행됩니다.',
    targetUrl: '/reports/new?type=lecture&activityId=act-001',
    priority: 1,
    completed: false,
  },
  {
    type: 'REPORT',
    label: '교육봉사 활동보고서 제출',
    description: '교육봉사 활동 완료 후 활동보고서를 제출해야 합니다. 활동 내용과 봉사 시간을 정확히 기록해주세요.',
    expectedResult: '보고서 제출 후 봉사시간 확정 절차가 진행됩니다.',
    targetUrl: '/reports/new?type=volunteer&activityId=act-002',
    priority: 1,
    completed: false,
  },
  {
    type: 'COMPLETE',
    label: '강의 완료 처리',
    description: '강의가 종료되었습니다. 강의 완료 처리를 진행해주세요.',
    expectedResult: '강의 완료 처리 후 보고서 작성 단계로 진행됩니다.',
    targetUrl: '/lectures/lect-001/complete',
    priority: 2,
    completed: false,
  },
  {
    type: 'COMPLETE',
    label: '봉사 완료 처리',
    description: '봉사 활동이 종료되었습니다. 봉사 완료 처리를 진행해주세요.',
    expectedResult: '봉사 완료 처리 후 보고서 작성 단계로 진행됩니다.',
    targetUrl: '/volunteers/vol-001/complete',
    priority: 2,
    completed: false,
  },
  {
    type: 'REVIEW',
    label: '신청 검토',
    description: '새로운 신청이 접수되었습니다. 신청 내용을 검토해주세요.',
    expectedResult: '신청 검토 완료 후 승인 또는 반려 처리가 진행됩니다.',
    targetUrl: '/applications/app-001',
    priority: 1,
    completed: false,
  },
  {
    type: 'SUBMIT',
    label: '정산 문서 확인',
    description: '정산 문서가 생성되었습니다. 내용을 확인하고 승인해주세요.',
    expectedResult: '정산 문서 승인 후 지급 절차가 진행됩니다.',
    targetUrl: '/settlements/set-001',
    priority: 3,
    completed: false,
  },
  {
    type: 'REPORT',
    label: '프로그램 종료 보고서 제출',
    description: '프로그램이 종료되었습니다. 프로그램 종료 보고서를 제출해주세요.',
    expectedResult: '보고서 제출 후 프로그램 이력이 확정됩니다.',
    targetUrl: '/reports/new?type=program&programId=prog-001',
    priority: 2,
    completed: false,
  },
]

export const mockTodos: Todo[] = Array.from({ length: 20 }, (_, index) => {
  const template = todoTemplates[index % todoTemplates.length]
  const createdAt = getDate(Math.floor(Math.random() * 30) + 1)
  const completed = Math.random() > 0.7
  const completedAt = completed ? getDate(Math.floor(Math.random() * 5)) : undefined

  return {
    id: `todo-${String(index + 1).padStart(3, '0')}`,
    ...template,
    label: `${template.label} ${index >= todoTemplates.length ? `(${Math.floor(index / todoTemplates.length) + 1})` : ''}`,
    priority: template.priority + Math.floor(index / todoTemplates.length),
    completed,
    completedAt,
    createdAt,
    updatedAt: completedAt || createdAt,
  }
})

export const mockTodosMap = new Map(mockTodos.map(todo => [todo.id, todo]))




