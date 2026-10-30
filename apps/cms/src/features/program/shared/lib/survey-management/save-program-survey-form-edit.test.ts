import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchVersion = vi.fn()
const copyVersion = vi.fn()
const createVersion = vi.fn()
const updateVersion = vi.fn()
const updateTemplate = vi.fn()
const publishVersion = vi.fn()
const updateBinding = vi.fn()
const listBindings = vi.fn()
const validate = vi.fn()

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchVersion(...args),
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyVersion(...args),
  createFormTemplateVersionRemote: (...args: unknown[]) => createVersion(...args),
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
  PROGRAM_SURVEY_FORM_FOREIGN_OWNER_MESSAGE,
  saveProgramSurveyFormEdit,
} from '@/features/program/shared/lib/survey-management/save-program-survey-form-edit'
import { SURVEY_OPEN_ENDED_END_AT } from '@/features/program/shared/lib/survey-management/survey-binding-period'
import { createNewSurveyDraft } from '@/features/template/model/writing-form-draft.schema'

const TARGET = { programId: '186051', bindingId: '900', sourceVersionId: 352, title: '설문' }

const TODAY_SURVEY_BINDING = {
  bindingId: 900,
  formType: 'SURVEY',
  templateVersionId: 352,
  progressStatus: 'IN_PROGRESS' as const,
  submittedCount: 0,
  submissionStartAt: '2026-10-19T00:00:00.000Z',
  submissionEndAt: '2026-10-19T23:59:59.000Z',
  availableActions: ['VIEW', 'EDIT'],
  createdAt: '2026-10-19T08:55:00.000Z',
}

const UNLOCKED_BINDING = {
  bindingId: 900,
  templateVersionId: 352,
  progressStatus: 'BEFORE_START' as const,
  submittedCount: 0,
  availableActions: ['UPDATE_TEMPLATE'],
}

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
    for (const mock of [fetchVersion, copyVersion, createVersion, updateVersion, updateTemplate, publishVersion, updateBinding, listBindings, validate]) {
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
      submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
    })
  })

  it('이미 이 프로그램 전용(PROGRAM) 템플릿이면 copy 없이 같은 템플릿에 version을 추가해 저장한다', async () => {
    fetchVersion.mockResolvedValue({
      templateId: 196537,
      templateVersionId: 352,
      versionStatus: 'PUBLISHED',
      templateScope: 'PROGRAM',
      ownerProgramId: 186051,
    })
    createVersion.mockResolvedValue({ templateId: 196537, templateVersionId: 410, versionNo: 3 })
    publishVersion.mockResolvedValue(410)

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: true,
      templateId: 196537,
      templateVersionId: 410,
    })
    expect(copyVersion).not.toHaveBeenCalled()
    expect(createVersion).toHaveBeenCalledWith(196537, {
      versionLabel: 'program-186051',
      sourceVersionId: 352,
    })
    expect(updateVersion).toHaveBeenCalledWith(410, { schemaJson: '{"edited":true}' })
    expect(publishVersion).toHaveBeenCalledWith(410)
    expect(updateTemplate).not.toHaveBeenCalled()
    expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
      templateId: 196537,
      templateVersionId: 410,
      submissionStartAt: '2026-10-20T00:00:00.000Z',
      submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
    })
  })

  it('COPY 템플릿도 copy 없이 같은 템플릿에 version을 추가한다', async () => {
    fetchVersion.mockResolvedValue({
      templateId: 3001,
      templateVersionId: 352,
      versionStatus: 'PUBLISHED',
      templateScope: 'COPY',
      ownerProgramId: null,
    })
    createVersion.mockResolvedValue({ templateId: 3001, templateVersionId: 411 })
    publishVersion.mockResolvedValue(411)

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toMatchObject({
      ok: true,
      templateId: 3001,
      templateVersionId: 411,
    })
    expect(copyVersion).not.toHaveBeenCalled()
    expect(createVersion).toHaveBeenCalledWith(3001, expect.objectContaining({ sourceVersionId: 352 }))
  })

  it('CATALOG copy 응답이 기존 PROGRAM 복사본의 PUBLISHED version이면 그 템플릿에 version을 추가한다', async () => {
    fetchVersion.mockResolvedValue({
      templateId: 1995,
      templateVersionId: 352,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyVersion.mockResolvedValue({
      templateId: 2001,
      templateVersionId: 399,
      versionStatus: 'PUBLISHED',
      templateScope: 'PROGRAM',
      ownerProgramId: 186051,
    })
    createVersion.mockResolvedValue({ templateId: 2001, templateVersionId: 400 })

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: true,
      templateId: 2001,
      templateVersionId: 400,
    })
    expect(copyVersion).toHaveBeenCalledWith(1995, { sourceVersionId: 352, ownerProgramId: 186051 })
    expect(createVersion).toHaveBeenCalledWith(2001, {
      versionLabel: 'program-186051',
      sourceVersionId: 399,
    })
    expect(updateVersion).toHaveBeenCalledWith(400, { schemaJson: '{"edited":true}' })
    expect(updateVersion).not.toHaveBeenCalledWith(399, expect.anything())
    expect(publishVersion).toHaveBeenCalledWith(400)
  })

  it('CATALOG copy 응답이 DRAFT면 version을 추가하지 않고 그 DRAFT에 저장한다', async () => {
    fetchVersion.mockResolvedValue({
      templateId: 1995,
      templateVersionId: 352,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyVersion.mockResolvedValue({ templateId: 2001, templateVersionId: 400, versionStatus: 'DRAFT' })

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toMatchObject({
      ok: true,
      templateVersionId: 400,
    })
    expect(createVersion).not.toHaveBeenCalled()
    expect(updateVersion).toHaveBeenCalledWith(400, { schemaJson: '{"edited":true}' })
  })

  it('구버전 응답으로 copy를 골랐는데 카탈로그 원본 아님 400이면 같은 템플릿에 version을 추가한다', async () => {
    copyVersion.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: {
            code: 'BAD_REQUEST',
            message:
              '신규 템플릿은 카탈로그 원본에서만 복제할 수 있습니다. 프로그램 전용 복사본은 같은 템플릿에 버전을 추가해 주세요.',
          },
        },
      },
    })
    createVersion.mockResolvedValue({ templateId: 1995, templateVersionId: 420 })
    publishVersion.mockResolvedValue(420)

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: true,
      templateId: 1995,
      templateVersionId: 420,
    })
    expect(createVersion).toHaveBeenCalledWith(1995, {
      versionLabel: 'program-186051',
      sourceVersionId: 352,
    })
  })

  it('다른 프로그램 소유 PROGRAM 템플릿이면 원격 쓰기 없이 차단한다', async () => {
    fetchVersion.mockResolvedValue({
      templateId: 196537,
      templateVersionId: 352,
      versionStatus: 'PUBLISHED',
      templateScope: 'PROGRAM',
      ownerProgramId: 999999,
    })

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: false,
      message: PROGRAM_SURVEY_FORM_FOREIGN_OWNER_MESSAGE,
    })
    expect(copyVersion).not.toHaveBeenCalled()
    expect(createVersion).not.toHaveBeenCalled()
    expect(updateVersion).not.toHaveBeenCalled()
    expect(publishVersion).not.toHaveBeenCalled()
    expect(updateBinding).not.toHaveBeenCalled()
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
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T00:00:00.000Z'))
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

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 2001,
        templateVersionId: 400,
      })

      expect(updateBinding).toHaveBeenNthCalledWith(1, '186051', '900', {
        submissionStartAt: '2026-10-20T00:00:00.000Z',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
      expect(copyVersion).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('등록 직후 SURVEY(서버가 오늘 시작일을 채움·IN_PROGRESS)에도 기간을 먼저 넣고 저장한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T09:00:00.000Z'))
    listBindings
      .mockResolvedValueOnce([TODAY_SURVEY_BINDING])
      .mockResolvedValueOnce([UNLOCKED_BINDING])

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 2001,
        templateVersionId: 400,
      })

      expect(updateBinding).toHaveBeenNthCalledWith(1, '186051', '900', {
        submissionStartAt: '2026-10-20T00:00:00.000Z',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
      expect(updateBinding).toHaveBeenLastCalledWith('186051', '900', {
        templateId: 2001,
        templateVersionId: 400,
        submissionStartAt: '2026-10-20T00:00:00.000Z',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
      expect(copyVersion).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('시작일이 오늘이어도 생성일이 다른 IN_PROGRESS 설문은 양식 교체 없이 기간만 저장한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T09:00:00.000Z'))
    listBindings.mockResolvedValue([
      {
        bindingId: 900,
        templateId: 1995,
        templateVersionId: 352,
        progressStatus: 'IN_PROGRESS',
        submittedCount: 0,
        submissionStartAt: '2026-10-19T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
      },
    ])

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 1995,
        templateVersionId: 352,
      })
      expect(copyVersion).not.toHaveBeenCalled()
      expect(updateBinding).toHaveBeenCalledTimes(1)
      expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
        submissionStartAt: '2026-10-20T00:00:00.000Z',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('최초 저장으로 version이 바뀐 당일 IN_PROGRESS 설문은 기간만 저장한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T09:00:00.000Z'))
    listBindings.mockResolvedValue([
      {
        ...TODAY_SURVEY_BINDING,
        templateId: 1995,
        templateVersionId: 400,
      },
    ])

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 1995,
        templateVersionId: 400,
      })
      expect(copyVersion).not.toHaveBeenCalled()
      expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
        submissionStartAt: '2026-10-20T00:00:00.000Z',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('UTC 날짜가 같아도 Asia/Seoul 달력이 다르면 양식 교체 없이 기간만 저장한다', async () => {
    vi.useFakeTimers()
    // 2026-10-19T16:30Z = KST 10/20 01:30. start 10/19 09:00 KST.
    vi.setSystemTime(new Date('2026-10-19T16:30:00.000Z'))
    listBindings.mockResolvedValue([{ ...TODAY_SURVEY_BINDING, templateId: 1995 }])

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 1995,
        templateVersionId: 352,
      })
      expect(copyVersion).not.toHaveBeenCalled()
      expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
        submissionStartAt: '2026-10-20T00:00:00.000Z',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('응답 0건인 종료 설문은 기간을 다시 연 뒤 저장한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-27T00:00:00.000Z'))
    listBindings
      .mockResolvedValueOnce([
        {
          bindingId: 900,
          formType: 'SURVEY',
          templateVersionId: 352,
          progressStatus: 'FINISHED',
          submittedCount: 0,
          submissionStartAt: '2026-10-24T15:00:00.000Z',
          submissionEndAt: '2026-10-25T14:59:59.999Z',
          createdAt: '2026-10-24T08:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([UNLOCKED_BINDING])

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 2001,
        templateVersionId: 400,
      })
      expect(updateBinding).toHaveBeenNthCalledWith(1, '186051', '900', {
        submissionStartAt: '2026-10-28T00:00:00.000+09:00',
        submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
      })
      expect(copyVersion).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('KST 달력이 같으면 UTC 자정 경계에서도 최초 저장 잠금 해제를 한다', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T16:30:00.000Z'))
    listBindings
      .mockResolvedValueOnce([
        {
          ...TODAY_SURVEY_BINDING,
          submissionStartAt: '2026-10-19T16:00:00.000Z',
          submissionEndAt: '2026-10-20T14:59:59.000Z',
          createdAt: '2026-10-19T16:05:00.000Z',
        },
      ])
      .mockResolvedValueOnce([UNLOCKED_BINDING])

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
        ok: true,
        templateId: 2001,
        templateVersionId: 400,
      })
      expect(copyVersion).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    {
      title: '템플릿 복제 실패',
      fail: () => {
        copyVersion.mockRejectedValueOnce(new Error('copy failed'))
      },
    },
    {
      title: '템플릿 게시 실패',
      fail: () => {
        publishVersion.mockRejectedValueOnce(new Error('publish failed'))
      },
    },
    {
      title: '최종 바인딩 PATCH 실패',
      fail: () => {
        updateBinding
          .mockResolvedValueOnce({})
          .mockRejectedValueOnce(new Error('final patch failed'))
      },
    },
  ])('$title 시 임시 시작일을 원래 기간으로 되돌린다', async ({ fail }) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-19T09:00:00.000Z'))
    listBindings
      .mockResolvedValueOnce([TODAY_SURVEY_BINDING])
      .mockResolvedValueOnce([UNLOCKED_BINDING])
    fail()

    try {
      await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).rejects.toThrow()
      expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
        submissionStartAt: TODAY_SURVEY_BINDING.submissionStartAt,
        submissionEndAt: TODAY_SURVEY_BINDING.submissionEndAt,
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('응답이 있는 설문은 복사하지 않는다', async () => {
    listBindings.mockResolvedValue([
      { bindingId: 900, progressStatus: 'BEFORE_START', submittedCount: 2 },
    ])

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toMatchObject({
      ok: false,
      refetchBindings: true,
    })
    expect(copyVersion).not.toHaveBeenCalled()
    expect(updateBinding).not.toHaveBeenCalled()
  })

  it('과거부터 진행 중인 응답 0건 설문은 기간만 저장한다', async () => {
    listBindings.mockResolvedValue([
      {
        bindingId: 900,
        templateId: 1995,
        templateVersionId: 352,
        progressStatus: 'IN_PROGRESS',
        submittedCount: 0,
        submissionStartAt: '2020-01-01T00:00:00.000Z',
      },
    ])

    await expect(saveProgramSurveyFormEdit(TARGET, createNewSurveyDraft())).resolves.toEqual({
      ok: true,
      templateId: 1995,
      templateVersionId: 352,
    })
    expect(copyVersion).not.toHaveBeenCalled()
    expect(updateBinding).toHaveBeenCalledWith('186051', '900', {
      submissionStartAt: '2026-10-20T00:00:00.000Z',
      submissionEndAt: SURVEY_OPEN_ENDED_END_AT,
    })
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
