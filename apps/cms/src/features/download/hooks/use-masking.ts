/**
 * 마스킹 Hook
 * Phase 0.5.3: 다운로드 보호 UX
 * Phase 0.5: 다운로드 마스킹 Mock 데이터 강화
 */

import { useMemo } from 'react'
import { MASKING_POLICY, type MaskingPolicy } from '@/shared/constants/download-policy'

interface UseMaskingOptions {
  enabled: boolean
  policies?: MaskingPolicy[]
}

/**
 * 마스킹된 필드 정보
 */
export interface MaskedFieldInfo {
  originalValue: string
  maskedValue: string
  policy: MaskingPolicy
  fieldName: string
}

interface UseMaskingResult {
  mask: <T extends Record<string, any>>(
    data: T,
    fieldMappings: Record<keyof T, MaskingPolicy | MaskingPolicy[]>
  ) => T
  maskValue: (value: string, policy: MaskingPolicy) => string
}

/**
 * 마스킹 Hook
 * @param enabled 마스킹 활성화 여부
 * @param policies 적용할 마스킹 정책 목록 (지정하지 않으면 모든 정책 사용)
 */
export function useMasking(
  { enabled, policies }: UseMaskingOptions = { enabled: true }
): UseMaskingResult {
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

  /**
   * Phase 0.5: 마스킹된 필드 정보 추출 (원본과 마스킹된 값 비교)
   */
  const getMaskedFields = <T extends Record<string, any>>(
    data: T,
    fieldMappings: Record<keyof T, MaskingPolicy | MaskingPolicy[]>
  ): MaskedFieldInfo[] => {
    if (!enabled) return []

    const maskedFields: MaskedFieldInfo[] = []

    Object.entries(fieldMappings).forEach(([field, policy]) => {
      const fieldValue = (data as Record<string, any>)[field]
      if (fieldValue === null || fieldValue === undefined) return

      const originalValue = String(fieldValue)
      let maskedValue = originalValue

      if (Array.isArray(policy)) {
        // 여러 정책을 순차적으로 적용
        policy.forEach(p => {
          maskedValue = maskValue(maskedValue, p)
        })
        // 첫 번째 정책을 대표 정책으로 사용
        maskedFields.push({
          originalValue,
          maskedValue,
          policy: policy[0],
          fieldName: field,
        })
      } else {
        maskedValue = maskValue(originalValue, policy)
        maskedFields.push({
          originalValue,
          maskedValue,
          policy,
          fieldName: field,
        })
      }
    })

    return maskedFields
  }

  /**
   * Phase 0.5: 데이터 배열에 마스킹 적용 (배치 처리)
   */
  const maskBatch = <T extends Record<string, any>>(
    dataArray: T[],
    fieldMappings: Record<keyof T, MaskingPolicy | MaskingPolicy[]>
  ): T[] => {
    if (!enabled) return dataArray
    return dataArray.map(data => mask(data, fieldMappings))
  }

  /**
   * Phase 0.5: 마스킹 옵션별 데이터 변환 로직
   */
  const maskByOptions = <T extends Record<string, any>>(
    data: T,
    options: {
      phone?: boolean
      email?: boolean
      accountNumber?: boolean
      name?: boolean
      residentNumber?: boolean
      address?: boolean
    }
  ): T => {
    if (!enabled) return data

    const masked = { ...data } as T
    const fieldMappings: Record<string, MaskingPolicy> = {}

    // 옵션에 따라 필드 매핑 생성
    if (options.phone && 'phone' in data) {
      fieldMappings.phone = 'phone'
    }
    if (options.email && 'email' in data) {
      fieldMappings.email = 'email'
    }
    if (options.accountNumber && 'accountNumber' in data) {
      fieldMappings.accountNumber = 'accountNumber'
    }
    if (options.name && 'name' in data) {
      fieldMappings.name = 'name'
    }
    if (options.residentNumber && 'residentNumber' in data) {
      fieldMappings.residentNumber = 'residentNumber'
    }
    if (options.address && 'address' in data) {
      fieldMappings.address = 'address'
    }

    return mask(masked, fieldMappings as Record<keyof T, MaskingPolicy>)
  }

  return {
    mask,
    maskValue,
    getMaskedFields,
    maskBatch,
    maskByOptions,
  }
}
