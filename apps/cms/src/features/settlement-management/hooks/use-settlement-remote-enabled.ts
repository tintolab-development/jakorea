import { hasRemoteAdminJwt } from '@/entities/user/api/auth-service'
import { isRealApiModuleEnabled, type RealApiModule } from '@/shared/config/real-api-modules'

type SettlementModule = Extract<
  RealApiModule,
  'paymentOrders' | 'accountPayments' | 'settlementConfigs'
>

export function useSettlementRemoteEnabled(module: SettlementModule, enabled = true): boolean {
  return enabled && isRealApiModuleEnabled(module) && hasRemoteAdminJwt()
}

export function shouldUseSettlementRemote(module: SettlementModule): boolean {
  return isRealApiModuleEnabled(module) && hasRemoteAdminJwt()
}
