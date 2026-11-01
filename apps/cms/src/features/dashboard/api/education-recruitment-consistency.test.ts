/**
 * 대시보드 프로그램 집계 — mock 카탈로그 없음.
 * remote OFF면 빈 목록.
 */

import { describe, it, expect, vi } from 'vitest'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  getRecruitmentStatusList,
  getProgramProgressStages,
  getDashboardShortcutBadges,
  getMenuShortcutBadgeCounts,
  getProgramProgressSummary,
  getProgramProgressStagesByProgramId,
  getKpiAchievementList,
  getDashboardHomeSummary,
  type ProgramProgressStages,
} from './admin-dashboard-service'

describe('대시보드 프로그램 집계 (mock 카탈로그 제거)', () => {
  it('remote OFF면 모집 신청 현황은 빈 목록이다', async () => {
    const widgetPrograms = await getRecruitmentStatusList()
    expect(widgetPrograms).toEqual({ rows: [], totalCount: null })
  })

  it('remote OFF면 바로가기 배지를 mock 숫자로 채우지 않는다', async () => {
    expect(getMenuShortcutBadgeCounts()).toEqual({})
    await expect(getDashboardShortcutBadges()).resolves.toEqual({})
  })

  it('대시보드 서비스 호출만으로는 API 연동 안내 모달을 띄우지 않는다', async () => {
    const show = vi.spyOn(cmsAlertModal, 'show')
    await getProgramProgressSummary()
    await getProgramProgressStages({ programType: 'education' })
    await getProgramProgressStages({ programType: 'general' })
    await getProgramProgressStagesByProgramId('p-1')
    await getRecruitmentStatusList()
    await getKpiAchievementList()
    await getDashboardHomeSummary()
    expect(show).not.toHaveBeenCalled()
    show.mockRestore()
  })

  it('getProgramProgressStages(education)는 빈 7단계 집계를 반환한다', async () => {
    const stages = (await getProgramProgressStages({
      programType: 'education',
    })) as ProgramProgressStages
    expect(stages.total).toBe(0)
    expect(stages.studentRecruitment).toBe(0)
    expect(stages.instructorRecruitment).toBe(0)
  })
})
