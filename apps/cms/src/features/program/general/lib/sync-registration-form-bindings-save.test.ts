import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { queryClient } from '@/shared/lib/query-client'

const fetchFormTemplateVersionRemote = vi.fn()
const copyFormTemplateVersionRemote = vi.fn()
const createFormTemplateVersionRemote = vi.fn()
const updateFormTemplateRemote = vi.fn()
const loadFormTemplateVersionDraftByVersionId = vi.fn()
const saveFormTemplateVersionDraftByVersionId = vi.fn()
const publishFormTemplateVersionById = vi.fn()
const resolveFormTemplateCatalogIds = vi.fn()
const fetchGeneralProgramFormBindings = vi.fn()
const updateGeneralProgramFormBinding = vi.fn()
const createGeneralProgramFormBinding = vi.fn()
const fetchProgramApplicationCountsRemote = vi.fn()

vi.mock('@/features/template/api/form-templates-api-client', () => ({
  fetchFormTemplateVersionRemote: (...args: unknown[]) => fetchFormTemplateVersionRemote(...args),
  copyFormTemplateVersionRemote: (...args: unknown[]) => copyFormTemplateVersionRemote(...args),
  createFormTemplateVersionRemote: (...args: unknown[]) => createFormTemplateVersionRemote(...args),
  updateFormTemplateRemote: (...args: unknown[]) => updateFormTemplateRemote(...args),
}))

vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    loadFormTemplateVersionDraftByVersionId(...args),
  saveFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    saveFormTemplateVersionDraftByVersionId(...args),
  publishFormTemplateVersionById: (...args: unknown[]) => publishFormTemplateVersionById(...args),
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  shouldUseFormsSurveysRemoteApi: () => true,
}))

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramFormBindings: (...args: unknown[]) => fetchGeneralProgramFormBindings(...args),
  updateGeneralProgramFormBinding: (...args: unknown[]) => updateGeneralProgramFormBinding(...args),
  createGeneralProgramFormBinding: (...args: unknown[]) => createGeneralProgramFormBinding(...args),
}))

vi.mock('@/features/program/general/api/application-counts-api-client', () => ({
  fetchProgramApplicationCountsRemote: (...args: unknown[]) =>
    fetchProgramApplicationCountsRemote(...args),
}))

vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseProgramsHttpRemoteApi: () => true,
}))

vi.mock('@/features/program/ujat/api/capabilities', () => ({
  shouldUseRemoteApi: () => false,
}))

import {
  ensureProgramScopedOperationalBinding,
  getRememberedProgramOperationalFormBinding,
  saveProgramScopedOperationalFormVersion,
} from './sync-registration-form-bindings'

const program = { id: 'tt-program-1' } as Program
const userDraft = { paragraphs: [] } as unknown as WritingFormDraft

describe('saveProgramScopedOperationalFormVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue(null)
    saveFormTemplateVersionDraftByVersionId.mockResolvedValue(undefined)
    publishFormTemplateVersionById.mockImplementation(async (versionId: number) => versionId)
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 100 })
    updateFormTemplateRemote.mockResolvedValue(undefined)
    updateGeneralProgramFormBinding.mockResolvedValue(undefined)
    createGeneralProgramFormBinding.mockResolvedValue(undefined)
    fetchProgramApplicationCountsRemote.mockResolvedValue([])
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 7,
        active: true,
        formType: 'APPLICATION',
        targetRole: 'ORGANIZATION',
        templateId: 55,
        templateVersionId: 501,
        templateName: '교육받은 교사 신청',
      },
    ])
  })

  it('copies a published version, saves the draft, publishes, and rebinds', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 10,
      templateVersionId: 501,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 880,
      versionStatus: 'DRAFT',
    })
    publishFormTemplateVersionById.mockResolvedValue(880)

    const saved = await saveProgramScopedOperationalFormVersion({
      program,
      templateCode: 'application-trained-teachers',
      versionId: 501,
      draft: userDraft,
    })

    expect(copyFormTemplateVersionRemote).toHaveBeenCalledWith(10, {
      sourceVersionId: 501,
      versionLabel: 'program-tt-program-1',
    })
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      expect.objectContaining({
        versionId: 880,
        templateCode: 'application-trained-teachers',
        draft: userDraft,
      })
    )
    expect(publishFormTemplateVersionById).toHaveBeenCalledWith(880)
    expect(updateGeneralProgramFormBinding).toHaveBeenCalledWith(
      'tt-program-1',
      '7',
      expect.objectContaining({
        templateId: 88,
        templateVersionId: 880,
      })
    )
    expect(saved).toEqual({ templateId: 88, templateVersionId: 880, bindingId: 7 })
    expect(
      getRememberedProgramOperationalFormBinding('tt-program-1', 'application-trained-teachers')
    ).toEqual({ templateId: 88, templateVersionId: 880 })
  })

  it('copies even a DRAFT version when ownership is unknown (always COPY — shared data guard)', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 10,
      templateVersionId: 502,
      versionStatus: 'DRAFT',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyFormTemplateVersionRemote.mockResolvedValue({ templateId: 88, templateVersionId: 881 })
    publishFormTemplateVersionById.mockResolvedValue(881)

    await saveProgramScopedOperationalFormVersion({
      program: { id: 'tt-program-2' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 502,
      draft: userDraft,
    })

    expect(copyFormTemplateVersionRemote).toHaveBeenCalled()
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 502 })
    )
    expect(publishFormTemplateVersionById).not.toHaveBeenCalledWith(502)
  })

  it('모집 시작일이 오늘이어도 신청 0건이면 form-binding PATCH를 시도한다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 10,
      templateVersionId: 501,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 880,
      versionStatus: 'DRAFT',
    })
    publishFormTemplateVersionById.mockResolvedValue(880)

    await saveProgramScopedOperationalFormVersion({
      program: {
        id: 'tt-program-today',
        programRecruitments: [
          {
            id: 31,
            recruitmentType: 'PARTICIPANT',
            startAt: '2026-10-25T00:00:00+09:00',
            applicationFormBindingId: 7,
          },
        ],
      } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 501,
      draft: userDraft,
    })

    expect(updateGeneralProgramFormBinding).toHaveBeenCalledWith(
      'tt-program-today',
      '7',
      expect.objectContaining({ templateId: 88, templateVersionId: 880 })
    )
  })

  it('신청서가 있는 모집은 template COPY/PUT/publish/PATCH 전에 저장을 차단한다', async () => {
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186100, recruitmentId: 31, targetType: 'ORGANIZATION', totalCount: 1 },
    ])

    await expect(
      saveProgramScopedOperationalFormVersion({
        program: {
          id: '186100',
          backendProgramType: 'GENERAL',
          activeRecruitmentId: 31,
          programRecruitments: [
            {
              id: 31,
              recruitmentType: 'PARTICIPANT',
              applicationType: 'ORGANIZATION',
              applicationFormBindingId: 7,
            },
          ],
        } as Program,
        templateCode: 'application-trained-teachers',
        versionId: 501,
        draft: userDraft,
      })
    ).rejects.toThrow('모집 시작 이후에는 신청 양식을 수정할 수 없습니다.')

    expect(fetchFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
    expect(publishFormTemplateVersionById).not.toHaveBeenCalled()
    expect(updateGeneralProgramFormBinding).not.toHaveBeenCalled()
    expect(createGeneralProgramFormBinding).not.toHaveBeenCalled()
  })

  it('activeRecruitmentId가 없어도 모집 행 범위로 counts GET 후 저장을 차단한다', async () => {
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 186100, recruitmentId: 31, targetType: 'ORGANIZATION', totalCount: 1 },
    ])

    await expect(
      saveProgramScopedOperationalFormVersion({
        program: {
          id: '186100',
          backendProgramType: 'GENERAL',
          generalParticipantTypes: ['school_institution'],
          programRecruitments: [
            {
              id: 31,
              recruitmentType: 'PARTICIPANT',
              applicationType: 'ORGANIZATION',
              applicationFormBindingId: 7,
            },
          ],
        } as Program,
        templateCode: 'application-participant-school',
        versionId: 501,
        draft: userDraft,
      })
    ).rejects.toThrow('모집 시작 이후에는 신청 양식을 수정할 수 없습니다.')

    expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('186100')
    expect(fetchFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
  })

  it.each([
    [
      '카탈로그 DRAFT',
      { versionStatus: 'DRAFT', templateId: 10, templateScope: 'CATALOG', ownerProgramId: null },
      {},
    ],
    [
      '카탈로그 PUBLISHED + ownerProgramId(CREATE 직후 적용)',
      {
        versionStatus: 'PUBLISHED',
        templateId: 10,
        templateScope: 'CATALOG',
        ownerProgramId: null,
      },
      { ownerProgramId: 186363 },
    ],
  ])('공용 버전 보호: %s 이면 COPY 후 저장한다', async (_label, version, extra) => {
    fetchFormTemplateVersionRemote.mockResolvedValue({ templateVersionId: 94, ...version })
    copyFormTemplateVersionRemote.mockReset()
    copyFormTemplateVersionRemote.mockResolvedValue({ templateId: 1, templateVersionId: 9401 })
    publishFormTemplateVersionById.mockResolvedValue(9401)

    await saveProgramScopedOperationalFormVersion({
      program: { id: '186363' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 94,
      draft: userDraft,
      ...extra,
    })

    expect(copyFormTemplateVersionRemote).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ sourceVersionId: 94, ownerProgramId: 186363 })
    )
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 94 })
    )
    expect(publishFormTemplateVersionById).not.toHaveBeenCalledWith(94)
  })

  it('autoApply가 이미 프로그램 전용 템플릿을 붙인 DRAFT면 copyVersion 없이 제자리 저장한다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 94,
      versionStatus: 'DRAFT',
      templateScope: 'PROGRAM',
      ownerProgramId: 186363,
    })
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 100 })

    await saveProgramScopedOperationalFormVersion({
      program: { id: '186363' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 94,
      draft: userDraft,
      ownerProgramId: 186363,
    })

    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(createFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 94 })
    )
    expect(publishFormTemplateVersionById).toHaveBeenCalledWith(94)
  })

  it('프로그램 전용 PUBLISHED면 copyVersion 대신 같은 템플릿에 DRAFT version을 추가한다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 94,
      versionStatus: 'PUBLISHED',
      templateScope: 'PROGRAM',
      ownerProgramId: 186363,
    })
    createFormTemplateVersionRemote.mockResolvedValue({ templateId: 88, templateVersionId: 9402 })
    publishFormTemplateVersionById.mockResolvedValue(9402)
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 100 })

    await saveProgramScopedOperationalFormVersion({
      program: { id: '186363' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 94,
      draft: userDraft,
      ownerProgramId: 186363,
    })

    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(createFormTemplateVersionRemote).toHaveBeenCalledWith(88, {
      versionLabel: 'program-186363',
      sourceVersionId: 94,
    })
    expect(saveFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 9402 })
    )
  })

  it('copyVersion이 카탈로그 원본만 허용하면 같은 템플릿에 DRAFT version을 추가한다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 94,
      versionStatus: 'PUBLISHED',
      templateScope: 'COPY',
      ownerProgramId: null,
    })
    copyFormTemplateVersionRemote.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'BAD_REQUEST',
            message: '신규 템플릿은 카탈로그 원본에서만 복제할 수 있습니다. 프로그램 전용 복사본은 같은 템플릿에 버전을 추가해 주세요.',
          },
        },
      },
    })
    createFormTemplateVersionRemote.mockResolvedValue({ templateId: 88, templateVersionId: 9403 })
    publishFormTemplateVersionById.mockResolvedValue(9403)

    await saveProgramScopedOperationalFormVersion({
      program: { id: '186363' } as Program,
      templateCode: 'application-trained-teachers',
      versionId: 94,
      draft: userDraft,
      ownerProgramId: 186363,
    })

    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(createFormTemplateVersionRemote).toHaveBeenCalledWith(88, {
      versionLabel: 'program-186363',
      sourceVersionId: 94,
    })
  })

  it('copyVersion DATABASE_ERROR는 재시도하지 않는다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 10,
      templateVersionId: 94,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    const error = {
      response: { data: { error: { code: 'DATABASE_ERROR', message: '데이터 처리 중 오류가 발생했습니다.' } } },
    }
    copyFormTemplateVersionRemote.mockRejectedValue(error)

    await expect(
      saveProgramScopedOperationalFormVersion({
        program: { id: '186363' } as Program,
        templateCode: 'application-trained-teachers',
        versionId: 94,
        draft: userDraft,
        ownerProgramId: 186363,
      })
    ).rejects.toMatchObject({ response: { data: { error: { code: 'DATABASE_ERROR' } } } })
    expect(copyFormTemplateVersionRemote).toHaveBeenCalledTimes(1)
    expect(createFormTemplateVersionRemote).not.toHaveBeenCalled()
  })

  it('reusePublished이면 COPY/PUT/publish 없이 바인딩만 붙인다', async () => {
    await saveProgramScopedOperationalFormVersion({
      program,
      templateCode: 'application-trained-teachers',
      versionId: 501,
      draft: userDraft,
      ownerProgramId: 1,
      reusePublished: { templateId: 900, templateVersionId: 901 },
    })

    expect(fetchFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(saveFormTemplateVersionDraftByVersionId).not.toHaveBeenCalled()
    expect(publishFormTemplateVersionById).not.toHaveBeenCalled()
    expect(updateGeneralProgramFormBinding).toHaveBeenCalledWith(
      'tt-program-1',
      '7',
      expect.objectContaining({
        templateId: 900,
        templateVersionId: 901,
      })
    )
  })

  it('바인딩이 없어도 대상 모집 신청이 있으면 COPY 전에 저장을 차단한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 170100, recruitmentId: 41, targetType: 'ORGANIZATION', totalCount: 1 },
    ])

    await expect(
      saveProgramScopedOperationalFormVersion({
        program: {
          id: '170100',
          backendProgramType: 'COMPANY_SCHOOL',
          generalParticipantTypes: ['school_institution', 'teacher_instructor'],
          programRecruitments: [
            {
              id: 41,
              recruitmentType: 'PARTICIPANT',
              applicationType: 'ORGANIZATION',
            },
            { id: 42, recruitmentType: 'INSTRUCTOR' },
          ],
        } as Program,
        templateCode: 'application-economy',
        versionId: 501,
        draft: userDraft,
      })
    ).rejects.toThrow('모집 시작 이후에는 신청 양식을 수정할 수 없습니다.')

    expect(fetchProgramApplicationCountsRemote).toHaveBeenCalledWith('170100')
    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(createGeneralProgramFormBinding).not.toHaveBeenCalled()
    expect(updateGeneralProgramFormBinding).not.toHaveBeenCalled()
  })

  it('1사1교 form-binding POST에는 recruitments와 모집 행 scope를 넣지 않는다', async () => {
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 10,
      templateVersionId: 501,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyFormTemplateVersionRemote.mockResolvedValue({
      templateId: 88,
      templateVersionId: 880,
      versionStatus: 'DRAFT',
    })
    publishFormTemplateVersionById.mockResolvedValue(880)
    fetchGeneralProgramFormBindings.mockResolvedValue([])
    fetchProgramApplicationCountsRemote.mockResolvedValue([])

    await saveProgramScopedOperationalFormVersion({
      program: {
        id: '170100',
        backendProgramType: 'COMPANY_SCHOOL',
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        programRecruitments: [
          {
            id: 41,
            recruitmentType: 'PARTICIPANT',
            applicationType: 'ORGANIZATION',
          },
        ],
      } as Program,
      templateCode: 'application-economy',
      versionId: 501,
      draft: userDraft,
    })

    expect(createGeneralProgramFormBinding).toHaveBeenCalledTimes(1)
    const payload = createGeneralProgramFormBinding.mock.calls[0]?.[1] as Record<string, unknown>
    expect(payload).not.toHaveProperty('recruitments')
    expect(payload.targetScope).toBeUndefined()
    expect(payload.targetScopeId).toBeUndefined()
  })

  it('같은 저장을 동시에 호출하면 COPY/publish를 한 번만 한다', async () => {
    let resolveCopy: ((value: { templateId: number; templateVersionId: number }) => void) | undefined
    fetchFormTemplateVersionRemote.mockResolvedValue({
      templateId: 10,
      templateVersionId: 501,
      versionStatus: 'PUBLISHED',
      templateScope: 'CATALOG',
      ownerProgramId: null,
    })
    copyFormTemplateVersionRemote.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCopy = resolve
        })
    )
    publishFormTemplateVersionById.mockResolvedValue(880)

    const first = saveProgramScopedOperationalFormVersion({
      program,
      templateCode: 'application-trained-teachers',
      versionId: 501,
      draft: userDraft,
    })
    const second = saveProgramScopedOperationalFormVersion({
      program,
      templateCode: 'application-trained-teachers',
      versionId: 501,
      draft: userDraft,
    })

    await vi.waitFor(() => {
      expect(copyFormTemplateVersionRemote).toHaveBeenCalledTimes(1)
    })
    resolveCopy?.({ templateId: 88, templateVersionId: 880 })
    await Promise.all([first, second])
    expect(copyFormTemplateVersionRemote).toHaveBeenCalledTimes(1)
    expect(publishFormTemplateVersionById).toHaveBeenCalledTimes(1)
  })
})

describe('ensureProgramScopedOperationalBinding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 10, templateVersionId: 100 })
    fetchGeneralProgramFormBindings.mockResolvedValue([])
    fetchProgramApplicationCountsRemote.mockResolvedValue([
      { programId: 170100, recruitmentId: 41, targetType: 'ORGANIZATION', totalCount: 1 },
    ])
  })

  it('모달 오픈 경로에서는 COPY/publish/form-binding POST를 하지 않는다', async () => {
    await ensureProgramScopedOperationalBinding(
      {
        id: '170100',
        backendProgramType: 'COMPANY_SCHOOL',
        generalParticipantTypes: ['school_institution', 'teacher_instructor'],
        programRecruitments: [
          {
            id: 41,
            recruitmentType: 'PARTICIPANT',
            applicationType: 'ORGANIZATION',
          },
        ],
      } as Program,
      'application-economy'
    )

    expect(copyFormTemplateVersionRemote).not.toHaveBeenCalled()
    expect(publishFormTemplateVersionById).not.toHaveBeenCalled()
    expect(createGeneralProgramFormBinding).not.toHaveBeenCalled()
    expect(updateGeneralProgramFormBinding).not.toHaveBeenCalled()
  })
})
