import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  persistUjatRegistrationFormLocal,
  readUjatRegistrationLocalSaveRecords,
} from './ujat-registration-local-save'

const draft = {
  title: 'UJAT 등록',
  paragraphs: [],
  formSettings: { titleNumbering: 'number' },
} as unknown as WritingFormDraft

describe('UJAT registration local save', () => {
  const storage = new Map<string, string>()

  beforeAll(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => storage.clear(),
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size
      },
    } satisfies Storage)
  })

  beforeEach(() => {
    storage.clear()
  })

  it('같은 완료 idempotency key를 한 번만 저장한다', () => {
    const input = {
      draft,
      overlay: { 'ujat.basicInfo.programManagementName': '2026 UJAT' },
      idempotencyKey: 'completion-1',
    }

    const first = persistUjatRegistrationFormLocal(input)
    const second = persistUjatRegistrationFormLocal(input)

    expect(second.id).toBe(first.id)
    expect(readUjatRegistrationLocalSaveRecords()).toHaveLength(1)
  })
})
