import type { ProgramFile, ProgramPost } from '@/types/domain'

export function resolveEnrollmentProgramPostsList(options: {
  membersRemote: boolean
  postsOverride: ProgramPost[] | null | undefined
  programId: string
  schoolId?: string
}): ProgramPost[] {
  const { membersRemote, postsOverride } = options
  if (postsOverride != null) return postsOverride
  if (membersRemote) return []
  return []
}

export function resolveEnrollmentProgramFilesList(options: {
  membersRemote: boolean
  postsOverride: ProgramPost[] | null | undefined
  filesOverride?: ProgramFile[] | null
  programId: string
}): ProgramFile[] {
  const { membersRemote, postsOverride, filesOverride } = options
  if (filesOverride != null) return filesOverride
  if (membersRemote && postsOverride == null) return []
  return []
}
