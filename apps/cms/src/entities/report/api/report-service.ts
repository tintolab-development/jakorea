/**
 * 보고서 Mock 서비스
 */

import type { Report, ReportType } from '@/types/domain'
import dayjs from 'dayjs'

function generateUUID(): string {
  return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Mock 데이터 저장소 (메모리)
const mockReports: Report[] = []

export interface SubmitReportRequest {
  type: ReportType
  activityId?: string
  programId?: string
  fields: Record<string, string | number | Date>
}

export const reportService = {
  /**
   * 보고서 제출
   */
  submit: async (data: SubmitReportRequest): Promise<Report> => {
    // Mock: 제출 성공 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500))

    const now = dayjs().toISOString()

    const newReport: Report = {
      id: generateUUID(),
      type: data.type,
      activityId: data.activityId,
      programId: data.programId,
      fields: Object.fromEntries(
        Object.entries(data.fields).map(([key, value]) => [
          key,
          value instanceof Date ? value.toISOString() : value,
        ])
      ),
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    mockReports.push(newReport)
    return Promise.resolve(newReport)
  },

  /**
   * 보고서 조회
   */
  getById: async (id: string): Promise<Report> => {
    const report = mockReports.find(r => r.id === id)
    if (!report) {
      throw new Error(`Report not found: ${id}`)
    }
    return Promise.resolve(report)
  },

  /**
   * 보고서 목록 조회
   */
  getAll: async (): Promise<Report[]> => {
    return Promise.resolve([...mockReports])
  },
}



