/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

const fetchGeneralProgramFormBindings = vi.fn()
const saveProgramScopedOperationalFormVersion = vi.fn()
const resolveFormTemplateCatalogIds = vi.fn()
const loadFormTemplateVersionDraftByVersionId = vi.fn()
const alertShow = vi.fn()

vi.mock('@/features/program/general/api/admin-general-programs-service', () => ({
  fetchGeneralProgramFormBindings: (...args: unknown[]) => fetchGeneralProgramFormBindings(...args),
}))
vi.mock('@/features/template/api/admin-form-templates-service', () => ({
  resolveFormTemplateCatalogIds: (...args: unknown[]) => resolveFormTemplateCatalogIds(...args),
  loadFormTemplateVersionDraftByVersionId: (...args: unknown[]) =>
    loadFormTemplateVersionDraftByVersionId(...args),
}))
vi.mock('@/features/program/general/lib/sync-registration-form-bindings', () => ({
  saveProgramScopedOperationalFormVersion: (...args: unknown[]) =>
    saveProgramScopedOperationalFormVersion(...args),
  invalidateProgramFormBindingsCache: vi.fn(),
}))
vi.mock('@/features/program/general/lib/registration-operational-form-drafts', () => ({
  createSeedDraftForOperationalCatalogId: vi.fn(() => null),
}))
vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: (...args: unknown[]) => alertShow(...args) },
}))

import {
  applyPreparedRegistrationFormsAfterCreate,
  applyRegistrationFormsAfterCreate,
  formatRegistrationFormApplyFailureContent,
  hasPendingRegistrationFormApplyFailures,
  retryPendingRegistrationFormApply,
} from './apply-registration-forms-after-create'

const generalProgram = {
  id: '186400',
  backendProgramType: 'GENERAL_INDIVIDUAL',
} as Program

const draft = createProgramRegistrationDraft()

describe('applyRegistrationFormsAfterCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 5, templateVersionId: 50 })
    saveProgramScopedOperationalFormVersion.mockResolvedValue({ templateId: 9, templateVersionId: 90 })
  })

  it('프로그램 단위 양식은 기본 바인딩 버전에서 ownerProgramId COPY로 적용한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      { bindingId: 1, formType: 'REGISTRATION', templateId: 5, templateVersionId: 51, active: true },
    ])
    const result = await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [{ templateCode: 'registration-general', formType: 'REGISTRATION', draft, overlay: { a: 1 } }],
    })
    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([{ templateCode: 'registration-general', recruitmentId: undefined }])
    expect(saveProgramScopedOperationalFormVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        templateCode: 'registration-general',
        versionId: 51,
        draft,
        overlay: { a: 1 },
        ownerProgramId: 186400,
      })
    )
  })

  it('1사1교: 기관 양식이 차지한 BE 자동 바인딩을 강사 양식이 덮어쓰지 않는다(새 바인딩, 카탈로그 원본)', async () => {
    const csProgram = { id: '186500', backendProgramType: 'COMPANY_SCHOOL' } as Program
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 77,
        formType: 'RECRUITMENT',
        templateId: 42,
        templateVersionId: 85,
        targetRole: 'TEACHER',
        targetType: 'ORGANIZATION',
        active: true,
      },
    ])
    resolveFormTemplateCatalogIds.mockImplementation(async (code: string) =>
      code === 'recruitment-economy'
        ? { templateId: 42, templateVersionId: 85 }
        : { templateId: 4, templateVersionId: 2056 }
    )
    saveProgramScopedOperationalFormVersion
      .mockResolvedValueOnce({ templateId: 900, templateVersionId: 901, bindingId: 77 })
      .mockResolvedValueOnce({ templateId: 910, templateVersionId: 911 })
    const result = await applyRegistrationFormsAfterCreate({
      program: csProgram,
      forms: [
        { templateCode: 'recruitment-economy', formType: 'RECRUITMENT', draft, overlay: { a: 1 } },
        { templateCode: 'recruitment-instructor', formType: 'RECRUITMENT', draft, overlay: { b: 2 } },
      ],
    })
    expect(result.failed).toEqual([])
    const [first, second] = saveProgramScopedOperationalFormVersion.mock.calls.map(
      call => call[0] as { versionId: number; excludeBindingIds?: ReadonlySet<number> }
    )
    expect(first?.versionId).toBe(85)
    // 강사 양식: 이미 차지된 바인딩 77의 버전(85)이 아니라 자기 카탈로그 버전에서 COPY, 77은 제외
    expect(second?.versionId).toBe(2056)
    expect(second?.excludeBindingIds?.has(77)).toBe(true)
  })

  it('GENERAL 신청 양식은 fan-out된 모집 행 바인딩마다 적용한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 11,
        formType: 'APPLICATION',
        targetRole: 'INDIVIDUAL',
        targetScope: 'RECRUITMENT',
        targetScopeId: 701,
        templateId: 5,
        templateVersionId: 55,
        active: true,
      },
      {
        bindingId: 12,
        formType: 'APPLICATION',
        targetRole: 'INSTRUCTOR',
        targetScope: 'RECRUITMENT',
        targetScopeId: 702,
        templateId: 6,
        templateVersionId: 66,
        active: true,
      },
      {
        bindingId: 10,
        formType: 'APPLICATION',
        targetRole: 'INDIVIDUAL',
        templateId: 5,
        templateVersionId: 55,
        active: false,
      },
    ])
    const result = await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [
        {
          templateCode: 'application-participant-individual',
          formType: 'APPLICATION',
          draft,
        },
      ],
    })
    expect(result.applied).toEqual([
      { templateCode: 'application-participant-individual', recruitmentId: 701 },
    ])
    const call = saveProgramScopedOperationalFormVersion.mock.calls[0]?.[0] as {
      program: Program
      versionId: number
    }
    expect(call.versionId).toBe(55)
    expect(call.program.activeRecruitmentId).toBe(701)
  })

  it('기관·강사·봉사자 신청은 각 모집 targetScopeId의 바인딩을 한 번씩 적용한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 189454,
        formType: 'APPLICATION',
        targetType: 'ORGANIZATION',
        targetRole: 'TEACHER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 301,
        templateVersionId: 31,
        active: true,
      },
      {
        bindingId: 189455,
        formType: 'APPLICATION',
        targetType: 'TEACHER',
        targetRole: 'TEACHER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 302,
        templateVersionId: 32,
        active: true,
      },
      {
        bindingId: 189456,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetRole: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 303,
        templateVersionId: 33,
        active: true,
      },
    ])
    saveProgramScopedOperationalFormVersion
      .mockResolvedValueOnce({ templateId: 9, templateVersionId: 91, bindingId: 189454 })
      .mockResolvedValueOnce({ templateId: 9, templateVersionId: 92, bindingId: 189455 })
      .mockResolvedValueOnce({ templateId: 9, templateVersionId: 93, bindingId: 189456 })

    const result = await applyRegistrationFormsAfterCreate({
      program: { id: '186391', backendProgramType: 'GENERAL' } as Program,
      forms: [
        { templateCode: 'application-participant-school', formType: 'APPLICATION', draft },
        { templateCode: 'application-instructor', formType: 'APPLICATION', draft },
        { templateCode: 'application-volunteer', formType: 'APPLICATION', draft },
      ],
    })

    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([
      { templateCode: 'application-participant-school', recruitmentId: 301 },
      { templateCode: 'application-instructor', recruitmentId: 302 },
      { templateCode: 'application-volunteer', recruitmentId: 303 },
    ])
    expect(saveProgramScopedOperationalFormVersion).toHaveBeenCalledTimes(3)
    expect(saveProgramScopedOperationalFormVersion.mock.calls.map(call => call[0].versionId)).toEqual([
      31,
      32,
      33,
    ])
  })

  it('draft가 null이면 바인딩 버전 본문(baseline)을 쓴다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      { bindingId: 2, formType: 'RECRUITMENT', targetRole: 'INDIVIDUAL', templateId: 5, templateVersionId: 52, active: true },
    ])
    const baseline = createProgramRegistrationDraft()
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue({ draft: baseline })
    await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [
        { templateCode: 'recruitment-participant-individual', formType: 'RECRUITMENT', draft: null, overlay: { r: 1 } },
      ],
    })
    expect(loadFormTemplateVersionDraftByVersionId).toHaveBeenCalledWith(
      'recruitment-participant-individual',
      52
    )
    expect(saveProgramScopedOperationalFormVersion).toHaveBeenCalledWith(
      expect.objectContaining({ draft: baseline, overlay: { r: 1 } })
    )
  })
})

describe('applyPreparedRegistrationFormsAfterCreate (부분 실패 → 안내·재시도)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resolveFormTemplateCatalogIds.mockResolvedValue({ templateId: 5, templateVersionId: 50 })
    fetchGeneralProgramFormBindings.mockResolvedValue([])
  })

  it('실패한 양식만 pending으로 남기고 재시도 성공 시 비운다', async () => {
    saveProgramScopedOperationalFormVersion
      .mockResolvedValueOnce({ templateId: 9, templateVersionId: 90 })
      .mockRejectedValueOnce(new Error('잠금'))
    const result = await applyPreparedRegistrationFormsAfterCreate(
      { id: '186401', backendProgramType: 'COMPANY_SCHOOL' } as Program,
      {
        forms: [
          { templateCode: 'registration-economy', formType: 'REGISTRATION', draft },
          { templateCode: 'recruitment-economy', formType: 'RECRUITMENT', draft },
        ],
      }
    )
    expect(result.failed.map(item => item.templateCode)).toEqual(['recruitment-economy'])
    expect(hasPendingRegistrationFormApplyFailures()).toBe(true)
    expect(alertShow).toHaveBeenCalledWith(expect.objectContaining({ title: '일부 양식 적용 실패' }))

    saveProgramScopedOperationalFormVersion.mockResolvedValueOnce({ templateId: 9, templateVersionId: 91 })
    await retryPendingRegistrationFormApply()
    expect(saveProgramScopedOperationalFormVersion).toHaveBeenLastCalledWith(
      expect.objectContaining({ templateCode: 'recruitment-economy' })
    )
    expect(hasPendingRegistrationFormApplyFailures()).toBe(false)
  })

  it('실패 안내에 모집 대상·양식 이름·서버 코드가 들어간다', () => {
    const content = formatRegistrationFormApplyFailureContent([
      {
        templateCode: 'application-participant-school',
        recruitmentId: 10,
        message: '바인딩을 저장하지 못했습니다.',
        code: 'FORM_BINDING_COPY_FAILED',
      },
      {
        templateCode: 'application-instructor',
        recruitmentId: 11,
        message: '템플릿 버전이 없습니다.',
        code: 'TEMPLATE_VERSION_NOT_FOUND',
      },
    ])
    expect(content).toContain('참여기관')
    expect(content).toContain('기관 신청')
    expect(content).toContain('FORM_BINDING_COPY_FAILED')
    expect(content).toContain('강사')
    expect(content).toContain('강사 신청')
    expect(content).toContain('TEMPLATE_VERSION_NOT_FOUND')
  })
})
