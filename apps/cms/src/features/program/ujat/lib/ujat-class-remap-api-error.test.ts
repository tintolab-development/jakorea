import { describe, expect, it } from 'vitest'
import {
  isUjatClassRemapInlineFormErrorCode,
  resolveUjatClassRemapInlineFormError,
} from '@/features/program/ujat/lib/ujat-class-remap-api-error'

describe('ujat-class-remap-api-error', () => {
  it('treats TARGET_EXISTS and SLOT_CONFLICT as inline form errors', () => {
    expect(isUjatClassRemapInlineFormErrorCode('UJAT_CLASS_REMAP_TARGET_EXISTS')).toBe(true)
    expect(isUjatClassRemapInlineFormErrorCode('UJAT_CLASS_REMAP_TARGET_SLOT_CONFLICT')).toBe(true)
    expect(isUjatClassRemapInlineFormErrorCode('UJAT_CLASS_REMAP_REVISION_CONFLICT')).toBe(false)
  })

  it('maps TARGET_EXISTS details to the matching row message', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 'UJAT_CLASS_REMAP_TARGET_EXISTS',
            message: '이미 진행 중인 학급으로 변경할 수 없습니다.',
            details: { toGrade: '2', toClassName: '1반' },
          },
        },
      },
    }
    const message = resolveUjatClassRemapInlineFormError(
      error,
      [{ existingGrade: '1학년', existingClassNo: '1반', newGrade: '2', newClassNo: '1' }]
    )
    expect(message).toBe('1번째 행의 변경 학급은 이미 진행 중인 학급입니다.')
  })

  it('falls back to server message when details do not match a row', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 'UJAT_CLASS_REMAP_TARGET_EXISTS',
            message: '이미 진행 중인 학급으로 변경할 수 없습니다.',
            details: { toGrade: '9', toClassName: '9반' },
          },
        },
      },
    }
    expect(
      resolveUjatClassRemapInlineFormError(error, [
        { existingGrade: '1학년', existingClassNo: '1반', newGrade: '3', newClassNo: '1' },
      ])
    ).toBe('이미 진행 중인 학급으로 변경할 수 없습니다.')
  })

  it('uses server SLOT_CONFLICT message for inline form', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 'UJAT_CLASS_REMAP_TARGET_SLOT_CONFLICT',
            message: '같은 교육일에 이미 존재하는 학급으로 변경할 수 없습니다.',
          },
        },
      },
    }
    expect(
      resolveUjatClassRemapInlineFormError(error, [
        { existingGrade: '1학년', existingClassNo: '1반', newGrade: '3', newClassNo: '1' },
      ])
    ).toBe('같은 교육일에 이미 존재하는 학급으로 변경할 수 없습니다.')
  })
})
