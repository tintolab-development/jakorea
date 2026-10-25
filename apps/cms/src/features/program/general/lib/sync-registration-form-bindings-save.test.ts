import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

const fetchFormTemplateVersionRemote = vi.fn()
const copyFormTemplateVersionRemote = vi.fn()
const updateFormTemplateRemote = vi.fn()
const loadFormTemplateVersionDraftByVersionId = vi.fn()
const saveFormTemplateVersionDraftByVersionId = vi.fn()
const publishFormTemplateVersionById = vi.fn()
const resolveFormTemplateCatalogIds = vi.fn()
const fetchGeneralProgramFormBindings = vi.fn()
const updateGeneralProgramFormBinding = vi.fn()
const createGeneralProgramFormBinding = vi.fn()

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyFormTemplateVersionRemote(...args),
  updateFormTemplateRemote: (...args: unknown[]) => updateFormTemplateRemote(...args),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    loadFormTemplateVersionDraftByVersionId(...args),
  saveFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    saveFormTemplateVersionDraftByVersionId(...args),
  publishFormTemplateVersionById: (...args: unknown[]) => publishFormTemplateVersionById(...args),
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  shouldUseFormsSurveysRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramFormBindings: (...args: unknown[]) => fetchGeneralProgramFormBindings(...args),
  updateGeneralProgramFormBinding: (...args: unknown[]) => updateGeneralProgramFormBinding(...args),
  createGeneralProgramFormBinding: (...args: unknown[]) => createGeneralProgramFormBinding(...args),
}))

import {
  getRememberedProgramOperationalFormBinding,
  saveProgramScopedOperationalFormVersion,
} from './sync-registration-form-bindings'

const program = { id: 'tt-program-1' } as Program
const userDraft = { paragraphs: [] } as unknown as WritingFormDraft

describe('saveProgramScopedOperationalFormVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue(null)
    saveFormTemplateVersionDraftByVersionId.mockResolvedValue(undefined)
    publishFormTemplateVersionById.mockImplementation(async (versionId: number) => versionId)
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 100 })
    updateFormTemplateRemote.mockResolvedValue(undefined)
    updateGeneralProgramFormBinding.mockResolvedValue(undefined)
    createGeneralProgramFormBinding.mockResolvedValue(undefined)
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 7,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        templateId: 55,
        templateVersionId: 501,
        templateName: '교육받은 교사 신청',
      },
    ])
  })

  it('copies a published version, saves the draft, publishes, and rebinds', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 55,
      templateVersionId: 501,
      versionStatus: 'PUBLISHED',
    })
    copyFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 880,
      versionStatus: 'DRAFT',
    })
    publishFormTemplateVersionById.mockResolvedValue(880)

    const saved = await saveProgramScopedOperationalFormVersion({
      program,
      templateCode: 'application-trained-teachers',
      versionId: 501,
      draft: userDraft,
    })

    expect(copyFormTemplateVersionRemote).toHaveBeenCalledWith(55, {
      sourceVersionId: 501,
      versionLabel: 'program-tt-program-1',
    })
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      expect.objectContaining({
        versionId: 880,
        templateCode: 'application-trained-teachers',
        draft: userDraft,
      })
    )
    expect(publishFormTemplateVersionById).toHaveBeenCalledWith(880)
    expect(updateGeneralProgramFormBinding).toHaveBeenCalledWith(
      'tt-program-1',
      '7',
      expect.objectContaining({
        templateId: 88,
        templateVersionId: 880,
      })
    )
    expect(saved).toEqual({ templateId: 88, templateVersionId: 880, bindingId: 7 })
    expect(
      getRememberedProgramOperationalFormBinding('tt-program-1', 'application-trained-teachers')
    ).toEqual({ templateId: 88, templateVersionId: 880 })
  })

  it('copies even a DRAFT version when ownership is unknown (always COPY — shared data guard)', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 55,
      templateVersionId: 502,
      versionStatus: 'DRAFT',
    })
    copyFormTemplateVersionRemote.mockResolvedValue({ templateId: 88, templateVersionId: 881 })
    publishFormTemplateVersionById.mockResolvedValue(881)

    await saveProgramScopedOperationalFormVersion({
      program: { id: 'tt-program-2' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 502,
      draft: userDraft,
    })

    expect(copyFormTemplateVersionRemote).toHaveBeenCalled()
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 502 })
    )
    expect(publishFormTemplateVersionById).not.toHaveBeenCalledWith(502)
  })

  it.each([
    ['ownerProgramId(CREATE 직후 적용)', { versionStatus: undefined }, { ownerProgramId: 186363 }],
    ['ownerProgramId + DRAFT', { versionStatus: 'DRAFT' }, { ownerProgramId: 186363 }],
    ['여러 바인딩이 공유하는 DRAFT', { versionStatus: 'DRAFT', activeBindingCount: 3 }, {}],
    ['카탈로그(공용) 템플릿의 DRAFT', { versionStatus: 'DRAFT', templateId: 10 }, {}],
  ])('공용 버전 보호: %s 이면 상태와 무관하게 COPY 후 저장한다', async (_label, version, extra) => {
    fetchFormTemplateVersionRemote.mockResolvedValue({ templateId: 1, templateVersionId: 94, ...version })
    copyFormTemplateVersionRemote.mockReset()
    copyFormTemplateVersionRemote.mockResolvedValue({ templateId: 1, templateVersionId: 9401 })
    publishFormTemplateVersionById.mockResolvedValue(9401)

    await saveProgramScopedOperationalFormVersion({
      program: { id: '186363' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 94,
      draft: userDraft,
      ...extra,
    })

    expect(copyFormTemplateVersionRemote).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ sourceVersionId: 94, ownerProgramId: 186363 })
    )
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 94 })
    )
    expect(publishFormTemplateVersionById).not.toHaveBeenCalledWith(94)
  })
})
