/** @vitest-environment jsdom */
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import { patchGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { CompanySchoolRegistrationWizardFormProvider } from './registration-wizard-form-provider'

describe('C8 1사1교 applyOverlayRecord dirty 의미', () => {
  afterEach(() => cleanup())

  async function mount() {
    render(
      <CompanySchoolRegistrationWizardFormProvider>
        <div />
      </CompanySchoolRegistrationWizardFormProvider>
    )
    await waitFor(() => expect(peekCompanySchoolRegistrationRhf()).not.toBeNull())
    return peekCompanySchoolRegistrationRhf()!
  }

  it('shouldDirty:true면 적용한 값이 dirty로 잡힌다', async () => {
    const api = await mount()
    expect(api.isDirty()).toBe(false)
    act(() => {
      api.applyOverlayRecord({ 'economyRegistration.basicInfo.repKo': '변경' }, { shouldDirty: true })
    })
    await waitFor(() => expect(api.isDirty()).toBe(true))
    expect(api.getValues().repKo).toBe('변경')
  })

  it('useInstructorRecruitField와 같은 setter 경로가 instructorRecruit에 기록된다', async () => {
    const api = await mount()
    act(() => {
      patchGeneralRecruitOverlay({
        'recruit.instructor.inquiryContact': '강사 문의',
        'recruit.instructor.notes': '0',
        'recruit.instructor.programRangeSeal': { start: '2026-04-01', end: '2026-04-30' },
      })
    })
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('강사 문의')
    expect(api.getValues().instructorRecruit.notes).toBe('0')
    expect(api.getValues().instructorRecruit.programRange).toEqual({
      start: '2026-04-01',
      end: '2026-04-30',
    })
  })

  it('강사 모집 overlay 키는 instructorRecruit typed state에 남고 탭 전환 후에도 유지된다', async () => {
    const api = await mount()
    act(() => {
      api.applyOverlayRecord({
        'recruit.instructor.inquiryContact': '강사 문의',
        'recruit.instructor.notes': '0',
        'recruit.instructor.programRangeSeal': { start: '2026-04-01', end: '2026-04-30' },
        'recruit.inquiryContact': '기관 문의',
      })
    })
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('강사 문의')
    expect(api.getValues().instructorRecruit.notes).toBe('0')
    expect(api.getValues().instructorRecruit.programRange).toEqual({
      start: '2026-04-01',
      end: '2026-04-30',
    })
    expect(api.getValues().recruitment.inquiryContact).toBe('기관 문의')
    act(() => {
      api.applyOverlayRecord({ 'recruit.inquiryContact': '기관 수정' })
    })
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('강사 문의')
    expect(api.getValues().recruitment.inquiryContact).toBe('기관 수정')
    act(() => {
      api.applyOverlayRecord({ 'recruit.instructor.inquiryContact': '강사 수정' })
    })
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('강사 수정')
    expect(api.getValues().recruitment.inquiryContact).toBe('기관 수정')
  })

  it('shouldDirty:false면 적용으로 dirty를 만들지 않는다', async () => {
    const api = await mount()
    act(() => {
      api.applyOverlayRecord({ 'economyRegistration.basicInfo.repKo': '복원' }, { shouldDirty: false })
    })
    expect(api.getValues().repKo).toBe('복원')
    expect(api.isDirty()).toBe(false)
  })
})
