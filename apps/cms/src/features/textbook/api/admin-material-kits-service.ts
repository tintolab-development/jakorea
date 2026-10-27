import {
  fetchGlobalMaterialKitCurrentConfigRemote,
  putGlobalMaterialKitCurrentConfigRemote,
} from '@/features/textbook/api/material-kits-api-client'
import { shouldUseTextbooksRemoteApi } from '@/features/textbook/api/admin-textbooks-service'
import { parseKitQuantityInput } from '@/features/textbook/lib/kit-quantity'
import {
  EMPTY_KIT_QUANTITIES,
  type TextbookKitQuantityValues,
} from '@/features/textbook/ui/textbook-kit-quantity-modal'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { MaterialKitCurrentConfigRequest } from '@/shared/api/generated/data-management/schemas'
import type { MaterialKitCurrentConfigResponse } from '@/shared/api/generated/data-management/schemas'

export const MATERIAL_KIT_TARGET_LEVELS = [
  'kindergarten',
  'elementary',
  'middle',
  'high',
  'university',
] as const satisfies ReadonlyArray<keyof TextbookKitQuantityValues>

function assertMaterialKitsRemoteReady(): void {
  if (!isRealApiModuleEnabled('textbooks')) {
    throw new Error(
      '키트 수량 API가 활성화되지 않았습니다. VITE_API_SERVER(또는 VITE_API_BASE_URL)로 백엔드를 설정해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('키트 수량 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseMaterialKitsRemoteApi(): boolean {
  return shouldUseTextbooksRemoteApi()
}

/** 테스트·로그아웃 시 모듈 캐시 초기화 (레거시 kit id 캐시 호환) */
export function clearMaterialKitIdCache(): void {
  // global current-config 경로에서는 kit id 캐시를 사용하지 않음
}

function readLevelCount(
  config: MaterialKitCurrentConfigResponse,
  level: keyof TextbookKitQuantityValues
): number | undefined {
  if (level === 'kindergarten') return config.infant
  return config[level]
}

export function materialKitCurrentConfigToQuantities(
  config: MaterialKitCurrentConfigResponse
): TextbookKitQuantityValues {
  const values: TextbookKitQuantityValues = { ...EMPTY_KIT_QUANTITIES }
  for (const level of MATERIAL_KIT_TARGET_LEVELS) {
    const count = readLevelCount(config, level)
    if (count != null && Number.isFinite(count)) {
      values[level] = String(count)
    }
  }
  return values
}

export function quantitiesToMaterialKitCurrentConfigRequest(
  values: TextbookKitQuantityValues,
  options?: { effectiveFrom?: string }
): MaterialKitCurrentConfigRequest {
  const parsed = (level: keyof TextbookKitQuantityValues) => parseKitQuantityInput(values[level])
  return {
    infant: parsed('kindergarten'),
    elementary: parsed('elementary'),
    middle: parsed('middle'),
    high: parsed('high'),
    university: parsed('university'),
    ...(options?.effectiveFrom?.trim() ? { effectiveFrom: options.effectiveFrom.trim() } : {}),
  }
}

export async function getMaterialKitQuantities(): Promise<TextbookKitQuantityValues> {
  assertMaterialKitsRemoteReady()
  const config = await fetchGlobalMaterialKitCurrentConfigRemote()
  return materialKitCurrentConfigToQuantities(config)
}

export async function saveMaterialKitQuantities(
  values: TextbookKitQuantityValues
): Promise<TextbookKitQuantityValues> {
  assertMaterialKitsRemoteReady()
  const current = await fetchGlobalMaterialKitCurrentConfigRemote()
  const body = quantitiesToMaterialKitCurrentConfigRequest(values, {
    effectiveFrom: current.effectiveFrom,
  })
  const saved = await putGlobalMaterialKitCurrentConfigRemote(body)
  return materialKitCurrentConfigToQuantities(saved)
}
