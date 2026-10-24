import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-institution-draft'
import type { ApplicationIncompleteField } from '@/features/program/lib/application-apply-incomplete'
import {
  findIncompleteUjatInstitutionBasicInfoMessage,
  type ApplyUjatInstitutionBasicInfoValues,
} from '@/features/program/ui/apply-ujat-institution-basic-info/apply-ujat-institution-basic-info'
import {
  findIncompleteUjatInstitutionGradeInfoMessage,
  type ApplyUjatGradeBlock,
} from '@/features/program/ui/apply-ujat-institution-grade-info/apply-ujat-institution-grade-info'
import {
  findIncompleteUjatInstitutionClassTimeMessage,
  type ApplyUjatClassTimeBlock,
} from '@/features/program/ui/apply-ujat-institution-class-time/apply-ujat-institution-class-time'
import type { UjatPreferredEducationScheduleOption } from '@/features/program/lib/ujat-preferred-education-schedule-options'
import {
  findIncompleteUjatInstitutionPreferredScheduleMessage,
} from '@/features/program/ui/apply-ujat-institution-preferred-schedule/apply-ujat-institution-preferred-schedule'

export type UjatInstitutionIncompleteField = ApplicationIncompleteField

export function resolveUjatInstitutionApplyIncomplete(input: {
  basicInfo: ApplyUjatInstitutionBasicInfoValues
  gradeBlocks: ApplyUjatGradeBlock[]
  classTimeBlocks: ApplyUjatClassTimeBlock[]
  preferredIds: string[]
  preferredOptions: readonly UjatPreferredEducationScheduleOption[]
  confirmed?: boolean | null
}): UjatInstitutionIncompleteField | null {
  const basic = findIncompleteUjatInstitutionBasicInfoMessage(input.basicInfo)
  if (basic) {
    return { message: basic, paragraphId: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo }
  }
  const grade = findIncompleteUjatInstitutionGradeInfoMessage(input.gradeBlocks)
  if (grade) {
    return {
      message: grade,
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo,
      field: grade.includes('학급 수') ? 'classCount' : undefined,
    }
  }
  const classTime = findIncompleteUjatInstitutionClassTimeMessage(
    input.classTimeBlocks,
    input.gradeBlocks,
  )
  if (classTime) {
    return {
      message: classTime,
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime,
    }
  }
  const preferred = findIncompleteUjatInstitutionPreferredScheduleMessage(
    input.preferredIds,
    input.preferredOptions,
  )
  if (preferred) {
    return {
      message: preferred,
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
    }
  }
  if (input.confirmed === false) {
    return {
      message: '제출 전 확인 항목을 선택해 주세요.',
      paragraphId: UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
    }
  }
  return null
}

export { focusIncompleteApplicationField } from '@/features/program/lib/application-apply-incomplete'
