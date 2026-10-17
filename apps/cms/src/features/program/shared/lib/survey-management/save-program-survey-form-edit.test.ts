import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchVersion = vi.fn()
const copyVersion = vi.fn()
const updateVersion = vi.fn()
const updateTemplate = vi.fn()
const publishVersion = vi.fn()
const updateBinding = vi.fn()
const listBindings = vi.fn()
const validate = vi.fn()

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchVersion(...args),
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyVersion(...args),
  updateFormTemplateVersionRemote: (...args: unknown[]) => updateVersion(...args),
  updateFormTemplateRemote: (...args: unknown[]) => updateTemplate(...args),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  publishFormTemplateVersionById: (...args: unknown[]) => publishVersion(...args),
}))

vi.mock('@/features/program/general/api/programs-api-client', () => ({
  updateAdminProgramFormBindingRemote: (...args: unknown[]) => updateBinding(...args),
  fetchAdminProgramFormBindingsRemote: (...args: unknown[]) => listBindings(...args),
}))

vi.mock('@/features/program/shared/lib/survey-management/survey-writing-draft', () => ({
  validateSurveyWritingDraft: (...args: unknown[]) => validate(...args),
}))

vi.mock('@/features/template/api/adapters/form-template-draft-adapters', () => ({
  writingFormDraftToSchemaJson: () => '{"edited":true}',
}))

vi.mock('@/features/program/shared/lib/survey-management/resolve-published-survey-binding', () => ({
  readSurveySubmissionPeriodFromSchema: () => ({ submissionStartAt: '2026-10-20T00:00:00.000Z' }),
}))

import {
  buildProgramSurveyFormEditTarget,
  resolveProgramSurveyFormEditFailure,
  saveProgramSurveyFormEdit,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import { createNewSurveyDraft } from '@/features/template/model/writing-form-draft.schema'

const TARGET = { programId: '186051', bindingId: '900', sourceVersionId: 352, title: '설문' }

describe('buildProgramSurveyFormEditTarget', () => {
  it('requires a remote binding id and numeric version id', () => {
    expect(
      buildProgramSurveyFormEditTarget('186051', { id: '352', title: '설문', bindingId: '900' })
    ).toEqual(TARGET)
    expect(buildProgramSurveyFormEditTarget('186051', { id: '352', title: '설문' })).toBeNull()
    expect(
      buildProgramSurveyFormEditTarget('186051', { id: 'temp-1', title: '설문', bindingId: '900' })
    ).toBeNull()
  })
})

describe('saveProgramSurveyFormEdit', () => {
  beforeEach(() => {
    for (const mock of [fetchVersion, copyVersion, updateVersion, updateTemplate, publishVersion, updateBinding, listBindings, validate]) {
      mock.mockReset()
    }
    validate.mockReturnValue({ ok: true })
    fetchVersion.mockResolvedValue({ templateId: 1995, templateVersionId: 352 })
    copyVersion.mockResolvedValue({ templateId: 2001, templateVersionId: 400 })
    publishVersion.mockResolvedValue(400)
    listBindings.mockResolvedValue([
      { bindingId: 900, progressStatus: 'BEFORE_START', submittedCount: 0 },
    ])
  })

  it('copies the bound version, saves and publishes the copy, then rebinds only this program', async () => {
    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: true,
      templateId: 2001,
      templateVersionId: 400,
    })

    expect(copyVersion).toHaveBeenCalledWith(1995, {
      sourceVersionId: 352,
      ownerProgramId: 186051,
    })
    expect(updateVersion).toHaveBeenCalledWith(400, { schemaJson: '{"edited":true}' })
    expect(publishVersion).toHaveBeenCalledWith(400)
    expect(updateTemplate).toHaveBeenCalledWith(2001, { templateName: '설문' })
    expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
      templateId: 2001,
      templateVersionId: 400,
      submissionStartAt: '2026-10-20T00:00:00.000Z',
    })
  })

  it('stops before any remote write when the draft is invalid', async () => {
    validate.mockReturnValue({ ok: false, message: '문항을 1개 이상 추가해 주세요.' })

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: false,
      message: '문항을 1개 이상 추가해 주세요.',
    })
    expect(copyVersion).not.toHaveBeenCalled()
    expect(updateBinding).not.toHaveBeenCalled()
  })

  it('등록 직후(기간 null·IN_PROGRESS)에는 기간을 먼저 넣고 양식 저장을 진행한다', async () => {
    listBindings
      .mockResolvedValueOnce([
        { bindingId: 900, progressStatus: 'IN_PROGRESS', submittedCount: 0 },
      ])
      .mockResolvedValueOnce([
        {
          bindingId: 900,
          progressStatus: 'BEFORE_START',
          submittedCount: 0,
          availableActions: ['UPDATE_TEMPLATE'],
        },
      ])

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: true,
      templateId: 2001,
      templateVersionId: 400,
    })

    expect(updateBinding).toHaveBeenNthCalledWith(1, '186051', '900', {
      submissionStartAt: '2026-10-20T00:00:00.000Z',
    })
    expect(copyVersion).toHaveBeenCalled()
  })

  it.each([
    { progressStatus: 'IN_PROGRESS', submittedCount: 0, submissionStartAt: '2020-01-01T00:00:00.000Z' },
    { progressStatus: 'BEFORE_START', submittedCount: 2 },
  ])('does not copy when the binding is no longer swappable (%o)', async binding => {
    listBindings.mockResolvedValue([{ bindingId: 900, ...binding }])

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toMatchObject({
      ok: false,
      refetchBindings: true,
    })
    expect(copyVersion).not.toHaveBeenCalled()
  })
})

describe('resolveProgramSurveyFormEditFailure', () => {
  const apiError = (status: number, code?: string, message?: string) => ({
    response: { status, data: { error: { code, message } } },
  })

  it('maps binding swap errors to program edit messages', () => {
    expect(
      resolveProgramSurveyFormEditFailure(apiError(409, 'FORM_BINDING_TEMPLATE_LOCKED', '이미 진행 중입니다.'))
    ).toEqual({ message: '이미 진행 중입니다.', refetchBindings: true })
    expect(
      resolveProgramSurveyFormEditFailure(apiError(400, 'FORM_BINDING_FORM_TYPE_IMMUTABLE'))
    ).toEqual({ message: '같은 유형의 양식으로만 교체할 수 있습니다.', refetchBindings: false })
    expect(resolveProgramSurveyFormEditFailure(apiError(403, 'FORBIDDEN'))).toEqual({
      message: '이 프로그램의 양식을 수정할 권한이 없습니다.',
      refetchBindings: false,
    })
    expect(resolveProgramSurveyFormEditFailure(apiError(500, 'INTERNAL'))).toBeUndefined()
  })
})
