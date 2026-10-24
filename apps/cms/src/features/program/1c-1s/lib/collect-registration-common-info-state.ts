/**
 * 1사1교 등록 공통정보 RHF → canonical common.
 * Overlay store를 읽지 않는다.
 */
import type { CompanySchoolRegistrationCommonCanonical } from './registration-canonical-types'
import type { CompanySchoolRegistrationRhfValues } from './registration-rhf-values'

export function collectCompanySchoolRegistrationCommonState(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationCommonCanonical {
  return {
    repKo: values.repKo,
    repEn: values.repEn,
    publicProgramTitle: values.publicProgramTitle,
    detailedProgramId: values.detailedProgramId,
    detailedProgramName: values.detailedProgramName,
    operationRange: values.operationRange ? { ...values.operationRange } : null,
    businessField: values.businessField,
    sponsorId: values.sponsorId,
    managerContactIds: [...values.managerContactIds],
    ipOwned: values.ipOwned,
    courseDeliveredBy: values.courseDeliveredBy,
    partnerInvolvement: values.partnerInvolvement,
    ipsCategory: values.ipsCategory,
    educationCourse: values.educationCourse,
    participantCount: values.participantCount,
    instructor: values.instructor,
    dispatchedSchool: values.dispatchedSchool,
    dispatchedClass: values.dispatchedClass,
    grade1Fee: values.grade1Fee,
    grade1DistanceFee: values.grade1DistanceFee,
    grade2Fee: values.grade2Fee,
    grade2DistanceFee: values.grade2DistanceFee,
    grade3Fee: values.grade3Fee,
    grade3DistanceFee: values.grade3DistanceFee,
    paymentItemValues:
      values.paymentItemValues === undefined ? undefined : [...values.paymentItemValues],
    curriculumSessions: values.curriculumSessions.map(session => ({ ...session })),
    educationScheduleRange: values.educationScheduleRange
      ? { ...values.educationScheduleRange }
      : null,
    educationScheduleMode: 'period',
    educationScheduleLines: [...values.educationScheduleLines],
    generalSurveyMenuKeys: [...values.generalSurveyMenuKeys],
  }
}
