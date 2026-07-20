/**
 * 대시보드 설정·위젯용 프로그램 옵션 목록 (mock fallback)
 */
import {
  mockPrograms,
  getGeneralEducationPrograms,
  getCompanySchoolPrograms,
  getUjatPrograms,
  getGeminiPrograms,
} from '@/data/mock'
import type { DashboardProgramOption } from './adapters/dashboard-adapters'

export function getMockDashboardProgramOptions(widgetKey: string): DashboardProgramOption[] {
  if (widgetKey === 'program-schedule-general-widget') {
    return getGeneralEducationPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  if (widgetKey === 'program-schedule-company-school-widget') {
    return getCompanySchoolPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  if (widgetKey === 'program-schedule-ujat-widget') {
    return getUjatPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  if (widgetKey === 'program-schedule-gemini-widget') {
    return getGeminiPrograms().map(p => ({ id: p.id, title: p.title }))
  }
  return mockPrograms.map(p => ({ id: p.id, title: p.title }))
}
