import { describe, expect, it } from 'vitest'
import {
  buildGeminiInstructorApproveMessageLines,
  buildGeminiInstructorChangeMessageLines,
} from './instructor-approve-messages'

describe('Gemini 강사 승인 안내 문구', () => {
  it('승인 안내 문구를 Figma 문구로 만든다', () => {
    expect(buildGeminiInstructorApproveMessageLines(' 김제이 ')).toEqual([
      '**[김제이]** 님의 프로그램 신청을 승인하시겠습니까?',
      '승인 시 회원에게 승인 알림이 발송되며, 다른 신청 강사들은 자동으로 반려 처리됩니다.',
    ])
  })

  it('변경 안내 문구에 새 강사명과 되돌릴 수 없음 안내를 포함한다', () => {
    expect(buildGeminiInstructorChangeMessageLines('김호령')).toEqual([
      '**[김호령]** 님으로 강사를 변경하시겠습니까?',
      '승인 시 회원에게 승인 알림이 발송되며, 연수일시가 바뀌면 기관에 일정이 안내됩니다.',
      '기존 강사는 사용자 귀책으로 활동 포기 처리되며, 처리 후에는 되돌릴 수 없습니다.',
    ])
  })
})
