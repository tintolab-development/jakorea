/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

const ensureDraftOwnedFormVersion = vi.fn()
const ensureDraftOwnedFormVersionWithBaseline = vi.fn()
const persistDraftOwnedFormVersion = vi.fn()
const publishFormTemplateVersionById = vi.fn()
const ensureRegistrationProgramDraftId = vi.fn()
const collectOperationalOverlayForCatalogId = vi.fn()
const createSeedDraftForOperationalCatalogId = vi.fn()

vi.mock('@/features/program/general/lib/registration-draft-form-versions', () => ({
  ensureDraftOwnedFormVersion: (...args: unknown[]) => ensureDraftOwnedFormVersion(...args),
  ensureDraftOwnedFormVersionWithBaseline: (...args: unknown[]) =>
    ensureDraftOwnedFormVersionWithBaseline(...args),
  persistDraftOwnedFormVersion: (...args: unknown[]) => persistDraftOwnedFormVersion(...args),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
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
    const ownedRef = (templateCode: string) => ({
      templateCode,
      templateId: 10,
      draftVersionId: 100,
    })
    ensureDraftOwnedFormVersion.mockImplementation(async (args: { templateCode: string }) =>
      ownedRef(args.templateCode)
    )
    ensureDraftOwnedFormVersionWithBaseline.mockImplementation(
      async (args: { templateCode: string }) => ({
        owned: ownedRef(args.templateCode),
        baseline: { draft: createProgramRegistrationDraft() },
      })
    )
    persistDraftOwnedFormVersion.mockImplementation(
      async (args: { templateCode: string }) => ownedRef(args.templateCode)
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
    expect(ensureDraftOwnedFormVersionWithBaseline).toHaveBeenCalled()
    type PersistCallArg = { templateCode?: string; baseline?: unknown; owned?: unknown }
    const registrationPersist = persistDraftOwnedFormVersion.mock.calls.find(
      (call: PersistCallArg[]) => call[0]?.templateCode === 'registration-general'
    )
    expect(registrationPersist?.[0]?.baseline).toBeDefined()
    expect(registrationPersist?.[0]?.owned).toBeDefined()

    // targetRole이 있는 모든 binding(RECRUITMENT/APPLICATION)엔 BE canonical `targetType`도 같이 보낸다.
    // (targetRole만 보내면 BE가 recruitments[].targetType과 매칭 못해
    // GENERAL_PROGRAM_APPLICATION_FORM_BINDING_REQUIRED로 거절할 수 있음 — 2026-09-21 관측)
    const roleBoundBindings = result?.formBindings.filter(binding => binding.targetRole != null) ?? []
    expect(roleBoundBindings.length).toBeGreaterThan(0)
    for (const binding of roleBoundBindings) {
      expect(binding.targetType).toBe(binding.targetRole)
    }
  })
})
