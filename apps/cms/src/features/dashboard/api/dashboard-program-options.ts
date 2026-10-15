/**
 * 대시보드 설정·위젯용 프로그램 옵션 — remote 미연동 시 빈 목록.
 */
import type { DashboardProgramOption } from './adapters/dashboard-adapters'

export function getDashboardProgramOptions(_widgetKey: string): DashboardProgramOption[] {
  void _widgetKey
  return []
}
