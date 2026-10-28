import { describe, expect, it } from 'vitest'
import { TEXTBOOK_NOT_USED_OPTION_VALUE } from '@/features/program/general/lib/individual-applicant-textbook'
import type { ParticipatingInstitutionEditDraft } from '@/features/program/general/lib/participating-institution-detail-edit'
import {
  buildParticipatingInstitutionLocalSavePatch,
  buildParticipatingInstitutionOrganizationUpdateRequest,
  resolveParticipatingInstitutionApplicationId,
} from './participating-institution-organization-update'

const baseDraft = {
  adminComment: '',
  educationGrade: '3학년',
  classCount: '2',
  studentCount: '40',
  addressDetail: '본관 3층',
  educationFormat: '오프라인',
  applicationReason: '신청',
  otherRequests: '',
  computerInRoom: '',
  waitingRoomAvailable: false,
  waitingRoomLocation: '',
  mealProvided: false,
  mealNotice: '',
  parkingInfo: '',
  teacherName: '김교사',
  teacherPhone: '02-000-0000',
  teacherMobile: '010-0000-0000',
  teacherEmail: 't@school.kr',
  textbookId: '55',
  textbookName: '성공하는 경제생활',
  textbookGrade: '3학년',
  combinedClassApplication: '미신청',
  combinedClassPartnerSchoolIds: [],
} as ParticipatingInstitutionEditDraft

describe('resolveParticipatingInstitutionApplicationId', () => {
  it('organizationApplicationId를 우선한다', () => {
    expect(
      resolveParticipatingInstitutionApplicationId({
        organizationApplicationId: '186100',
        detailId: 'detail-1',
        rowId: 'row-1',
      })
    ).toBe('186100')
  })
})

describe('buildParticipatingInstitutionOrganizationUpdateRequest', () => {
  it('PATCH body를 화면 필드에서 만든다', () => {
    const body = buildParticipatingInstitutionOrganizationUpdateRequest({
      draft: baseDraft,
      teacherOptions: [{ value: '1001', label: '김교사', mobile: '', email: '' }],
      textbookGrade: '3학년',
    })
    expect(body).toMatchObject({
      requestedGrade: '3학년',
      organizationAddressDetail: '본관 3층',
      requestedClassCount: 2,
      requestedStudentCount: 40,
      requestedEducationFormat: 'OFFLINE',
      teacherMemberId: 1001,
      teacherPhone: '010-0000-0000',
      teacherEmail: 't@school.kr',
      textbookId: 55,
      textbookGrade: '3학년',
    })
    expect(body).not.toHaveProperty('textbookKits')
    expect(body).not.toHaveProperty('textbookQuantity')
  })

  it('교육 형태가 그대로면 requestedEducationFormat을 보내지 않는다', () => {
    const body = buildParticipatingInstitutionOrganizationUpdateRequest({
      draft: baseDraft,
      teacherOptions: [],
      baselineEducationFormat: '오프라인',
    })
    expect(body.requestedEducationFormat).toBeUndefined()
  })

  it('교재를 건드리지 않은 기관 정보 수정에서는 교재 필드를 생략한다', () => {
    const body = buildParticipatingInstitutionOrganizationUpdateRequest({
      draft: baseDraft,
      teacherOptions: [],
      includeTextbookFields: false,
    })

    expect(body).not.toHaveProperty('textbookId')
    expect(body).not.toHaveProperty('textbookKits')
    expect(body).not.toHaveProperty('textbookQuantity')
  })

  it('학생 수·교재 변경 PATCH도 키트·권수는 omit하여 서버 자동 산출을 쓴다', () => {
    const body = buildParticipatingInstitutionOrganizationUpdateRequest({
      draft: { ...baseDraft, studentCount: '25' },
      teacherOptions: [],
      includeTextbookFields: true,
    })

    expect(body.requestedStudentCount).toBe(25)
    expect(body.textbookId).toBe(55)
    expect(body).not.toHaveProperty('textbookKits')
    expect(body).not.toHaveProperty('textbookQuantity')
  })

  it('참여자 선택이 아니면 교육 형태가 바뀌어도 requestedEducationFormat을 보내지 않는다', () => {
    const body = buildParticipatingInstitutionOrganizationUpdateRequest({
      draft: { ...baseDraft, educationFormat: '온라인' },
      teacherOptions: [],
      baselineEducationFormat: '오프라인',
      allowEducationFormatChange: false,
    })
    expect(body.requestedEducationFormat).toBeUndefined()
    expect(body.requestedGrade).toBe('3학년')
  })

  it('교육 형태가 바뀌었을 때만 requestedEducationFormat을 보낸다', () => {
    expect(
      buildParticipatingInstitutionOrganizationUpdateRequest({
        draft: { ...baseDraft, educationFormat: '온라인' },
        teacherOptions: [],
        baselineEducationFormat: '오프라인',
      }).requestedEducationFormat
    ).toBe('ONLINE')
  })

  it('신청 학년 숫자·교육 형태 한글을 API 형식으로 보낸다', () => {
    expect(
      buildParticipatingInstitutionOrganizationUpdateRequest({
        draft: { ...baseDraft, educationGrade: '2', educationFormat: '온라인' },
        teacherOptions: [],
      })
    ).toMatchObject({
      requestedGrade: '2학년',
      requestedEducationFormat: 'ONLINE',
    })
  })

  it('해당 없음이면 textbookId null을 보낸다', () => {
    const body = buildParticipatingInstitutionOrganizationUpdateRequest({
      draft: {
        ...baseDraft,
        textbookId: TEXTBOOK_NOT_USED_OPTION_VALUE,
        textbookName: '해당 없음',
      },
      teacherOptions: [],
    })
    expect(body.textbookId).toBeNull()
    expect(body).not.toHaveProperty('textbookKits')
    expect(body).not.toHaveProperty('textbookQuantity')
  })
})

describe('buildParticipatingInstitutionLocalSavePatch', () => {
  it('학년·학급·학생 수를 로컬 패치에 포함한다', () => {
    expect(
      buildParticipatingInstitutionLocalSavePatch({
        detailId: 'd1',
        draft: baseDraft,
        patch: { addressDetail: '본관 3층' },
        fallbackClassCount: 1,
        fallbackStudentCount: 10,
      })
    ).toMatchObject({
      id: 'd1',
      educationGrade: '3학년',
      classCount: 2,
      studentCount: 40,
      addressDetail: '본관 3층',
    })
  })
})
