/**
 * 마스킹 Hook
 * Phase 0.5.3: 다운로드 보호 UX
 */

import { useMemo } from 'react'
import { MASKING_POLICY, type MaskingPolicy } from '@/shared/constants/download-policy'

interface UseMaskingOptions {
  enabled: boolean
  policies?: MaskingPolicy[]
}

interface UseMaskingResult {
  mask: <T extends Record<string, any>>(data: T, fieldMappings: Record<keyof T, MaskingPolicy | MaskingPolicy[]>) => T
  maskValue: (value: string, policy: MaskingPolicy) => string
}

/**
 * 마스킹 Hook
 * @param enabled 마스킹 활성화 여부
 * @param policies 적용할 마스킹 정책 목록 (지정하지 않으면 모든 정책 사용)
 */
export function useMasking({ enabled, policies }: UseMaskingOptions = { enabled: true }): UseMaskingResult {
  const availablePolicies = useMemo(() => {
    if (!policies) return MASKING_POLICY
    return Object.fromEntries(
      policies.map(policy => [policy, MASKING_POLICY[policy]])
    ) as typeof MASKING_POLICY
  }, [policies])

  const maskValue = (value: string, policy: MaskingPolicy): string => {
    if (!enabled || !value) return value
    const maskFn = availablePolicies[policy]
    if (!maskFn) return value
    return maskFn(value)
  }

  const mask = <T extends Record<string, any>>(
    data: T,
    fieldMappings: Record<keyof T, MaskingPolicy | MaskingPolicy[]>
  ): T => {
    if (!enabled) return data

    const masked = { ...data } as T
    Object.entries(fieldMappings).forEach(([field, policy]) => {
      const fieldValue = (data as Record<string, any>)[field]
      if (fieldValue === null || fieldValue === undefined) return

      if (Array.isArray(policy)) {
        // 여러 정책을 순차적으로 적용
        let maskedValue = String(fieldValue)
        policy.forEach(p => {
          maskedValue = maskValue(maskedValue, p)
        })
        ;(masked as Record<string, any>)[field] = maskedValue
      } else {
        ;(masked as Record<string, any>)[field] = maskValue(String(fieldValue), policy)
      }
    })

    return masked
  }

  return {
    mask,
    maskValue,
  }
}
