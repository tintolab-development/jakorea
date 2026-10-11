import type { Report } from '@/types/domain'

export interface SubmitReportRequest {
  type: Report['type']
  scheduleId?: string
  activityId?: string
  programId?: string
  content?: string
}

async function notAvailable(): Promise<never> {
  throw new Error('보고서 API가 연동되지 않았습니다.')
}

export const reportService = {
  submit: async (_data: SubmitReportRequest): Promise<Report> => notAvailable(),
  getById: async (_id: string): Promise<Report> => notAvailable(),
  getAll: async (): Promise<Report[]> => [],
  review: async (_id: string, _reviewerId: string): Promise<Report> => notAvailable(),
  approve: async (_id: string, _reviewerId: string, _notes?: string): Promise<Report> =>
    notAvailable(),
  reject: async (_id: string, _reviewerId: string, _notes: string): Promise<Report> =>
    notAvailable(),
}

export async function getReports(): Promise<Report[]> {
  return reportService.getAll()
}

export async function getReportById(_id: string): Promise<Report | null> {
  try {
    return await reportService.getById(_id)
  } catch {
    return null
  }
}
