import type {
  ProgramIntroCategoryDocument,
  ProgramIntroCategoryKey,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { shouldUseEducationProgramIntroRemoteApi } from './capabilities'
import {
  readProgramIntroCategory,
  saveProgramIntroCategory as saveLocal,
} from './store'

export async function getProgramIntroCategoryService(
  categoryKey: ProgramIntroCategoryKey
): Promise<ProgramIntroCategoryDocument> {
  if (shouldUseEducationProgramIntroRemoteApi()) {
    throw new Error('Education program intro remote API is not implemented yet')
  }
  return readProgramIntroCategory(categoryKey)
}

export async function saveProgramIntroCategoryService(
  input: ProgramIntroSaveInput
): Promise<ProgramIntroCategoryDocument> {
  if (shouldUseEducationProgramIntroRemoteApi()) {
    throw new Error('Education program intro remote API is not implemented yet')
  }
  return saveLocal(input)
}
