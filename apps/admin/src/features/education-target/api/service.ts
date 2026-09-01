import type {
  EducationTarget,
  EducationTargetNamePatch,
} from '@/entities/education-target/model/types'
import { getJAKoreaHomepageAdminAPIEducationSubset } from '@/shared/api/generated/education/education-api'
import { shouldUseEducationTargetRemoteApi } from './capabilities'
import { mapTargetResponseToDomain, toTargetBulkUpdateRequest } from './mappers'
import {
  readEducationTargets,
  updateEducationTargetNames as updateLocal,
} from './store'

function educationApi() {
  return getJAKoreaHomepageAdminAPIEducationSubset()
}

async function listRemote(): Promise<EducationTarget[]> {
  const rows = await educationApi().targets()
  return (rows ?? [])
    .map(mapTargetResponseToDomain)
    .filter((row): row is EducationTarget => row != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function listEducationTargetsService(): Promise<EducationTarget[]> {
  if (shouldUseEducationTargetRemoteApi()) {
    return listRemote()
  }
  return readEducationTargets()
}

export async function saveEducationTargetsService(
  patches: EducationTargetNamePatch[],
  cached?: EducationTarget[] | null,
): Promise<EducationTarget[]> {
  if (shouldUseEducationTargetRemoteApi()) {
    const current = cached && cached.length > 0 ? cached : await listRemote()
    const updated = await educationApi().updateTargets(
      toTargetBulkUpdateRequest(current, patches),
    )
    return (updated ?? [])
      .map(mapTargetResponseToDomain)
      .filter((row): row is EducationTarget => row != null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return updateLocal(patches)
}
