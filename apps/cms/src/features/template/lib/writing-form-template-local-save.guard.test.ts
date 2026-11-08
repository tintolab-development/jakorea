import { beforeEach, describe, expect, it, vi } from 'vitest'

const saveFormTemplateVersionDraftByVersionId = vi.fn()
const resolveFormTemplateCatalogIds = vi.fn()
const fetchFormTemplateVersionRemote = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  saveFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    saveFormTemplateVersionDraftByVersionId(...args),
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  saveFormTemplateVersionDraft: vi.fn(),
}))
vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
}))

import { persistWritingFormTemplateDraft } from './writing-form-template-local-save'

const draft = { paragraphs: [] } as never

describe('persistWritingFormTemplateDraft(templateVersionId) 공용 버전 가드', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 70 })
  })

  it('카탈로그 버전에는 저장하지 않고 예외를 던진다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({ templateId: 10, versionStatus: 'DRAFT' })
    await expect(
      persistWritingFormTemplateDraft({ templateId: 'application-participant-school', draft, templateVersionId: 70 })
    ).rejects.toThrow(/공용 또는 발행된 양식 버전/)
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
  })

  it('발행 버전에는 저장하지 않는다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({ templateId: 501, versionStatus: 'PUBLISHED' })
    await expect(
      persistWritingFormTemplateDraft({ templateId: 'application-participant-school', draft, templateVersionId: 9001 })
    ).rejects.toThrow()
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
  })

  it('COPY 스코프 DRAFT에는 제자리 저장하지 않는다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 501,
      versionStatus: 'DRAFT',
      templateScope: 'COPY',
    })
    await expect(
      persistWritingFormTemplateDraft({ templateId: 'application-participant-school', draft, templateVersionId: 9002 })
    ).rejects.toThrow(/공용 또는 발행된 양식 버전/)
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
  })

  // 489f03235: 소유 정보(templateScope·ownerProgramId)가 없는 구버전 응답은 catalog templateId 비교로만 판단한다.
  it('소유 정보가 없는 구버전 DRAFT는 카탈로그와 템플릿이 다르면 전용 복사본으로 보고 저장한다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({ templateId: 501, versionStatus: 'DRAFT', activeBindingCount: 1 })
    await persistWritingFormTemplateDraft({
      templateId: 'application-participant-school',
      draft,
      templateVersionId: 9002,
    })
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 9002 })
    )
  })

})
