/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'

const collectOperationalOverlayForCatalogId = vi.fn()
const createSeedDraftForOperationalCatalogId = vi.fn()
const listAllRegistrationCreateFormSpecs = vi.fn()
const loadRegistrationWizardFormDraft = vi.fn()

const individualProgramBindingSpecs = [
  {
    templateCode: 'registration-general',
    formType: 'REGISTRATION' as const,
    nameHints: [] as const,
  },
  {
    templateCode: 'recruitment-participant-individual',
    formType: 'RECRUITMENT' as const,
    targetRole: 'INDIVIDUAL',
    nameHints: [] as const,
  },
  {
    templateCode: 'application-participant-individual',
    formType: 'APPLICATION' as const,
    targetRole: 'INDIVIDUAL',
    nameHints: [] as const,
  },
]

vi.mock('@/features/program/general/lib/registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
}))

vi.mock('@/features/program/general/lib/operational-form-bindings', () => ({
  listAllRegistrationCreateFormSpecs: (...args: unknown[]) =>
    listAllRegistrationCreateFormSpecs(...args),
  isSystemCatalogOnlyFormType: (formType: string | null | undefined) => {
    const normalized = String(formType ?? '')
      .trim()
      .toUpperCase()
    return (
      normalized === 'REGISTRATION' ||
      normalized === 'ISSUANCE' ||
      normalized === 'CERTIFICATE' ||
      normalized === 'CERTIFICATION'
    )
  },
}))

vi.mock('@/features/program/general/lib/registration-wizard-form-draft', () => ({
  loadRegistrationWizardFormDraft: (...args: unknown[]) => loadRegistrationWizardFormDraft(...args),
}))

const resolveProgramOperationalBindingKind = vi.fn(() => 'GENERAL')
vi.mock('@/features/program/general/lib/program-operational-binding-profile', () => ({
  resolveProgramOperationalBindingKind: (...args: unknown[]) =>
    resolveProgramOperationalBindingKind(...(args as [])),
}))

vi.mock('@/features/program/general/lib/resolve-program-api-type-for-draft', () => ({
  resolveRegistrationProgramDraftProgramType: () => 'GENERAL',
}))

vi.mock('@/features/program/general/lib/registration-operational-form-drafts', () => ({
  collectOperationalOverlayForCatalogId: (...args: unknown[]) =>
    collectOperationalOverlayForCatalogId(...args),
  createSeedDraftForOperationalCatalogId: (...args: unknown[]) =>
    createSeedDraftForOperationalCatalogId(...args),
}))

const peekActiveTrainedTeachersRecruitmentOverlayRecord = vi.fn()
const peekActiveTrainedTeachersApplicationOverlayRecord = vi.fn()
vi.mock('@/features/program/trained-teachers/lib/registration-rhf-api', () => ({
  peekActiveTrainedTeachersRecruitmentOverlayRecord: () =>
    peekActiveTrainedTeachersRecruitmentOverlayRecord(),
  peekActiveTrainedTeachersApplicationOverlayRecord: () =>
    peekActiveTrainedTeachersApplicationOverlayRecord(),
}))

vi.mock(
  '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush',
  () => ({
    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay: vi.fn(),
  })
)

import { prepareRegistrationCreateFormBindings } from './prepare-registration-create-form-bindings'

const httpCalls: string[] = []
vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(async (config: { url?: string }) => {
    httpCalls.push(String(config?.url ?? ''))
    return {}
  }),
}))

const program = {
  id: '100001',
  generalProgramAudience: 'individual',
  generalParticipantTypes: ['individual'],
} as Program

describe('prepareRegistrationCreateFormBindings (CREATE 후 적용할 양식 목록)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    httpCalls.length = 0
    collectOperationalOverlayForCatalogId.mockReturnValue(null)
    peekActiveTrainedTeachersRecruitmentOverlayRecord.mockReturnValue(null)
    peekActiveTrainedTeachersApplicationOverlayRecord.mockReturnValue(null)
    createSeedDraftForOperationalCatalogId.mockReturnValue(createProgramRegistrationDraft())
    listAllRegistrationCreateFormSpecs.mockReturnValue(individualProgramBindingSpecs)
    loadRegistrationWizardFormDraft.mockResolvedValue(null)
    resolveProgramOperationalBindingKind.mockReturnValue('GENERAL')
  })

  it('서버 호출 없이 순수 데이터만 반환하고 programDraftId·formBindings가 없다', async () => {
    const registrationDraft = createProgramRegistrationDraft()
    const result = await prepareRegistrationCreateFormBindings({
      program,
      registration: {
        templateCode: 'registration-general',
        draft: registrationDraft,
        overlay: { 'program.titleKo': '테스트' },
      },
    })

    expect(httpCalls).toEqual([])
    expect(result).not.toHaveProperty('programDraftId')
    expect(result).not.toHaveProperty('formBindings')
    expect(result?.forms).toEqual([
      // 등록 양식은 시스템 카탈로그만 사용하므로 COPY 목록에 넣지 않는다.
      // GENERAL 신청 양식은 수정이 없어도 항상 COPY 대상이다(본문은 적용 단계가 바인딩 버전에서 채운다).
      { templateCode: 'application-participant-individual', formType: 'APPLICATION', draft: null },
    ])
  })

  it('overlay나 로컬 초안이 있는 모집 양식만 포함하고 나머지 모집·등록은 기본 바인딩에 맡긴다(신청 양식은 항상 포함)', async () => {
    collectOperationalOverlayForCatalogId.mockImplementation((code: string) =>
      code === 'recruitment-participant-individual' ? { 'recruit.foo': 'bar' } : null
    )
    const appDraft = createProgramRegistrationDraft()
    loadRegistrationWizardFormDraft.mockImplementation(
      async (args: { templateCode: string }) =>
        args.templateCode === 'application-participant-individual'
          ? { draft: appDraft, editorState: { a: 1 }, settingsJson: { s: 1 } }
          : null
    )

    const result = await prepareRegistrationCreateFormBindings({ program })

    expect(result?.forms.map(item => item.templateCode)).toEqual([
      'recruitment-participant-individual',
      'application-participant-individual',
    ])
    const recruit = result?.forms[0]
    expect(recruit?.draft).toBeNull()
    expect(recruit?.overlay).toEqual({ 'recruit.foo': 'bar' })
    const application = result?.forms[1]
    expect(application?.draft).toBe(appDraft)
    expect(application?.editorState).toEqual({ a: 1 })
    expect(application?.settingsJson).toEqual({ s: 1 })
    expect(loadRegistrationWizardFormDraft).toHaveBeenCalledWith({
      programType: 'GENERAL',
      templateCode: 'application-participant-individual',
    })
  })

  it('operationalOverrides가 있으면 그 양식은 override 값을 쓴다', async () => {
    const overrideDraft = createProgramRegistrationDraft()
    const result = await prepareRegistrationCreateFormBindings({
      program,
      operationalOverrides: [
        {
          templateCode: 'recruitment-participant-individual',
          draft: overrideDraft,
          overlay: { x: 1 },
        },
      ],
    })
    expect(result?.forms).toEqual([
      expect.objectContaining({
        templateCode: 'recruitment-participant-individual',
        draft: overrideDraft,
        overlay: { x: 1 },
      }),
      // 수정 없는 GENERAL 신청 양식은 draft null로 항상 포함한다.
      { templateCode: 'application-participant-individual', formType: 'APPLICATION', draft: null },
    ])
  })

  it('같은 templateCode 단계가 여러 개여도(1사1교 기관·강사) 한 번만 적용한다', async () => {
    listAllRegistrationCreateFormSpecs.mockReturnValue([
      { templateCode: 'registration-economy', formType: 'REGISTRATION', nameHints: [] },
      { templateCode: 'recruitment-economy', formType: 'RECRUITMENT', targetRole: 'TEACHER', nameHints: [] },
      { templateCode: 'recruitment-economy', formType: 'RECRUITMENT', targetRole: 'INSTRUCTOR', nameHints: [] },
      { templateCode: 'application-economy', formType: 'APPLICATION', targetRole: 'TEACHER', nameHints: [] },
      { templateCode: 'application-economy', formType: 'APPLICATION', targetRole: 'INSTRUCTOR', nameHints: [] },
    ])
    collectOperationalOverlayForCatalogId.mockReturnValue({ k: 1 })
    const result = await prepareRegistrationCreateFormBindings({ program })
    expect(result?.forms.map(item => item.templateCode)).toEqual([
      'recruitment-economy',
      'application-economy',
    ])
  })

  describe('GENERAL 신청 양식은 수정하지 않아도 항상 COPY 대상으로 포함한다', () => {
    const generalAllSpecs = [
      { templateCode: 'registration-general', formType: 'REGISTRATION', nameHints: [] },
      { templateCode: 'recruitment-participant-individual', formType: 'RECRUITMENT', targetRole: 'INDIVIDUAL', nameHints: [] },
      { templateCode: 'recruitment-instructor', formType: 'RECRUITMENT', targetRole: 'INSTRUCTOR', nameHints: [] },
      { templateCode: 'application-participant-individual', formType: 'APPLICATION', targetRole: 'INDIVIDUAL', nameHints: [] },
      { templateCode: 'application-participant-school', formType: 'APPLICATION', targetRole: 'ORGANIZATION', nameHints: [] },
      { templateCode: 'application-instructor', formType: 'APPLICATION', targetRole: 'INSTRUCTOR', nameHints: [] },
      { templateCode: 'application-volunteer', formType: 'APPLICATION', targetRole: 'VOLUNTEER', nameHints: [] },
    ]

    it('draft·overlay 없는 개인/기관/강사/봉사자 신청을 draft null로 포함하고 모집·등록은 건너뛴다', async () => {
      listAllRegistrationCreateFormSpecs.mockReturnValue(generalAllSpecs)
      const result = await prepareRegistrationCreateFormBindings({ program })
      expect(result?.forms).toEqual([
        { templateCode: 'application-participant-individual', formType: 'APPLICATION', draft: null },
        { templateCode: 'application-participant-school', formType: 'APPLICATION', draft: null },
        { templateCode: 'application-instructor', formType: 'APPLICATION', draft: null },
        { templateCode: 'application-volunteer', formType: 'APPLICATION', draft: null },
      ])
    })

    it('수정한 신청 양식은 기존처럼 위저드 본문·overlay를 그대로 쓴다(덮어쓰지 않음)', async () => {
      listAllRegistrationCreateFormSpecs.mockReturnValue(generalAllSpecs)
      const appDraft = createProgramRegistrationDraft()
      loadRegistrationWizardFormDraft.mockImplementation(
        async (args: { templateCode: string }) =>
          args.templateCode === 'application-instructor' ? { draft: appDraft } : null
      )
      const result = await prepareRegistrationCreateFormBindings({ program })
      const instructor = result?.forms.find(item => item.templateCode === 'application-instructor')
      expect(instructor?.draft).toBe(appDraft)
      expect(result?.forms.map(item => item.templateCode)).toEqual([
        'application-participant-individual',
        'application-participant-school',
        'application-instructor',
        'application-volunteer',
      ])
    })

    it.each(['UJAT', 'TRAINED_TEACHER', 'COMPANY_SCHOOL'])(
      '%s는 기존 동작: 수정 없는 신청 양식은 포함하지 않는다',
      async kind => {
        resolveProgramOperationalBindingKind.mockReturnValue(kind)
        listAllRegistrationCreateFormSpecs.mockReturnValue([
          { templateCode: 'application-ujat-school', formType: 'APPLICATION', targetRole: 'ORGANIZATION', nameHints: [] },
          { templateCode: 'application-ujat-volunteer', formType: 'APPLICATION', targetRole: 'VOLUNTEER', nameHints: [] },
          { templateCode: 'application-trained-teachers', formType: 'APPLICATION', targetRole: 'ORGANIZATION', nameHints: [] },
          { templateCode: 'application-economy', formType: 'APPLICATION', targetRole: 'ORGANIZATION', nameHints: [] },
        ])
        const result = await prepareRegistrationCreateFormBindings({ program })
        expect(result?.forms).toEqual([])
      }
    )

    it('TRAINED_TEACHER RHF overlay가 있으면 모집·신청 Form Version 적용 목록에 넣는다', async () => {
      resolveProgramOperationalBindingKind.mockReturnValue('TRAINED_TEACHER')
      listAllRegistrationCreateFormSpecs.mockReturnValue([
        {
          templateCode: 'recruitment-trained-teachers',
          formType: 'RECRUITMENT',
          targetRole: 'ORGANIZATION',
          nameHints: [],
        },
        {
          templateCode: 'application-trained-teachers',
          formType: 'APPLICATION',
          targetRole: 'ORGANIZATION',
          nameHints: [],
        },
      ])
      peekActiveTrainedTeachersRecruitmentOverlayRecord.mockReturnValue({
        'recruit.maxClassCount': 4,
        'trainedTeachersRecruit.detailInfo.programDescription': '모집 설명',
      })
      peekActiveTrainedTeachersApplicationOverlayRecord.mockReturnValue({
        'application.trainedTeachers.preferredSchedules': [],
      })
      const result = await prepareRegistrationCreateFormBindings({ program })
      expect(result?.forms.map(item => item.templateCode)).toEqual([
        'recruitment-trained-teachers',
        'application-trained-teachers',
      ])
      expect(result?.forms[0]?.overlay).toMatchObject({ 'recruit.maxClassCount': 4 })
      expect(result?.forms[1]?.overlay).toMatchObject({
        'application.trainedTeachers.preferredSchedules': [],
      })
    })
  })
})
