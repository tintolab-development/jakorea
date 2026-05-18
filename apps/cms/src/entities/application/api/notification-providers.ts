/**
 * 알림 발송 Provider 인터페이스 (FR-C04)
 * Task 2.4.2: 실제 문자/이메일/카카오 API 연동 준비
 * Mock 구현 제공, 추후 실제 API로 교체 가능
 */

export interface SmsSendParams {
  to: string
  body: string
  sender?: string
}

export interface SmsSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface EmailSendParams {
  to: string
  subject: string
  body: string
  /** HTML body (선택) */
  html?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface KakaoSendParams {
  /** 수신자 휴대폰 번호 또는 카카오 사용자 식별자 */
  to: string
  /** 알림톡 템플릿 ID (실제 연동 시 사용) */
  templateId?: string
  body: string
  /** 템플릿 변수 (실제 연동 시 사용) */
  templateParams?: Record<string, string>
}

export interface KakaoSendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SmsProvider {
  send(params: SmsSendParams): Promise<SmsSendResult>
}

export interface EmailProvider {
  send(params: EmailSendParams): Promise<EmailSendResult>
}

export interface KakaoProvider {
  send(params: KakaoSendParams): Promise<KakaoSendResult>
}

/** Mock 실패 시뮬레이션 비율 (0 = 항상 성공, 1 = 항상 실패) */
const MOCK_FAIL_RATE = 0

function shouldMockFail(): boolean {
  return Math.random() < MOCK_FAIL_RATE
}

function mockDelay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

const mockSmsProvider: SmsProvider = {
  async send(params) {
    await mockDelay(300)
    void params
    if (shouldMockFail()) {
      return { success: false, error: 'Mock SMS 발송 실패 (시뮬레이션)' }
    }
    return {
      success: true,
      messageId: `sms-mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }
  },
}

const mockEmailProvider: EmailProvider = {
  async send(params) {
    await mockDelay(400)
    void params
    if (shouldMockFail()) {
      return { success: false, error: 'Mock 이메일 발송 실패 (시뮬레이션)' }
    }
    return {
      success: true,
      messageId: `email-mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }
  },
}

const mockKakaoProvider: KakaoProvider = {
  async send(params) {
    await mockDelay(350)
    void params
    if (shouldMockFail()) {
      return { success: false, error: 'Mock 카카오 알림 발송 실패 (시뮬레이션)' }
    }
    return {
      success: true,
      messageId: `kakao-mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }
  },
}

/** 실제 연동 시 외부 SMS API 인스턴스로 교체 */
export const smsProvider: SmsProvider = mockSmsProvider

/** 실제 연동 시 외부 이메일 API 인스턴스로 교체 */
export const emailProvider: EmailProvider = mockEmailProvider

/** 실제 연동 시 카카오 알림톡 API 인스턴스로 교체 */
export const kakaoProvider: KakaoProvider = mockKakaoProvider
