// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  resetAllOperationalOverlayStores,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import { useGeneralRecruitOverlayKv } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  individualRecruitFieldForm,
  useIndividualRecruitField,
} from '@/features/template/ui/form-set/recruit-form/individual/individual-recruit-form-rhf'
import {
  individualTeamInfoFieldForm,
  useIndividualTeamInfoField,
} from '@/features/template/ui/form-set/application-form/individual/individual-team-info-form-rhf'
import { composeOverlayStoreWithFieldForms, createScopedRhfFieldForm } from './scoped-rhf-field-form'
import { createScopedOverlayStore } from './scoped-overlay-store'

describe('scoped RHF field form', () => {
  it('점 표기 키를 평평하게 두고 그대로 직렬화한다(없는 키·null 유지, 비소유 키 무시)', () => {
    const form = createScopedRhfFieldForm({ ownsKey: key => key.startsWith('a.') })
    form.replaceFor('t1', { 'a.b.0': 1, 'a.c': null, 'z.q': 2 })
    expect(form.peekRecord('t1')).toEqual({ 'a.b.0': 1, 'a.c': null })
    form.setScope('t1')
    form.patch({ 'a.d': 'x', 'z.q': 3 })
    expect(form.getRecord()).toEqual({ 'a.b.0': 1, 'a.c': null, 'a.d': 'x' })
    expect(form.getForm().getFieldState('fields.a~d').isDirty).toBe(true)
    expect(form.peekRecord('t2')).toEqual({})
  })

  it('레코드 참조는 값이 바뀔 때만 바뀐다', () => {
    const form = createScopedRhfFieldForm({ ownsKey: () => true })
    form.patch({ k: 1 })
    const first = form.getRecord()
    expect(form.getRecord()).toBe(first)
    form.patch({ k: 1 })
    expect(form.getRecord()).toBe(first)
    form.patch({ k: 2 })
    expect(form.getRecord()).not.toBe(first)
  })
})

describe('일반 개인 단락 RHF 훅 = 예전 스토어 훅 결과', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
  })

  function runRecruit(useField: typeof useGeneralRecruitOverlayKv) {
    resetAllOperationalOverlayStores()
    applyOperationalOverlayForCatalogId('recruitment-participant-individual', {
      'recruit.individual.notes': '기존',
      'recruit.detailInfo.programDescription': '설명',
    })
    setOperationalOverlayScope('recruitment-participant-individual')
    const notes = renderHook(() => useField<string>('recruit.individual.notes', ''))
    const levels = renderHook(() => useField<string[]>('recruit.individual.targetLevels', []))
    expect(notes.result.current[0]).toBe('기존')
    act(() => notes.result.current[1]('수정'))
    act(() => levels.result.current[1](['adult']))
    expect(notes.result.current[0]).toBe('수정')
    return collectOperationalOverlayForCatalogId('recruitment-participant-individual')
  }

  it('모집 단락', () => {
    const viaStoreHook = runRecruit(useGeneralRecruitOverlayKv)
    const viaRhfHook = runRecruit(useIndividualRecruitField)
    expect(viaRhfHook).toEqual(viaStoreHook)
    expect(individualRecruitFieldForm.getRecord()).toEqual({
      'recruit.individual.notes': '수정',
      'recruit.individual.targetLevels': ['adult'],
    })
  })

  function runTeam(useField: typeof useGeneralApplicationOverlayKv) {
    resetAllOperationalOverlayStores()
    setOperationalOverlayScope('application-participant-individual')
    const name = renderHook(() => useField<string>('application.individual.teamInfo.teamName', ''))
    const role = renderHook(() =>
      useField<string>('application.individual.teamInfo.teamRole', 'leader')
    )
    expect(role.result.current[0]).toBe('leader')
    act(() => name.result.current[1]('팀'))
    act(() => role.result.current[1]('member'))
    return collectOperationalOverlayForCatalogId('application-participant-individual')
  }

  it('팀 정보 단락', () => {
    const viaStoreHook = runTeam(useGeneralApplicationOverlayKv)
    const viaRhfHook = runTeam(useIndividualTeamInfoField)
    expect(viaRhfHook).toEqual(viaStoreHook)
    expect(individualTeamInfoFieldForm.getRecord()).toEqual({
      'application.individual.teamInfo.teamName': '팀',
      'application.individual.teamInfo.teamRole': 'member',
    })
  })
})

describe('composeOverlayStoreWithFieldForms 키 순서(part3 step5)', () => {
  it('replace 순서·patch 뒤 붙이기가 단일 스토어와 같다', () => {
    const plain = createScopedOverlayStore()
    const form = createScopedRhfFieldForm({ ownsKey: key => key.startsWith('o.') })
    const composed = composeOverlayStoreWithFieldForms(createScopedOverlayStore(), [form])
    const next = { 'a.1': 1, 'o.1': 2, 'a.2': 3, 'o.2': 4 }
    for (const s of [plain, composed]) {
      s.setScope('t')
      s.replace(next)
      s.patch({ 'o.3': 5, 'a.3': 6, 'a.1': 7 })
      s.updateKey<number>('o.4', () => 8)
    }
    expect(Object.keys(composed.getRecord())).toEqual(Object.keys(plain.getRecord()))
    expect(JSON.stringify(composed.peekRecord('t'))).toBe(JSON.stringify(plain.peekRecord('t')))
    const first = composed.getRecord()
    composed.patch({ 'a.1': 7 })
    expect(composed.getRecord()).toBe(first)
  })
})
