import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveFormTemplateCatalogIds = vi.fn()
const publishFormTemplateVersionById = vi.fn()
const fetchFormTemplateVersionsRemote = vi.fn()
const fetchFormTemplateVersionRemote = vi.fn()

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  publishFormTemplateVersionById: (...args: unknown[]) => publishFormTemplateVersionById(...args),
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchFormTemplateVersionsRemote(...args),
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
}))

import {
  readSurveySubmissionPeriodFromSchema,
  readSurveyTitleFromSchema,
  resolvePublishedSurveyBinding,
  surveyBindingResolutionAlert,
} from '@/features/program/shared/lib/survey-management/resolve-published-survey-binding'

const START = '2026-10-20T00:00:00.000Z'
const END = '2026-10-31T14:59:59.000Z'

function titleSchema(title: Record<string, unknown>): string {
  return JSON.stringify({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'none' },
    paragraphs: [
      {
        id: 'title',
        kind: 'description',
        variant: 'survey_title_with_period',
        title: '설문',
        ...title,
      },
    ],
  })
}

describe('readSurveyTitleFromSchema', () => {
  it('reads surveyTitle from the title period paragraph', () => {
    expect(
      readSurveyTitleFromSchema(
        titleSchema({
          surveyTitle: '2026 봄 만족도 조사',
        })
      )
    ).toBe('2026 봄 만족도 조사')
  })

  it('returns undefined when surveyTitle is blank', () => {
    expect(readSurveyTitleFromSchema(titleSchema({ surveyTitle: '   ' }))).toBeUndefined()
  })
})

describe('readSurveySubmissionPeriodFromSchema', () => {
  it('reads custom start/end dates from the title period paragraph', () => {
    expect(
      readSurveySubmissionPeriodFromSchema(
        titleSchema({
          showWritingPeriodOnForm: true,
          startPeriodMode: 'custom',
          endPeriodMode: 'custom',
          startAt: START,
          endAt: END,
        })
      )
    ).toEqual({ submissionStartAt: START, submissionEndAt: END })
  })

  it('skips the period when the form hides it', () => {
    expect(
      readSurveySubmissionPeriodFromSchema(
        titleSchema({ showWritingPeriodOnForm: false, startPeriodMode: 'custom', startAt: START })
      )
    ).toEqual({})
  })

  it('skips immediate start and relative presets', () => {
    expect(
      readSurveySubmissionPeriodFromSchema(
        titleSchema({
          showWritingPeriodOnForm: true,
          startPeriodMode: 'immediate',
          endPeriodMode: 'custom',
          endAt: END,
          endPeriodPresetLabel: '활동일 익월 5일 (24:00)',
        })
      )
    ).toEqual({})
  })
})

describe('resolvePublishedSurveyBinding', () => {
  beforeEach(() => {
    resolveFormTemplateCatalogIds.mockReset()
    publishFormTemplateVersionById.mockReset()
    fetchFormTemplateVersionsRemote.mockReset()
    fetchFormTemplateVersionRemote.mockReset()
    fetchFormTemplateVersionRemote.mockResolvedValue({ schemaJson: null })
  })

  it('includes the form writing period of the bound version', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 1995, templateVersionId: 352 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 352, versionNo: 1, versionStatus: 'PUBLISHED' },
    ])
    fetchFormTemplateVersionRemote.mockResolvedValue({
      schemaJson: titleSchema({
        showWritingPeriodOnForm: true,
        startPeriodMode: 'custom',
        endPeriodMode: 'custom',
        startAt: START,
        endAt: END,
      }),
    })

    await expect(resolvePublishedSurveyBinding('survey-period')).resolves.toEqual({
      ok: true,
      templateId: 1995,
      templateVersionId: 352,
      submissionStartAt: START,
      submissionEndAt: END,
    })
    expect(fetchFormTemplateVersionRemote).toHaveBeenCalledWith(352)
  })

  it('binds the latest version directly when it is already published', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 101 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 100, versionNo: 1, versionStatus: 'PUBLISHED' },
      { templateVersionId: 101, versionNo: 2, versionStatus: 'DRAFT' },
      { templateVersionId: 102, versionNo: 3, versionStatus: 'PUBLISHED' },
    ])

    await expect(resolvePublishedSurveyBinding('survey-student')).resolves.toEqual({
      ok: true,
      templateId: 99,
      templateVersionId: 102,
    })
    expect(fetchFormTemplateVersionsRemote).toHaveBeenCalledWith(99)
    expect(publishFormTemplateVersionById).not.toHaveBeenCalled()
  })

  it('publishes the latest draft of the same template instead of duplicating it', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 1995, templateVersionId: 352 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 352, versionNo: 1, versionStatus: 'DRAFT' },
    ])
    publishFormTemplateVersionById.mockResolvedValue(352)

    await expect(resolvePublishedSurveyBinding('survey-period')).resolves.toEqual({
      ok: true,
      templateId: 1995,
      templateVersionId: 352,
    })
    expect(publishFormTemplateVersionById).toHaveBeenCalledWith(352)
  })

  it('publishes a newer draft over an older published version', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 101 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 100, versionNo: 1, versionStatus: 'PUBLISHED' },
      { templateVersionId: 101, versionNo: 2, versionStatus: 'DRAFT' },
    ])
    publishFormTemplateVersionById.mockResolvedValue(101)

    await expect(resolvePublishedSurveyBinding('survey-student')).resolves.toEqual({
      ok: true,
      templateId: 99,
      templateVersionId: 101,
    })
  })

  it('binds the in-use published version instead of publishing a newer draft (avoids archiving it)', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 101 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 100, versionNo: 1, versionStatus: 'PUBLISHED', activeBindingCount: 2 },
      { templateVersionId: 101, versionNo: 2, versionStatus: 'DRAFT' },
    ])

    await expect(resolvePublishedSurveyBinding('survey-student')).resolves.toEqual({
      ok: true,
      templateId: 99,
      templateVersionId: 100,
    })
    expect(publishFormTemplateVersionById).not.toHaveBeenCalled()
  })

  it('returns not_published when no draft or published version exists', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 99, templateVersionId: 100 })
    fetchFormTemplateVersionsRemote.mockResolvedValue([
      { templateVersionId: 100, versionNo: 1, versionStatus: 'ARCHIVED' },
    ])

    await expect(resolvePublishedSurveyBinding('survey-student')).resolves.toEqual({
      ok: false,
      reason: 'not_published',
    })
  })

  it('returns not_found when the selected template has no server id', async () => {
    resolveFormTemplateCatalogIds.mockResolvedValue(null)

    await expect(resolvePublishedSurveyBinding('missing')).resolves.toEqual({
      ok: false,
      reason: 'not_found',
    })
    expect(fetchFormTemplateVersionsRemote).not.toHaveBeenCalled()
  })
})

describe('surveyBindingResolutionAlert', () => {
  it('describes each failure reason', () => {
    expect(surveyBindingResolutionAlert('not_published')).toContain('등록 가능한 버전')
    expect(surveyBindingResolutionAlert('not_found')).toContain('서버 ID')
  })
})
