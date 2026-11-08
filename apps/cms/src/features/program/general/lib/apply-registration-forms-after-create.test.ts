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

  it('등록/발급/인증서 양식은 시스템 카탈로그만 쓰고 COPY하지 않는다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      { bindingId: 1, formType: 'REGISTRATION', templateId: 5, templateVersionId: 51, active: true },
    ])
    const result = await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [{ templateCode: 'registration-general', formType: 'REGISTRATION', draft, overlay: { a: 1 } }],
    })
    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([])
    expect(saveProgramScopedOperationalFormVersion).not.toHaveBeenCalled()
  })

  it('formType이 APPLICATION이어도 registration-* 코드는 COPY하지 않는다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      { bindingId: 1, formType: 'APPLICATION', templateId: 1, templateVersionId: 51, active: true },
    ])
    const result = await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [
        {
          templateCode: 'registration-general',
          formType: 'APPLICATION',
          draft,
        },
      ],
    })
    expect(result.failed).toEqual([])
    expect(saveProgramScopedOperationalFormVersion).not.toHaveBeenCalled()
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

  it('1사1교: 강사 APPLICATION만 있어도 기관 신청이 그 바인딩을 가져가지 않아 강사 신청이 실패하지 않는다', async () => {
    const csProgram = { id: '186500', backendProgramType: 'COMPANY_SCHOOL' } as Program
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 189778,
        formType: 'APPLICATION',
        targetType: 'INSTRUCTOR',
        targetRole: 'INSTRUCTOR',
        targetScope: 'RECRUITMENT',
        targetScopeId: 501,
        templateId: 12,
        templateVersionId: 68,
        active: true,
      },
    ])
    resolveFormTemplateCatalogIds.mockImplementation(async (code: string) =>
      code === 'application-economy'
        ? { templateId: 42, templateVersionId: 85 }
        : { templateId: 12, templateVersionId: 68 }
    )
    saveProgramScopedOperationalFormVersion
      .mockResolvedValueOnce({ templateId: 900, templateVersionId: 901, bindingId: 9001 })
      .mockResolvedValueOnce({ templateId: 12, templateVersionId: 902, bindingId: 189778 })
    const result = await applyRegistrationFormsAfterCreate({
      program: csProgram,
      forms: [
        { templateCode: 'application-economy', formType: 'APPLICATION', draft, overlay: { a: 1 } },
        { templateCode: 'application-instructor', formType: 'APPLICATION', draft, overlay: { b: 2 } },
      ],
    })
    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([
      { templateCode: 'application-economy', recruitmentId: undefined },
      { templateCode: 'application-instructor', recruitmentId: 501 },
    ])
    const [economy, instructor] = saveProgramScopedOperationalFormVersion.mock.calls.map(
      call =>
        call[0] as {
          templateCode: string
          versionId: number
          program: Program
        }
    )
    expect(economy?.templateCode).toBe('application-economy')
    expect(economy?.versionId).toBe(85)
    expect(instructor?.templateCode).toBe('application-instructor')
    expect(instructor?.versionId).toBe(68)
    expect(instructor?.program.activeRecruitmentId).toBe(501)
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
    expect(
      saveProgramScopedOperationalFormVersion.mock.calls.map(
        call => (call[0] as { reusePublished?: unknown }).reusePublished
      )
    ).toEqual([undefined, undefined, undefined])
    expect(saveProgramScopedOperationalFormVersion.mock.calls.map(call => call[0].versionId)).toEqual([
      31,
      32,
      33,
    ])
  })

  it('UJAT 봉사자 상·하반기 신청은 같은 양식을 한 번만 COPY하고 둘째 행은 발행본을 재사용한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 21,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetRole: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 801,
        templateVersionId: 80,
        active: true,
      },
      {
        bindingId: 22,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetRole: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 802,
        templateVersionId: 80,
        active: true,
      },
    ])
    saveProgramScopedOperationalFormVersion
      .mockResolvedValueOnce({ templateId: 900, templateVersionId: 901, bindingId: 21 })
      .mockResolvedValueOnce({ templateId: 900, templateVersionId: 901, bindingId: 22 })

    const result = await applyRegistrationFormsAfterCreate({
      program: { id: '182200', backendProgramType: 'UJAT' } as Program,
      forms: [{ templateCode: 'application-ujat-volunteer', formType: 'APPLICATION', draft }],
    })

    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([
      { templateCode: 'application-ujat-volunteer', recruitmentId: 801 },
      { templateCode: 'application-ujat-volunteer', recruitmentId: 802 },
    ])
    const calls = saveProgramScopedOperationalFormVersion.mock.calls.map(
      call =>
        call[0] as {
          reusePublished?: { templateId: number; templateVersionId: number }
        }
    )
    expect(calls).toHaveLength(2)
    expect(calls[0]?.reusePublished).toBeUndefined()
    expect(calls[1]?.reusePublished).toEqual({ templateId: 900, templateVersionId: 901 })
  })

  it('UJAT 봉사자 모집 TERM 2행도 templateCode당 COPY 1회 후 같은 발행본을 재사용한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 31,
        formType: 'RECRUITMENT',
        targetType: 'VOLUNTEER',
        targetRole: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 901,
        templateVersionId: 90,
        active: true,
      },
      {
        bindingId: 32,
        formType: 'RECRUITMENT',
        targetType: 'VOLUNTEER',
        targetRole: 'MEMBER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 902,
        templateVersionId: 90,
        active: true,
      },
    ])
    saveProgramScopedOperationalFormVersion
      .mockResolvedValueOnce({ templateId: 800, templateVersionId: 801, bindingId: 31 })
      .mockResolvedValueOnce({ templateId: 800, templateVersionId: 801, bindingId: 32 })

    const result = await applyRegistrationFormsAfterCreate({
      program: { id: '182201', backendProgramType: 'UJAT' } as Program,
      forms: [{ templateCode: 'recruitment-ujat-volunteer', formType: 'RECRUITMENT', draft }],
    })

    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([
      { templateCode: 'recruitment-ujat-volunteer', recruitmentId: 901 },
      { templateCode: 'recruitment-ujat-volunteer', recruitmentId: 902 },
    ])
    const calls = saveProgramScopedOperationalFormVersion.mock.calls.map(
      call => call[0] as { reusePublished?: { templateId: number; templateVersionId: number } }
    )
    expect(calls).toHaveLength(2)
    expect(calls[0]?.reusePublished).toBeUndefined()
    expect(calls[1]?.reusePublished).toEqual({ templateId: 800, templateVersionId: 801 })
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

  it('수정 없는 강사·봉사자 신청(draft null)은 DRAFT 카탈로그 버전 본문으로 모집 행마다 COPY·교체한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 189631,
        formType: 'APPLICATION',
        targetType: 'INSTRUCTOR',
        targetRole: 'INSTRUCTOR',
        targetScope: 'RECRUITMENT',
        targetScopeId: 186879,
        templateId: 12,
        templateVersionId: 68,
        active: true,
      },
      {
        bindingId: 189632,
        formType: 'APPLICATION',
        targetType: 'VOLUNTEER',
        targetRole: 'VOLUNTEER',
        targetScope: 'RECRUITMENT',
        targetScopeId: 186880,
        templateId: 13,
        templateVersionId: 74,
        active: true,
      },
    ])
    const instructorBody = createProgramRegistrationDraft()
    const volunteerBody = createProgramRegistrationDraft()
    loadFormTemplateVersionDraftByVersionId.mockImplementation(
      async (_code: string, versionId: number) => ({
        draft: versionId === 68 ? instructorBody : volunteerBody,
      })
    )
    const result = await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [
        { templateCode: 'application-instructor', formType: 'APPLICATION', draft: null },
        { templateCode: 'application-volunteer', formType: 'APPLICATION', draft: null },
      ],
    })
    expect(result.failed).toEqual([])
    expect(result.applied).toEqual([
      { templateCode: 'application-instructor', recruitmentId: 186879 },
      { templateCode: 'application-volunteer', recruitmentId: 186880 },
    ])
    const calls = saveProgramScopedOperationalFormVersion.mock.calls.map(
      c =>
        c[0] as {
          templateCode: string
          versionId: number
          draft: unknown
          ownerProgramId: number
          program: Program
        }
    )
    expect(calls.map(c => [c.templateCode, c.versionId, c.ownerProgramId])).toEqual([
      ['application-instructor', 68, 186400],
      ['application-volunteer', 74, 186400],
    ])
    expect(calls[0]?.draft).toBe(instructorBody)
    expect(calls[1]?.draft).toBe(volunteerBody)
    // 모집 행 scope(RECRUITMENT)로 바인딩을 교체하도록 행 id가 program.activeRecruitmentId에 실린다.
    expect(calls.map(c => c.program.activeRecruitmentId)).toEqual([186879, 186880])
  })

  it('버전 본문 조회가 비면 seed 초안으로 적용하고, seed도 없으면 해당 양식만 실패한다', async () => {
    fetchGeneralProgramFormBindings.mockResolvedValue([
      {
        bindingId: 189630,
        formType: 'APPLICATION',
        targetType: 'INDIVIDUAL',
        targetRole: 'INDIVIDUAL',
        targetScope: 'RECRUITMENT',
        targetScopeId: 186878,
        templateVersionId: 69,
        active: true,
      },
    ])
    loadFormTemplateVersionDraftByVersionId.mockResolvedValue(null)
    const result = await applyRegistrationFormsAfterCreate({
      program: generalProgram,
      forms: [
        { templateCode: 'application-participant-individual', formType: 'APPLICATION', draft: null },
      ],
    })
    expect(saveProgramScopedOperationalFormVersion).not.toHaveBeenCalled()
    expect(result.failed).toEqual([
      expect.objectContaining({ templateCode: 'application-participant-individual' }),
    ])
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
          { templateCode: 'application-economy', formType: 'APPLICATION', draft },
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
