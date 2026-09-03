// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { shouldRecordFileAccessRemotely } from '@/shared/lib/should-record-file-access-remotely'

describe('shouldRecordFileAccessRemotely', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('BE client API 배포 전에는 항상 false (405 방지)', () => {
    localStorage.setItem('auth_token', 'aaa.bbb.ccc')
    expect(shouldRecordFileAccessRemotely()).toBe(false)
  })
})
