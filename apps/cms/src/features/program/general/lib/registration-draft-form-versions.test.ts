/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApplicantRecruitFormIndividualDraft } from '@/features/template/model/applicant-recruit-form-individual-draft'
import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'

const loadFormTemplateVersionDraftByVersionId = vi.fn()
const saveFormTemplateVersionDraftByVersionId = vi.fn()
const resolveFormTemplateCatalogIds = vi.fn()
const copyFormTemplateVersionRemote = vi.fn()
const updateFormTemplateRemote = vi.fn()
const fetchFormTemplateVersionRemote = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', async importOriginal => {
  const actual = await importOriginal<
    typeof import('@/features/template/api/admin-form-templates-service')
  >()
  return {
    ...actual,
    loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
      loadFormTemplateVersionDraftByVersionId(...args),
    saveFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
      saveFormTemplateVersionDraftByVersionId(...args),
    resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  }
})

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyFormTemplateVersionRemote(...args),
  updateFormTemplateRemote: (...args: unknown[]) => updateFormTemplateRemote(...args),
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
}))

import {
  clearDraftOwnedFormVersions,
  ensureDraftOwnedFormVersion,
  ensureDraftOwnedFormVersionWithBaseline,
  getDraftOwnedFormVersion,
  persistDraftOwnedFormVersion,
  rememberDraftOwnedFormVersion,
} from './registration-draft-form-versions'

describe('persistDraftOwnedFormVersion baseline dedup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDraftOwnedFormVersions()
    rememberDraftOwnedFormVersion(1, {
      templateCode: 'recruitment-instructor',
      templateId: 10,
      draftVersionId: 100,
    })
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue({
      draft: createApplicantRecruitFormIndividualDraft(),
    })
    saveFormTemplateVersionDraftByVersionId.mockResolvedValue(undefined)
    fetchFormTemplateVersionRemote.mockResolvedValue({ versionStatus: 'DRAFT' })
  })

  it('skips baseline GET when baseline and owned are passed from caller', async () => {
    const userDraft = createApplicantRecruitFormIndividualDraft()
    const baseline: WritingFormTemplateSaveRecord = {
      version: 1,
      templateId: 'recruitment-instructor',
      savedAt: '2026-01-01T00:00:00.000Z',
      draft: createApplicantRecruitFormIndividualDraft(),
      overlay: {},
    }
    const owned = {
      templateCode: 'recruitment-instructor',
      templateId: 10,
      draftVersionId: 100,
    }

    await persistDraftOwnedFormVersion({
      programDraftId: 1,
      templateCode: 'recruitment-instructor',
      owned,
      draft: userDraft,
      overlay: { 'recruit.instructor.inquiryContact': 'test' },
      baseline,
    })

    expect(fetchFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(loadFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledTimes(1)
  })

  it('loads baseline when baseline is not passed', async () => {
    const userDraft = createApplicantRecruitFormIndividualDraft()

    await persistDraftOwnedFormVersion({
      programDraftId: 1,
      templateCode: 'recruitment-instructor',
      draft: userDraft,
    })

    expect(loadFormTemplateVersionDraftByVersionId).toHaveBeenCalledTimes(1)
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledTimes(1)
  })
})

describe('ensureDraftOwnedFormVersion re-copy on stale (published) cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDraftOwnedFormVersions()
    rememberDraftOwnedFormVersion(1, {
      templateCode: 'recruitment-instructor',
      templateId: 10,
      draftVersionId: 100,
    })
  })

  it('discards a cached version that is already PUBLISHED and copies a fresh DRAFT', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({ versionStatus: 'PUBLISHED' })
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 900 })
    copyFormTemplateVersionRemote.mockResolvedValue({ templateId: 10, templateVersionId: 200 })

    const owned = await ensureDraftOwnedFormVersion({
      programDraftId: 1,
      templateCode: 'recruitment-instructor',
    })

    expect(fetchFormTemplateVersionRemote).toHaveBeenCalledWith(100)
    expect(copyFormTemplateVersionRemote).toHaveBeenCalledTimes(1)
    expect(owned.draftVersionId).toBe(200)
    expect(getDraftOwnedFormVersion(1, 'recruitment-instructor')?.draftVersionId).toBe(200)
  })

  it('reuses the cached version when it is still DRAFT', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      versionStatus: 'DRAFT',
      schemaJson: '{}',
    })

    const owned = await ensureDraftOwnedFormVersion({
      programDraftId: 1,
      templateCode: 'recruitment-instructor',
    })

    expect(fetchFormTemplateVersionRemote).toHaveBeenCalledTimes(1)
    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(owned.draftVersionId).toBe(100)
  })
})

describe('ensureDraftOwnedFormVersionWithBaseline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDraftOwnedFormVersions()
    rememberDraftOwnedFormVersion(1, {
      templateCode: 'recruitment-instructor',
      templateId: 10,
      draftVersionId: 100,
    })
    saveFormTemplateVersionDraftByVersionId.mockResolvedValue(undefined)
    fetchFormTemplateVersionRemote.mockResolvedValue({
      versionStatus: 'DRAFT',
      schemaJson: JSON.stringify(createApplicantRecruitFormIndividualDraft()),
      extensionJson: '{}',
    })
  })

  it('uses a single version GET for mutable check and baseline on cache hit', async () => {
    const { owned, baseline } = await ensureDraftOwnedFormVersionWithBaseline({
      programDraftId: 1,
      templateCode: 'recruitment-instructor',
    })

    expect(fetchFormTemplateVersionRemote).toHaveBeenCalledTimes(1)
    expect(fetchFormTemplateVersionRemote).toHaveBeenCalledWith(100)
    expect(loadFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
    expect(owned.draftVersionId).toBe(100)
    expect(baseline?.draft).toBeDefined()
  })
})
