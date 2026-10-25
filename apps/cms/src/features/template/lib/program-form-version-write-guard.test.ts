import { describe, expect, it } from 'vitest'
import {
  canWriteProgramFormVersionInPlace,
  readFormVersionStatus,
} from './program-form-version-write-guard'

describe('canWriteProgramFormVersionInPlace (공용 데이터 보호)', () => {
  const owned = {
    templateId: 501,
    versionStatus: 'DRAFT',
    activeBindingCount: 1,
    templateScope: 'PROGRAM',
    ownerProgramId: 186363,
  }
  const opts = { catalogTemplateId: 10, programId: '186363' }

  it('이 프로그램 소유 PROGRAM 스코프 DRAFT만 제자리 쓰기를 허용한다', () => {
    expect(canWriteProgramFormVersionInPlace(owned, opts)).toBe(true)
  })

  it.each([
    ['상태 불명', { ...owned, versionStatus: undefined }, opts],
    ['PUBLISHED', { ...owned, versionStatus: 'PUBLISHED' }, opts],
    ['여러 바인딩 공유', { ...owned, activeBindingCount: 2 }, opts],
    ['카탈로그 템플릿', { ...owned, templateId: 10 }, opts],
    ['template_scope=CATALOG', { ...owned, templateScope: 'CATALOG' }, opts],
    ['소유 정보 없음(현재 BE 응답)', { templateId: 501, versionStatus: 'DRAFT' }, opts],
    ['다른 프로그램 소유', { ...owned, ownerProgramId: 999 }, opts],
    ['카탈로그 확인 실패', owned, { ...opts, catalogTemplateId: null }],
    ['programId 없음', owned, { catalogTemplateId: 10 }],
    ['forceCopy', owned, { ...opts, forceCopy: true }],
  ])('%s 이면 COPY해야 한다', (_label, version, options) => {
    expect(canWriteProgramFormVersionInPlace(version, options)).toBe(false)
  })

  it('상태는 versionStatus를 읽고, 없으면 status를 호환으로 읽는다', () => {
    expect(readFormVersionStatus({ versionStatus: 'PUBLISHED', status: 'DRAFT' })).toBe('PUBLISHED')
    expect(readFormVersionStatus({ status: 'draft' })).toBe('DRAFT')
    expect(readFormVersionStatus({})).toBeNull()
  })
})
