import { describe, expect, it } from 'vitest'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import { PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID } from '@/features/program/general/lib/student-portrait-consent'
import {
  formatStudentGradeClass,
  mapApiBirthDateToDisplay,
  mapApiGenderToStudentGenderKey,
  mapDisplayBirthDateToApi,
  mapRosterPortraitConsentSubmission,
  mapStudentRosterItemToRow,
  mapStudentRosterResponseToRows,
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
      serverRosterId: 12,
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
      serverRosterId: 123,
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
        serverRosterId: 1,
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
          serverRosterId: 1,
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

  function commitRow(
    partial: Partial<SchoolDetailStudentRow> & Pick<SchoolDetailStudentRow, 'id' | 'name'>
  ) {
    return mapStudentRowToRosterRequest({
      no: 1,
      gender: 'female',
      birthDate: '2010. 04. 04.',
      gradeClass: '1학년 1',
      contact: '010-2222-3333',
      email: 'student@example.com',
      ...partial,
    })
  }

  it('T01/T02: new rows omit rosterId even when the temp id starts with digits', () => {
    const uuidLike = '67243e8a-4f2b-4c1d-9a10-aabbccddeeff'
    expect(Number.parseInt(uuidLike, 10)).toBe(67243)

    const one = commitRow({ id: `draft-student-${uuidLike}`, name: '테스트학생' })
    const many = [
      commitRow({ id: 'draft-student-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: '가' }),
      commitRow({ id: '67243', name: '나' }),
      commitRow({ id: uuidLike, name: '다' }),
    ]
    expect('rosterId' in one).toBe(false)
    expect(many.every(row => !('rosterId' in row))).toBe(true)
  })

  it('T03/T04/T06/T09: keeps server rosterId and omits it on a colliding temp id', () => {
    const body = mapStudentRowsToRosterCommitRequest({
      expectedRevisionNo: 4,
      educationGrade: '1학년',
      rows: [
        {
          id: '67243',
          serverRosterId: 67243,
          no: 1,
          name: '기존학생',
          gender: 'female',
          birthDate: '2010. 04. 04.',
          gradeClass: '1학년 1',
          contact: '010-****-1111',
          email: 'o***@example.com',
        },
        {
          id: '67243',
          no: 2,
          name: '신규학생',
          gender: 'female',
          birthDate: '2010. 04. 04.',
          gradeClass: '1학년 1',
          contact: '010-2222-3333',
          email: 'new@example.com',
        },
      ],
    })
    expect(body.expectedRevisionNo).toBe(4)
    expect(body.rows).toHaveLength(2)
    expect(body.rows[0]?.rosterId).toBe(67243)
    expect('phone' in (body.rows[0] ?? {})).toBe(false)
    expect('email' in (body.rows[0] ?? {})).toBe(false)
    expect('rosterId' in (body.rows[1] ?? {})).toBe(false)
    expect(body.rows[1]?.phone).toBe('010-2222-3333')
    expect(body.rows[1]?.email).toBe('new@example.com')
  })

  it('T07/T12: GET rows after save or excel import keep the issued rosterId', () => {
    const [existing] = mapStudentRosterResponseToRows({
      revisionNo: 1,
      totalCount: 1,
      rows: [
        {
          rosterId: 201,
          studentName: '가져오기학생',
          gender: 'female',
          birthDate: '2010-04-04',
          grade: '1학년',
          className: '1',
          studentNo: 1,
          maskedPhone: '010-****-3333',
          maskedEmail: 'i***@example.com',
        },
      ],
    })
    expect(existing?.serverRosterId).toBe(201)
    const body = mapStudentRowsToRosterCommitRequest({
      expectedRevisionNo: 1,
      rows: [
        existing!,
        {
          id: 'draft-student-11111111-2222-3333-4444-555555555555',
          no: 2,
          name: '수동추가',
          gender: 'male',
          birthDate: '2011. 01. 01.',
          gradeClass: '1학년 1',
          contact: '010-4444-5555',
          email: 'manual@example.com',
        },
      ],
    })
    expect(body.rows[0]?.rosterId).toBe(201)
    expect('phone' in (body.rows[0] ?? {})).toBe(false)
    expect('rosterId' in (body.rows[1] ?? {})).toBe(false)
    expect('sourceFileObjectId' in body).toBe(false)
  })
})
