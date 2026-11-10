import { describe, expect, it } from 'vitest'
import { GENERAL_VOLUNTEER_DOC_PASSED_CALENDAR_TAG_LABELS } from '@/features/program/general/lib/general-volunteer-doc-passed-calendar-list-rows'
import { GENERAL_INTERVIEW_ASSIGNMENT_STATUS_CALENDAR_LIST_TAG_LABELS } from '@/features/program/general/lib/volunteer-screening-constants'
import { buildGeneralVolunteerDocumentBulkApproveMessage } from './general-volunteer-document-bulk-approve-modal'
import { buildGeneralVolunteerDocumentBulkRejectMessage } from './general-volunteer-document-bulk-reject-modal'
import { buildGeneralVolunteerDocumentRejectMessage } from './general-volunteer-document-reject-modal'
import { buildGeneralVolunteerInterview2BulkFailSpecMessage } from './general-volunteer-interview2-bulk-fail-modal'
import { buildGeneralVolunteerInterview2ResultCompleteCopy } from './interview2-result-complete-modal'

describe('일반 봉사자 심사 팝업 시안 문구', () => {
  it('면접 합격·불합격 완료 (12-2·14-2)', () => {
    expect(buildGeneralVolunteerInterview2ResultCompleteCopy('pass')).toEqual({
      title: '합격 처리 완료',
      description: '면접 결과가 합격 처리되었습니다.',
    })
    expect(buildGeneralVolunteerInterview2ResultCompleteCopy('fail')).toEqual({
      title: '불합격 처리 완료',
      description: '면접 결과가 불합격 처리되었습니다.',
    })
  })

  it('1차 서류 반려·일괄 승인·일괄 반려 (03-1·04-1)', () => {
    expect(buildGeneralVolunteerDocumentRejectMessage('김제이')).toBe(
      '**[김제이]** 님의 1차 서류를 반려하시겠습니까?\n반려 시 회원에게 반려 알림이 발송됩니다.'
    )
    expect(buildGeneralVolunteerDocumentBulkApproveMessage(3, '김제이')).toBe(
      '**[김제이] 님 외 2명**의 1차 서류를 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.'
    )
    expect(buildGeneralVolunteerDocumentBulkRejectMessage(2, '김제이')).toBe(
      '**[김제이] 님 외 1명**의 1차 서류를 반려하시겠습니까?\n반려 시 회원에게 반려 알림이 발송됩니다.'
    )
  })

  it('면접 일괄 불합격 (11-1)', () => {
    expect(buildGeneralVolunteerInterview2BulkFailSpecMessage(4, '김제이')).toBe(
      '**[김제이] 님 외 3명**의 면접 결과를 불합격 처리하시겠습니까?\n불합격 시 회원에게 불합격 알림이 발송됩니다.'
    )
  })

  it('1차 서류 합격자 캘린더 카드 — 봉사자만 「배정 전」, 기본 라벨은 유지', () => {
    expect(GENERAL_VOLUNTEER_DOC_PASSED_CALENDAR_TAG_LABELS.waiting).toBe('배정 전')
    expect(GENERAL_INTERVIEW_ASSIGNMENT_STATUS_CALENDAR_LIST_TAG_LABELS.waiting).toBe('배정 대기')
  })
})
