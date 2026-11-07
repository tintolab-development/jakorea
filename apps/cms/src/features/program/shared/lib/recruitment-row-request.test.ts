import { describe, expect, it } from 'vitest'
import type { ProgramRecruitmentRequest } from '@/shared/api/generated/dashboard/schemas/programRecruitmentRequest'
import type { ProgramRecruitmentWindow } from '@/types/domain'
import {
  attachRecruitmentRowIdentity,
  buildRecruitmentRowCopyRequests,
  mergeRecruitmentRowRequests,
} from './recruitment-row-request'

const ujatRows: ProgramRecruitmentWindow[] = [
  { id: 182213, recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', startAt: '2026-08-01T00:00:00+09:00' },
  { id: 182211, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION', startAt: '2026-02-01T00:00:00+09:00' },
  { id: 182212, recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', startAt: '2026-02-01T00:00:00+09:00' },
]

describe('attachRecruitmentRowIdentity', () => {
  it('기존 행은 id, 같은 유형이 여럿이면 모집 시작이 빠른 행에 맞춘다', () => {
    const rows: ProgramRecruitmentRequest[] = [
      { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' },
      { recruitmentType: 'VOLUNTEER', targetType: 'COLLEGE_STUDENT' },
    ]
    expect(attachRecruitmentRowIdentity(rows, ujatRows)).toEqual([
      { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION', id: 182211, applicationType: 'ORGANIZATION' },
      { recruitmentType: 'VOLUNTEER', targetType: 'COLLEGE_STUDENT', id: 182212, applicationType: 'VOLUNTEER' },
    ])
  })

  it('기존 행이 없으면 applicationType만 붙여 새 행으로 보낸다', () => {
    const rows: ProgramRecruitmentRequest[] = [
      { recruitmentType: 'PARTICIPANT', targetType: 'INDIVIDUAL' },
      { recruitmentType: 'INSTRUCTOR', targetType: 'TEACHER' },
    ]
    expect(attachRecruitmentRowIdentity(rows, undefined)).toEqual([
      { recruitmentType: 'PARTICIPANT', targetType: 'INDIVIDUAL', applicationType: 'INDIVIDUAL' },
      { recruitmentType: 'INSTRUCTOR', targetType: 'TEACHER', applicationType: 'INSTRUCTOR' },
    ])
  })

  it('BOTH에서 나뉜 기관·개인 행은 신청 유형으로 각각 맞춘다', () => {
    const existing: ProgramRecruitmentWindow[] = [
      { id: 186050, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
      { id: 186068, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
    ]
    const out = attachRecruitmentRowIdentity(
      [
        { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' },
        { recruitmentType: 'PARTICIPANT', targetType: 'INDIVIDUAL' },
      ],
      existing
    )
    expect(out.map(row => row.id)).toEqual([186068, 186050])
  })

  it('UJAT 반기 요청은 recruitTerm이 같은 행에만 id를 붙인다', () => {
    const rows: ProgramRecruitmentRequest[] = [
      {
        recruitmentType: 'VOLUNTEER',
        targetType: 'COLLEGE_STUDENT',
        applicationType: 'VOLUNTEER',
        recruitTerm: 'FIRST_HALF',
      },
    ]
    const out = attachRecruitmentRowIdentity(rows, ujatRows)
    expect(out[0]?.id).toBeUndefined()
    expect(out[0]?.recruitTerm).toBe('FIRST_HALF')
  })
})

describe('buildRecruitmentRowCopyRequests', () => {
  it('바뀐 문구만 행 id로 보내고 지운 값은 빈 문자열로 보낸다', () => {
    const before: ProgramRecruitmentWindow[] = [
      { id: 182212, recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', programDescription: '상반기', remarks: '비고' },
      { id: 182213, recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', programDescription: '하반기' },
    ]
    const next: ProgramRecruitmentWindow[] = [
      { ...before[0], programDescription: '상반기 수정', remarks: null },
      before[1],
    ]
    expect(buildRecruitmentRowCopyRequests(next, before)).toEqual([
      {
        id: 182212,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        programDescription: '상반기 수정',
        remarks: '',
      },
    ])
  })

  it('하반기 기간 변경은 하반기 행 id에만 실린다', () => {
    const before: ProgramRecruitmentWindow[] = [
      {
        id: 182212,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        startAt: '2026-03-01T00:00:00+09:00',
        endAt: '2026-03-31T00:00:00+09:00',
      },
      {
        id: 182213,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        startAt: '2026-08-01T00:00:00+09:00',
        endAt: '2026-08-31T00:00:00+09:00',
      },
    ]
    const next = before.map(row =>
      row.id === 182213
        ? { ...row, startAt: '2026-09-01T00:00:00+09:00', endAt: '2026-09-30T00:00:00+09:00' }
        : row
    )
    expect(buildRecruitmentRowCopyRequests(next, before)).toEqual([
      {
        id: 182213,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        startAt: '2026-09-01T00:00:00+09:00',
        endAt: '2026-09-30T00:00:00+09:00',
      },
    ])
  })

  it('강사·봉사자 기타사항만 행에 보내고 면접 여부는 넣지 않는다', () => {
    const before: ProgramRecruitmentWindow[] = [
      { id: 186070, recruitmentType: 'VOLUNTEER', applicationType: 'VOLUNTEER', otherMatters: null },
    ]
    const next: ProgramRecruitmentWindow[] = [{ ...before[0], otherMatters: '봉사자 기타' }]
    const sent = buildRecruitmentRowCopyRequests(next, before)
    expect(sent).toEqual([
      {
        id: 186070,
        recruitmentType: 'VOLUNTEER',
        applicationType: 'VOLUNTEER',
        otherMatters: '봉사자 기타',
      },
    ])
    expect(sent[0]).not.toHaveProperty('interviewEnabled')
  })

  it('잠긴 행은 보내지 않는다', () => {
    const before: ProgramRecruitmentWindow[] = [
      { id: 1, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION', summary: 'a' },
    ]
    const next = [{ ...before[0], summary: 'b' }]
    expect(buildRecruitmentRowCopyRequests(next, before, () => true)).toEqual([])
  })
})

describe('mergeRecruitmentRowRequests', () => {
  it('같은 행 id 요청을 합친다', () => {
    expect(
      mergeRecruitmentRowRequests(
        [{ id: 1, recruitmentType: 'PARTICIPANT', startAt: '2026-01-01' }],
        [{ id: 1, recruitmentType: 'PARTICIPANT', remarks: '' }]
      )
    ).toEqual([{ id: 1, recruitmentType: 'PARTICIPANT', startAt: '2026-01-01', remarks: '' }])
  })
})
