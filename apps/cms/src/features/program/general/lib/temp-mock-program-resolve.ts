/**
 * TODO(temp-mock): 열여라 참깨 — 기관·개인 쇼케이스 공통 resolve (검증 후 삭제)
 */

import {
  isGeneralProgramTempMockIndividualProgramId,
  isGeneralProgramTempMockOrgProgramId,
} from '@/features/program/general/api/temp-mock-capabilities'
import {
  getTempMockIndividualApplicants,
  getTempMockIndividualApplicantInstructors,
  getTempMockIndividualProgramIfId,
  getTempMockIndividualProgramManagers,
  getTempMockIndividualProgressInstructors,
  getTempMockIndividualProgressParticipants,
  getTempMockIndividualProgressVolunteers,
  getTempMockIndividualVolunteerApplicants,
} from '@/features/program/general/lib/temp-mock-individual-program'
import {
  getTempMockOrgApplicantInstructors,
  getTempMockOrgProgramIfId,
  getTempMockOrgProgramManagers,
  getTempMockOrgProgressInstructors,
  getTempMockOrgProgressVolunteers,
  getTempMockOrgVolunteerApplicants,
} from '@/features/program/general/lib/temp-mock-org-program'
import type { ProgramManagerRow } from '@/features/program/general/model/program-managers'
import type { Program } from '@/types/domain'
import type { GeneralIndividualApplicantRow } from '@/features/program/general/model/individual-applicant'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

export function getTempMockShowcaseProgramIfId(programId?: string | null): Program | undefined {
  return (
    getTempMockOrgProgramIfId(programId) ??
    getTempMockIndividualProgramIfId(programId) ??
    undefined
  )
}

export function getTempMockShowcaseProgramManagers(
  programId?: string | null
): ProgramManagerRow[] {
  if (isGeneralProgramTempMockOrgProgramId(programId)) {
    return getTempMockOrgProgramManagers(programId)
  }
  if (isGeneralProgramTempMockIndividualProgramId(programId)) {
    return getTempMockIndividualProgramManagers(programId)
  }
  return []
}

export function getTempMockShowcaseApplicantInstructors(
  programId?: string | null
): ApplicantInstructorRow[] {
  if (isGeneralProgramTempMockOrgProgramId(programId)) {
    return getTempMockOrgApplicantInstructors(programId)
  }
  if (isGeneralProgramTempMockIndividualProgramId(programId)) {
    return getTempMockIndividualApplicantInstructors(programId)
  }
  return []
}

export function getTempMockShowcaseProgressInstructors(
  programId?: string | null
): ParticipatingInstructorRow[] {
  if (isGeneralProgramTempMockOrgProgramId(programId)) {
    return getTempMockOrgProgressInstructors(programId)
  }
  if (isGeneralProgramTempMockIndividualProgramId(programId)) {
    return getTempMockIndividualProgressInstructors(programId)
  }
  return []
}

export function getTempMockShowcaseVolunteerApplicants(
  programId?: string | null,
  stage?: 'doc1' | 'docPassed' | 'interview2'
): GeneralVolunteerApplicantRow[] {
  if (isGeneralProgramTempMockOrgProgramId(programId)) {
    return getTempMockOrgVolunteerApplicants(programId, stage)
  }
  if (isGeneralProgramTempMockIndividualProgramId(programId)) {
    return getTempMockIndividualVolunteerApplicants(programId, stage)
  }
  return []
}

export function getTempMockShowcaseProgressVolunteers(
  programId?: string | null
): ParticipatingVolunteerRow[] {
  if (isGeneralProgramTempMockOrgProgramId(programId)) {
    return getTempMockOrgProgressVolunteers(programId)
  }
  if (isGeneralProgramTempMockIndividualProgramId(programId)) {
    return getTempMockIndividualProgressVolunteers(programId)
  }
  return []
}

export function getTempMockShowcaseIndividualApplicants(
  programId?: string | null
): GeneralIndividualApplicantRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return getTempMockIndividualApplicants(programId)
}

export function getTempMockShowcaseIndividualProgressParticipants(
  programId?: string | null
): ParticipatingIndividualParticipantRow[] {
  if (!isGeneralProgramTempMockIndividualProgramId(programId)) return []
  return getTempMockIndividualProgressParticipants(programId)
}
