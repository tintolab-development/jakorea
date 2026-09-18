import { describe, expect, it } from 'vitest'
import {
  formatStudentGradeClass,
  mapApiBirthDateToDisplay,
  mapApiGenderToStudentGenderKey,
  mapDisplayBirthDateToApi,
  mapStudentRosterItemToRow,
  mapStudentRowToRosterRequest,
  mapStudentRowsToRosterCommitRequest,
} from './student-roster-adapters'

describe('student-roster-adapters', () => {
  it('maps gender and birthDate both ways', () => {
    expect(mapApiGenderToStudentGenderKey('남')).toBe('male')
    expect(mapApiGenderToStudentGenderKey('FEMALE')).toBe('female')
    expect(mapApiBirthDateToDisplay('2010-07-15')).toBe('2010. 07. 15.')
    expect(mapDisplayBirthDateToApi('2010. 07. 15.')).toBe('2010-07-15')
  })

  it('formats gradeClass from grade + className', () => {
    expect(formatStudentGradeClass('초5', '1반')).toBe('초5 1반')
    expect(formatStudentGradeClass('초5', '초5 1반')).toBe('초5 1반')
  })

  it('maps roster item to UI row', () => {
    const row = mapStudentRosterItemToRow(
      {
        rosterId: 12,
        studentName: '김학생',
        gender: 'male',
        birthDate: '2010-07-15',
        grade: '초5',
        className: '1반',
        studentNo: 3,
        maskedPhone: '010-****-1234',
        maskedEmail: 'k***@example.com',
        participantId: 99,
      },
      0
    )
    expect(row).toMatchObject({
      id: '12',
      no: 3,
      name: '김학생',
      gender: 'male',
      birthDate: '2010. 07. 15.',
      gradeClass: '초5 1반',
      contact: '010-****-1234',
      email: 'k***@example.com',
      participantId: 99,
    })
  })

  it('omits masked phone/email on commit payload', () => {
    const payload = mapStudentRowToRosterRequest(
      {
        id: '1',
        no: 1,
        name: '김학생',
        gender: 'male',
        birthDate: '2010. 07. 15.',
        gradeClass: '1반',
        contact: '010-****-1234',
        email: 'k***@example.com',
      },
      { educationGrade: '초5' }
    )
    expect(payload).toEqual({
      studentName: '김학생',
      gender: 'male',
      birthDate: '2010-07-15',
      grade: '초5',
      className: '1반',
      studentNo: 1,
    })
  })

  it('builds commit body with fallback sourceFileObjectId 0', () => {
    const body = mapStudentRowsToRosterCommitRequest({
      educationGrade: '초5',
      rows: [
        {
          id: '1',
          no: 1,
          name: '김학생',
          birthDate: '20100101',
          gradeClass: '1반',
          contact: '010-1234-5678',
        },
      ],
    })
    expect(body.sourceFileObjectId).toBe(0)
    expect(body.rows[0]?.phone).toBe('010-1234-5678')
  })
})
