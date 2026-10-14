import { useMemo } from 'react'
import type { SettlementItemSettingSection } from '@/features/settlement-management/model/settlement-item-settings'
import {
  getSettlementConfigRemote,
  type SettlementConfigQueryData,
} from '@/features/settlement-management/api/settlement-configs/admin-settlement-configs-service'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { useSettlementConfigSectionsQuery } from '@/features/settlement-management/hooks/use-settlement-config-sections-query'
import { shouldUseSettlementRemote } from '@/features/settlement-management/hooks/use-settlement-remote-enabled'
import { queryClient } from '@/shared/lib/query-client'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'

/** 제거된 FE mock id → 라벨 (로컬 레거시 교정용, API 카탈로그 없을 때만) */
export const LEGACY_LOCAL_PAYMENT_ITEM_OPTIONS: CmsSelectMultipleOption[] = [
  { value: 'p-1', label: '강사 교통비' },
  { value: 'p-3', label: '숙박비' },
  { value: 'p-6', label: '참여자 활동비' },
  { value: 'p-7', label: '숙박비 (1사1교)' },
]

function localPaymentItemCatalogFallback(
  sections: readonly SettlementItemSettingSection[]
): CmsSelectMultipleOption[] {
  const fromSections = getTemplateRegistrationPaymentItemOptions(sections)
  return fromSections.length > 0 ? fromSections : LEGACY_LOCAL_PAYMENT_ITEM_OPTIONS
}

/**
 * 정산 항목 설정(`/settlement-management/item-settings`)의 `지급 항목` 섹션 → 셀렉트 옵션.
 * `sections` 미전달 시 빈 목록.
 */
export function getTemplateRegistrationPaymentItemOptions(
  sections: readonly SettlementItemSettingSection[] = []
): CmsSelectMultipleOption[] {
  const section = sections.find(s => s.kind === 'payment')
  return (section?.items ?? []).map(item => ({
    value: item.id,
    label: item.title,
  }))
}

/** 실 API 환경이면 지급 항목은 정산 설정 API의 실제 ID만 쓴다. mock 은 백엔드 미설정 로컬 환경 전용. */
export function isPaymentItemCatalogRemote(): boolean {
  return shouldUseSettlementRemote('settlementConfigs')
}

function cachedRemotePaymentSections(): SettlementItemSettingSection[] | undefined {
  return queryClient.getQueryData<SettlementConfigQueryData>(
    settlementQueryKeys.settlementConfigs.current()
  )?.sections
}

/** 실제 지급 항목 목록을 판정할 수 있는 상태인지 (실 API 응답 캐시 존재 또는 mock 환경) */
export function isPaymentItemCatalogReady(): boolean {
  return !isPaymentItemCatalogRemote() || cachedRemotePaymentSections() != null
}

/**
 * 동기 헬퍼용 현재 지급 항목 카탈로그.
 * 실 API 환경에서 응답 전이면 `[]` — mock 으로 대체하지 않는다.
 */
export function getActivePaymentItemCatalogOptions(): CmsSelectMultipleOption[] {
  if (!isPaymentItemCatalogRemote()) return localPaymentItemCatalogFallback([])
  const sections = cachedRemotePaymentSections()
  return sections ? getTemplateRegistrationPaymentItemOptions(sections) : []
}

/** 제출 직전 등 — 화면에서 셀렉트를 열지 않았어도 실제 지급 항목 목록을 캐시에 올린다. */
export async function ensurePaymentItemCatalog(): Promise<void> {
  if (!isPaymentItemCatalogRemote()) return
  await queryClient
    .ensureQueryData({
      queryKey: settlementQueryKeys.settlementConfigs.current(),
      queryFn: () => getSettlementConfigRemote(),
      staleTime: 60_000,
    })
    .catch(() => undefined)
}

export type PaymentItemCatalogState = {
  options: CmsSelectMultipleOption[]
  sections?: SettlementItemSettingSection[]
  /** 실제 목록으로 선택·교정할 수 있음 */
  ready: boolean
  isLoading: boolean
  isError: boolean
}

/**
 * 정산 항목 설정과 동일 소스의 지급 항목 옵션.
 * 실 API 환경: 응답 전·실패 시 빈 목록(mock 대체 없음). 백엔드 미설정 로컬 환경: mock.
 */
export function usePaymentItemCatalogState(enabled = true): PaymentItemCatalogState {
  const remote = isPaymentItemCatalogRemote()
  const sectionsQuery = useSettlementConfigSectionsQuery(remote && enabled)

  return useMemo(() => {
    if (!remote) {
      return {
        options: getTemplateRegistrationPaymentItemOptions(),
        sections: [],
        ready: true,
        isLoading: false,
        isError: false,
      }
    }
    const sections = sectionsQuery.data
    return {
      options: sections ? getTemplateRegistrationPaymentItemOptions(sections) : [],
      sections,
      ready: sections != null,
      isLoading: sectionsQuery.isLoading,
      isError: sectionsQuery.isError,
    }
  }, [remote, sectionsQuery.data, sectionsQuery.isLoading, sectionsQuery.isError])
}

export function useTemplateRegistrationPaymentItemOptions(): CmsSelectMultipleOption[] {
  return usePaymentItemCatalogState().options
}

/** 지급 항목 셀렉트 placeholder — 로딩·실패 시 안내 */
export function paymentItemSelectPlaceholder(state: PaymentItemCatalogState): string {
  if (state.isError) return '지급 항목을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'
  if (!state.ready) return '지급 항목을 불러오는 중입니다.'
  return '지급 항목을 선택하세요'
}
