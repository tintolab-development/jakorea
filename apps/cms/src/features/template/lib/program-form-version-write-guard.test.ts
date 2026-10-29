import { describe, expect, it } from 'vitest'
import {
  canWriteProgramFormVersionInPlace,
  readFormVersionStatus,
  resolveProgramFormWritePlan,
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

  it('PROGRAM 소유 DRAFT는 바인딩이 여러 개여도 제자리 PUT한다(봉사자 상·하반기 공유)', () => {
    expect(
      canWriteProgramFormVersionInPlace({ ...owned, activeBindingCount: 2 }, opts)
    ).toBe(true)
  })

  it('PROGRAM 소유이면 catalogTemplateId 없이도 제자리 PUT한다', () => {
    expect(
      canWriteProgramFormVersionInPlace(owned, { programId: '186363', catalogTemplateId: null })
    ).toBe(true)
  })

  it.each([
    ['상태 불명', { ...owned, versionStatus: undefined }, opts, 'create-draft-version'],
    ['PUBLISHED', { ...owned, versionStatus: 'PUBLISHED' }, opts, 'create-draft-version'],
    ['ARCHIVED', { ...owned, versionStatus: 'ARCHIVED' }, opts, 'create-draft-version'],
    ['카탈로그 템플릿 id만 같고 scope 없음', { templateId: 10, versionStatus: 'DRAFT' }, opts, 'copy-from-catalog'],
    ['template_scope=CATALOG', { ...owned, templateScope: 'CATALOG', ownerProgramId: null }, opts, 'copy-from-catalog'],
    ['소유 정보 없음(구버전 카탈로그 id 일치)', { templateId: 10, versionStatus: 'DRAFT' }, opts, 'copy-from-catalog'],
    ['다른 프로그램 소유', { ...owned, ownerProgramId: 999 }, opts, 'create-draft-version'],
    ['COPY 스코프', { ...owned, templateScope: 'COPY', ownerProgramId: null }, opts, 'create-draft-version'],
    ['forceCopy', owned, { ...opts, forceCopy: true }, 'copy-from-catalog'],
  ])('%s 이면 %s', (_label, version, options, action) => {
    expect(resolveProgramFormWritePlan(version, options).action).toBe(action)
    expect(canWriteProgramFormVersionInPlace(version, options)).toBe(
      resolveProgramFormWritePlan(version, options).action === 'write-in-place'
    )
  })

  it('구버전: catalog templateId와 다르면 이미 전용 복사본으로 본다', () => {
    expect(
      resolveProgramFormWritePlan(
        { templateId: 501, versionStatus: 'DRAFT' },
        opts
      ).action
    ).toBe('write-in-place')
    expect(
      resolveProgramFormWritePlan(
        { templateId: 501, versionStatus: 'PUBLISHED' },
        opts
      ).action
    ).toBe('create-draft-version')
  })

  it('상태는 versionStatus를 읽고, 없으면 status를 호환으로 읽는다', () => {
    expect(readFormVersionStatus({ versionStatus: 'PUBLISHED', status: 'DRAFT' })).toBe('PUBLISHED')
    expect(readFormVersionStatus({ status: 'draft' })).toBe('DRAFT')
    expect(readFormVersionStatus({})).toBeNull()
  })
})
