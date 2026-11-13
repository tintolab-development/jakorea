// @vitest-environment jsdom
/**
 * 기본 정보 — 후원사 담당자 선택이 문의처(contactPhone)를 바꾸지 않는다(기획: 자동 채움 없음).
 * 담당자 선택지는 모든 유형(1사1교 포함) contactPrivacy=MASKED 조회만 쓴다(정책 CMS-32·37).
 */
import { useEffect, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useForm, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { encodeSponsorManagerContactRef } from '@/features/program/general/model/common-info-edit-schema'
import { BasicInfoSection } from './basic-info-section'

const MASKED_CONTACT = {
  id: 'c1',
  name: '김담당',
  position: '팀장',
  phone: '010-****-5678',
  contactType: 'lead',
}

const maskedContactsQuery = vi.fn()

vi.mock('@/features/program/general/hooks/use-general-program-sponsor-edit-context', () => ({
  useProgramSponsorContactsMaskedQuery: (...args: unknown[]) => maskedContactsQuery(...args),
  useGeneralProgramSponsorEditContext: () => ({
    sponsors: [{ id: 's1', name: '후원사A' }],
    contactsBySponsorId: { s1: [MASKED_CONTACT] },
  }),
}))

vi.mock('@/features/sponsor/hooks/use-sponsor-options-query', () => ({
  useSponsorSelectOptions: () => ({ options: [{ value: 's1', label: '후원사A' }] }),
}))

vi.mock('@/features/detailed-program/hooks/use-detailed-program-options-query', () => ({
  useDetailedProgramSelectOptions: () => ({ options: [], isSuccess: true }),
}))

vi.mock('@/shared/ui/cms-select', () => ({
  CmsSelect: (props: {
    placeholder?: string
    mode?: string
    options?: Array<{ value: unknown; label: ReactNode }>
    onChange?: (value: unknown) => void
  }) => (
    <div data-select={props.placeholder}>
      {(props.options ?? []).map(option => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() =>
            props.onChange?.(props.mode === 'multiple' ? [option.value] : option.value)
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}))

const INQUIRY_PHONE = '02-1234-5678'

function baseProgram(overrides: Partial<Program> = {}): Program {
  return {
    id: '501',
    title: '프로그램',
    category: 'general',
    status: 'active',
    sponsorId: 's1',
    managerName: '김담당',
    contactPhone: INQUIRY_PHONE,
    generalCommonInfo: {
      sponsorManagementIds: ['s1'],
      sponsorManagementId: 's1',
      sponsorManagerContactIds: [],
    },
    ...overrides,
  } as unknown as Program
}

function Harness({
  program,
  onForm,
}: {
  program: Program
  onForm: (form: UseFormReturn<ProgramDetailEditFormValues>) => void
}) {
  const form = useForm<ProgramDetailEditFormValues>({
    defaultValues: {
      sponsorId: 's1',
      sponsorManagementIds: ['s1'],
      sponsorManagerContactIds: [],
      managerName: '',
      contactPhone: INQUIRY_PHONE,
    } as unknown as ProgramDetailEditFormValues,
  })
  useEffect(() => {
    onForm(form)
  }, [form, onForm])
  return <BasicInfoSection program={program} isEditMode form={form} />
}

function renderWithProviders(node: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>
  )
}

function clickOption(container: HTMLElement, placeholder: string, text: string) {
  const buttons = Array.from(
    container.querySelectorAll<HTMLButtonElement>(`[data-select="${placeholder}"] button`)
  )
  const target = buttons.find(button => button.textContent?.includes(text))
  if (!target) throw new Error(`option not found: ${placeholder} / ${text}`)
  fireEvent.click(target)
}

describe('BasicInfoSection — 후원사 담당자 선택과 문의처(contactPhone)', () => {
  beforeEach(() => {
    maskedContactsQuery.mockReset()
    maskedContactsQuery.mockReturnValue({
      data: [MASKED_CONTACT],
      isSuccess: true,
      isError: false,
      isLoading: false,
    })
  })
  afterEach(cleanup)

  it('1사1교 수정에서도 담당자 선택지는 MASKED 조회를 쓰고, 담당자를 골라도 문의처가 바뀌지 않는다', () => {
    let form: UseFormReturn<ProgramDetailEditFormValues> | undefined
    const program = baseProgram({ backendProgramType: 'COMPANY_SCHOOL' } as Partial<Program>)
    const { container } = renderWithProviders(
      <Harness program={program} onForm={next => (form = next)} />
    )
    expect(maskedContactsQuery).toHaveBeenCalledWith('s1', true)

    clickOption(container, '후원사 담당자를 선택해 주세요', '김담당')

    expect(form?.getValues('sponsorManagerContactIds')).toEqual([
      encodeSponsorManagerContactRef('s1', 'c1'),
    ])
    expect(form?.getValues('managerName')).toBe('김담당')
    expect(form?.getValues('contactPhone')).toBe(INQUIRY_PHONE)
  })

  it('단일 담당자 선택(일반 레이아웃)도 문의처를 바꾸지 않고, 옆 연락처는 선택한 담당자 값(마스킹)이다', () => {
    let form: UseFormReturn<ProgramDetailEditFormValues> | undefined
    const { container, getByText } = renderWithProviders(
      <Harness program={baseProgram()} onForm={next => (form = next)} />
    )
    expect(maskedContactsQuery).toHaveBeenCalledWith('s1', true)

    clickOption(container, '담당자 선택', '김담당')
    expect(form?.getValues('managerName')).toBe('김담당')
    expect(form?.getValues('contactPhone')).toBe(INQUIRY_PHONE)
    expect(getByText('010-****-5678')).toBeTruthy()

    clickOption(container, '담당자 선택', '미선택')
    expect(form?.getValues('contactPhone')).toBe(INQUIRY_PHONE)
  })

  it('조회 모드 담당자는 이름·직책만 보이고 연락처·문의처(contactPhone)를 붙이지 않는다', () => {
    const ref = encodeSponsorManagerContactRef('s1', 'c1')
    const withDetail = baseProgram({
      generalCommonInfo: {
        sponsorManagementIds: ['s1'],
        sponsorManagementId: 's1',
        sponsorManagerContactIds: [ref],
        sponsorManagerContactDetails: {
          [ref]: { position: '팀장', phone: '010-9999-8888', email: null },
        },
      },
    } as Partial<Program>)
    const view = renderWithProviders(<BasicInfoSection program={withDetail} />)
    expect(view.container.textContent).not.toContain('8888')
    expect(view.container.textContent).not.toContain(INQUIRY_PHONE)
    cleanup()

    const nameOnly = renderWithProviders(<BasicInfoSection program={baseProgram()} />)
    expect(nameOnly.container.textContent).toContain('김담당')
    expect(nameOnly.container.textContent).not.toContain(INQUIRY_PHONE)
    expect(nameOnly.container.textContent).not.toContain('02-****')
  })
})
