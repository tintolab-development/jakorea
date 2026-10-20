import { describe, expect, it } from 'vitest'
import { PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID } from '@/features/program/general/lib/student-portrait-consent'
import {
  formatStudentGradeClass,
  mapApiBirthDateToDisplay,
  mapApiGenderToStudentGenderKey,
  mapDisplayBirthDateToApi,
  mapRosterPortraitConsentSubmission,
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
        memberId: 4401,
        portraitConsentStatus: 'CONSENTED',
        portraitConsentUpdatedAt: '2026-09-01T00:00:00Z',
      },
      0,
      { useShortClassLabel: true }
    )
    expect(row).toMatchObject({
      id: '12',
      memberId: 4401,
      no: 3,
      name: '김학생',
      gender: 'male',
      birthDate: '2010. 07. 15.',
      gradeClass: '1반',
      contact: '010-****-1234',
      email: 'k***@example.com',
      participantId: 99,
      portraitConsentSubmission: {
        templateId: PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID,
        submittedAt: '2026-09-01T00:00:00Z',
      },
    })
  })

  it('maps portraitConsentFileObjectId and satisfactionSurveyCompleted additively', () => {
    const row = mapStudentRosterItemToRow(
      {
        rosterId: 13,
        studentName: '이학생',
        portraitConsentStatus: 'CONSENTED',
        portraitConsentUpdatedAt: '2026-09-01T00:00:00Z',
        portraitConsentFileObjectId: 88001,
        satisfactionSurveyCompleted: true,
      } as never,
      0
    )
    expect(row.portraitConsentFileObjectId).toBe(88001)
    expect(row.satisfactionSurveyCompleted).toBe(true)
  })

  it('maps roster portrait consent only when CONSENTED with timestamp', () => {
    expect(
      mapRosterPortraitConsentSubmission({
        portraitConsentStatus: 'REFUSED',
        portraitConsentUpdatedAt: '2026-09-01T00:00:00Z',
      })
    ).toBeNull()
    expect(
      mapRosterPortraitConsentSubmission({
        portraitConsentStatus: 'CONSENTED',
      })
    ).toBeNull()
  })

  it('includes plaintext phone/email only when the user actually changed them', () => {
    const payload = mapStudentRowToRosterRequest({
      id: '123',
      no: 1,
      name: '김학생',
      gender: 'male',
      birthDate: '2014. 03. 01.',
      gradeClass: '1반',
      contact: '010-1234-5678',
      email: 'new@example.com',
    })
    expect(payload.rosterId).toBe(123)
    expect(payload.phone).toBe('010-1234-5678')
    expect(payload.email).toBe('new@example.com')
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
      rosterId: 1,
      studentName: '김학생',
      gender: 'male',
      birthDate: '2010-07-15',
      grade: '초5',
      className: '1반',
      studentNo: 1,
    })
  })

  it('splits combined gradeClass display into grade and className', () => {
    const payload = mapStudentRowToRosterRequest(
      {
        id: '2',
        no: 2,
        name: '이학생',
        gradeClass: '4학년 2반',
        birthDate: '2010. 01. 01.',
      },
      { educationGrade: '3학년' }
    )
    expect(payload.grade).toBe('4학년')
    expect(payload.className).toBe('2반')
  })

  it('omits placeholder grade and masked contacts on PUT row', () => {
    const payload = mapStudentRowToRosterRequest({
      id: '7',
      no: 1,
      name: '박학생',
      gender: 'female',
      gradeClass: '1반',
      birthDate: '2010. 01. 01.',
      contact: '010-****-5678',
      email: 'p***@example.com',
    })
    expect(payload.gender).toBe('female')
    expect('grade' in payload).toBe(false)
    expect('phone' in payload).toBe(false)
    expect('email' in payload).toBe(false)
  })

  it('builds commit body without forcing sourceFileObjectId 0', () => {
    const body = mapStudentRowsToRosterCommitRequest({
      educationGrade: '초5',
      expectedRevisionNo: 0,
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
    expect(body.expectedRevisionNo).toBe(0)
    expect('sourceFileObjectId' in body).toBe(false)
    expect(body.rows[0]?.phone).toBe('010-1234-5678')
  })

  it('includes notes on GET mapping and PUT payload', () => {
    const row = mapStudentRosterItemToRow(
      {
        rosterId: 1,
        studentName: '김학생',
        birthDate: '2010-01-01',
        grade: '초5',
        className: '1반',
        notes: '특이사항',
      },
      0
    )
    expect(row.notes).toBe('특이사항')
    const payload = mapStudentRowToRosterRequest(
      { ...row, birthDate: '2010. 01. 01.' },
      { educationGrade: '초5' }
    )
    expect(payload.notes).toBe('특이사항')
  })

  it('does not include sourceFileObjectId on manual commit even when GET had file id', () => {
    const body = mapStudentRowsToRosterCommitRequest({
      expectedRevisionNo: 5,
      educationGrade: '초5',
      rows: [
        {
          id: '1',
          no: 1,
          name: '김학생',
          birthDate: '2010. 01. 01.',
          gradeClass: '1반',
          memberId: 4401,
        },
      ],
    })
    expect('sourceFileObjectId' in body).toBe(false)
    expect(body.rows[0]?.memberId).toBe(4401)
    expect(body.rows[0]?.rosterId).toBe(1)
  })
})
