import { describe, expect, it } from 'vitest'
import { buildActivityCertificateInitialStringValues, buildActivityCertificateInitialStringValuesForVolunteer } from '@/features/program/general/lib/build-activity-certificate-issuance-preview'
import { buildStudentCertificateInitialStringValues } from '@/features/program/general/lib/build-student-certificate-issuance'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import {
  ACTIVITY_CERTIFICATE_BODY_CONTENT,
  COMPLETION_CERTIFICATE_BODY_CONTENT,
  PARTICIPATION_CERTIFICATE_BODY_CONTENT,
} from './certificate-body-content'
import { getIssuanceFormSeedSpecsForExport } from './export-writing-form-template-seeds'

const oneLine = (text: string) => text.replace(/\n/g, ' ')

function seedBodyContent(templateCode: string): unknown {
  const spec = getIssuanceFormSeedSpecsForExport().find(s => s.templateCode === templateCode)
  return (spec?.settingsJson as Record<string, unknown> | undefined)?.bodyContent
}

describe('certificate body content (기획 확정 2026-11-12)', () => {
  it('uses the confirmed sentences', () => {
    expect(oneLine(ACTIVITY_CERTIFICATE_BODY_CONTENT)).toBe(
      '귀하는 위 프로그램 활동에 성실히 참여하였음을 확인합니다.'
    )
    expect(PARTICIPATION_CERTIFICATE_BODY_CONTENT).toBe(ACTIVITY_CERTIFICATE_BODY_CONTENT)
    expect(oneLine(COMPLETION_CERTIFICATE_BODY_CONTENT)).toBe(
      '귀하는 위의 과정에 참여하여 교육과정을 수료하였음을 확인합니다.'
    )
  })

  it('seeds activity/participation templates with the activity sentence and 수료증 with completion', () => {
    expect(seedBodyContent('document-4')).toBe(ACTIVITY_CERTIFICATE_BODY_CONTENT)
    expect(seedBodyContent('document-5')).toBe(ACTIVITY_CERTIFICATE_BODY_CONTENT)
    expect(seedBodyContent('document-participation-certificate')).toBe(
      PARTICIPATION_CERTIFICATE_BODY_CONTENT
    )
    expect(seedBodyContent('document-3')).toBe(COMPLETION_CERTIFICATE_BODY_CONTENT)
  })

  it('does not use the instructor-only 교육진행자 sentence for volunteer issuance', () => {
    const volunteer = buildActivityCertificateInitialStringValuesForVolunteer('홍봉사')
    expect(volunteer.bodyContent).toBe(ACTIVITY_CERTIFICATE_BODY_CONTENT)
    expect(volunteer.bodyContent).not.toContain('교육진행자')

    const instructor = buildActivityCertificateInitialStringValues({
      instructorName: '김강사',
      schoolName: '학교',
    } as ParticipatingInstructorRow)
    expect(instructor.bodyContent).toBe(ACTIVITY_CERTIFICATE_BODY_CONTENT)
  })

  it('maps student certificate kinds to their body content', () => {
    const base = {
      student: { id: '1', name: '김참가', gradeClass: '1반' },
      schoolName: '학교',
      educationGrade: '1학년',
      programTitle: '프로그램',
      programPeriodLabel: '2026.01.01 ~ 2026.12.31',
      issuanceReasonLabel: '기관 제출용',
    }
    expect(
      buildStudentCertificateInitialStringValues({ ...base, certificateKind: 'completion' } as never)
        .bodyContent
    ).toBe(COMPLETION_CERTIFICATE_BODY_CONTENT)
    expect(
      buildStudentCertificateInitialStringValues({
        ...base,
        certificateKind: 'participation',
      } as never).bodyContent
    ).toBe(PARTICIPATION_CERTIFICATE_BODY_CONTENT)
  })
})
