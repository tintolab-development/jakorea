import type { ProgramDetail, ProgramListItem } from '../model/types'

export function getMockPrograms(): ProgramListItem[] {
  return []
}

export function getMockProgramById(_id: string): ProgramDetail | undefined {
  return undefined
}

export async function loadMockPrograms(): Promise<ProgramDetail[]> {
  return []
}

export async function loadMockProgramById(_id: string): Promise<ProgramDetail | undefined> {
  return undefined
}
