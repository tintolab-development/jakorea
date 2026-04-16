/**
 * 파일 다운로드 이력 Mock 데이터
 */

import type { DownloadLog } from '@/types/download-log'

function generateUUID(): string {
  return `log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`
}

function generatePastDate(daysAgo = 0, minutesAgo = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setMinutes(date.getMinutes() - minutesAgo)
  return date.toISOString()
}

export const mockDownloadLogs: DownloadLog[] = [
  {
    id: generateUUID(),
    fileName: '회원정보_목록.xlsx',
    userId: 'user-admin1',
    userName: '홍길동',
    ipAddress: '14.128.xxx.xxx',
    downloadedAt: generatePastDate(0, 8),
  },
  {
    id: generateUUID(),
    fileName: '프로그램_신청현황.csv',
    userId: 'user-admin2',
    userName: '김철수',
    ipAddress: '14.129.xxx.xxx',
    downloadedAt: generatePastDate(0, 13),
  },
  {
    id: generateUUID(),
    fileName: '강사정산_리포트.pdf',
    userId: 'user-admin3',
    userName: '이영희',
    ipAddress: '14.130.xxx.xxx',
    downloadedAt: generatePastDate(0, 21),
  },
  {
    id: generateUUID(),
    fileName: '공지사항_첨부파일.zip',
    userId: 'user-admin1',
    userName: '박민수',
    ipAddress: '14.131.xxx.xxx',
    downloadedAt: generatePastDate(0, 34),
  },
  {
    id: generateUUID(),
    fileName: '교육기록_상세.docx',
    userId: 'user-admin4',
    userName: '최지훈',
    ipAddress: '14.132.xxx.xxx',
    downloadedAt: generatePastDate(0, 42),
  },
]
