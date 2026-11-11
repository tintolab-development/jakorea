import { describe, expect, it } from 'vitest'
import { formatStudentGenderLabel } from '@/features/program/general/model/school-detail-types'
import { mapStudentRosterItemToRow, mapStudentRowToRosterRequest } from './student-roster-adapters'

/**
 * Step 6.4 — 학생 명단 성별·생년월일 (가짜 데이터).
 * 정책(10/27·11/06 §4-2): Owner·Assistant는 AUTO_RAW_ACCESS로 생년월일 원문, 그 외 CMS 조회는 MASKED.
 * 원문 표시가 허용된 응답은 그대로 두고, MASKED 응답은 정책 표기로만 보여준다.
 */
type Item = Parameters<typeof mapStudentRosterItemToRow>[0]

function item(overrides: Partial<Item>): Item {
  return {
    rosterId: 21,
    studentName: '김학생',
    grade: '초5',
    className: '1반',
    studentNo: 1,
    maskedPhone: '010-****-1234',
    maskedEmail: 'k***@example.com',
    ...overrides,
  } as Item
}

function genderLabel(gender: string | null | undefined): string {
  const row = mapStudentRosterItemToRow(item({ gender: gender as string }), 0)
  return formatStudentGenderLabel(row.gender, row.genderMask)
}

describe('학생 명단 성별', () => {
  it.each([
    ['male', '남'],
    ['MALE', '남'],
    ['남', '남'],
    ['female', '여'],
    ['FEMALE', '여'],
    ['여', '여'],
  ])('확인된 성별 %s → %s', (gender, label) => {
    expect(genderLabel(gender)).toBe(label)
  })

  it('null·빈 값은 "-" (남성으로 추정하지 않음)', () => {
    expect(genderLabel(null)).toBe('-')
    expect(genderLabel('')).toBe('-')
  })

  it('MASKED 응답의 ** 는 실제 성별로 바꾸지 않고 마스킹 그대로 보여준다', () => {
    const row = mapStudentRosterItemToRow(item({ gender: '**' }), 0)
    expect(row.gender).toBeUndefined()
    expect(formatStudentGenderLabel(row.gender, row.genderMask)).toBe('**')
  })

  it('알 수 없는 코드는 "-"', () => {
    expect(genderLabel('OTHER')).toBe('-')
    expect(genderLabel('X')).toBe('-')
  })
})

describe('학생 명단 생년월일', () => {
  it('AUTO_RAW_ACCESS 원문 생년월일은 정책 예외대로 원문 날짜로 보여준다(마스킹으로 바꾸지 않음)', () => {
    const row = mapStudentRosterItemToRow(
      item({ birthDate: '2013-04-05', birthYear: 2013, maskedBirthDate: '2013-**-**' }),
      0
    )
    expect(row.birthDate).toBe('2013. 04. 05.')
  })

  it('MASKED 응답(birthDate 생략, maskedBirthDate만)은 yyyy.**.** 로 보여준다', () => {
    const row = mapStudentRosterItemToRow(
      item({ birthDate: null, birthYear: 2013, maskedBirthDate: '2013-**-**' }),
      0
    )
    expect(row.birthDate).toBe('2013.**.**')
  })

  it('생년월일이 모두 없으면 비워 둔다(화면 "-")', () => {
    const row = mapStudentRosterItemToRow(item({ birthDate: null, maskedBirthDate: null }), 0)
    expect(row.birthDate).toBeUndefined()
  })

  it('MASKED 행을 그대로 저장해도 마스킹 성별·생년월일을 payload로 보내지 않는다(원문 유지)', () => {
    const row = mapStudentRosterItemToRow(
      item({ gender: '**', birthDate: null, birthYear: 2013, maskedBirthDate: '2013-**-**' }),
      0
    )
    const payload = mapStudentRowToRosterRequest(row)
    expect(payload).not.toHaveProperty('gender')
    expect(payload).not.toHaveProperty('birthDate')
  })
})
