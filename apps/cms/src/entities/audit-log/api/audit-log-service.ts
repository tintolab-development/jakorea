/**
 * 감사 로그 API 서비스 (Mock)
 * Phase 0.5.4: 감사 로그 UI
 */

import type {
  AuditLog,
  AuditLogFilters,
  AuditLogQueryResult,
  CreateAuditLogInput,
} from '@/types/audit-log'
import { mockAuditLogs } from '@/data/mock/audit-logs'
import { useAuthStore } from '@/features/auth/model/auth-store'

// Mock: 메모리 기반 저장소
const logs: AuditLog[] = [...mockAuditLogs]

/**
 * 감사 로그 목록 조회
 */
export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogQueryResult> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let filtered = [...logs]
  const page = filters.page || 1
  const pageSize = filters.pageSize || 20

  // 이벤트 유형 필터
  if (filters.eventType) {
    filtered = filtered.filter(log => log.eventType === filters.eventType)
  }

  // 사용자 ID 필터
  if (filters.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId)
  }

  // 사용자 이름 필터
  if (filters.userName) {
    filtered = filtered.filter(log => 
      log.userName.toLowerCase().includes(filters.userName!.toLowerCase())
    )
  }

  // 대상 ID 필터
  if (filters.targetId) {
    filtered = filtered.filter(log => log.targetId === filters.targetId)
  }

  // 대상 타입 필터
  if (filters.targetType) {
    filtered = filtered.filter(log => log.targetType === filters.targetType)
  }

  // 기간 필터
  if (filters.startDate) {
    filtered = filtered.filter(log => 
      new Date(log.createdAt) >= new Date(filters.startDate!)
    )
  }

  if (filters.endDate) {
    filtered = filtered.filter(log => 
      new Date(log.createdAt) <= new Date(filters.endDate!)
    )
  }

  // 정렬 (최신순)
  filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // 페이지네이션
  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginated = filtered.slice(start, end)

  return {
    logs: paginated,
    total,
    page,
    pageSize,
  }
}

/**
 * 감사 로그 생성
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const { user } = useAuthStore.getState()
  
  if (!user && !input.userId) {
    throw new Error('사용자 정보가 필요합니다.')
  }

  // IP 주소 및 User Agent 가져오기 (Mock)
  const ipAddress = typeof window !== 'undefined' 
    ? (window as any).mockIP || '192.168.1.1'
    : '192.168.1.1'
  
  const userAgent = typeof window !== 'undefined' && window.navigator
    ? window.navigator.userAgent
    : 'Mozilla/5.0'

  const newLog: AuditLog = {
    id: `audit-${Date.now()}`,
    eventType: input.eventType,
    userId: input.userId || user!.id,
    userName: user?.name || 'Unknown',
    userRole: user?.role || 'UNKNOWN',
    targetId: input.targetId,
    targetType: input.targetType,
    targetName: input.targetName,
    details: input.details || {},
    ipAddress,
    userAgent,
    createdAt: new Date().toISOString(),
  }

  logs.unshift(newLog) // 최신 로그를 맨 앞에 추가

  return newLog
}

/**
 * 감사 로그 통계 조회
 */
export async function getAuditLogStats(filters: AuditLogFilters = {}): Promise<{
  total: number
  byEventType: Record<string, number>
  byUser: Record<string, number>
}> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const queryResult = await getAuditLogs({ ...filters, page: 1, pageSize: 10000 })
  const allLogs = queryResult.logs

  const byEventType: Record<string, number> = {}
  const byUser: Record<string, number> = {}

  allLogs.forEach(log => {
    byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1
    byUser[log.userName] = (byUser[log.userName] || 0) + 1
  })

  return {
    total: allLogs.length,
    byEventType,
    byUser,
  }
}
