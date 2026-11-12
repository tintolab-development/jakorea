import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import type { SettlementConfigQueryData } from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { queryClient } from '@/shared/lib/query-client'
import {
  assignProgramPaymentItemsToWriteRequest,
  mapProgramPaymentItemsToSettlementRequest,
  programPaymentItemsUnchanged,
  resolveProgramSettlementItemType,
} from './wage-payment-item-request'
import {
  getProgramWagePaymentItemOptions,
  resolveProgramPaymentItemIdsFromLabels,
} from './program-wage-payment-item-helpers'
import {
  applySettlementPolicyToCommonInfo,
  mapSettlementPaymentItemsToLabel,
} from '@/features/program/general/lib/settlement-policy-to-wage-rows'

vi.mock('@/features/settlement-management/hooks/use-settlement-remote-enabled', () => ({
  shouldUseSettlementRemote: () => true,
  useSettlementRemoteEnabled: () => false,
}))

function seedRemoteCatalog(
  items: Array<{ id: string; title: string; paymentItemType?: string; useYn?: boolean }>
): void {
  queryClient.setQueryData<SettlementConfigQueryData>(
    settlementQueryKeys.settlementConfigs.current(),
    {
      config: {},
      sections: [
        {
          kind: 'payment',
          sectionTitle: '지급 항목',
          items: items
            .filter(item => item.useYn !== false)
            .map(item => ({
              id: item.id,
              title: item.title,
              paymentItemType: item.paymentItemType,
              sectionKind: 'payment' as const,
              description: '',
              iconKey: 'pay_transport' as const,
            })),
        },
      ],
    } as SettlementConfigQueryData
  )
}

afterEach(() => {
  queryClient.clear()
})

const ALL_POLICY_ITEMS = [
  { itemType: 'TRANSPORTATION', useYn: true },
  { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
  { itemType: 'LODGING', useYn: true },
  { itemType: 'ACTIVITY', useYn: true },
  { itemType: 'MEAL', useYn: true },
] as const

describe('지급 항목 설정 — 프로그램 유형별 필터 없음', () => {
  it('카탈로그 활성 항목을 프로그램 유형으로 제거하지 않는다', () => {
    seedRemoteCatalog([
      { id: 'p-166201', title: '강사 교통비', paymentItemType: 'TRANSPORT_INSTRUCTOR' },
      { id: 'p-166202', title: '학생 교통비', paymentItemType: 'TRANSPORT_STUDENT' },
      { id: 'p-166206', title: '장거리 교통비', paymentItemType: 'LONG_DISTANCE_TRANSPORTATION' },
      { id: 'p-166203', title: '숙박비', paymentItemType: 'LODGING_GENERAL' },
      { id: 'p-166204', title: '활동비', paymentItemType: 'ACTIVITY' },
      { id: 'p-166205', title: '식사비', paymentItemType: 'MEAL' },
      { id: 'p-166209', title: '숙박비 (비활성)', paymentItemType: 'LODGING_GENERAL', useYn: false },
    ])
    const labels = getProgramWagePaymentItemOptions().map(option => option.label)
    expect(labels).toEqual(
      expect.arrayContaining(['강사 교통비', '학생 교통비', '장거리 교통비', '숙박비', '활동비', '식사비'])
    )
    expect(labels).not.toContain('숙박비 (비활성)')
    expect(labels).not.toContain('p-1')
  })

  it.each([
    'GENERAL_INDIVIDUAL',
    'GENERAL_ORGANIZATION',
    'COMPANY_SCHOOL',
    'TRAINED_TEACHER',
    'UJAT',
    'GEMINI',
  ] as const)('%s 선택값을 숙박비·장거리 교통비 포함 복수 항목으로 저장한다', programType => {
    void programType
    const request = mapProgramPaymentItemsToSettlementRequest(
      '숙박비, 장거리 교통비, 식사비, 강사 교통비'
    )
    expect(request).toEqual([
      { itemType: 'LODGING', useYn: true },
      { itemType: 'LONG_DISTANCE_TRANSPORTATION', useYn: true },
      { itemType: 'MEAL', useYn: true },
      { itemType: 'TRANSPORTATION', useYn: true },
    ])
  })

  it('카탈로그에 없는 임의 항목을 만들지 않는다', () => {
    expect(resolveProgramSettlementItemType('FAKE_BONUS')).toBeUndefined()
    expect(mapProgramPaymentItemsToSettlementRequest('해당없음')).toEqual([])
  })
})

describe('mapProgramPaymentItemsToSettlementRequest', () => {
  it('null은 omit하고 빈 값·해당없음은 []이다', () => {
    expect(mapProgramPaymentItemsToSettlementRequest(undefined)).toBeUndefined()
    expect(mapProgramPaymentItemsToSettlementRequest(null)).toBeUndefined()
    expect(mapProgramPaymentItemsToSettlementRequest('')).toEqual([])
    expect(mapProgramPaymentItemsToSettlementRequest('해당없음')).toEqual([])
  })

  it('강사 교통비와 학생 교통비를 서로 다른 itemType으로 저장한다', () => {
    expect(mapProgramPaymentItemsToSettlementRequest('강사 교통비, 학생 교통비')).toEqual([
      { itemType: 'TRANSPORTATION', useYn: true },
      { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
    ])
    expect(mapProgramPaymentItemsToSettlementRequest('학생 교통비')).toEqual([
      { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
    ])
    expect(resolveProgramSettlementItemType('TRANSPORT_STUDENT')).toBe('STUDENT_TRANSPORTATION')
    expect(resolveProgramSettlementItemType('p-166202')).toBe('STUDENT_TRANSPORTATION')
    expect(resolveProgramSettlementItemType('p-166201')).toBe('TRANSPORTATION')
    expect(resolveProgramSettlementItemType('장거리 교통비')).toBe('LONG_DISTANCE_TRANSPORTATION')
  })

  it('GET 강사+학생 itemType은 둘 다 켜고, TRANSPORTATION만 있으면 학생은 끈다', () => {
    seedRemoteCatalog([
      { id: 'p-166201', title: '강사 교통비', paymentItemType: 'TRANSPORT_INSTRUCTOR' },
      { id: 'p-166202', title: '학생 교통비', paymentItemType: 'TRANSPORT_STUDENT' },
    ])
    expect(
      resolveProgramPaymentItemIdsFromLabels([
        { itemType: 'TRANSPORTATION', useYn: true },
        { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
      ])
    ).toEqual(['p-166201', 'p-166202'])
    expect(
      resolveProgramPaymentItemIdsFromLabels([{ itemType: 'TRANSPORTATION', useYn: true }])
    ).toEqual(['p-166201'])
    expect(
      mapProgramPaymentItemsToSettlementRequest(['p-166201', 'p-166202'])
    ).toEqual([
      { itemType: 'TRANSPORTATION', useYn: true },
      { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
    ])
  })
})

describe('assignProgramPaymentItemsToWriteRequest', () => {
  const program = (paymentItems?: string): Program =>
    ({
      id: '1',
      sponsorId: 's',
      title: 't',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      rounds: [],
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'pending',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      generalCommonInfo: paymentItems == null ? undefined : { paymentItems },
    }) as Program

  it('Create는 선택값을 paymentItems에 그대로 넣는다', () => {
    const body: { paymentItems?: { itemType?: string; useYn?: boolean }[] } = {}
    assignProgramPaymentItemsToWriteRequest({
      body,
      program: program('숙박비, 식사비, 강사 교통비'),
    })
    expect(body.paymentItems).toEqual([
      { itemType: 'LODGING', useYn: true },
      { itemType: 'MEAL', useYn: true },
      { itemType: 'TRANSPORTATION', useYn: true },
    ])
  })

  it('지급 항목 외 PATCH는 paymentItems를 omit한다', () => {
    const existing = program('숙박비')
    const body: { paymentItems?: { itemType?: string; useYn?: boolean }[] } = {}
    assignProgramPaymentItemsToWriteRequest({
      body,
      program: { ...existing, title: '제목만' },
      patch: { title: '제목만' },
      baseline: existing,
    })
    expect(body).not.toHaveProperty('paymentItems')
  })

  it('값이 같으면 generalCommonInfo에 paymentItems가 있어도 omit한다', () => {
    const existing = program('숙박비, 식사비')
    const body: { paymentItems?: { itemType?: string; useYn?: boolean }[] } = {}
    assignProgramPaymentItemsToWriteRequest({
      body,
      program: existing,
      patch: { generalCommonInfo: { paymentItems: '숙박비, 식사비' } },
      baseline: existing,
    })
    expect(body).not.toHaveProperty('paymentItems')
    expect(programPaymentItemsUnchanged(existing.generalCommonInfo, existing.generalCommonInfo)).toBe(
      true
    )
  })

  it('전체 해제만 명시적 []를 보낸다', () => {
    const existing = program('숙박비')
    const body: { paymentItems?: { itemType?: string; useYn?: boolean }[] } = {}
    assignProgramPaymentItemsToWriteRequest({
      body,
      program: program('해당없음'),
      patch: { generalCommonInfo: { paymentItems: '해당없음' } },
      baseline: existing,
    })
    expect(body.paymentItems).toEqual([])
  })
})

describe('settlementPolicy hydrate', () => {
  it('프로그램 유형으로 지급 항목을 숨기지 않는다', () => {
    expect(mapSettlementPaymentItemsToLabel([...ALL_POLICY_ITEMS])).toBe(
      '교통비, 장거리 교통비, 숙박비, 활동비, 식비'
    )
  })

  it('강사·학생 교통비를 GET itemType 기준으로 따로 표시한다', () => {
    expect(
      mapSettlementPaymentItemsToLabel([
        { itemType: 'TRANSPORTATION', useYn: true },
        { itemType: 'STUDENT_TRANSPORTATION', useYn: true },
        { itemType: 'MEAL', useYn: true },
      ])
    ).toBe('교통비, 학생 교통비, 식비')
    expect(
      mapSettlementPaymentItemsToLabel([{ itemType: 'TRANSPORTATION', useYn: true }])
    ).toBe('교통비')
  })

  it('settlementPolicy.paymentItems []는 overlay 라벨을 덮어 빈 상태로 둔다', () => {
    const applied = applySettlementPolicyToCommonInfo(
      { paymentItems: '숙박비' },
      { paymentItems: [] }
    )
    expect(applied?.paymentItems).toBeUndefined()
  })

  it('settlementPolicy.paymentItems 누락은 overlay 라벨을 유지한다', () => {
    const applied = applySettlementPolicyToCommonInfo(
      { paymentItems: '숙박비' },
      { deductionType: 'NONE' }
    )
    expect(applied?.paymentItems).toBe('숙박비')
  })
})
