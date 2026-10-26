import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import { queryClient } from '@/shared/lib/query-client'
import {
  isProgramFormVersionMutable,
  resolveApplicationFormLoadSource,
  resolveProgramOperationalFormLoadSource,
} from './sync-registration-form-bindings'

const fetchFormTemplateVersionRemote = vi.fn()
const copyFormTemplateVersionRemote = vi.fn()
const saveFormTemplateVersionDraftByVersionId = vi.fn()
const publishFormTemplateVersionById = vi.fn()
const resolveFormTemplateCatalogIds = vi.fn()
const fetchGeneralProgramFormBindings = vi.fn()
const updateGeneralProgramFormBinding = vi.fn()
const createGeneralProgramFormBinding = vi.fn()

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyFormTemplateVersionRemote(...args),
  updateFormTemplateRemote: vi.fn(),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  saveFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    saveFormTemplateVersionDraftByVersionId(...args),
  publishFormTemplateVersionById: (...args: unknown[]) => publishFormTemplateVersionById(...args),
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  loadFormTemplateVersionDraftByVersionId: vi.fn(),
  shouldUseFormsSurveysRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramFormBindings: (...args: unknown[]) => fetchGeneralProgramFormBindings(...args),
  updateGeneralProgramFormBinding: (...args: unknown[]) => updateGeneralProgramFormBinding(...args),
  createGeneralProgramFormBinding: (...args: unknown[]) => createGeneralProgramFormBinding(...args),
}))

vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseProgramsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/ujat/api/capabilities', () => ({
  shouldUseRemoteApi: () => false,
}))

function binding(partial: ProgramFormBindingResponse): ProgramFormBindingResponse {
  return { active: true, ...partial }
}

describe('resolveApplicationFormLoadSource', () => {
  it('prefers local draft while catalog APPLICATION binding is still shared', () => {
    const source = resolveApplicationFormLoadSource({
      programId: 'p1',
      templateCode: 'application-participant-individual',
      catalogTemplateId: 22,
      bindings: [
        binding({
          formType: 'APPLICATION',
          templateId: 22,
          templateVersionId: 202,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
      ],
    })
    expect(source).toEqual({ preferLocalDraft: true })
  })

  it('loads program-scoped binding version when templateId diverged from catalog', () => {
    const source = resolveApplicationFormLoadSource({
      programId: 'p1',
      templateCode: 'application-participant-individual',
      catalogTemplateId: 22,
      bindings: [
        binding({
          formType: 'APPLICATION',
          templateId: 99,
          templateVersionId: 501,
          targetRole: 'INDIVIDUAL',
          templateName: '참여자 신청',
        }),
      ],
    })
    expect(source).toEqual({ templateVersionId: 501, preferLocalDraft: false })
  })

  it('uses the API binding even when its templateId matches the catalog in strict remote mode', () => {
    const source = resolveApplicationFormLoadSource({
      programId: '186264',
      templateCode: 'application-trained-teachers',
      catalogTemplateId: 22,
      strictRemote: true,
      bindings: [
        binding({
          formType: 'APPLICATION',
          templateId: 22,
          templateVersionId: 902,
          targetRole: 'ORGANIZATION',
          templateName: '교육받은 교사 참여 기관 신청',
        }),
      ],
    })

    expect(source).toEqual({ templateVersionId: 902, preferLocalDraft: false })
  })

  it('does not fall back to a local seed when the strict remote binding is missing', () => {
    const source = resolveApplicationFormLoadSource({
      programId: '186264',
      templateCode: 'application-trained-teachers',
      catalogTemplateId: 22,
      strictRemote: true,
      bindings: [],
    })

    expect(source).toEqual({
      preferLocalDraft: false,
      unavailableReason: '신청 양식 바인딩이 없습니다.',
    })
  })
})

describe('resolveProgramOperationalFormLoadSource', () => {
  beforeEach(() => {
    queryClient.clear()
    resolveFormTemplateCatalogIds.mockReset()
    fetchGeneralProgramFormBindings.mockReset()
  })

  it('reads the bound recruitment version even when templateId still matches catalog', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 22, templateVersionId: 1 })
    fetchGeneralProgramFormBindings.mockResolvedValue([
      binding({
        formType: 'RECRUITMENT',
        templateId: 22,
        templateVersionId: 392,
        targetRole: 'ORGANIZATION',
        templateName: '참여 기관 모집',
      }),
    ])

    const source = await resolveProgramOperationalFormLoadSource(
      { id: 'ujat-1' } as Program,
      'recruitment-ujat-school'
    )

    expect(source).toEqual({ templateVersionId: 392, preferLocalDraft: false })
    expect(resolveApplicationFormLoadSource({
      programId: 'ujat-1',
      templateCode: 'recruitment-ujat-school',
      catalogTemplateId: 22,
      bindings: [
        binding({
          formType: 'RECRUITMENT',
          templateId: 22,
          templateVersionId: 392,
          targetRole: 'ORGANIZATION',
          templateName: '참여 기관 모집',
        }),
      ],
    })).toEqual({ preferLocalDraft: true })
  })
})

describe('isProgramFormVersionMutable', () => {
  it('allows only draft status (unknown status is treated as immutable — shared data guard)', () => {
    expect(isProgramFormVersionMutable('DRAFT')).toBe(true)
    expect(isProgramFormVersionMutable(undefined)).toBe(false)
    expect(isProgramFormVersionMutable('PUBLISHED')).toBe(false)
    expect(isProgramFormVersionMutable('ARCHIVED')).toBe(false)
  })
})
