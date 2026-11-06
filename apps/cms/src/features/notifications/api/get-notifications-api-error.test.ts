import { describe, expect, it } from 'vitest'
import {
  getNotificationSendBatchErrorMessage,
  getNotificationsApiErrorMessage,
  isAlimtalkTemplateDeleteRejectedByNhnError,
  isCategoryHasChildrenError,
  isCategoryNeedsSyncError,
  resolveNotificationSendFieldError,
  NOTIFICATION_MMS_ATTACHMENT_ERROR_CODES,
} from './get-notifications-api-error'
import { formatNotificationFailedReason } from '@/features/notifications/model/shared/format-notification-failed-reason'

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
    const error = apiError(
      409,
      'ALIMTALK_TEMPLATE_DELETE_REJECTED_BY_NHN',
      '승인 템플릿은 삭제할 수 없습니다.'
    )

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
    expect(getNotificationsApiErrorMessage(apiError(400, 'FILE_NOT_CLEAN'), 'fallback')).toBe(
      '파일 검사가 완료되지 않았거나 사용할 수 없는 파일입니다. 다시 업로드해 주세요.'
    )
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
      getNotificationsApiErrorMessage(
        apiError(400, 'EMAIL_SENDER_PROFILE_NOT_HARVESTED'),
        'fallback'
      )
    ).toBe('NHN에 등록된 발신 메일만 사용할 수 있습니다. 발신 프로필을 확인해 주세요.')
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_SENDER_PROFILES_EMPTY'), 'fallback')
    ).toBe('NHN 발신 메일 프로필이 없습니다. 발신 프로필 동기화(sync) 후 다시 시도해 주세요.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_SENDER_PROFILE_NOT_FOUND'),
        'fallback'
      )
    ).toContain('발신 프로필을 찾을 수 없습니다')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'EMAIL_TEMPLATE_FILE_OWNER_INVALID'),
        'fallback'
      )
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
    ).toBe('메일 템플릿명은 한글·영문·숫자·_·-만 사용할 수 있습니다. 공백은 사용할 수 없습니다.')
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
      getNotificationsApiErrorMessage(
        apiError(409, 'SMS_TEMPLATE_DELETE_REJECTED_BY_NHN'),
        'fallback'
      )
    ).toContain('문자 템플릿 삭제')
    expect(
      getNotificationsApiErrorMessage(
        apiError(409, 'SMS_TEMPLATE_DELETE_REJECTED_BY_NHN', 'Hub에서 삭제가 거절되었습니다.'),
        'fallback'
      )
    ).toBe('Hub에서 삭제가 거절되었습니다.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'),
        'fallback'
      )
    ).toContain('부모 카테고리')
    expect(
      isCategoryNeedsSyncError(apiError(400, 'NOTIFICATION_CATEGORY_PARENT_NOT_LINKED_TO_NHN'))
    ).toBe(true)
    expect(
      getNotificationsApiErrorMessage(
        {
          response: {
            status: 400,
            data: {
              success: false,
              error: {
                code: 'MISSING_PARAMETER',
                message:
                  'SMS template requires providerSenderPhoneNumber when NHN catalog is enabled',
                field: 'providerSenderPhoneNumber',
              },
            },
          },
        },
        'fallback'
      )
    ).toBe('발신 번호를 선택해 주세요.')
  })

  it('PROVIDER_UNAVAILABLE은 안내·서버 메시지·traceId를 노출하고 코드는 숨긴다', () => {
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
    expect(message).not.toContain('PROVIDER_UNAVAILABLE')
    expect(message).toContain('message: hub down')
    expect(message).toContain('traceId: trace-abc')
  })

  it('NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED는 일반 안내만 표시한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED'),
        'fallback'
      )
    ).toBe(
      '선택한 템플릿에 현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다. 템플릿과 수신자 설정을 다시 확인해 주세요.'
    )
  })

  it('NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED 메시지 변수명을 표시한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(
          400,
          'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED',
          'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED:참여자 모집 문의처명'
        ),
        'fallback'
      )
    ).toBe(
      '선택한 템플릿에 현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다. 템플릿과 수신자 설정을 다시 확인해 주세요.\n사용할 수 없는 변수: 참여자 모집 문의처명'
    )
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED', '참여자 모집 문의처명'),
        'fallback'
      )
    ).toContain('사용할 수 없는 변수: 참여자 모집 문의처명')
  })

  it('NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED:{변수명} 레거시 코드를 매핑한다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED:참여자 모집 문의처명'),
        'fallback'
      )
    ).toContain('사용할 수 없는 변수: 참여자 모집 문의처명')
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
    ).toBe('프로그램을 먼저 선택해 주세요.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES'),
        'fallback'
      )
    ).toBe('프로그램 필수 변수가 있어 프로그램을 선택해 주세요.')
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

describe('resolveNotificationSendFieldError', () => {
  it('BE 발송 검증 코드는 BE 문구 그대로 + 포커스 필드', () => {
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_SMS_SENDER_PROFILE_MISMATCH', '발신번호가 일치하지 않습니다.')
      )
    ).toEqual({
      code: 'NOTIFICATION_SMS_SENDER_PROFILE_MISMATCH',
      field: 'sender',
      message: '발신번호가 일치하지 않습니다.',
    })
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_SMS_CONTENT_REQUIRED', '본문을 입력해 주세요.')
      )?.field
    ).toBe('content')
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_SENDER_DISPLAY_NAME_INVALID', '발신자명 형식 오류')
      )?.field
    ).toBe('senderDisplayName')
  })

  it('MMS 첨부 오류 코드는 BE error.message 그대로 + 첨부 영역 포커스', () => {
    for (const code of NOTIFICATION_MMS_ATTACHMENT_ERROR_CODES) {
      expect(resolveNotificationSendFieldError(apiError(400, code, `BE ${code}`))).toEqual({
        code,
        field: 'attachments',
        message: `BE ${code}`,
      })
    }
  })

  it('없는 fileObjectId(NOT_FOUND)·만료(NOT_AVAILABLE)는 BE 문구 없으면 계약 문구', () => {
    expect(
      resolveNotificationSendFieldError(apiError(400, 'NOTIFICATION_MMS_ATTACHMENT_NOT_FOUND'))
        ?.message
    ).toBe('MMS 첨부 파일을 찾을 수 없습니다.')
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_MMS_ATTACHMENT_NOT_AVAILABLE'),
        'fallback'
      )
    ).toContain('파일을 다시 등록해 주세요.')
  })

  it('CODE:{키} 접두어도 매칭하고, 그 외 코드는 null', () => {
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_SERVER_RESERVED_VARIABLE:회원명', '예약 변수 오류')
      )
    ).toMatchObject({ code: 'NOTIFICATION_SERVER_RESERVED_VARIABLE', field: null })
    expect(resolveNotificationSendFieldError(apiError(503, 'PROVIDER_UNAVAILABLE'))).toBeNull()
    expect(resolveNotificationSendFieldError(new Error('local'))).toBeNull()
  })

  it('NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED는 템플릿 필드로 안내한다', () => {
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED')
      )
    ).toEqual({
      code: 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED',
      field: 'template',
      message:
        '선택한 템플릿에 현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다. 템플릿과 수신자 설정을 다시 확인해 주세요.',
    })
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED:참여자 모집 문의처명')
      )
    ).toEqual({
      code: 'NOTIFICATION_TEMPLATE_VARIABLE_SCOPE_DISABLED',
      field: 'template',
      message:
        '선택한 템플릿에 현재 프로그램 또는 수신자 유형에서 사용할 수 없는 변수가 포함되어 있습니다. 템플릿과 수신자 설정을 다시 확인해 주세요.\n사용할 수 없는 변수: 참여자 모집 문의처명',
    })
  })

  it('EVENT_ONLY·UNREGISTERED API 코드는 발송 필드 오류로 취급하지 않는다', () => {
    expect(resolveNotificationSendFieldError(apiError(400, 'EVENT_ONLY'))).toBeNull()
    expect(resolveNotificationSendFieldError(apiError(400, 'UNREGISTERED'))).toBeNull()
  })

  it('메일·문자 기존 발송 오류 매핑을 유지한다', () => {
    expect(
      getNotificationsApiErrorMessage(apiError(400, 'EMAIL_ATTACHMENT_LIMIT_EXCEEDED'), 'fallback')
    ).toBe('파일은 최대 10개까지 첨부할 수 있습니다.')
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_MMS_ATTACHMENT_NOT_FOUND', 'MMS 첨부 없음')
      )
    ).toEqual({
      code: 'NOTIFICATION_MMS_ATTACHMENT_NOT_FOUND',
      field: 'attachments',
      message: 'MMS 첨부 없음',
    })
    expect(
      resolveNotificationSendFieldError(
        apiError(400, 'NOTIFICATION_SMS_SENDER_PROFILE_MISMATCH', '발신번호가 일치하지 않습니다.')
      )?.field
    ).toBe('sender')
  })
})

describe('formatNotificationFailedReason', () => {
  it('변수 누락 failureCode(VARIABLE_RESOLUTION_FAILED 접두어)를 안내 문구로 바꾼다', () => {
    expect(formatNotificationFailedReason('NOTIFICATION_TEMPLATE_VARIABLE_RESOLUTION_FAILED')).toBe(
      '자동입력 변수값이 없어 발송되지 않았습니다.'
    )
    // 구 코드는 상세(;type=… 등)를 노출하지 않는 일반 문구
    expect(
      formatNotificationFailedReason('NOTIFICATION_TEMPLATE_VARIABLE_RESOLUTION_FAILED:회원명')
    ).toBe('자동입력 변수값이 없어 발송되지 않았습니다.')
    expect(
      formatNotificationFailedReason(
        'NOTIFICATION_TEMPLATE_VARIABLE_RESOLUTION_FAILED: key=회원명;type=MEMBER'
      )
    ).toBe('자동입력 변수값이 없어 발송되지 않았습니다.')
  })

  it('REQUIRED_VARIABLE_MISSING:{키} failedReason을 자동입력 변수 누락 문구로 바꾼다', () => {
    expect(
      formatNotificationFailedReason('NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키1, 키2')
    ).toBe('자동입력 변수값이 없어 발송되지 않았습니다: 키1, 키2')
    expect(formatNotificationFailedReason('NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING')).toBe(
      '자동입력 변수값이 없어 발송되지 않았습니다.'
    )
  })
})

describe('NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:{키}', () => {
  it('키를 포함한 안내 문구와 program 포커스 필드를 돌려준다', () => {
    const error = apiError(
      400,
      'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:프로그램명,교육 일시'
    )
    expect(getNotificationsApiErrorMessage(error, 'fallback')).toBe(
      '프로그램 필수 변수가 있어 프로그램을 선택해 주세요: 프로그램명, 교육 일시'
    )
    expect(resolveNotificationSendFieldError(error)).toEqual({
      code: 'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES',
      field: 'program',
      message: '프로그램 필수 변수가 있어 프로그램을 선택해 주세요: 프로그램명, 교육 일시',
    })
  })

  it('BE message가 별도여도 code의 키로 안내한다', () => {
    const error = apiError(
      400,
      'NOTIFICATION_PROGRAM_REQUIRED_FOR_TEMPLATE_VARIABLES:프로그램명',
      'program required'
    )
    expect(resolveNotificationSendFieldError(error)?.message).toBe(
      '프로그램 필수 변수가 있어 프로그램을 선택해 주세요: 프로그램명'
    )
  })

  it('400 REQUIRED_VARIABLE_MISSING:{키} code도 생성 시 문구로 키를 보여 준다', () => {
    expect(
      getNotificationsApiErrorMessage(
        apiError(400, 'NOTIFICATION_TEMPLATE_REQUIRED_VARIABLE_MISSING:키1,키2'),
        'fallback'
      )
    ).toContain('템플릿 필수 변수가 없습니다: 키1, 키2')
  })
})
