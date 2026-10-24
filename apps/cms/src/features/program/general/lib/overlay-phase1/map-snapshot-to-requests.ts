import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { omitUnchangedWageFieldsFromProgramForServiceDetail } from '@/features/program/general/lib/general-program-service-detail-json'
import {
  applyRecruitmentDraftsToProgram,
  mergeRegistrationAndRecruitOverlay,
} from './build-program-edit-snapshot'
import type {
  CommonInfoCreateSave,
  CommonInfoUpdateSave,
  ProgramEditSnapshot,
} from './program-edit-snapshot.types'

export function snapshotToCreateProgram(snapshot: ProgramEditSnapshot): Program {
  const withRecruit = applyRecruitmentDraftsToProgram(
    snapshot.commonInfo.program,
    snapshot.recruitments
  )
  return {
    ...withRecruit,
    registrationOverlay: mergeRegistrationAndRecruitOverlay(
      snapshot.commonInfo.inputOverlay,
      snapshot.recruitments
    ),
  }
}

export function snapshotToCommonInfoCreateSave(
  snapshot: ProgramEditSnapshot
): CommonInfoCreateSave {
  const program = snapshotToCreateProgram(snapshot)
  const createRequest = mapGeneralProgramToCreateRequest(program)
  return {
    program,
    registrationOverlay: program.registrationOverlay ?? {},
    createRequest,
    serviceDetailJson: createRequest.serviceDetailJson,
  }
}

export function snapshotStripUnchangedWage(program: Program, baseline: Program): Program {
  return omitUnchangedWageFieldsFromProgramForServiceDetail(program, baseline)
}

export function snapshotToCommonInfoUpdateSave(
  snapshot: ProgramEditSnapshot,
  baseline: Program
): CommonInfoUpdateSave {
  const program: Program = {
    ...snapshot.commonInfo.program,
    registrationOverlay: snapshot.commonInfo.resyncedOverlay,
  }
  const patch: Partial<Program> = {
    title: program.title,
    mainTitle: program.mainTitle,
    startDate: program.startDate,
    endDate: program.endDate,
    generalCommonInfo: program.generalCommonInfo,
    registrationOverlay: program.registrationOverlay,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
  }
  const updateRequest = mapGeneralProgramToUpdateRequest(baseline, patch, baseline)
  return {
    program,
    patch,
    updateRequest,
    serviceDetailJson: updateRequest.serviceDetailJson,
  }
}
