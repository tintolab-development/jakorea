import type { BugIssueLog } from '@/types/bug-issue-log'

function generateUUID(): string {
  return `bug-log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`
}

const defaultOccurredAt = '2026-03-30T01:15:45.000Z'

export const mockBugIssueLogs: BugIssueLog[] = [
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
  {
    id: generateUUID(),
    screenName: '회원 관리 > 전체 회원',
    errorMessage: '[503] Service Unavailable - Database connection failed',
    userName: '홍길동',
    occurredAt: defaultOccurredAt,
  },
]
