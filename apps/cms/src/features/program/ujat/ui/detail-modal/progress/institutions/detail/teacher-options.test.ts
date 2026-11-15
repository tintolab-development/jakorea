import { describe, expect, it } from 'vitest'
import {
  buildUjatInstitutionTeacherOptions,
  resolveUjatInstitutionTeacherMemberIdChange,
} from './teacher-options'

const rows = [
  { id: 'r1', teacherMemberId: 11, name: '김제이', phone: '010-****-1111', email: 'k***@example.com' },
  { id: 'r2', teacherMemberId: 22, name: '박제이', phone: '-', email: '-' },
  { id: 'r3', teacherMemberId: 33, name: '-', phone: '-', email: '-' },
]

describe('buildUjatInstitutionTeacherOptions', () => {
  it('소속 교사 목록을 선택지로 만들고 이름 없는 행은 뺀다', () => {
    expect(buildUjatInstitutionTeacherOptions({ rows, currentTeacherName: '김제이' })).toEqual([
      { value: '11', label: '김제이', mobile: '010-****-1111', email: 'k***@example.com' },
      { value: '22', label: '박제이', mobile: '', email: '' },
    ])
  })

  it('현재 담당 교사가 목록에 없으면 legacy 항목을 앞에 둔다', () => {
    const options = buildUjatInstitutionTeacherOptions({ rows, currentTeacherName: '최제이' })
    expect(options[0]).toEqual({ value: 'legacy:최제이', label: '최제이', mobile: '', email: '' })
    expect(options).toHaveLength(3)
  })

  it('목록을 조회하지 못하면 현재 담당 교사만 legacy로 둔다(자유 입력 없음)', () => {
    expect(buildUjatInstitutionTeacherOptions({ rows: null, currentTeacherName: '김제이' })).toEqual([
      { value: 'legacy:김제이', label: '김제이', mobile: '', email: '' },
    ])
  })
})

describe('resolveUjatInstitutionTeacherMemberIdChange', () => {
  const teacherOptions = buildUjatInstitutionTeacherOptions({ rows, currentTeacherName: '최제이' })

  it('다른 소속 교사를 고르면 그 회원 ID를 돌려준다', () => {
    expect(
      resolveUjatInstitutionTeacherMemberIdChange({
        teacherNameDraft: '박제이',
        teacherOptions,
        currentTeacherMemberId: 11,
      })
    ).toBe(22)
  })

  it('현재 담당 교사와 같거나 legacy 선택지면 생략한다', () => {
    expect(
      resolveUjatInstitutionTeacherMemberIdChange({
        teacherNameDraft: '김제이',
        teacherOptions,
        currentTeacherMemberId: 11,
      })
    ).toBeUndefined()
    expect(
      resolveUjatInstitutionTeacherMemberIdChange({
        teacherNameDraft: '최제이',
        teacherOptions,
        currentTeacherMemberId: 11,
      })
    ).toBeUndefined()
  })
})
