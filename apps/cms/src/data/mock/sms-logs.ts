/**
 * SMS 발송 이력 Mock 데이터
 * Phase 0.5: 백엔드 연동 필요 항목 Mock 구현
 */

export interface SmsLog {
  id: string
  userId: string
  phoneNumber: string
  otpCode: string
  sentAt: string
  expiresAt: string
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'EXPIRED'
  deliveryStatus?: 'PENDING' | 'DELIVERED' | 'FAILED'
  errorMessage?: string
}

// Mock: SMS 발송 이력 저장소
const smsLogs: SmsLog[] = []

/**
 * SMS 발송 이력 저장
 */
export function saveSmsLog(log: Omit<SmsLog, 'id'>): SmsLog {
  const newLog: SmsLog = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...log,
  }
  smsLogs.unshift(newLog) // 최신 로그를 맨 앞에 추가
  return newLog
}

/**
 * 사용자별 SMS 발송 이력 조회
 */
export function getSmsLogsByUserId(userId: string): SmsLog[] {
  return smsLogs.filter(log => log.userId === userId)
}

/**
 * 전화번호별 SMS 발송 이력 조회
 */
export function getSmsLogsByPhone(phoneNumber: string): SmsLog[] {
  return smsLogs.filter(log => log.phoneNumber === phoneNumber)
}

/**
 * 최근 SMS 발송 이력 조회
 */
export function getRecentSmsLogs(limit: number = 50): SmsLog[] {
  return smsLogs.slice(0, limit)
}

/**
 * OTP 코드로 SMS 로그 찾기
 */
export function getSmsLogByOtp(otpCode: string, userId: string): SmsLog | undefined {
  return smsLogs.find(
    log => log.otpCode === otpCode && log.userId === userId && log.status !== 'EXPIRED'
  )
}

/**
 * SMS 발송 상태 업데이트
 */
export function updateSmsLogStatus(
  logId: string,
  status: SmsLog['status'],
  deliveryStatus?: SmsLog['deliveryStatus'],
  errorMessage?: string
): boolean {
  const log = smsLogs.find(l => l.id === logId)
  if (!log) return false

  log.status = status
  if (deliveryStatus) {
    log.deliveryStatus = deliveryStatus
  }
  if (errorMessage) {
    log.errorMessage = errorMessage
  }

  return true
}

/**
 * 만료된 SMS 로그 처리
 */
export function expireSmsLogs(): void {
  const now = new Date()
  smsLogs.forEach(log => {
    if (new Date(log.expiresAt) < now && log.status === 'SENT') {
      log.status = 'EXPIRED'
    }
  })
}

/**
 * 모든 SMS 로그 조회 (관리자용)
 */
export function getAllSmsLogs(): SmsLog[] {
  return [...smsLogs]
}
