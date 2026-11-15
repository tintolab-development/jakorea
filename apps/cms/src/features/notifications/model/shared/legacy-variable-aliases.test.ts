import { describe, expect, it } from 'vitest'
import { templateUsesProgramRequiredVariable } from '@/features/notifications/api/adapters/alimtalk-send-batch-adapters'
import { listAlimtalkManualSendUnusableKeys } from '@/features/notifications/model/alimtalk-send/manual-send-usable'
import { listNotificationSendTemplateDisabledKeysForProgram } from './template-usable-for-program'
import {
  findNotificationCatalogEntry,
  withNotificationRenamedVariableKeys,
} from './legacy-variable-aliases'

/** BE 44784cf36 이후 카탈로그: 새 key만 온다 */
const renamedCatalog = [
  {
    key: '프로그램 담당자명',
    token: '#{프로그램 담당자명}',
    enabled: true,
    requiresProgram: true,
    sourceMode: 'SERVER_RESOLVED' as const,
  },
  {
    key: '프로그램 담당자 연락처',
    token: '#{프로그램 담당자 연락처}',
    enabled: true,
    requiresProgram: true,
    sourceMode: 'SERVER_RESOLVED' as const,
  },
]

describe('자동입력 변수 개명 별칭 (담당자명 → 프로그램 담당자명)', () => {
  it('예전 key는 새 key 항목으로 찾는다', () => {
    expect(findNotificationCatalogEntry(renamedCatalog, '담당자명')?.key).toBe('프로그램 담당자명')
    expect(findNotificationCatalogEntry(renamedCatalog, '담당자 연락처')?.key).toBe(
      '프로그램 담당자 연락처'
    )
    expect(findNotificationCatalogEntry(renamedCatalog, '없는 변수')).toBeUndefined()
  })

  it('카탈로그에 예전 key가 아직 있으면(BE 배포 전) 그 항목을 그대로 쓴다', () => {
    const legacyCatalog = [{ key: '담당자명', token: '#{담당자명}' }, ...renamedCatalog]
    expect(findNotificationCatalogEntry(legacyCatalog, '담당자명')?.key).toBe('담당자명')
  })

  it('예전 토큰이 든 기존 알림톡 템플릿을 "등록되지 않은 변수"로 막지 않는다', () => {
    const unusable = listAlimtalkManualSendUnusableKeys({
      usedKeys: ['담당자명', '담당자 연락처'],
      catalog: renamedCatalog,
      programNumericId: 10,
    })
    expect(unusable.unregistered).toEqual([])
    expect(unusable.catalogConditionDisabled).toEqual([])
  })

  it('메일·문자 피커도 예전 토큰을 쓸 수 없는 변수로 보지 않는다', () => {
    expect(
      listNotificationSendTemplateDisabledKeysForProgram({
        usedKeys: ['담당자명'],
        catalog: renamedCatalog,
        programNumericId: 10,
      })
    ).toEqual([])
  })

  it('예전 토큰도 프로그램 필수 변수로 판정한다', () => {
    expect(
      templateUsesProgramRequiredVariable(
        renamedCatalog.map(item => ({
          ...item,
          description: item.key,
          programGroups: [],
          recruitmentTypes: [],
          participantTypes: [],
          memberTypes: [],
        })),
        { content: '안녕하세요 #{담당자명}입니다.' }
      )
    ).toBe(true)
  })

  it('본문 key 집합에 새 이름을 더한다', () => {
    expect([...withNotificationRenamedVariableKeys(['회원명', '담당자명'])]).toEqual([
      '회원명',
      '담당자명',
      '프로그램 담당자명',
    ])
  })
})
