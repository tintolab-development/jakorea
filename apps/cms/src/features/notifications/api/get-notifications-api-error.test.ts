import { describe, expect, it } from 'vitest'
import {
  getNotificationsApiErrorMessage,
  isAlimtalkTemplateDeleteRejectedByNhnError,
  isCategoryHasChildrenError,
} from './get-notifications-api-error'

function apiError(status: number, code: string, message?: string) {
  return {
    response: {
      status,
      data: {
        success: false,
        data: null,
        message: message ?? null,
        error: { code, message: message ?? code },
      },
    },
  }
}

describe('get-notifications-api-error', () => {
  it('CATEGORY_HAS_CHILDREN만 하위 존재 삭제로 본다', () => {
    const children = apiError(409, 'CATEGORY_HAS_CHILDREN')
    const rejected = apiError(409, 'ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN', 'Hub 거절')

    expect(isCategoryHasChildrenError(children)).toBe(true)
    expect(isCategoryHasChildrenError(rejected)).toBe(false)
    expect(getNotificationsApiErrorMessage(children, 'fallback')).toBe(
      '하위 카테고리 또는 템플릿이 있어 삭제할 수 없습니다.'
    )
  })

  it('ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN은 서버 메시지와 Console CTA 분기를 쓴다', () => {
    const error = apiError(409, 'ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN', '승인 템플릿은 삭제할 수 없습니다.')

    expect(isAlimtalkTemplateDeleteRejectedByNhnError(error)).toBe(true)
    expect(getNotificationsApiErrorMessage(error, 'fallback')).toBe(
      '승인 템플릿은 삭제할 수 없습니다.'
    )
  })

  it('ALIMTALK_TEMPLATE_MANAGED_BY_NHN은 본문 수정만 안내한다', () => {
    const error = apiError(409, 'ALIMTALK_TEMPLATE_MANAGED_BY_NHN')
    expect(getNotificationsApiErrorMessage(error, 'fallback')).toBe(
      '알림톡 템플릿 본문은 NHN Cloud에서 관리됩니다. CMS에서는 수정할 수 없습니다.'
    )
  })
})
