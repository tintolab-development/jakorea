import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import {
  getSettlementItemSettingDetail,
  saveSettlementItemSettingDetail,
  type SettlementItemSettingDetail,
} from '@/data/mock/settlement-item-setting-detail.mock'
import type { SettlementItemSettingRow } from '@/data/mock/settlement-item-settings'
import { resolveSettingDetailFromConfig } from '@/features/settlement-management/api/settlement-configs/map-settlement-config-detail-to-upsert'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'

type DetailSourceMode = 'mock' | 'remote'

interface SettlementItemSettingDetailSourceValue {
  mode: DetailSourceMode
  getDetail: (itemId: string) => SettlementItemSettingDetail
  persistDetail: (itemId: string, detail: SettlementItemSettingDetail) => void
  resolveLayout: (itemId: string) => SettlementItemSettingDetail['layout']
}

const SettlementItemSettingDetailSourceContext =
  createContext<SettlementItemSettingDetailSourceValue | null>(null)

export function SettlementItemSettingDetailSourceProvider({
  mode,
  config,
  itemById,
  children,
}: {
  mode: DetailSourceMode
  config?: SettlementConfigResponse | null
  itemById: Map<string, SettlementItemSettingRow>
  children: ReactNode
}) {
  const sessionOverridesRef = useRef<Map<string, SettlementItemSettingDetail>>(new Map())

  const getDetail = useCallback(
    (itemId: string): SettlementItemSettingDetail => {
      const override = sessionOverridesRef.current.get(itemId)
      if (override) return override

      if (mode === 'remote' && config) {
        const row = itemById.get(itemId)
        if (row) return resolveSettingDetailFromConfig(config, row)
      }

      return getSettlementItemSettingDetail(itemId)
    },
    [config, itemById, mode]
  )

  const persistDetail = useCallback(
    (itemId: string, detail: SettlementItemSettingDetail) => {
      if (mode === 'remote') {
        sessionOverridesRef.current.set(itemId, detail)
        return
      }
      saveSettlementItemSettingDetail(itemId, detail)
    },
    [mode]
  )

  const resolveLayout = useCallback(
    (itemId: string) => getDetail(itemId).layout,
    [getDetail]
  )

  const value = useMemo(
    () => ({ mode, getDetail, persistDetail, resolveLayout }),
    [getDetail, mode, persistDetail, resolveLayout]
  )

  return (
    <SettlementItemSettingDetailSourceContext.Provider value={value}>
      {children}
    </SettlementItemSettingDetailSourceContext.Provider>
  )
}

export function useSettlementItemSettingDetailSource(itemId: string): SettlementItemSettingDetail {
  const ctx = useContext(SettlementItemSettingDetailSourceContext)
  if (!ctx) return getSettlementItemSettingDetail(itemId)
  return ctx.getDetail(itemId)
}

export function usePersistSettlementItemSettingDetail() {
  const ctx = useContext(SettlementItemSettingDetailSourceContext)
  return ctx?.persistDetail ?? saveSettlementItemSettingDetail
}

export function useSettlementItemSettingLayout(itemId: string | null | undefined) {
  const ctx = useContext(SettlementItemSettingDetailSourceContext)
  if (!itemId) return 'simple' as const
  if (!ctx) return getSettlementItemSettingDetail(itemId).layout
  return ctx.resolveLayout(itemId)
}

export function useSettlementItemSettingDetailSourceContext() {
  return useContext(SettlementItemSettingDetailSourceContext)
}
