import { describe, expect, it } from 'vitest'
import {
  getNotificationSendBatchErrorMessage,
  getNotificationsApiErrorMessage,
  isAlimtalkTemplateDeleteRejectedByNhnError,
  isCategoryHasChildrenError,
  isCategoryNeedsSyncError,
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
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_SENDER_PROFILE_MISMATCH'), 'fallback')
    ).toBe('메일 발신 프로필이 템플릿 발신 메일과 일치하지 않습니다.')
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_SENDER_PROFILE_NOT_HARVESTED'), 'fallback')
    ).toBe('NHN에 등록된 발신 메일만 사용할 수 있습니다. 발신 프로필을 확인해 주세요.')
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_SENDER_PROFILES_EMPTY'), 'fallback')
    ).toBe(
      'NHN 발신 메일 프로필이 없습니다. 발신 프로필 동기화(sync) 후 다시 시도해 주세요.'
    )
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_SENDER_PROFILE_NOT_FOUND'),
        'fallback'
      )
    ).toContain('발신 프로필을 찾을 수 없습니다')
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_TEMPLATE_FILE_OWNER_INVALID'), 'fallback')
    ).toContain('메일 템플릿이 아닙니다')
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_ATTACHMENT_OWNER_MISMATCH'), 'fallback')
    ).toContain('소유가 아닙니다')
    expect(
      getNotificationsApiErrorMessage(apiError(404, 'FILE_OBJECT_NOT_FOUND'), 'fallback')
    ).toContain('파일을 찾을 수 없습니다')
  })

  it('EMAIL_TEMPLATE_NAME_INVALID와 displayName 누락을 안내한다', () => {
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_TEMPLATE_NAME_INVALID'), 'fallback')
    ).toBe(
      '메일 템플릿명은 한글·영문·숫자·_·-만 사용할 수 있습니다. 공백은 사용할 수 없습니다.'
    )
    expect(
      getNotificationsApiErrorMessage(
        {
          response: {
            status: 400,
            data: {
              success: false,
              error: {
                code: 'MISSING_PARAMETER',
                message: '필수 입력값이 누락되었습니다',
                field: 'displayName',
              },
            },
          },
        },
        'fallback'
      )
    ).toBe('템플릿명을 입력해 주세요.')
  })

  it('EMAIL_CATEGORY_NOT_LINKED_TO_NHN은 동기화 안내를 쓴다', () => {
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_CATEGORY_NOT_LINKED_TO_NHN'), 'fallback')
    ).toContain('카테고리 동기화')
  })

  it('EMAIL_SENDER_PROFILES_EMPTY는 동기화 CTA 대상이다', () => {
    expect(isCategoryNeedsSyncError(apiError(400, 'EMAIL_SENDER_PROFILES_EMPTY'))).toBe(true)
    expect(isCategoryNeedsSyncError(apiError(400, 'EMAIL_SENDER_PROFILE_NOT_HARVESTED'))).toBe(
      false
    )
  })

  it('SMS_TEMPLATE_DELETE_REJECTED_BY_NHN과 발신번호·부모 미연결을 매핑한다', () => {
    expect(
      getNotificationsApiErrorMessage(apiError(409, 'SMS_TEMPLATE_DELETE_REJECTED_BY_NHN'), 'fallback')
    ).toContain('문자 템플릿 삭제')
    expect(
      getNotificationsApiErrorMessage(
        apiError(
          409,
          'SMS_TEMPLATE_DELETE_REJECTED_BY_NHN',
          'Hub에서 삭제가 거절되었습니다.'
        ),
        'fallback'
      )
    ).toBe('Hub에서 삭제가 거절되었습니다.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'),
        'fallback'
      )
    ).toContain('부모 카테고리')
    expect(isCategoryNeedsSyncError(apiError(400, 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'))).toBe(
      true
    )
    expect(
      getNotificationsApiErrorMessage(
        {
          response: {
            status: 400,
            data: {
              success: false,
              error: {
                code: 'MISSING_PARAMETER',
                message: 'SMS template requires providerSenderPhoneNumber when NHN catalog is enabled',
                field: 'providerSenderPhoneNumber',
              },
            },
          },
        },
        'fallback'
      )
    ).toBe('발신 번호를 선택하세요.')
  })

  it('PROVIDER_UNAVAILABLE은 code·traceId를 함께 노출한다', () => {
    const message = getNotificationsApiErrorMessage(
      {
        response: {
          status: 503,
          data: {
            success: false,
            error: {
              code: 'PROVIDER_UNAVAILABLE',
              message: 'hub down',
              traceId: 'trace-abc',
            },
          },
        },
      },
      'fallback'
    )
    expect(message).toContain('외부 연동 서비스를 사용할 수 없습니다')
    expect(message).toContain('code: PROVIDER_UNAVAILABLE')
    expect(message).toContain('message: hub down')
    expect(message).toContain('traceId: trace-abc')
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
    ).toBe(
      '템플릿 필수 변수가 없습니다: 사용자 아이디(이메일)\n본문 #{키} 값이 비어 발송이 중단되었습니다. 수신자·프로그램 데이터 또는 템플릿 본문을 확인하세요.'
    )
  })

  it('NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING 복수 키를 표시한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(
          400,
          'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING',
          'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:교육 진행 수업 시간,배정 기관명'
        ),
        'fallback'
      )
    ).toBe(
      '템플릿 필수 변수가 없습니다: 교육 진행 수업 시간, 배정 기관명\n본문 #{키} 값이 비어 발송이 중단되었습니다. 수신자·프로그램 데이터 또는 템플릿 본문을 확인하세요.'
    )
  })

  it('NOTIFICATION_SERVER_RESERVED_VARIABLE 키를 표시한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(
          400,
          'NOTIFICATION_SERVER_RESERVED_VARIABLE',
          'NOTIFICATION_SERVER_RESERVED_VARIABLE:휴대폰 번호'
        ),
        'fallback'
      )
    ).toBe('서버가 채우는 예약 변수는 발송 요청에 넣을 수 없습니다: 휴대폰 번호')
  })

  it('DIRECT + AD 및 프로그램 필수 에러를 매핑한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'DIRECT_RECIPIENT_AD_CONSENT_UNSUPPORTED'),
        'fallback'
      )
    ).toBe('직접 입력 수신자로는 광고성 템플릿을 발송할 수 없습니다.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_PROGRAM_REQUIRED_FOR_RECIPIENTS'),
        'fallback'
      )
    ).toBe('프로그램을 먼저 선택하세요.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES'),
        'fallback'
      )
    ).toBe('프로그램 필수 변수가 있어 프로그램을 선택하세요.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_RECIPIENT_NOT_IN_PROGRAM'),
        'fallback'
      )
    ).toBe('선택한 수신자가 해당 프로그램 참여자가 아닙니다.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_ADMIN_RECIPIENT_NOT_IN_PROGRAM'),
        'fallback'
      )
    ).toBe('선택한 관리자가 해당 프로그램에 배정되어 있지 않습니다.')
  })

  it('PROGRAM_NOT_FOUND는 권한/장애로 오해되지 않는 고정 문구를 쓴다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(404, 'PROGRAM_NOT_FOUND', '프로그램을 찾을 수 없습니다.'),
        'fallback'
      )
    ).toBe('선택한 프로그램이 없거나 잘못된 id입니다. 프로그램 목록을 다시 불러오세요.')
  })

  it('발송 배치 INVALID_VALUE는 예약 시각 재확인 CTA를 붙인다', () => {
    expect(
      getNotificationSendBatchErrorMessage(
        apiError(400, 'INVALID_VALUE', '입력값 또는 요청 조건을 확인해 주세요.'),
        'fallback'
      )
    ).toBe('예약 시간은 현재 이후여야 합니다. 예약 발송 시각을 다시 확인해 주세요.')
  })
})
