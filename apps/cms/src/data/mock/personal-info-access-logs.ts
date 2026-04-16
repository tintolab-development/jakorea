import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'

function generateUUID(): string {
  return `pi-log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`
}

function generatePastDate(daysAgo = 0, minutesAgo = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setMinutes(date.getMinutes() - minutesAgo)
  return date.toISOString()
}

export const mockPersonalInfoAccessLogs: PersonalInfoAccessLog[] = [
  {
    id: generateUUID(),
    accessItem: '최원석씨_박진도',
    accessPurpose: '고객CS 처리를 하기 위함',
    accessorId: 'user-admin1',
    accessorName: '홍길동',
    accessedAt: generatePastDate(0, 9),
    ipAddress: '14.128.xxx.xxx',
  },
  {
    id: generateUUID(),
    accessItem: '최원석씨_박진도',
    accessPurpose: '고객CS 처리를 하기 위함',
    accessorId: 'user-admin2',
    accessorName: '김철수',
    accessedAt: generatePastDate(0, 14),
    ipAddress: '14.129.xxx.xxx',
  },
  {
    id: generateUUID(),
    accessItem: '최원석씨_박진도',
    accessPurpose: '고객CS 처리를 하기 위함',
    accessorId: 'user-admin3',
    accessorName: '이영희',
    accessedAt: generatePastDate(0, 20),
    ipAddress: '14.130.xxx.xxx',
  },
]
