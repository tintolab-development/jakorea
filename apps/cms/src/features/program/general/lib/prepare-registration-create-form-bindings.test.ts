/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

const collectOperationalOverlayForCatalogId = vi.fn()
const createSeedDraftForOperationalCatalogId = vi.fn()
const listAllRegistrationCreateFormSpecs = vi.fn()
const loadRegistrationWizardFormDraft = vi.fn()

const individualProgramBindingSpecs = [
  {
    templateCode: 'registration-general',
    formType: 'REGISTRATION' as const,
    nameHints: [] as const,
  },
  {
    templateCode: 'recruitment-participant-individual',
    formType: 'RECRUITMENT' as const,
    targetRole: 'INDIVIDUAL',
    nameHints: [] as const,
  },
  {
    templateCode: 'application-participant-individual',
    formType: 'APPLICATION' as const,
    targetRole: 'INDIVIDUAL',
    nameHints: [] as const,
  },
]

vi.mock('@/features/program/general/lib/registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
}))

vi.mock('@/features/program/general/lib/operational-form-bindings', () => ({
  listAllRegistrationCreateFormSpecs: (...args: unknown[]) =>
    listAllRegistrationCreateFormSpecs(...args),
}))

vi.mock('@/features/program/general/lib/registration-wizard-form-draft', () => ({
  loadRegistrationWizardFormDraft: (...args: unknown[]) => loadRegistrationWizardFormDraft(...args),
}))

vi.mock('@/features/program/general/lib/resolve-program-api-type-for-draft', () => ({
  resolveRegistrationProgramDraftProgramType: () => 'GENERAL',
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

const httpCalls: string[] = []
vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(async (config: { url?: string }) => {
    httpCalls.push(String(config?.url ?? ''))
    return {}
  }),
}))

const program = {
  id: '100001',
  generalProgramAudience: 'individual',
  generalParticipantTypes: ['individual'],
} as Program

describe('prepareRegistrationCreateFormBindings (CREATE 후 적용할 양식 목록)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    httpCalls.length = 0
    collectOperationalOverlayForCatalogId.mockReturnValue(null)
    createSeedDraftForOperationalCatalogId.mockReturnValue(createProgramRegistrationDraft())
    listAllRegistrationCreateFormSpecs.mockReturnValue(individualProgramBindingSpecs)
    loadRegistrationWizardFormDraft.mockResolvedValue(null)
  })

  it('서버 호출 없이 순수 데이터만 반환하고 programDraftId·formBindings가 없다', async () => {
    const registrationDraft = createProgramRegistrationDraft()
    const result = await prepareRegistrationCreateFormBindings({
      program,
      registration: {
        templateCode: 'registration-general',
        draft: registrationDraft,
        overlay: { 'program.titleKo': '테스트' },
      },
    })

    expect(httpCalls).toEqual([])
    expect(result).not.toHaveProperty('programDraftId')
    expect(result).not.toHaveProperty('formBindings')
    expect(result?.forms).toEqual([
      {
        templateCode: 'registration-general',
        formType: 'REGISTRATION',
        draft: registrationDraft,
        overlay: { 'program.titleKo': '테스트' },
        editorState: undefined,
      },
    ])
  })

  it('overlay나 로컬 초안이 있는 운영 양식만 포함하고 나머지는 기본 바인딩에 맡긴다', async () => {
    collectOperationalOverlayForCatalogId.mockImplementation((code: string) =>
      code === 'recruitment-participant-individual' ? { 'recruit.foo': 'bar' } : null
    )
    const appDraft = createProgramRegistrationDraft()
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) =>
        args.templateCode === 'application-participant-individual'
          ? { draft: appDraft, editorState: { a: 1 }, settingsJson: { s: 1 } }
          : null
    )

    const result = await prepareRegistrationCreateFormBindings({ program })

    expect(result?.forms.map(item => item.templateCode)).toEqual([
      'recruitment-participant-individual',
      'application-participant-individual',
    ])
    const recruit = result?.forms[0]
    expect(recruit?.draft).toBeNull()
    expect(recruit?.overlay).toEqual({ 'recruit.foo': 'bar' })
    const application = result?.forms[1]
    expect(application?.draft).toBe(appDraft)
    expect(application?.editorState).toEqual({ a: 1 })
    expect(application?.settingsJson).toEqual({ s: 1 })
    expect(loadRegistrationWizardFormDraft).toHaveBeenCalledWith({
      programType: 'GENERAL',
      templateCode: 'application-participant-individual',
    })
  })

  it('operationalOverrides가 있으면 그 양식은 override 값을 쓴다', async () => {
    const overrideDraft = createProgramRegistrationDraft()
    const result = await prepareRegistrationCreateFormBindings({
      program,
      operationalOverrides: [
        {
          templateCode: 'recruitment-participant-individual',
          draft: overrideDraft,
          overlay: { x: 1 },
        },
      ],
    })
    expect(result?.forms).toEqual([
      expect.objectContaining({
        templateCode: 'recruitment-participant-individual',
        draft: overrideDraft,
        overlay: { x: 1 },
      }),
    ])
  })

  it('같은 templateCode 단계가 여러 개여도(1사1교 기관·강사) 한 번만 적용한다', async () => {
    listAllRegistrationCreateFormSpecs.mockReturnValue([
      { templateCode: 'registration-economy', formType: 'REGISTRATION', nameHints: [] },
      { templateCode: 'recruitment-economy', formType: 'RECRUITMENT', targetRole: 'TEACHER', nameHints: [] },
      { templateCode: 'recruitment-economy', formType: 'RECRUITMENT', targetRole: 'INSTRUCTOR', nameHints: [] },
      { templateCode: 'application-economy', formType: 'APPLICATION', targetRole: 'TEACHER', nameHints: [] },
      { templateCode: 'application-economy', formType: 'APPLICATION', targetRole: 'INSTRUCTOR', nameHints: [] },
    ])
    collectOperationalOverlayForCatalogId.mockReturnValue({ k: 1 })
    const result = await prepareRegistrationCreateFormBindings({ program })
    expect(result?.forms.map(item => item.templateCode)).toEqual([
      'recruitment-economy',
      'application-economy',
    ])
  })
})
