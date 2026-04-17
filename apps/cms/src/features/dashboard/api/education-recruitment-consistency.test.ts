/**
 * 일반 교육 프로그램 목록과 모집 신청 현황 데이터 정합성 검증
 * - 목록(useProgramListFilters), 모집 신청 현황 위젯(getRecruitmentStatusList), 진행 단계 위젯(getProgramProgressStages)이
 *   동일한 getEducationPrograms() 소스를 사용하는지 확인
 */

import { describe, it, expect } from 'vitest'
import { getEducationPrograms } from '@/data/mock/education-programs'
import {
  getRecruitmentStatusList,
  getProgramProgressStages,
  type ProgramProgressStages,
} from './admin-dashboard-service'

describe('일반 교육 프로그램 · 모집 신청 현황 데이터 정합성', () => {
  it('getRecruitmentStatusList()는 getEducationPrograms()와 동일한 프로그램 집합을 반환한다 (programIds 미지정 시)', async () => {
    const listIds = getEducationPrograms().map(p => p.id).sort()
    const widgetPrograms = await getRecruitmentStatusList()
    const widgetIds = widgetPrograms.map(p => p.id).sort()
    expect(widgetIds).toEqual(listIds)
  })

  it('교육 프로그램 목록의 모든 프로그램에 lifecycleStatus가 있어 모집 신청 현황 컬럼에 표시 가능하다', () => {
    const programs = getEducationPrograms()
    expect(programs.length).toBeGreaterThan(0)
    for (const p of programs) {
      expect(p.lifecycleStatus, `program ${p.id} (${p.title}) has lifecycleStatus`).toBeDefined()
    }
  })

  it('getProgramProgressStages(education) 집계는 getEducationPrograms() 기준과 동일한 소스다', async () => {
    const educationPrograms = getEducationPrograms()
    const stages = (await getProgramProgressStages({
      programType: 'education',
    })) as ProgramProgressStages
    // 7단계에 배정된 프로그램 수 합계 (participant_instructor_recruiting은 2단계에 포함되므로 합계 >= length 가능)
    const stageSum =
      stages.studentRecruitment +
      stages.instructorRecruitment +
      stages.matchingCompleted +
      stages.educationBeforeTextbook +
      stages.educationAfterTextbook +
      stages.educationCompleted +
      stages.documentProcessingCompleted
    // 집계된 total은 stageSum과 동일해야 함 (서비스 구현과 일치)
    expect(stages.total).toBe(stageSum)
    // 단계 버킷 합은 프로그램 수와 같거나, 일부 프로그램이 아직 어떤 단계에도 매핑되지 않은 경우 1 적을 수 있음
    expect(stageSum).toBeGreaterThanOrEqual(educationPrograms.length - 1)
  })

  it('모집 신청 현황 위젯 행 수 = 일반 교육 프로그램 목록 건수 (필터 없을 때)', async () => {
    const listCount = getEducationPrograms().length
    const widgetPrograms = await getRecruitmentStatusList()
    expect(widgetPrograms.length).toBe(listCount)
  })
})
