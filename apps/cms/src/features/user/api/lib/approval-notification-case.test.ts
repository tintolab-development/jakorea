import { describe, expect, it } from 'vitest'
import {
  parseApprovalNotificationCase,
  parseApprovalNotificationState,
  resolveApprovalCancelModalCase,
} from './approval-notification-case'

describe('parseApprovalNotificationCase', () => {
  it('서버 리터럴만 통과한다', () => {
    expect(parseApprovalNotificationCase('CASE_1')).toBe('CASE_1')
    expect(parseApprovalNotificationCase('CASE_2')).toBe('CASE_2')
    expect(parseApprovalNotificationCase('NONE')).toBe('NONE')
  })

  it('누락·알 수 없는 값은 null이다', () => {
    expect(parseApprovalNotificationCase(undefined)).toBeNull()
    expect(parseApprovalNotificationCase(null)).toBeNull()
    expect(parseApprovalNotificationCase('')).toBeNull()
    expect(parseApprovalNotificationCase('SENT')).toBeNull()
    expect(parseApprovalNotificationCase('case_1')).toBeNull()
  })
})

describe('parseApprovalNotificationState', () => {
  it('서버 상태 리터럴만 통과한다', () => {
    expect(parseApprovalNotificationState('UNKNOWN')).toBe('UNKNOWN')
    expect(parseApprovalNotificationState('SCHEDULED')).toBe('SCHEDULED')
    expect(parseApprovalNotificationState('bogus')).toBeNull()
  })
})

describe('resolveApprovalCancelModalCase', () => {
  it('NONE과 CASE_1은 CASE 1 모달이다', () => {
    expect(resolveApprovalCancelModalCase('NONE')).toBe('CASE_1')
    expect(resolveApprovalCancelModalCase('CASE_1')).toBe('CASE_1')
  })

  it('CASE_2는 CASE 2 모달이다', () => {
    expect(resolveApprovalCancelModalCase('CASE_2')).toBe('CASE_2')
  })

  it('필드 누락을 CASE로 추정하지 않는다', () => {
    expect(resolveApprovalCancelModalCase(null)).toBeNull()
    expect(resolveApprovalCancelModalCase(undefined)).toBeNull()
    expect(resolveApprovalCancelModalCase('UNKNOWN')).toBeNull()
    expect(resolveApprovalCancelModalCase('SENT')).toBeNull()
  })
})
