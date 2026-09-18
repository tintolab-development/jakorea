/**
 * 대시보드 설정·위젯용 프로그램 옵션 — mock 카탈로그 제거.
 * remote OFF면 빈 목록.
 */
import type { DashboardProgramOption } from './adapters/dashboard-adapters'

export function getMockDashboardProgramOptions(_widgetKey: string): DashboardProgramOption[] {
  void _widgetKey
  return []
}
