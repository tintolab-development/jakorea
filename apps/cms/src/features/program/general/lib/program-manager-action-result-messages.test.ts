import { describe, expect, it } from 'vitest'
import {
  PROGRAM_MANAGER_ADD_COMPLETE_BODY,
  PROGRAM_MANAGER_ADD_COMPLETE_TITLE,
  PROGRAM_MANAGER_DELETE_COMPLETE_BODY,
  PROGRAM_MANAGER_DELETE_COMPLETE_TITLE,
  PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY,
  PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE,
} from './program-manager-action-result-messages'

describe('program-manager action result messages', () => {
  it('추가 등록은 추가 완료 시안 문구를 쓴다', () => {
    expect(PROGRAM_MANAGER_ADD_COMPLETE_TITLE).toBe('추가 완료')
    expect(PROGRAM_MANAGER_ADD_COMPLETE_BODY).toBe('추가되었습니다.')
  })

  it('삭제는 삭제 완료 시안 문구를 쓴다', () => {
    expect(PROGRAM_MANAGER_DELETE_COMPLETE_TITLE).toBe('삭제 완료')
    expect(PROGRAM_MANAGER_DELETE_COMPLETE_BODY).toBe('삭제되었습니다.')
  })

  it('권한 변경은 변경 완료 시안 문구를 쓴다', () => {
    expect(PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_TITLE).toBe('변경 완료')
    expect(PROGRAM_MANAGER_ROLE_CHANGE_COMPLETE_BODY).toBe('변경되었습니다.')
  })
})
