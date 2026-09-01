import type { ProgramFile, ProgramPost } from '@/types/domain'
import {
  getProgramPostsByProgramId,
  getProgramPostsByProgramIdAndSchoolId,
  getProgramFilesByProgramId,
} from '@/data/mock'

export function resolveEnrollmentProgramPostsList(options: {
  membersRemote: boolean
  postsOverride: ProgramPost[] | null | undefined
  programId: string
  schoolId?: string
}): ProgramPost[] {
  const { membersRemote, postsOverride, programId, schoolId } = options
  if (postsOverride != null) return postsOverride
  if (membersRemote) return []
  return schoolId
    ? getProgramPostsByProgramIdAndSchoolId(programId, schoolId)
    : getProgramPostsByProgramId(programId)
}

export function resolveEnrollmentProgramFilesList(options: {
  membersRemote: boolean
  postsOverride: ProgramPost[] | null | undefined
  programId: string
}): ProgramFile[] {
  const { membersRemote, postsOverride, programId } = options
  if (membersRemote && postsOverride == null) return []
  return getProgramFilesByProgramId(programId)
}
