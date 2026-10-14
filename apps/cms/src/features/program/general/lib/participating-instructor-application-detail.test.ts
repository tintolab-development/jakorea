import { describe, expect, it } from 'vitest'
import { hydrateInstructorApplicationRowFromForm } from '@/features/program/general/api/adapters/application-form-detail-adapters'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { FormResponseResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseResponse'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import {
  mapInstructorApplicationDetailToParticipatingRow,
  mergeInstructorApplicationIntoParticipatingRow,
  participatingRowToInstructorApplicationSeed,
} from './participating-instructor-application-detail'

const scheduleMemoForm = {
  answers: [{ questionKeySnapshot: 'availableScheduleMemo', answerDisplayText: '화요일 오전 가능' }],
} as FormResponseResponse

const detailWithResume = {
  id: 1694639,
  instructorMemberId: 190001,
  instructorName: '이건희',
  instructorCmsProfile: {
    career: {
      level: 'experienced',
      rows: [{ companyName: 'QA 제휴학교', roleName: '담임', periodStart: '2021-03', currentlyEmployed: true }],
    },
    essays: { freeWrite1: '이력서 자기소개 1', freeWrite2: '이력서 자기소개 2' },
  },
} as unknown as InstructorApplicationDetailResponse

const base = {
  id: 'p-1',
  no: 1,
  instructorName: '이건희',
  instructorApplicationId: '1694639',
} as ParticipatingInstructorRow

describe('participating instructor application detail', () => {
  it('신청 상세 instructorCmsProfile 이력서를 참여 강사 행에 병합한다', () => {
    const row = mapInstructorApplicationDetailToParticipatingRow(detailWithResume, base, '186048')
    expect(row.careerDetails).toHaveLength(1)
    expect(row.freeWriting1).toBe('이력서 자기소개 1')
    expect(row.freeWriting2).toBe('이력서 자기소개 2')
  })

  it('form 일정 메모가 이력서 자기소개 1번을 덮어쓰지 않는다', () => {
    const canonical = mapInstructorApplicationDetailToParticipatingRow(detailWithResume, base, '186048')
    const hydrated = hydrateInstructorApplicationRowFromForm({
      row: participatingRowToInstructorApplicationSeed(canonical, '186048'),
      formResponse: scheduleMemoForm,
    })
    const merged = mergeInstructorApplicationIntoParticipatingRow(canonical, hydrated)
    expect(merged.freeWriting1).toBe('이력서 자기소개 1')
    expect(merged.careerDetails).toHaveLength(1)
  })

  it('이력서가 없으면 일정 메모를 자기소개 1번 대체값으로 쓴다', () => {
    const canonical = mapInstructorApplicationDetailToParticipatingRow(
      { ...detailWithResume, instructorCmsProfile: undefined },
      base,
      '186048'
    )
    const hydrated = hydrateInstructorApplicationRowFromForm({
      row: participatingRowToInstructorApplicationSeed(canonical, '186048'),
      formResponse: scheduleMemoForm,
    })
    const merged = mergeInstructorApplicationIntoParticipatingRow(canonical, hydrated)
    expect(merged.freeWriting1).toBe('화요일 오전 가능')
    expect(merged.careerDetails ?? []).toHaveLength(0)
  })
})
