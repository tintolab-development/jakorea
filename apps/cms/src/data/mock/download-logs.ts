/**
 * 다운로드 이력 Mock 데이터
 * Phase 4.1: 조회/다운로드 이력 기록 (FR-F00)
 */

import type { DownloadLog } from '@/types/download-log'

function generateUUID(): string {
  return `log-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function generatePastDate(daysAgo: number = 0, hoursAgo: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(date.getHours() - hoursAgo)
  return date.toISOString()
}

// Mock 다운로드 이력 데이터
// Phase 4.1: 더 다양한 다운로드 이력 데이터 추가
export const mockDownloadLogs: DownloadLog[] = [
  {
    id: generateUUID(),
    userId: 'user-admin1',
    action: 'DOWNLOAD',
    targetType: 'PARTICIPANTS',
    filters: { programId: 'prog-001', role: 'STUDENT' },
    rowCount: 25,
    programId: 'prog-001',
    createdAt: generatePastDate(1, 2),
  },
  {
    id: generateUUID(),
    userId: 'user-admin1',
    action: 'VIEW',
    targetType: 'PARTICIPANTS',
    filters: { programId: 'prog-002' },
    rowCount: 15,
    programId: 'prog-002',
    createdAt: generatePastDate(2, 5),
  },
  {
    id: generateUUID(),
    userId: 'user-admin2',
    action: 'DOWNLOAD',
    targetType: 'INSTRUCTORS',
    filters: { pillar: 'AI/머신러닝' },
    rowCount: 10,
    pillar: 'AI/머신러닝',
    createdAt: generatePastDate(3, 1),
  },
  {
    id: generateUUID(),
    userId: 'user-admin1',
    action: 'DOWNLOAD',
    targetType: 'INSTRUCTORS',
    filters: {},
    rowCount: 50,
    createdAt: generatePastDate(5, 3),
  },
  {
    id: generateUUID(),
    userId: 'user-admin1',
    action: 'DOWNLOAD',
    targetType: 'PARTICIPANTS',
    filters: { programId: 'prog-003', role: 'SCHOOL' },
    rowCount: 8,
    programId: 'prog-003',
    createdAt: generatePastDate(7, 1),
  },
  {
    id: generateUUID(),
    userId: 'user-admin2',
    action: 'VIEW',
    targetType: 'PARTICIPANTS',
    filters: { status: 'approved' },
    rowCount: 30,
    createdAt: generatePastDate(10, 3),
  },
  {
    id: generateUUID(),
    userId: 'user-admin1',
    action: 'DOWNLOAD',
    targetType: 'INSTRUCTORS',
    filters: { pillar: '데이터 분석', status: 'ACTIVE' },
    rowCount: 5,
    pillar: '데이터 분석',
    createdAt: generatePastDate(14, 2),
  },
]
