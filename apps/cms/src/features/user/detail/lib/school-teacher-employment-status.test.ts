import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { requestSchoolTeacherEmploymentDropdownOpen } from './school-teacher-employment-status'

describe('requestSchoolTeacherEmploymentDropdownOpen', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('뷰어는 드롭다운을 열지 않고 알림만 띄운다', () => {
    const show = vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
    const applyOpen = vi.fn()

    requestSchoolTeacherEmploymentDropdownOpen(true, 'VIEWER', applyOpen)

    expect(applyOpen).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('뷰어가 닫을 때는 알림 없이 닫는다', () => {
    const show = vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
    const applyOpen = vi.fn()

    requestSchoolTeacherEmploymentDropdownOpen(false, 'VIEWER', applyOpen)

    expect(applyOpen).toHaveBeenCalledWith(false)
    expect(show).not.toHaveBeenCalled()
  })

  it('마스터는 드롭다운을 연다', () => {
    const show = vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
    const applyOpen = vi.fn()

    requestSchoolTeacherEmploymentDropdownOpen(true, 'MASTER', applyOpen)

    expect(applyOpen).toHaveBeenCalledWith(true)
    expect(show).not.toHaveBeenCalled()
  })
})
