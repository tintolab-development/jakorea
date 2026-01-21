/**
 * 감사 로그 Mock 데이터
 * Phase 0.5.4: 감사 로그 UI
 */

import type { AuditLog, AuditEventType } from '@/types/audit-log'
import { mockUsers } from './users'
import { mockPrograms } from './programs'

function generateUUID(): string {
  return `audit-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function generatePastDate(daysAgo: number = 0, hoursAgo: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(date.getHours() - hoursAgo)
  return date.toISOString()
}

function getRandomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function getRandomUserAgent(): string {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ]
  return agents[Math.floor(Math.random() * agents.length)]
}

/**
 * 감사 로그 Mock 데이터 생성
 */
function createAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = []
  const eventTypes: AuditEventType[] = [
    'LOGIN',
    'LOGIN_FAILED',
    'MFA_SENT',
    'MFA_SUCCESS',
    'MFA_FAILED',
    'PERMISSION_REQUESTED',
    'PERMISSION_APPROVED',
    'PERMISSION_REJECTED',
    'DOWNLOAD',
    'SETTLEMENT_CONFIRMED',
  ]

  // 최근 30일간의 로그 생성
  for (let day = 0; day < 30; day++) {
    const eventsPerDay = Math.floor(Math.random() * 20) + 5 // 하루 5-25개 이벤트

    for (let i = 0; i < eventsPerDay; i++) {
      const user = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const hoursAgo = Math.floor(Math.random() * 24)
      const createdAt = generatePastDate(day, hoursAgo)

      let targetId: string | undefined
      let targetType: string | undefined
      let targetName: string | undefined
      const details: Record<string, unknown> = {}

      // 이벤트 타입별 상세 정보 설정
      switch (eventType) {
        case 'LOGIN':
        case 'LOGIN_FAILED':
          details.ipAddress = getRandomIP()
          break

        case 'MFA_SENT':
        case 'MFA_SUCCESS':
        case 'MFA_FAILED':
          details.phoneNumber = user.phone || '010-****-1234'
          if (eventType === 'MFA_FAILED') {
            details.attempts = Math.floor(Math.random() * 5) + 1
          }
          break

        case 'PERMISSION_REQUESTED':
        case 'PERMISSION_APPROVED':
        case 'PERMISSION_REJECTED': {
          const program = mockPrograms[Math.floor(Math.random() * mockPrograms.length)]
          targetId = program.id
          targetType = 'program'
          targetName = program.title
          details.requestedRole = ['OWNER', 'PARTNER', 'ASSISTANT'][Math.floor(Math.random() * 3)]
          details.requestedAction = ['VIEW', 'DOWNLOAD', 'EDIT'][Math.floor(Math.random() * 3)]
          if (eventType === 'PERMISSION_APPROVED') {
            details.grantedPeriod = {
              startDate: createdAt,
              endDate: new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
          }
          break
        }

        case 'DOWNLOAD': {
          const program = mockPrograms[Math.floor(Math.random() * mockPrograms.length)]
          targetId = program.id
          targetType = 'program'
          targetName = program.title
          details.targetType = ['PARTICIPANTS', 'INSTRUCTORS', 'SETTLEMENTS'][Math.floor(Math.random() * 3)]
          details.rowCount = Math.floor(Math.random() * 500) + 10
          details.maskingEnabled = Math.random() > 0.3 // 70% 마스킹
          if (!details.maskingEnabled) {
            details.reason = '원본 데이터 분석 필요'
          }
          break
        }

        case 'SETTLEMENT_CONFIRMED': {
          targetType = 'settlement'
          details.amount = Math.floor(Math.random() * 10000000) + 1000000
          details.instructorName = mockUsers.find(u => u.role === 'INSTRUCTOR')?.name || '강사명'
          break
        }
      }

      logs.push({
        id: generateUUID(),
        eventType,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        targetId,
        targetType,
        targetName,
        details,
        ipAddress: getRandomIP(),
        userAgent: getRandomUserAgent(),
        createdAt,
      })
    }
  }

  return logs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export const mockAuditLogs: AuditLog[] = createAuditLogs()
