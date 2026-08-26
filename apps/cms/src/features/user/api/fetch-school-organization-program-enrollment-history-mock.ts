import { applicationService } from '@/entities/application/api/application-service'
import { programService } from '@/entities/program/api/program-service'
import { getEffectiveEnrollmentDisplayStatus } from '@/shared/constants/status'
import { toSchoolOrganizationEnrollmentRowId } from '@/features/user/api/map-school-organization-program-enrollment-history'
import type { Application } from '@/types/domain'

const MOCK_BUSINESS_AREAS = ['경제·금융', '디지털 리터러시', '창업·기업가정신', '직업·진로']
const MOCK_EDUCATION_GRADES = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
  }
  return Math.abs(hash)
}

function mapMockSchoolApplicationToEnrollmentRow(
  app: Application,
  organizationUserId: string,
  historyRowId: number
): Application {
  const program = programService.getByIdSync(app.programId)
  const progressYear =
    typeof app.customFields?.progressYear === 'number' && Number.isFinite(app.customFields.progressYear)
      ? app.customFields.progressYear
      : program
        ? new Date(program.startDate).getFullYear()
        : new Date(app.submittedAt).getFullYear()
  const enrollmentDisplayStatus =
    typeof app.customFields?.enrollmentDisplayStatus === 'string' &&
    app.customFields.enrollmentDisplayStatus.trim()
      ? app.customFields.enrollmentDisplayStatus.trim()
      : getEffectiveEnrollmentDisplayStatus(
          app.status,
          app.progressStatus,
          program?.lifecycleStatus,
          app.rejectionKind
        )
  const seed = hashString(app.id)
  const businessArea =
    typeof app.customFields?.businessArea === 'string' && app.customFields.businessArea.trim()
      ? app.customFields.businessArea.trim()
      : MOCK_BUSINESS_AREAS[seed % MOCK_BUSINESS_AREAS.length]
  const educationGrade =
    typeof app.customFields?.educationGrade === 'string' && app.customFields.educationGrade.trim()
      ? app.customFields.educationGrade.trim()
      : MOCK_EDUCATION_GRADES[seed % MOCK_EDUCATION_GRADES.length]

  return {
    ...app,
    id: toSchoolOrganizationEnrollmentRowId(historyRowId),
    subjectType: 'school',
    subjectId: organizationUserId,
    customFields: {
      ...app.customFields,
      programName:
        (typeof app.customFields?.programName === 'string' && app.customFields.programName.trim()) ||
        program?.title ||
        undefined,
      progressYear,
      enrollmentDisplayStatus,
      businessArea,
      educationGrade,
      historyRowId,
      deletable: app.customFields?.deletable ?? true,
    },
  }
}

/** BE organization enrollment API 미연동 시 mock applications → 학교 수강 이력 테이블 행 */
export async function fetchSchoolOrganizationProgramEnrollmentHistoryMock(
  organizationUserId: string
): Promise<Application[]> {
  const apps = await applicationService.getByUserId(organizationUserId, 'school')
  return apps.map((app, index) =>
    mapMockSchoolApplicationToEnrollmentRow(app, organizationUserId, index + 1)
  )
}
