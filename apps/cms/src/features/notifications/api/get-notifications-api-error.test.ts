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

  it('EMAIL 첨부/발신 에러 코드를 매핑한다', () => {
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_ATTACHMENT_LIMIT_EXCEEDED'), 'fallback')
    ).toBe('파일은 최대 10개까지 첨부할 수 있습니다.')
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'FILE_NOT_CLEAN'), 'fallback')
    ).toBe('파일 검사가 완료되지 않았거나 사용할 수 없는 파일입니다. 다시 업로드해 주세요.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'EMAIL_TEMPLATE_LANGUAGE_FREEMARKER_NOT_SUPPORTED'),
        'fallback'
      )
    ).toContain('FreeMarker')
  })

  it('NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING을 사용자 문구로 변환한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(
          400,
          'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING',
          'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:사용자 아이디(이메일)'
        ),
        'fallback'
      )
    ).toBe('템플릿 필수 변수가 없습니다: 사용자 아이디(이메일)')
  })
})
