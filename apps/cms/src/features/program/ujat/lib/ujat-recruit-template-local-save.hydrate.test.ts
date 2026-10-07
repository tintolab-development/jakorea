import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { queryClient } from '@/shared/lib/query-client'

const resolveProgramOperationalFormLoadSource = vi.fn()
const loadFormTemplateVersionDraftByVersionId = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/template/api/admin-form-templates-service')>()
  return {
    ...actual,
    shouldUseFormsSurveysRemoteApi: () => true,
    loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
      loadFormTemplateVersionDraftByVersionId(...args),
  }
})

vi.mock('@/features/program/general/lib/sync-registration-form-bindings', () => ({
  resolveProgramOperationalFormLoadSource: (...args: unknown[]) =>
    resolveProgramOperationalFormLoadSource(...args),
}))

vi.mock('@/features/program/general/lib/registration-operational-form-drafts', () => ({
  applyOperationalOverlayForCatalogId: vi.fn(),
}))

import {
  hydrateUjatRecruitTemplatesForProgram,
  resetUjatRecruitTemplateProgramHydrate,
} from './ujat-recruit-template-local-save'

const program = { id: 'ujat-program-1' } as Program

describe('hydrateUjatRecruitTemplatesForProgram', () => {
  beforeEach(() => {
    queryClient.clear()
    resetUjatRecruitTemplateProgramHydrate()
    resolveProgramOperationalFormLoadSource.mockReset()
    loadFormTemplateVersionDraftByVersionId.mockReset()
    resolveProgramOperationalFormLoadSource.mockResolvedValue({ templateVersionId: 392 })
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue({
      draft: { schemaVersion: 1, formSettings: { titleNumbering: 'none' }, paragraphs: [] },
      overlay: {},
    })
  })

  afterEach(() => {
    resetUjatRecruitTemplateProgramHydrate()
    queryClient.clear()
  })

  it('같은 프로그램은 모달·패널이 동시에 호출해도 모집 양식 GET을 한 번만 한다', async () => {
    await Promise.all([
      hydrateUjatRecruitTemplatesForProgram(program),
      hydrateUjatRecruitTemplatesForProgram(program),
    ])
    await hydrateUjatRecruitTemplatesForProgram(program)

    expect(resolveProgramOperationalFormLoadSource).toHaveBeenCalledTimes(2)
    expect(loadFormTemplateVersionDraftByVersionId).toHaveBeenCalledTimes(2)
    expect(resolveProgramOperationalFormLoadSource.mock.calls.map(call => call[1]).sort()).toEqual([
      'recruitment-ujat-school',
      'recruitment-ujat-volunteer',
    ])
  })

  it('상세 overlay가 나중에 채워지면 바인딩 version을 다시 읽는다', async () => {
    await hydrateUjatRecruitTemplatesForProgram(program)
    expect(resolveProgramOperationalFormLoadSource).toHaveBeenCalledTimes(2)

    await hydrateUjatRecruitTemplatesForProgram({
      ...program,
      ujatRegistrationOverlay: { 'ujat.recruit.institution.publicTitle': '등록 공고' },
    } as Program)

    expect(resolveProgramOperationalFormLoadSource).toHaveBeenCalledTimes(4)
  })
})
