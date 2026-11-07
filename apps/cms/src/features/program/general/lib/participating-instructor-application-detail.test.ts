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
  it('신청 상세 정산 계좌·사업소득자 여부를 참여 강사 행에 유지한다', () => {
    const detail = {
      ...detailWithResume,
      businessIncomeEarnerStatus: '해당',
      settlement: { bankName: '우리', accountNumber: '239999288881', accountHolder: '이순규' },
    } as unknown as InstructorApplicationDetailResponse
    const canonical = mapInstructorApplicationDetailToParticipatingRow(detail, base, '186048')
    const hydrated = hydrateInstructorApplicationRowFromForm({
      row: participatingRowToInstructorApplicationSeed(canonical, '186048'),
      formResponse: scheduleMemoForm,
    })
    const merged = mergeInstructorApplicationIntoParticipatingRow(canonical, hydrated)
    expect(merged.bankName).toBe('우리')
    expect(merged.accountNumber).toBe('239999288881')
    expect(merged.accountHolder).toBe('이순규')
    expect(merged.businessIncomeEarnerStatus).toBe('해당')
  })

  it('신청 상세에 정산 값이 없으면 목록 row 값으로 보완하지 않는다', () => {
    const baseWithAccount = {
      ...base,
      bankName: '국민',
      accountNumber: '111-222',
      accountHolder: '목록값',
      businessIncomeEarnerStatus: '해당',
    } as ParticipatingInstructorRow
    const row = mapInstructorApplicationDetailToParticipatingRow(
      { ...detailWithResume, settlement: null, businessIncomeEarnerStatus: null },
      baseWithAccount,
      '186048'
    )
    expect(row.bankName).toBeUndefined()
    expect(row.accountNumber).toBeUndefined()
    expect(row.accountHolder).toBeUndefined()
    expect(row.businessIncomeEarnerStatus).toBeUndefined()
    expect(row.settlementBusinessIncome).toBeUndefined()
  })
})
