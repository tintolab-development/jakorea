/**
 * 보고서 Mock 서비스
 */

import type { Report, ReportType } from '@/types/domain'
import { mockReports } from '@/data/mock/reports'
import dayjs from 'dayjs'

function generateUUID(): string {
  return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

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
      status: 'submitted', // 제출 시 기본 상태
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    // mockReports는 import된 배열이므로 push하여 추가
    // 주의: 실제 환경에서는 서버 API에 저장
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

  /**
   * 보고서 검토 처리
   */
  review: async (id: string, reviewerId: string): Promise<Report> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const report = mockReports.find(r => r.id === id)
    if (!report) {
      throw new Error(`Report not found: ${id}`)
    }
    report.status = 'reviewing'
    report.reviewedAt = dayjs().toISOString()
    report.reviewedBy = reviewerId
    report.updatedAt = dayjs().toISOString()
    return Promise.resolve(report)
  },

  /**
   * 보고서 승인 처리
   */
  approve: async (id: string, reviewerId: string, notes?: string): Promise<Report> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const report = mockReports.find(r => r.id === id)
    if (!report) {
      throw new Error(`Report not found: ${id}`)
    }
    report.status = 'approved'
    report.reviewedAt = dayjs().toISOString()
    report.reviewedBy = reviewerId
    report.reviewNotes = notes
    report.updatedAt = dayjs().toISOString()
    return Promise.resolve(report)
  },

  /**
   * 보고서 반려 처리
   */
  reject: async (id: string, reviewerId: string, notes: string): Promise<Report> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const report = mockReports.find(r => r.id === id)
    if (!report) {
      throw new Error(`Report not found: ${id}`)
    }
    report.status = 'rejected'
    report.reviewedAt = dayjs().toISOString()
    report.reviewedBy = reviewerId
    report.reviewNotes = notes
    report.updatedAt = dayjs().toISOString()
    return Promise.resolve(report)
  },
}





