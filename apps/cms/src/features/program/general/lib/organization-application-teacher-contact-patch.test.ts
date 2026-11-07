import { describe, expect, it } from 'vitest'
import {
  buildOrganizationApplicationTeacherContactPatch,
  formTeacherContactFromOrganizationDetail,
} from './organization-application-teacher-contact-patch'

const baseline = {
  teacherPhone: '02-1234-5678',
  teacherMobile: '010-1234-5678',
  teacherEmail: 'teacher@example.test',
}

describe('buildOrganizationApplicationTeacherContactPatch', () => {
  it('Tel만 바뀌면 teacherTel만 보낸다', () => {
    expect(
      buildOrganizationApplicationTeacherContactPatch(
        { ...baseline, teacherPhone: '02-9999-0000' },
        baseline
      )
    ).toEqual({ teacherTel: '02-9999-0000' })
  })

  it('M만 바뀌면 teacherPhone만 보낸다', () => {
    expect(
      buildOrganizationApplicationTeacherContactPatch(
        { ...baseline, teacherMobile: '010-0000-1111' },
        baseline
      )
    ).toEqual({ teacherPhone: '010-0000-1111' })
  })

  it('Tel을 비우면 teacherTel null을 보내고 휴대전화는 omit한다', () => {
    expect(
      buildOrganizationApplicationTeacherContactPatch(
        { ...baseline, teacherPhone: '' },
        baseline
      )
    ).toEqual({ teacherTel: null })
  })

  it('빈 M을 Tel로 채우지 않는다', () => {
    expect(
      buildOrganizationApplicationTeacherContactPatch(
        { teacherPhone: '02-9999-0000', teacherMobile: '', teacherEmail: baseline.teacherEmail },
        { ...baseline, teacherMobile: '' }
      )
    ).toEqual({ teacherTel: '02-9999-0000' })
  })

  it('마스킹 값과 "-" 는 보내지 않는다', () => {
    expect(
      buildOrganizationApplicationTeacherContactPatch(
        {
          teacherPhone: '02-****-5678',
          teacherMobile: '-',
          teacherEmail: '  ',
        },
        {
          teacherPhone: '02-****-5678',
          teacherMobile: '010-****-5678',
          teacherEmail: 't***@school.kr',
        }
      )
    ).toEqual({})
  })

  it('Tel+M+이메일을 함께 저장한다', () => {
    expect(
      buildOrganizationApplicationTeacherContactPatch(
        {
          teacherPhone: '02-9999-0000',
          teacherMobile: '010-1234-5678',
          teacherEmail: 'teacher@example.test',
        },
        {
          teacherPhone: '02-1234-5678',
          teacherMobile: '010-0000-0000',
          teacherEmail: '',
        }
      )
    ).toEqual({
      teacherTel: '02-9999-0000',
      teacherPhone: '010-1234-5678',
      teacherEmail: 'teacher@example.test',
    })
  })
})

describe('formTeacherContactFromOrganizationDetail', () => {
  it('API teacherTel을 폼 Tel, teacherPhone을 폼 M으로 넣는다', () => {
    expect(
      formTeacherContactFromOrganizationDetail({
        teacherTel: '02-1234-5678',
        teacherPhone: '010-1234-5678',
        teacherEmail: 'teacher@example.test',
      })
    ).toEqual({
      teacherPhone: '02-1234-5678',
      teacherMobile: '010-1234-5678',
      teacherEmail: 'teacher@example.test',
    })
  })

  it('마스킹·하이픈 표시값은 폼에 넣지 않는다', () => {
    expect(
      formTeacherContactFromOrganizationDetail({
        teacherTel: '02-****-5678',
        teacherPhone: '-',
        teacherEmail: null,
      })
    ).toEqual({
      teacherPhone: '',
      teacherMobile: '',
      teacherEmail: '',
    })
  })
})
