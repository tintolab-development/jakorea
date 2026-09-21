/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

const ensureDraftOwnedFormVersion = vi.fn()
const getDraftOwnedFormVersion = vi.fn()
const loadFormTemplateVersionDraftByVersionId = vi.fn()
const persistDraftOwnedFormVersion = vi.fn()
const publishFormTemplateVersionById = vi.fn()
const ensureRegistrationProgramDraftId = vi.fn()
const collectOperationalOverlayForCatalogId = vi.fn()
const createSeedDraftForOperationalCatalogId = vi.fn()

vi.mock('@/features/program/general/lib/registration-draft-form-versions', () => ({
  ensureDraftOwnedFormVersion: (...args: unknown[]) => ensureDraftOwnedFormVersion(...args),
  getDraftOwnedFormVersion: (...args: unknown[]) => getDraftOwnedFormVersion(...args),
  persistDraftOwnedFormVersion: (...args: unknown[]) => persistDraftOwnedFormVersion(...args),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    loadFormTemplateVersionDraftByVersionId(...args),
  publishFormTemplateVersionById: (...args: unknown[]) => publishFormTemplateVersionById(...args),
}))

vi.mock('@/features/program/general/lib/registration-program-draft-session', () => ({
  ensureRegistrationProgramDraftId: (...args: unknown[]) =>
    ensureRegistrationProgramDraftId(...args),
}))

vi.mock('@/features/program/general/lib/registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
}))

vi.mock('@/features/program/general/lib/registration-operational-form-drafts', () => ({
  collectOperationalOverlayForCatalogId: (...args: unknown[]) =>
    collectOperationalOverlayForCatalogId(...args),
  createSeedDraftForOperationalCatalogId: (...args: unknown[]) =>
    createSeedDraftForOperationalCatalogId(...args),
}))

vi.mock(
  '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush',
  () => ({
    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay: vi.fn(),
  })
)

import { prepareRegistrationCreateFormBindings } from './prepare-registration-create-form-bindings'

describe('prepareRegistrationCreateFormBindings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ensureRegistrationProgramDraftId.mockResolvedValue(99)
    getDraftOwnedFormVersion.mockReturnValue(undefined)
    ensureDraftOwnedFormVersion.mockImplementation(async (args: { templateCode: string }) => ({
      templateCode: args.templateCode,
      templateId: 10,
      draftVersionId: 100,
    }))
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue({
      draft: createProgramRegistrationDraft(),
    })
    persistDraftOwnedFormVersion.mockImplementation(
      async (args: { templateCode: string; draftVersionId?: number }) => ({
        templateCode: args.templateCode,
        templateId: 10,
        draftVersionId: 100,
      })
    )
    publishFormTemplateVersionById.mockImplementation(async (versionId: number) => versionId + 1000)
    collectOperationalOverlayForCatalogId.mockReturnValue(null)
    createSeedDraftForOperationalCatalogId.mockReturnValue(createProgramRegistrationDraft())
  })

  it('flushes registration input once then publishes without re-copy', async () => {
    const program = {
      id: '100001',
      generalProgramAudience: 'individual',
      generalParticipantTypes: ['individual'],
    } as Program
    const registrationDraft = createProgramRegistrationDraft()

    const result = await prepareRegistrationCreateFormBindings({
      program,
      registration: {
        templateCode: 'registration-general',
        draft: registrationDraft,
        overlay: { 'program.titleKo': '테스트' },
      },
    })

    expect(result?.programDraftId).toBe(99)
    expect(persistDraftOwnedFormVersion).toHaveBeenCalled()
    expect(publishFormTemplateVersionById).toHaveBeenCalled()
    expect(ensureDraftOwnedFormVersion.mock.calls.length).toBeGreaterThan(0)
    type PersistCallArg = { templateCode?: string; baseline?: unknown }
    const registrationPersist = persistDraftOwnedFormVersion.mock.calls.find(
      (call: PersistCallArg[]) => call[0]?.templateCode === 'registration-general'
    )
    expect(registrationPersist?.[0]?.baseline).toBeDefined()
  })
})
