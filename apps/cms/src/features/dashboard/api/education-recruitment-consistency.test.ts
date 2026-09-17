/**
 * 대시보드 프로그램 집계 — mock 카탈로그 없음.
 * remote OFF면 빈 목록.
 */

import { describe, it, expect } from 'vitest'
import {
  getRecruitmentStatusList,
  getProgramProgressStages,
  type ProgramProgressStages,
} from './admin-dashboard-service'

describe('대시보드 프로그램 집계 (mock 카탈로그 제거)', () => {
  it('remote OFF면 모집 신청 현황은 빈 목록이다', async () => {
    const widgetPrograms = await getRecruitmentStatusList()
    expect(widgetPrograms).toEqual([])
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
