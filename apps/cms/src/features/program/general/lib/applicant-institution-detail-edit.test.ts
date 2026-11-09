import { describe, expect, it } from 'vitest'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import {
  applyUnmaskedOrganizationApplicationPrivacyToApplicantSchoolRow,
  rowToEditDraft,
} from './applicant-institution-detail-edit'

const baseRow = (): ApplicantSchoolRow => ({
  id: '1691546',
  no: 1,
  schoolName: 'QA 제휴학교',
  region: '서울특별시 종로구',
  educationGrade: '4학년',
  classCount: 4,
  studentCount: 120,
  teacherName: '김**',
  contact: '010-****-5678',
  approvalStatus: 'approved',
  programId: '186473',
  detail: {
    addressDetail: '청운효자동 1',
    educationType: 'OFFLINE',
    textbookId: '',
    textbookName: '성공하는 경제생활',
    teacherTel: '02-***-0000',
    teacherPhone: '010-****-5678',
    teacherEmail: 'k***@school.kr',
    applicationReason: '신청 사유',
  },
})

describe('applyUnmaskedOrganizationApplicationPrivacyToApplicantSchoolRow', () => {
  it('unmask 연락처만 입히고 상세 GET 학급·학년·교재는 유지한다', () => {
    const seeded = applyUnmaskedOrganizationApplicationPrivacyToApplicantSchoolRow(baseRow(), {
      id: 1691546,
      teacherName: '김선생',
      teacherTel: '02-123-0000',
      teacherPhone: '010-1234-5678',
      teacherEmail: 'kim@school.kr',
    })

    expect(seeded.schoolName).toBe('QA 제휴학교')
    expect(seeded.educationGrade).toBe('4학년')
    expect(seeded.classCount).toBe(4)
    expect(seeded.studentCount).toBe(120)
    expect(seeded.detail?.textbookName).toBe('성공하는 경제생활')
    expect(seeded.detail?.addressDetail).toBe('청운효자동 1')
    expect(seeded.teacherName).toBe('김선생')
    expect(seeded.detail?.teacherTel).toBe('02-123-0000')
    expect(seeded.detail?.teacherPhone).toBe('010-1234-5678')
    expect(seeded.detail?.teacherEmail).toBe('kim@school.kr')
  })

  it('reveal payload.detail 중첩도 동일하게 입힌다', () => {
    const seeded = applyUnmaskedOrganizationApplicationPrivacyToApplicantSchoolRow(baseRow(), {
      name: '김선생',
      detail: {
        teacherName: '김선생',
        teacherPhone: '010-9999-0000',
        teacherEmail: 'kim@school.kr',
      },
    })

    expect(seeded.classCount).toBe(4)
    expect(seeded.teacherName).toBe('김선생')
    expect(seeded.detail?.teacherPhone).toBe('010-9999-0000')
  })
})

describe('rowToEditDraft', () => {
  it('보기 화면과 같이 학급 수·학년·교육 형태를 기입한다', () => {
    const draft = rowToEditDraft(baseRow())
    expect(draft.educationGrade).toBe('4')
    expect(draft.classCount).toBe('4')
    expect(draft.studentCount).toBe('120')
    expect(draft.educationFormat).toBe('오프라인')
    expect(draft.addressDetail).toBe('청운효자동 1')
    expect(draft.textbookName).toBe('성공하는 경제생활')
  })

  it('교사명이 플레이스홀더 "-"이면 빈 값으로 둔다', () => {
    const draft = rowToEditDraft({
      ...baseRow(),
      teacherName: '-',
    })
    expect(draft.teacherName).toBe('')
  })
})
