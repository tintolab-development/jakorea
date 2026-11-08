import { describe, expect, it } from 'vitest'
import {
  buildStudentCertificateDownloadContext,
  resolveStudentCertificateProgramPeriodLabel,
} from './build-student-certificate-issuance'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'

const student: SchoolDetailStudentRow = {
  id: '1',
  no: 1,
  name: '김참가',
  gradeClass: '1반',
}

describe('resolveStudentCertificateProgramPeriodLabel', () => {
  it('prefers the server certificatePeriodLabel over dates', () => {
    expect(
      resolveStudentCertificateProgramPeriodLabel({
        certifiedPeriodLabel: '2026.03.01 ~ 2026.04.10',
        certifiedPeriodStart: '2026-01-01',
        certifiedPeriodEnd: '2026-12-31',
        programStartDate: '2026-01-01',
        programEndDate: '2026-12-31',
      })
    ).toBe('2026.03.01 ~ 2026.04.10')
  })

  it('formats official start and end dates when the label is absent', () => {
    expect(
      resolveStudentCertificateProgramPeriodLabel({
        certifiedPeriodStart: '2026-03-01',
        certifiedPeriodEnd: '2026-04-10',
        programStartDate: '2026-01-01',
        programEndDate: '2026-12-31',
      })
    ).toBe('2026.03.01 ~ 2026.04.10')
  })

  it('does not mix a certified start with the program end date', () => {
    expect(
      resolveStudentCertificateProgramPeriodLabel({
        certifiedPeriodStart: '2026-03-01',
        programStartDate: '2026-01-01',
        programEndDate: '2026-12-31',
      })
    ).toBe('2026.01.01 ~ 2026.12.31')
  })

  it('does not substitute the program period for GIVE_UP when certified dates are missing', () => {
    expect(
      resolveStudentCertificateProgramPeriodLabel({
        requireCertifiedPeriod: true,
        programStartDate: '2026-01-01',
        programEndDate: '2026-12-31',
      })
    ).toBeNull()
  })

  it('keeps the program period for a normal completion certificate', () => {
    expect(
      resolveStudentCertificateProgramPeriodLabel({
        programStartDate: '2026-01-01',
        programEndDate: '2026-12-31',
      })
    ).toBe('2026.01.01 ~ 2026.12.31')
  })
})

describe('buildStudentCertificateDownloadContext period', () => {
  it('writes the same certified label into preview and PDF participantInfo', () => {
    const context = buildStudentCertificateDownloadContext({
      student,
      certificateKind: 'participation',
      schoolName: '서울학교',
      educationGrade: '초등',
      programTitle: '경제교육',
      programStartDate: '2026-01-01',
      programEndDate: '2026-12-31',
      certifiedPeriodLabel: '2026.03.01 ~ 2026.04.10',
      certifiedPeriodStart: '2026-03-01',
      certifiedPeriodEnd: '2026-04-10',
      issuanceReasonLabel: '개인 보관',
    })
    expect(context.programPeriodLabel).toBe('2026.03.01 ~ 2026.04.10')
    expect(context.certificateKind).toBe('participation')
    expect(context.programPeriodLabel).toContain('2026.03.01')
    expect(context.programPeriodLabel).not.toContain('2026.01.01')
  })
})
