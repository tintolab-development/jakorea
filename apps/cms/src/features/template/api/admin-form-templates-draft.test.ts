/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writingFormDraftToSchemaJson } from '@/features/template/api/adapters/form-template-draft-adapters'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import { createRecruitFormInstructorDraft } from '@/features/template/model/recruit-form-instructor-draft'
import { loadWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'

const updateRemoteMock = vi.fn()
const fetchRemoteMock = vi.fn()
const fetchVersionsMock = vi.fn()
const fetchTemplatesMock = vi.fn().mockResolvedValue({ items: [] })
const getCacheMock = vi.fn()
const createVersionMock = vi.fn()

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  updateFormTemplateVersionRemote: (...args: unknown[]) => updateRemoteMock(...args),
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchRemoteMock(...args),
  fetchFormTemplateVersionsRemote: (...args: unknown[]) => fetchVersionsMock(...args),
  fetchFormTemplatesRemote: (...args: unknown[]) => fetchTemplatesMock(...args),
  fetchFormTemplatePayloadByCodeRemote: vi.fn(),
  copyFormTemplateVersionRemote: vi.fn(),
  createFormTemplateVersionRemote: (...args: unknown[]) => createVersionMock(...args),
  createFormTemplateRemote: vi.fn(),
  deleteFormTemplateRemote: vi.fn(),
  publishFormTemplateVersionRemote: vi.fn(),
  updateFormTemplateRemote: vi.fn(),
}))

vi.mock('@/features/template/api/form-template-version-cache', () => ({
  getFormTemplateVersionCacheEntry: (...args: unknown[]) => getCacheMock(...args),
  upsertFormTemplateVersionCacheEntry: vi.fn(),
  removeFormTemplateVersionCacheEntry: vi.fn(),
  clearFormTemplateVersionCache: vi.fn(),
  upsertFormTemplateVersionCacheFromListItems: vi.fn(),
}))

import {
  loadFormTemplateVersionDraft,
  saveFormTemplateVersionDraft,
  saveFormTemplateVersionDraftByVersionId,
} from '@/features/template/api/admin-form-templates-service'

const TEMPLATE_CODE = 'survey-default-custom-1'

function stubLocalStorage() {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      for (const key of Object.keys(store)) delete store[key]
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length
    },
  })
}

describe('saveFormTemplateVersionDraft / loadFormTemplateVersionDraft', () => {
  beforeEach(() => {
    stubLocalStorage()
    updateRemoteMock.mockReset()
    fetchRemoteMock.mockReset()
    fetchVersionsMock.mockReset()
    fetchTemplatesMock.mockReset()
    fetchTemplatesMock.mockResolvedValue({ items: [] })
    createVersionMock.mockReset()
    getCacheMock.mockReset()
    getCacheMock.mockReturnValue({
      templateCode: TEMPLATE_CODE,
      templateId: 1,
      templateVersionId: 10,
      latestVersionId: 10,
    })
  })

  it('rejects when remote PATCH fails (remote SSOT)', async () => {
    updateRemoteMock.mockRejectedValue(new Error('network'))
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).rejects.toThrow('network')

    expect(updateRemoteMock).toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).toBeNull()
  })

  it('rejects when versionId is missing', async () => {
    getCacheMock.mockReturnValue({
      templateCode: TEMPLATE_CODE,
      templateId: 1,
    })
    fetchVersionsMock.mockResolvedValue([])
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).rejects.toThrow(/버전 ID/)

    expect(updateRemoteMock).not.toHaveBeenCalled()
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).toBeNull()
  })

  it('resolves when remote PUT succeeds without writing localStorage', async () => {
    updateRemoteMock.mockResolvedValue({})
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: TEMPLATE_CODE,
        draft,
      })
    ).resolves.toBeUndefined()

    expect(updateRemoteMock).toHaveBeenCalled()
    const putBody = updateRemoteMock.mock.calls[0]?.[1] as { schemaJson?: string }
    expect(putBody.schemaJson).toContain('program-registration-seed-basic-info')
    expect(loadWritingFormTemplateSave(TEMPLATE_CODE)).toBeNull()
  })

  it('saves typed template settings without rewriting extensionJson.overlay', async () => {
    updateRemoteMock.mockResolvedValue({})
    const draft = createRecruitFormInstructorDraft()

    await saveFormTemplateVersionDraft({
      templateCode: 'recruitment-ujat-school-custom-01',
      draft,
      settingsJson: {
        ujatRecruitment: { institution: { description: 'typed' } },
      },
    })

    const putBody = updateRemoteMock.mock.calls[0]?.[1] as {
      extensionJson?: string
      settingsJson?: string
    }
    expect(putBody.settingsJson).toContain('typed')
    expect(putBody.extensionJson).toBeUndefined()
  })

  it('adds a new draft version to the same template on FORM_CATALOG_VERSION_IMMUTABLE', async () => {
    updateRemoteMock.mockRejectedValueOnce({
      response: { data: { error: { code: 'FORM_CATALOG_VERSION_IMMUTABLE' } } },
    })
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 10,
      schemaJson: '{"source":true}',
      extensionJson: null,
      settingsJson: '{"s":1}',
    })
    createVersionMock.mockResolvedValue({ templateId: 1, templateVersionId: 11, versionNo: 2 })
    const draft = createProgramRegistrationDraft('general')

    await saveFormTemplateVersionDraft({ templateCode: TEMPLATE_CODE, draft })

    expect(createVersionMock).toHaveBeenCalled()
  })

  it('adds a new draft version to the same template on FORM_VERSION_IMMUTABLE', async () => {
    updateRemoteMock.mockRejectedValueOnce({
      response: { data: { error: { code: 'FORM_VERSION_IMMUTABLE' } } },
    })
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 10,
      schemaJson: '{"source":true}',
      extensionJson: null,
      settingsJson: '{"s":1}',
    })
    createVersionMock.mockResolvedValue({ templateId: 1, templateVersionId: 11, versionNo: 2 })
    const draft = createProgramRegistrationDraft('general')

    await saveFormTemplateVersionDraft({ templateCode: TEMPLATE_CODE, draft })

    expect(updateRemoteMock).toHaveBeenCalledTimes(1)
    expect(fetchRemoteMock).toHaveBeenCalledWith(10)
    expect(createVersionMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        schemaJson: expect.stringContaining('program-registration-seed-basic-info'),
        settingsJson: '{"s":1}',
      })
    )
  })

  it('rethrows non-immutable PUT errors without copying', async () => {
    updateRemoteMock.mockRejectedValue({ response: { data: { code: 'VALIDATION_FAILED' } } })
    const draft = createProgramRegistrationDraft('general')

    await expect(
      saveFormTemplateVersionDraft({ templateCode: TEMPLATE_CODE, draft })
    ).rejects.toBeDefined()
    expect(createVersionMock).not.toHaveBeenCalled()
  })

  it('creates a new draft version directly for catalog survey without PUT', async () => {
    getCacheMock.mockReturnValue({
      templateCode: 'survey-default',
      templateId: 7,
      templateVersionId: 70,
      latestVersionId: 70,
    })
    createVersionMock.mockResolvedValue({ templateId: 7, templateVersionId: 71, versionNo: 2 })
    const draft = createProgramRegistrationDraft('general')

    await saveFormTemplateVersionDraft({
      templateCode: 'survey-default',
      draft,
    })

    expect(updateRemoteMock).not.toHaveBeenCalled()
    expect(createVersionMock).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        sourceVersionId: 70,
        schemaJson: expect.any(String),
      })
    )
  })

  it('creates a new draft version directly for catalog agreement without PUT', async () => {
    getCacheMock.mockReturnValue({
      templateCode: 'agreement-third-party',
      templateId: 24,
      templateVersionId: 64,
      latestVersionId: 64,
    })
    createVersionMock.mockResolvedValue({ templateId: 24, templateVersionId: 65, versionNo: 2 })

    await saveFormTemplateVersionDraft({
      templateCode: 'agreement-third-party',
      draft: createProgramRegistrationDraft('general'),
    })

    expect(updateRemoteMock).not.toHaveBeenCalled()
    expect(createVersionMock).toHaveBeenCalledWith(
      24,
      expect.objectContaining({
        sourceVersionId: 64,
      })
    )
  })

  it('blocks agreement-crime form version writes', async () => {
    await expect(
      saveFormTemplateVersionDraft({
        templateCode: 'agreement-crime',
        draft: createProgramRegistrationDraft('general'),
      })
    ).rejects.toThrow(/PDF 교체/)
    expect(updateRemoteMock).not.toHaveBeenCalled()
    expect(createVersionMock).not.toHaveBeenCalled()
  })

  it('blocks catalog registration original PUT', async () => {
    getCacheMock.mockReturnValue({
      templateCode: 'registration-trained-teachers',
      templateId: 1,
      templateVersionId: 140,
      latestVersionId: 140,
    })
    const draft = createProgramRegistrationDraft('trainedTeachers')

    await expect(
      saveFormTemplateVersionDraft({
        templateCode: 'registration-trained-teachers',
        draft,
        overlay: { 'trainedTeachersRegistration.basicInfo.programTitleKo': '가나다' },
        editorState: { programType: 'schedule' },
      })
    ).rejects.toThrow(/CATALOG 원본/)

    expect(updateRemoteMock).not.toHaveBeenCalled()
  })

  it('omits schemaJson on version-id PUT when templateCode is registration', async () => {
    updateRemoteMock.mockResolvedValue({})
    const draft = createProgramRegistrationDraft('trainedTeachers')

    await saveFormTemplateVersionDraftByVersionId({
      versionId: 140,
      draft,
      overlay: { 'trainedTeachersRegistration.basicInfo.programTitleKo': '가나다' },
      editorState: { programType: 'schedule' },
      templateCode: 'registration-trained-teachers',
    })

    expect(updateRemoteMock).toHaveBeenCalledWith(
      140,
      expect.objectContaining({
        extensionJson: expect.stringContaining('가나다'),
      })
    )
    const putBody = updateRemoteMock.mock.calls[0]?.[1] as { schemaJson?: string }
    expect(putBody.schemaJson).toBeTruthy()
  })

  it('sends seed-aligned schemaJson with paragraph copy for recruitment PUT', async () => {
    getCacheMock.mockReturnValue({
      templateCode: 'recruitment-instructor-custom-01',
      templateId: 9,
      templateVersionId: 22,
      latestVersionId: 22,
      baseTemplateCode: 'recruitment-instructor',
    })
    updateRemoteMock.mockResolvedValue({})
    const draft = createRecruitFormInstructorDraft()
    const firstId = draft.paragraphs[0]?.id
    const customized = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === firstId
          ? { ...p, paragraphTitle: '맞춤 타이틀', paragraphDescription: '맞춤 설명' }
          : p
      ),
    }

    await saveFormTemplateVersionDraft({
      templateCode: 'recruitment-instructor-custom-01',
      draft: customized,
      overlay: { 'recruit.instructor.notes': '안내' },
    })

    const putBody = updateRemoteMock.mock.calls[0]?.[1] as {
      schemaJson?: string
      extensionJson?: string
    }
    expect(putBody.schemaJson).toContain('맞춤 타이틀')
    expect(putBody.schemaJson).toContain('맞춤 설명')
    expect(putBody.extensionJson).toContain('안내')
  })

  it('개인 참여 신청 COPY PUT에 short_essay maxLength를 넣지 않는다', async () => {
    getCacheMock.mockReturnValue({
      templateCode: 'application-participant-individual-copy-1',
      templateId: 11,
      templateVersionId: 33,
      latestVersionId: 33,
      baseTemplateCode: 'application-participant-individual',
    })
    updateRemoteMock.mockResolvedValue({})
    const { createProgramParticipantApplicationDraft } = await import(
      '@/features/template/model/program-application-form-individual-draft'
    )
    const { PROGRAM_PARTICIPANT_APPLICATION_IDS } = await import(
      '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
    )
    const draft = createProgramParticipantApplicationDraft()
    const thirdParty = draft.paragraphs.find(
      p => p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
    )
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 33,
      schemaJson: JSON.stringify(draft),
    })
    const editorDraft = JSON.parse(JSON.stringify(draft)) as typeof draft
    const editorThird = editorDraft.paragraphs.find(
      p => p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent
    )
    if (
      editorThird?.kind === 'single_item' &&
      editorThird.variant === 'horizontal_table' &&
      editorThird.fieldDataRows?.[0]?.[0]
    ) {
      editorThird.fieldDataRows[0][0] = { kind: 'text', value: 'JA코리아' }
    }
    const withMaxLength = {
      ...editorDraft,
      paragraphs: [
        ...editorDraft.paragraphs.map(p =>
          p.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro
            ? { ...p, maxLength: 2000, paragraphTitle: '자기소개 및 지원동기' }
            : p
        ),
        {
          id: 'program-participant-application-seed-interview-schedule',
          kind: 'single_item' as const,
          variant: 'horizontal_table' as const,
          requiredMark: true,
          paragraphTitle: '면접 진행 가능 일정',
          paragraphDescription: '',
          participatesInTitleNumbering: true,
        },
      ],
    }
    expect(thirdParty).toBeTruthy()

    await saveFormTemplateVersionDraft({
      templateCode: 'application-participant-individual-copy-1',
      draft: withMaxLength as typeof draft,
    })

    const putBody = updateRemoteMock.mock.calls[0]?.[1] as { schemaJson?: string }
    expect(putBody.schemaJson).toBeTruthy()
    expect(putBody.schemaJson).not.toContain('"maxLength"')
    expect(putBody.schemaJson).not.toContain('interview-schedule')
    expect(putBody.schemaJson).toContain('JA코리아')
    expect(putBody.schemaJson).toContain('자기소개 및 지원동기')
  })

  it('returns remote draft and ignores localStorage by default', async () => {
    const remoteDraft = createProgramRegistrationDraft('general')
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 10,
      versionNo: 2,
      schemaJson: writingFormDraftToSchemaJson(remoteDraft),
      extensionJson: JSON.stringify({ editorState: { marker: 'remote' } }),
      updatedAt: new Date().toISOString(),
    })

    const loaded = await loadFormTemplateVersionDraft(TEMPLATE_CODE)
    expect(loaded?.editorState).toEqual({ marker: 'remote' })
  })

  it('keeps recruitment overlay when schemaJson is omitted', async () => {
    getCacheMock.mockReturnValue({
      templateCode: 'recruitment-participant-school-custom-2',
      templateId: 9,
      templateVersionId: 22,
      latestVersionId: 22,
    })
    fetchRemoteMock.mockResolvedValue({
      templateVersionId: 22,
      versionNo: 1,
      extensionJson: JSON.stringify({
        overlay: {
          'recruit.notes': '양식 안내',
          'recruit.detailInfo.programDescription': '양식 설명',
        },
      }),
      updatedAt: new Date().toISOString(),
    })

    const loaded = await loadFormTemplateVersionDraft('recruitment-participant-school-custom-2')
    expect(loaded?.overlay).toEqual({
      'recruit.notes': '양식 안내',
      'recruit.detailInfo.programDescription': '양식 설명',
    })
  })
})
