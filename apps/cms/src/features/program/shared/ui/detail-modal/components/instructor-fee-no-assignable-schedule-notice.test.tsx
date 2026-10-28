/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import {
  InstructorFeeNoAssignableScheduleNotice,
  NO_ASSIGNABLE_INSTITUTION_SCHEDULE_NOTICE_LINES,
} from './instructor-fee-approval-modal'

describe('InstructorFeeNoAssignableScheduleNotice', () => {
  it('스크린샷 안내 문구를 렌더한다', () => {
    render(<InstructorFeeNoAssignableScheduleNotice />)
    const notice = screen.getByRole('status')
    expect(notice).toHaveClass('instructor-fee-approval-modal__no-schedule-notice')
    for (const line of NO_ASSIGNABLE_INSTITUTION_SCHEDULE_NOTICE_LINES) {
      expect(notice).toHaveTextContent(line)
    }
  })
})
