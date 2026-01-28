/**
 * 정산 산출 규칙 Mock 서비스
 * Phase 0.4.1: 프로젝트별 커스터마이징 구현
 */

import type { SettlementCalculationRule } from '@/types/settlement-calculation'
import type { UUID } from '@/types'
import {
  TRANSPORT_FEE_POLICY,
  ACCOMMODATION_FEE,
} from '@/shared/constants/settlement-rules'

// Mock 데이터: 전역 기본 규칙 (초기값)
const defaultGlobalRule: SettlementCalculationRule = {
  id: 'global-rule-1',
  name: '기본 정산 규칙',
  description: '전역 기본 정산 산출 규칙 (§별첨2 기준, 일사일교 특수성)',
  instructorFee: {},
  transportation: {
    type: 'distance',
    distanceThreshold: TRANSPORT_FEE_POLICY.minimumDistanceForTransport,
    ratePerKm: 100,
    enabled: true,
  },
  accommodation: {
    type: 'fixed',
    fixedAmount: ACCOMMODATION_FEE,
    enabled: true,
  },
  isSpecialProgram: false,
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Mock 데이터: 전역 규칙 (mutable, UI 연동용)
let globalRule: SettlementCalculationRule = { ...defaultGlobalRule }

// Mock 데이터: 프로그램별 규칙 저장소
const programRules: Map<UUID, SettlementCalculationRule> = new Map()

export const settlementCalculationRuleService = {
  /**
   * 전역 기본 규칙 가져오기
   */
  getGlobalRule: async (): Promise<SettlementCalculationRule> => {
    return Promise.resolve(globalRule)
  },

  /**
   * Phase 0.4.1: 전역 규칙 업데이트 (규칙 설정 UI 연동)
   */
  updateGlobalRule: async (
    patch: Partial<Omit<SettlementCalculationRule, 'id' | 'programId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SettlementCalculationRule> => {
    const now = new Date().toISOString()
    globalRule = {
      ...globalRule,
      ...patch,
      id: globalRule.id,
      programId: undefined,
      isSpecialProgram: patch.isSpecialProgram ?? globalRule.isSpecialProgram,
      createdAt: globalRule.createdAt,
      updatedAt: now,
      instructorFee: { ...globalRule.instructorFee, ...(patch.instructorFee ?? {}) },
      transportation: { ...globalRule.transportation, ...(patch.transportation ?? {}) },
      accommodation: { ...globalRule.accommodation, ...(patch.accommodation ?? {}) },
    }
    return Promise.resolve(globalRule)
  },

  /**
   * 전역 규칙 초기화 (기본값 복원)
   */
  resetGlobalRule: async (): Promise<SettlementCalculationRule> => {
    globalRule = { ...defaultGlobalRule }
    return Promise.resolve(globalRule)
  },

  /**
   * 프로그램별 규칙 가져오기
   * @param programId 프로그램 ID
   * @returns 프로그램별 규칙 또는 전역 규칙
   */
  getRuleByProgram: async (programId: UUID): Promise<SettlementCalculationRule> => {
    const programRule = programRules.get(programId)
    if (programRule && programRule.enabled) {
      return Promise.resolve(programRule)
    }
    // 프로그램별 규칙이 없으면 전역 규칙 반환
    return Promise.resolve(globalRule)
  },

  /**
   * 프로그램별 규칙 저장/업데이트
   * @param programId 프로그램 ID
   * @param rule 규칙 데이터
   */
  saveProgramRule: async (
    programId: UUID,
    rule: Omit<SettlementCalculationRule, 'id' | 'programId' | 'createdAt' | 'updatedAt'>
  ): Promise<SettlementCalculationRule> => {
    const existingRule = programRules.get(programId)
    const now = new Date().toISOString()

    const savedRule: SettlementCalculationRule = {
      ...rule,
      id: existingRule?.id || `program-rule-${programId}`,
      programId,
      createdAt: existingRule?.createdAt || now,
      updatedAt: now,
    }

    programRules.set(programId, savedRule)
    return Promise.resolve(savedRule)
  },

  /**
   * 프로그램별 규칙 삭제 (전역 규칙으로 복원)
   * @param programId 프로그램 ID
   */
  deleteProgramRule: async (programId: UUID): Promise<void> => {
    programRules.delete(programId)
    return Promise.resolve()
  },

  /**
   * 모든 프로그램별 규칙 조회
   */
  getAllProgramRules: async (): Promise<SettlementCalculationRule[]> => {
    return Promise.resolve(Array.from(programRules.values()))
  },
}
