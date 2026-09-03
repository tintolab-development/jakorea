import {
  addMaterialKitTargetCountRemote,
  createMaterialKitRemote,
  createMaterialKitVersionRemote,
  fetchCurrentKitCalculationRemote,
  fetchMaterialKitVersionsRemote,
  fetchMaterialKitsRemote,
} from '@/features/textbook/api/material-kits-api-client'
import { shouldUseTextbooksRemoteApi } from '@/features/textbook/api/admin-textbooks-service'
import {
  DEFAULT_KIT_QUANTITIES,
  type TextbookKitQuantityValues,
} from '@/features/textbook/ui/textbook-kit-quantity-modal'
import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

const GLOBAL_KIT_NAME = '교재 키트 수량'

export const MATERIAL_KIT_TARGET_LEVELS = [
  'kindergarten',
  'elementary',
  'middle',
  'high',
  'university',
] as const satisfies ReadonlyArray<keyof TextbookKitQuantityValues>

/** 세션 내 글로벌 키트 id — GET /material-kits 반복 방지 */
let cachedGlobalKitId: number | null = null
/** 세션 내 current version id (kitId별) */
const cachedVersionIdByKitId = new Map<number, number>()

function assertMaterialKitsRemoteReady(): void {
  if (!isRealApiModuleEnabled('textbooks')) {
    throw new Error(
      '키트 수량 API가 활성화되지 않았습니다. VITE_REAL_API_MODULES에 textbooks를 추가해 주세요.'
    )
  }
  if (!hasRemoteAdminJwt()) {
    throw new Error('키트 수량 조회는 관리자 로그인 후 이용할 수 있습니다.')
  }
}

export function shouldUseMaterialKitsRemoteApi(): boolean {
  return shouldUseTextbooksRemoteApi()
}

/** 테스트·로그아웃 시 모듈 캐시 초기화 */
export function clearMaterialKitIdCache(): void {
  cachedGlobalKitId = null
  cachedVersionIdByKitId.clear()
}

async function resolveGlobalMaterialKitId(): Promise<number> {
  if (cachedGlobalKitId != null) return cachedGlobalKitId

  const page = await fetchMaterialKitsRemote({
    page: 0,
    size: 100,
    useYn: true,
    globalOnly: true,
  })
  const items = page.items ?? []
  const globalKit = items.find(kit => kit.textbookId == null) ?? items[0]
  if (globalKit?.id != null) {
    cachedGlobalKitId = globalKit.id
    return cachedGlobalKitId
  }

  const created = await createMaterialKitRemote({ kitName: GLOBAL_KIT_NAME, useYn: true })
  if (created.id == null) {
    throw new Error('키트를 생성하지 못했습니다.')
  }
  cachedGlobalKitId = created.id
  return cachedGlobalKitId
}

async function resolveCurrentVersionId(kitId: number): Promise<number> {
  const cached = cachedVersionIdByKitId.get(kitId)
  if (cached != null) return cached

  const versions = await fetchMaterialKitVersionsRemote(kitId)
  const current = versions.find(version => version.current) ?? versions.at(-1)
  if (current?.id != null) {
    cachedVersionIdByKitId.set(kitId, current.id)
    return current.id
  }

  const created = await createMaterialKitVersionRemote(kitId, { current: true })
  if (created.id == null) {
    throw new Error('키트 버전을 생성하지 못했습니다.')
  }
  cachedVersionIdByKitId.set(kitId, created.id)
  return created.id
}

export async function getMaterialKitQuantities(): Promise<TextbookKitQuantityValues> {
  assertMaterialKitsRemoteReady()
  const kitId = await resolveGlobalMaterialKitId()
  const values: TextbookKitQuantityValues = { ...DEFAULT_KIT_QUANTITIES }

  await Promise.all(
    MATERIAL_KIT_TARGET_LEVELS.map(async level => {
      try {
        const calculation = await fetchCurrentKitCalculationRemote(kitId, {
          targetLevel: level,
          targetStudentCount: 0,
        })
        if (calculation.bookCountPerKit != null && calculation.bookCountPerKit >= 0) {
          values[level] = String(calculation.bookCountPerKit)
        }
      } catch {
        // 미설정 레벨은 기본값 유지
      }
    })
  )

  return values
}

export async function saveMaterialKitQuantities(
  values: TextbookKitQuantityValues
): Promise<void> {
  assertMaterialKitsRemoteReady()
  const kitId = await resolveGlobalMaterialKitId()
  const versionId = await resolveCurrentVersionId(kitId)

  for (const level of MATERIAL_KIT_TARGET_LEVELS) {
    const parsed = Number.parseInt(values[level], 10)
    if (Number.isNaN(parsed) || parsed < 0) {
      throw new Error('키트 수량은 0 이상의 숫자로 입력해 주세요.')
    }
    await addMaterialKitTargetCountRemote(versionId, {
      targetLevel: level,
      bookCountPerKit: parsed,
    })
  }
}
