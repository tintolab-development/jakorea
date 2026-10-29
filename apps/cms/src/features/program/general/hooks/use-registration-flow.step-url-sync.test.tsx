/** @vitest-environment jsdom */
import { useCallback, useEffect, useMemo } from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider, useSearchParams } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

// vitest의 import.meta.hot.data 미정의로 모듈 평가가 깨지는 것만 우회
vi.mock('@/features/template/context/template-writing-preview-context', () => ({
  TEMPLATE_WRITING_USER_PREVIEW_Z_INDEX: 1300,
  TemplateWritingPreviewProvider: ({ children }: { children: unknown }) => children,
  useTemplateWritingPreview: () => ({
    openWritingUserPreview: () => {},
    syncWritingUserPreviewSession: () => {},
    closeWritingUserPreview: () => {},
    isWritingUserPreviewOpen: false,
  }),
}))
import {
  GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  normalizeGeneralProgramRegistrationStepKey,
  type GeneralProgramRegistrationStepKey,
} from '@/features/program/general/model/registration-flow'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import { TrainedTeachersRegistrationWizardFormProvider } from '@/features/program/trained-teachers/ui/registration/registration-wizard-form-provider'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  resetAllGeneralApplicationOverlay,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  patchApplicantRecruitInstitutionOverlay,
  resetAllApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  patchGeneralRecruitOverlay,
  resetAllGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  readActiveTrainedTeachersApplicationOverlayValue,
  readActiveTrainedTeachersRecruitmentOverlayValue,
} from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { readWizardRecruitmentKvValue } from '@/features/program/general/lib/overlay-phase1/registration-wizard-recruitment-rhf'
import { peekGeneralRegistrationWizardRhf } from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { useGeneralProgramRegistrationFlow } from './use-registration-flow'

type FlowApi = ReturnType<typeof useGeneralProgramRegistrationFlow>

/** 등록 모달(registration-fullpage-modal)의 URL↔단계 연결부만 재현 */
function Harness({
  variant,
  log,
  apiRef,
  continueMode = false,
}: {
  variant: ProgramRegistrationFormVariant
  log: GeneralProgramRegistrationStepKey[]
  apiRef: { current: FlowApi | null }
  continueMode?: boolean
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStep = useMemo(
    () => normalizeGeneralProgramRegistrationStepKey(searchParams.get(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)),
    [searchParams]
  )
  const syncStepToUrl = useCallback(
    (step: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, step)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )
  const flow = useGeneralProgramRegistrationFlow(true, {
    initialStep: initialStep ?? undefined,
    onStepChange: syncStepToUrl,
    registrationFormVariant: variant,
    skipDraftRestore: !continueMode,
  })
  apiRef.current = flow
  useEffect(() => {
    if (log[log.length - 1] !== flow.activeStep) log.push(flow.activeStep)
    if (process.env.FLOW_DEBUG) console.log('[commit]', flow.activeStep, searchParams.get('generalStep'), JSON.stringify(flow.participantFlags))
  })
  return null
}

function mount(variant: ProgramRegistrationFormVariant, continueMode = false) {
  const log: GeneralProgramRegistrationStepKey[] = []
  const apiRef: { current: FlowApi | null } = { current: null }
  const Provider =
    variant === 'trainedTeachers'
      ? TrainedTeachersRegistrationWizardFormProvider
      : GeneralRegistrationWizardFormProvider
  const router = createMemoryRouter(
    [
      {
        path: '/programs',
        element: (
          <Provider>
            <Harness variant={variant} log={log} apiRef={apiRef} continueMode={continueMode} />
          </Provider>
        ),
      },
    ],
    { initialEntries: [`/programs?mode=${continueMode ? 'continue' : 'new'}&generalStep=program`] }
  )
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return { log, apiRef, router }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function settle(apiRef: { current: FlowApi | null }, variant: ProgramRegistrationFormVariant) {
  for (let i = 0; i < 50; i += 1) {
    await act(async () => {
      await sleep(10)
    })
    const flags = apiRef.current?.participantFlags
    if (variant !== 'trainedTeachers' || flags?.organization === true) return
  }
}

describe('useGeneralProgramRegistrationFlow — 단계 이동 시 URL↔activeStep 되튀김', () => {
  afterEach(() => {
    cleanup()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  it.each([
    ['general', 'recruit-participant-individual'],
    ['trainedTeachers', 'recruit-participant-school'],
  ] as const)(
    '%s: 헤더 단계 클릭(실제 이벤트·라우터) 후 activeStep이 옛 단계로 되돌아갔다 오지 않는다',
    async (variant, to) => {
      const { log, apiRef, router } = mount(variant)
      await settle(apiRef, variant)
      expect(apiRef.current?.activeStep).toBe('program')
      log.length = 0
      log.push('program')
      // act 밖에서 실제 브라우저처럼 discrete 이벤트 → React 스케줄러·라우터 비동기 반영
      ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
      const button = document.createElement('button')
      button.addEventListener('click', () => apiRef.current!.selectStep(to))
      document.body.appendChild(button)
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await sleep(100)
      button.remove()
      expect(router.state.location.search).toContain(`generalStep=${to}`)
      expect(apiRef.current?.activeStep).toBe(to)
      expect(log).toEqual(['program', to])
    }
  )
})

async function go(apiRef: { current: FlowApi | null }, step: GeneralProgramRegistrationStepKey) {
  await act(async () => {
    apiRef.current!.selectStep(step)
  })
  for (let i = 0; i < 50; i += 1) {
    await act(async () => {
      await sleep(10)
    })
    const vm = apiRef.current!
    if (vm.activeStep === step && !vm.participantVm.isDraftLoading) break
  }
}

describe('useGeneralProgramRegistrationFlow — 참여자 단계 재방문 시 단락 편집 유지', () => {
  afterEach(() => cleanup())

  it.each([
    ['general', 'recruit-participant-individual', 'application-participant-individual'],
    ['trainedTeachers', 'recruit-participant-school', 'application-participant-school'],
  ] as const)('%s: 단락 제목 편집 후 다른 단계 갔다 오면 편집이 남는다', async (variant, step, other) => {
    const { apiRef } = mount(variant)
    await settle(apiRef, variant)
    await go(apiRef, step)
    const paragraphs = apiRef.current!.participantVm.draft.paragraphs
    expect(paragraphs.length).toBeGreaterThan(0)
    const target = paragraphs[paragraphs.length - 1]!
    await act(async () => {
      apiRef.current!.participantVm.updateParagraph(target.id, p => ({ ...p, paragraphTitle: 'EDITED-B' }))
    })
    expect(apiRef.current!.participantVm.draft.paragraphs.find(p => p.id === target.id)?.paragraphTitle).toBe('EDITED-B')
    await go(apiRef, 'program')
    await go(apiRef, step)
    expect(apiRef.current!.participantVm.draft.paragraphs.find(p => p.id === target.id)?.paragraphTitle).toBe('EDITED-B')
    await go(apiRef, other)
    await go(apiRef, step)
    expect(apiRef.current!.participantVm.draft.paragraphs.find(p => p.id === target.id)?.paragraphTitle).toBe('EDITED-B')
  })
})

/** act 밖 실제 discrete 클릭 + 라우터 비동기 반영 */
async function clickStep(apiRef: { current: FlowApi | null }, step: GeneralProgramRegistrationStepKey) {
  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  g.IS_REACT_ACT_ENVIRONMENT = false
  const button = document.createElement('button')
  button.addEventListener('click', () => apiRef.current!.selectStep(step))
  document.body.appendChild(button)
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  for (let i = 0; i < 50; i += 1) {
    await sleep(20)
    const vm = apiRef.current!
    if (vm.activeStep === step && !vm.participantVm.isDraftLoading) break
  }
  await sleep(50)
  button.remove()
  g.IS_REACT_ACT_ENVIRONMENT = true
}

describe('useGeneralProgramRegistrationFlow — 실제 클릭(되튀김 포함) 단계 이동 시 편집 유지', () => {
  afterEach(() => {
    cleanup()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  it.each([
    ['general', 'recruit-participant-individual', 'application-participant-individual'],
    ['trainedTeachers', 'recruit-participant-school', 'application-participant-school'],
  ] as const)('%s: 실제 클릭으로 단계 왕복해도 단락 편집이 남는다', async (variant, step, other) => {
    const { apiRef } = mount(variant)
    await settle(apiRef, variant)
    await clickStep(apiRef, step)
    expect(apiRef.current!.activeStep).toBe(step)
    const paragraphs = apiRef.current!.participantVm.draft.paragraphs
    const target = paragraphs[paragraphs.length - 1]!
    await act(async () => {
      apiRef.current!.participantVm.updateParagraph(target.id, p => ({ ...p, paragraphTitle: 'EDITED-C' }))
    })
    await clickStep(apiRef, other)
    await clickStep(apiRef, step)
    expect(apiRef.current!.participantVm.draft.paragraphs.find(p => p.id === target.id)?.paragraphTitle).toBe('EDITED-C')
    await clickStep(apiRef, 'program')
    await clickStep(apiRef, step)
    expect(apiRef.current!.participantVm.draft.paragraphs.find(p => p.id === target.id)?.paragraphTitle).toBe('EDITED-C')
  })
})

type OverlayCase = {
  name: string
  variant: ProgramRegistrationFormVariant
  step: GeneralProgramRegistrationStepKey
  other: GeneralProgramRegistrationStepKey
  write: (v: string) => void
  read: () => unknown
}

const OVERLAY_CASES: OverlayCase[] = [
  {
    name: 'general 모집(개인) RHF(화면 읽기 경로)',
    variant: 'general',
    step: 'recruit-participant-individual',
    other: 'application-participant-individual',
    write: v => patchGeneralRecruitOverlay({ 'recruit.individual.testNote': v }),
    read: () => readWizardRecruitmentKvValue('recruit.individual.testNote', undefined),
  },
  {
    name: 'general 신청(개인) overlay',
    variant: 'general',
    step: 'application-participant-individual',
    other: 'recruit-participant-individual',
    write: v => patchGeneralApplicationOverlay({ 'application.individual.testNote': v }),
    read: () => getGeneralApplicationOverlayRecord()['application.individual.testNote'],
  },
  {
    name: 'TT 모집(학교) RHF',
    variant: 'trainedTeachers',
    step: 'recruit-participant-school',
    other: 'application-participant-school',
    write: v => patchApplicantRecruitInstitutionOverlay({ 'recruit.inquiryTel': v }),
    read: () => readActiveTrainedTeachersRecruitmentOverlayValue('recruit.inquiryTel', undefined),
  },
  {
    name: 'TT 신청(학교) RHF',
    variant: 'trainedTeachers',
    step: 'application-participant-school',
    other: 'recruit-participant-school',
    write: v => patchGeneralApplicationOverlay({ 'application.trainedTeachers.basicInfo.teacherTel': v }),
    read: () =>
      readActiveTrainedTeachersApplicationOverlayValue('application.trainedTeachers.basicInfo.teacherTel', undefined),
  },
]

describe('useGeneralProgramRegistrationFlow — overlay/RHF 값 단계 왕복 유지', () => {
  afterEach(() => {
    cleanup()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  it.each(OVERLAY_CASES.map(c => [c.name, c] as const))('%s: 입력 후 단계 왕복해도 값이 남는다', async (_n, c) => {
    const { apiRef } = mount(c.variant)
    await settle(apiRef, c.variant)
    await clickStep(apiRef, c.step)
    expect(apiRef.current!.activeStep).toBe(c.step)
    await act(async () => c.write('V1'))
    expect(c.read()).toBe('V1')
    await clickStep(apiRef, 'program')
    await clickStep(apiRef, c.step)
    expect(c.read()).toBe('V1')
    await act(async () => c.write('V2'))
    await clickStep(apiRef, c.other)
    await clickStep(apiRef, c.step)
    expect(c.read()).toBe('V2')
    await clickStep(apiRef, 'program')
    await clickStep(apiRef, c.step)
    expect(c.read()).toBe('V2')
  })
})

function storageContains(token: string): boolean {
  for (const storage of [globalThis.localStorage, globalThis.sessionStorage]) {
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i)
      if (k != null && (storage.getItem(k) ?? '').includes(token)) return true
    }
  }
  return false
}

describe('useGeneralProgramRegistrationFlow — 임시저장에 general 개인 모집 입력 포함', () => {
  afterEach(() => {
    cleanup()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  it.each([['recruit-participant-individual'], ['program']] as const)(
    '참여자 칩을 건드리지 않은 기본(개인) 상태: %s 단계에서 임시저장해도 모집 입력이 저장된다',
    async saveAt => {
      globalThis.localStorage.clear()
      globalThis.sessionStorage.clear()
      const { apiRef } = mount('general')
      await settle(apiRef, 'general')
      await clickStep(apiRef, 'recruit-participant-individual')
      const token = `TOKEN-${saveAt}-${Date.now()}`
      await act(async () => patchGeneralRecruitOverlay({ 'recruit.individual.testNote': token }))
      expect(readWizardRecruitmentKvValue('recruit.individual.testNote', undefined)).toBe(token)
      if (saveAt === 'program') await clickStep(apiRef, 'program')
      await act(async () => {
        await apiRef.current!.persistDraftSilent()
      })
      expect(storageContains(token)).toBe(true)
    }
  )
})

describe('useGeneralProgramRegistrationFlow — 이어서 작성 복원', () => {
  afterEach(() => {
    cleanup()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  it.each(OVERLAY_CASES.map(c => [c.name, c] as const))(
    '%s: 임시저장 → 닫기 → 이어서 작성 후 같은 단계에서 값이 복원된다',
    async (_n, c) => {
      globalThis.localStorage.clear()
      globalThis.sessionStorage.clear()
      const first = mount(c.variant)
      await settle(first.apiRef, c.variant)
      await clickStep(first.apiRef, c.step)
      await act(async () => c.write('SAVED'))
      await clickStep(first.apiRef, 'program')
      await act(async () => {
        await first.apiRef.current!.persistDraftSilent()
      })
      cleanup()
      resetAllGeneralRecruitOverlay()
      resetAllGeneralApplicationOverlay()
      resetAllApplicantRecruitInstitutionOverlay()
      const second = mount(c.variant, true)
      await settle(second.apiRef, c.variant)
      for (let i = 0; i < 30; i += 1) {
        await act(async () => {
          await sleep(20)
        })
      }
      await clickStep(second.apiRef, c.step)
      expect(c.read()).toBe('SAVED')
    }
  )
})

describe('useGeneralProgramRegistrationFlow — 참여자 기본값 RHF 동기화', () => {
  afterEach(() => {
    cleanup()
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  it('general: 칩을 건드리지 않아도 위저드 RHF extras.participant가 editor 기본(개인)과 같다', async () => {
    globalThis.localStorage.clear()
    globalThis.sessionStorage.clear()
    const { apiRef } = mount('general')
    await settle(apiRef, 'general')
    expect(peekGeneralRegistrationWizardRhf()?.getValues().extras.participant).toEqual({
      individual: true,
      organization: false,
      teacherInstructor: false,
      volunteer: false,
    })
  })
})
