import { describe, expect, it } from 'vitest'
import type { ProgramMaterialCandidateResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialCandidateResponse'
import type { ProgramMaterialResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialResponse'
import {
  buildProgramMaterialSaveRequest,
  formatProgramMaterialDisplay,
  logicalMaterialKey,
  toExistingAssignmentRequest,
  toNewAssignmentRequest,
  uniqueCandidatesByLogicalKey,
} from './program-material-assignment'

const existing: ProgramMaterialResponse = {
  id: 11,
  textbookId: 100,
  textbookNameKo: '성공하는 경제생활',
  kitId: 7,
  kitVersionId: 1,
  targetLevel: '초등학교',
  booksPerKitSnapshot: 24,
  studentCountBasis: 50,
  calculatedKitCount: 3,
  deliveryStatusTag: '배송 준비 중',
}

const newerCandidate: ProgramMaterialCandidateResponse = {
  textbookId: 100,
  textbookNameKo: '성공하는 경제생활',
  kitId: 7,
  kitVersionId: 2,
  versionNo: 2,
  targetLevel: '초등학교',
  bookCountPerKit: 32,
}

describe('logicalMaterialKey', () => {
  it('교재 ID와 교육 대상으로 식별하고 키트 버전은 제외한다', () => {
    expect(logicalMaterialKey(existing)).toBe(logicalMaterialKey(newerCandidate))
    expect(logicalMaterialKey(existing)).toBe('100:초등학교')
  })
})

describe('uniqueCandidatesByLogicalKey', () => {
  it('같은 교재의 최신 버전만 남긴다', () => {
    const unique = uniqueCandidatesByLogicalKey([
      { ...newerCandidate, kitVersionId: 1, versionNo: 1 },
      newerCandidate,
    ])
    expect(unique).toHaveLength(1)
    expect(unique[0]?.kitVersionId).toBe(2)
  })
})

describe('formatProgramMaterialDisplay', () => {
  it('서버 스냅샷으로 1키트당 권수·필요 키트·총 권수를 표시한다', () => {
    const display = formatProgramMaterialDisplay(existing)
    expect(display.title).toBe('성공하는 경제생활 (초등학교)')
    expect(display.booksPerKitLabel).toBe('1키트당 24권')
    expect(display.studentCountLabel).toBe('기준 학생 수 50명')
    expect(display.kitCountLabel).toBe('필요 수량 3키트 (총 72권)')
    expect(display.deliveryLabel).toBe('배송 준비 중')
  })

  it('학생 수·키트 수가 없으면 0으로 표시하지 않는다', () => {
    const display = formatProgramMaterialDisplay({
      textbookId: 100,
      textbookNameKo: '성공하는 경제생활',
      kitVersionId: 1,
      booksPerKitSnapshot: 24,
    })
    expect(display.studentCountLabel).toBe('기준 학생 수 미확정')
    expect(display.kitCountLabel).toBe('필요 키트 수 미산출')
  })

  it('교재 ID가 없으면 해당 없음으로 표시하고 배정은 유지한다', () => {
    const display = formatProgramMaterialDisplay({
      id: 11,
      booksPerKitSnapshot: 24,
      calculatedKitCount: 3,
    })
    expect(display.title).toBe('해당 없음')
    expect(display.kitCountLabel).toBe('필요 수량 3키트 (총 72권)')
  })
})

describe('assignment request mapping', () => {
  it('기존 배정은 서버 스냅샷 버전·수량을 보존한다', () => {
    expect(toExistingAssignmentRequest(existing)).toEqual({
      textbookId: 100,
      kitId: 7,
      kitVersionId: 1,
      targetLevel: '초등학교',
      booksPerKitSnapshot: 24,
      studentCountBasis: 50,
      calculatedKitCount: 3,
      autoMatchedYn: false,
    })
  })

  it('신규 배정은 후보 버전을 보내되 프로그램 수량 스냅샷은 넣지 않는다', () => {
    expect(toNewAssignmentRequest(newerCandidate)).toEqual({
      textbookId: 100,
      kitId: 7,
      kitVersionId: 2,
      targetLevel: '초등학교',
      autoMatchedYn: false,
    })
    expect(toNewAssignmentRequest(newerCandidate)).not.toHaveProperty('booksPerKitSnapshot')
    expect(toNewAssignmentRequest(newerCandidate)).not.toHaveProperty('calculatedKitCount')
  })
})

describe('buildProgramMaterialSaveRequest', () => {
  const existingKey = logicalMaterialKey(existing)
  const existingByKey = new Map([[existingKey, existing]])
  const candidateByKey = new Map([[existingKey, newerCandidate]])

  it('기존 선택 저장 시 최신 후보 버전으로 덮지 않는다', () => {
    const result = buildProgramMaterialSaveRequest({
      mode: 'ASSIGNED',
      selectedKeys: [existingKey],
      existingByKey,
      candidateByKey,
      previousItems: [existing],
      isLoading: false,
      candidatesFailed: false,
    })
    expect(result).toEqual({
      ok: true,
      noneYn: false,
      items: [toExistingAssignmentRequest(existing)],
    })
    if (result.ok) {
      expect(result.items[0]?.kitVersionId).toBe(1)
      expect(result.items[0]?.booksPerKitSnapshot).toBe(24)
    }
  })

  it('교재 없음은 빈 배열 PUT을 허용한다', () => {
    expect(
      buildProgramMaterialSaveRequest({
        mode: 'NONE',
        selectedKeys: [],
        existingByKey,
        candidateByKey,
        previousItems: [existing],
        isLoading: false,
        candidatesFailed: false,
      })
    ).toEqual({ ok: true, noneYn: true, items: [] })
  })

  it('후보 API 실패 시 기존 배정 삭제 PUT을 막는다', () => {
    const result = buildProgramMaterialSaveRequest({
      mode: 'ASSIGNED',
      selectedKeys: [],
      existingByKey,
      candidateByKey: new Map(),
      previousItems: [existing],
      isLoading: false,
      candidatesFailed: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('candidates_failed')
  })

  it('로딩 중 저장을 막는다', () => {
    const result = buildProgramMaterialSaveRequest({
      mode: 'ASSIGNED',
      selectedKeys: [existingKey],
      existingByKey,
      candidateByKey,
      previousItems: [existing],
      isLoading: true,
      candidatesFailed: false,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('loading')
  })

  it('후보 실패여도 기존 선택만 있으면 기존 스냅샷으로 저장한다', () => {
    const result = buildProgramMaterialSaveRequest({
      mode: 'ASSIGNED',
      selectedKeys: [existingKey],
      existingByKey,
      candidateByKey: new Map(),
      previousItems: [existing],
      isLoading: false,
      candidatesFailed: true,
    })
    expect(result).toEqual({
      ok: true,
      noneYn: false,
      items: [toExistingAssignmentRequest(existing)],
    })
  })
})
