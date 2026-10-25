// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetAllOperationalOverlayStores, setOperationalOverlayScope } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  useGeneralRecruitOverlayKv,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  isRecruitDetailInfoFieldKey,
  peekRecruitDetailInfoRecord,
  recruitDetailInfoFieldForm,
  updateRecruitDetailInfoKey,
  useRecruitDetailInfoField,
} from './recruit-detail-info-form-rhf'
import {
  isVolunteerRecruitFieldKey,
  useVolunteerRecruitField,
} from '@/features/template/ui/form-set/recruit-form/volunteer/volunteer-recruit-form-rhf'
import {
  isFixedScheduleFieldKey,
  useFixedScheduleField,
} from '@/features/template/ui/form-set/application-form/shared/fixed-schedule-form-rhf'

describe('part3 step5 RHF 필드 폼 — 소유 키·훅 동등성', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
  })

  it('소유 키 범위', () => {
    expect(isRecruitDetailInfoFieldKey('recruit.detailInfo.thumbFileObjectId')).toBe(true)
    expect(isRecruitDetailInfoFieldKey('recruitInstructor.detailInfo.attachmentFileNames')).toBe(true)
    expect(isRecruitDetailInfoFieldKey('geminiRecruit.detailInfo.programDescription')).toBe(true)
    expect(isRecruitDetailInfoFieldKey('recruitVolunteer.h2.detailInfo.otherNotes')).toBe(true)
    expect(isRecruitDetailInfoFieldKey('geminiRecruit.title')).toBe(false)
    expect(isRecruitDetailInfoFieldKey('recruit.programRangeSeal')).toBe(false)
    expect(isVolunteerRecruitFieldKey('recruit.volunteer.interviewRangeSeal')).toBe(true)
    expect(isVolunteerRecruitFieldKey('recruit.volunteer.interview.selectedSlotKeys')).toBe(false)
    expect(isVolunteerRecruitFieldKey('recruit.volunteer.interview.exception.10.exceptionDate')).toBe(false)
    expect(isVolunteerRecruitFieldKey('recruit.volunteer.h1.notes')).toBe(false)
    expect(isFixedScheduleFieldKey('application.institution.fixedScheduleSelected')).toBe(true)
    expect(isFixedScheduleFieldKey('application.institution.basicInfo.schoolName')).toBe(false)
  })

  it('상세정보 훅: 새 훅과 스토어 훅이 같은 값을 본다(양방향)', () => {
    setOperationalOverlayScope('recruitment-participant-individual')
    const key = 'recruit.detailInfo.thumbFileName'
    const { result: next } = renderHook(() => useRecruitDetailInfoField<string | null>(key, null))
    const { result: prev } = renderHook(() => useGeneralRecruitOverlayKv<string | null>(key, null))
    act(() => next.current[1]('a.png'))
    expect(prev.current[0]).toBe('a.png')
    act(() => patchGeneralRecruitOverlay({ [key]: 'b.png' }))
    expect(next.current[0]).toBe('b.png')
    updateRecruitDetailInfoKey<string[]>('recruit.detailInfo.attachmentFileNames', p => [...(p ?? []), 'x.pdf'])
    expect(getGeneralRecruitOverlayRecord()['recruit.detailInfo.attachmentFileNames']).toEqual(['x.pdf'])
    expect(peekRecruitDetailInfoRecord('recruitment-participant-individual')).toEqual(
      recruitDetailInfoFieldForm.peekRecord('recruitment-participant-individual')
    )
  })

  it('봉사자·고정 일정 훅: 새 훅과 스토어 훅이 같은 값을 본다', () => {
    setOperationalOverlayScope('recruitment-volunteer')
    const { result: v1 } = renderHook(() => useVolunteerRecruitField<string>('recruit.volunteer.interviewMethod', ''))
    const { result: v2 } = renderHook(() => useGeneralRecruitOverlayKv<string>('recruit.volunteer.interviewMethod', ''))
    act(() => v1.current[1]('대면'))
    expect(v2.current[0]).toBe('대면')
    setOperationalOverlayScope('application-participant-school')
    const key = 'application.institution.fixedScheduleSelected'
    const { result: f1 } = renderHook(() => useFixedScheduleField<string[]>(key, []))
    const { result: f2 } = renderHook(() => useGeneralApplicationOverlayKv<string[]>(key, []))
    act(() => f1.current[1](['s1']))
    expect(f2.current[0]).toEqual(['s1'])
  })
})
