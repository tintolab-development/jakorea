import type { User } from '@/types/user'
import {
  canAdminAction,
  resolveAdminRoleCodeFromUser,
  type AdminRoleCode,
} from '@/shared/lib/admin-role-policy'

function copySettlementAccount(
  settlement: NonNullable<User['instructorCmsSettlement']> | undefined,
  previous: Omit<User, 'password'>
): User['instructorCmsSettlement'] {
  if (!settlement) return settlement
  return {
    ...settlement,
    accountNumber:
      previous.instructorCmsSettlement?.accountNumber ?? previous.instructorInfo?.accountNumber,
    accountHolder:
      previous.instructorCmsSettlement?.accountHolder ?? previous.instructorInfo?.accountHolder,
    bankAccounts: settlement.bankAccounts?.map((account, index) => {
      const prevAccount = previous.instructorCmsSettlement?.bankAccounts?.[index]
      return {
        ...account,
        accountNumber: prevAccount?.accountNumber ?? account.accountNumber,
      }
    }),
  }
}

/** 파트너·뷰어는 주민번호·계좌 원문을 세션 유저에 남기지 않는다. */
export function stripRestrictedPiiForRole(
  merged: Omit<User, 'password'>,
  previous: Omit<User, 'password'>,
  roleCode: AdminRoleCode | null
): Omit<User, 'password'> {
  if (canAdminAction({ roleCode, action: 'piiAccount' })) return merged
  return {
    ...merged,
    instructorInfo: merged.instructorInfo
      ? {
          ...merged.instructorInfo,
          accountNumber: previous.instructorInfo?.accountNumber ?? '',
          accountHolder:
            previous.instructorInfo?.accountHolder ?? merged.instructorInfo.accountHolder,
        }
      : merged.instructorInfo,
    instructorCmsSettlement: copySettlementAccount(merged.instructorCmsSettlement, previous),
  }
}

export function stripRestrictedPiiForSessionUser(
  merged: Omit<User, 'password'>,
  previous: Omit<User, 'password'>,
  sessionUser: Pick<User, 'role' | 'roleCode' | 'adminLevel' | 'listMetrics'> | null
): Omit<User, 'password'> {
  return stripRestrictedPiiForRole(merged, previous, resolveAdminRoleCodeFromUser(sessionUser))
}
