import type {
  EducationTarget,
  EducationTargetNamePatch,
} from '@/entities/education-target/model/types'
import { shouldUseEducationTargetRemoteApi } from './capabilities'
import {
  readEducationTargets,
  updateEducationTargetNames as updateLocal,
} from './store'

export async function listEducationTargetsService(): Promise<EducationTarget[]> {
  if (shouldUseEducationTargetRemoteApi()) {
    throw new Error('Education target remote API is not implemented yet')
  }
  return readEducationTargets()
}

export async function saveEducationTargetsService(
  patches: EducationTargetNamePatch[]
): Promise<EducationTarget[]> {
  if (shouldUseEducationTargetRemoteApi()) {
    throw new Error('Education target remote API is not implemented yet')
  }
  return updateLocal(patches)
}
