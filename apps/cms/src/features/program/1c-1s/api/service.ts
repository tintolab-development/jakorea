import { getCompanySchoolPrograms } from '@/data/mock/economy-programs'
import { programService } from '@/entities/program/api/program-service'
import {
  deleteCompanySchoolRegistrationLocalSaveProgram,
  readCompanySchoolRegistrationLocalSavePrograms,
  updateCompanySchoolRegistrationLocalSaveProgram,
} from '@/features/program/general/lib/registration-local-save'
import {
  createAdminProgramRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import type { Program } from '@/types/domain'
import {
  mapCompanySchoolDetailToProgram,
  mapCompanySchoolListItemToProgram,
  mapCompanySchoolToCreateRequest,
  mapCompanySchoolToUpdateRequest,
} from './adapters'
import { shouldUseCompanySchoolRemoteApi } from './capabilities'
import { companySchoolListParams, type CompanySchoolListFilters } from './list-params'

function assertRemoteReady(): void {
  if (shouldUseCompanySchoolRemoteApi()) return
  throw new Error(
    '1사1교 API가 활성화되지 않았습니다. 원격 JWT, programs 모듈, VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true 설정을 확인해 주세요.'
  )
}

export function getCompanySchoolMockList(): Program[] {
  const mockPrograms = getCompanySchoolPrograms()
  const localPrograms = readCompanySchoolRegistrationLocalSavePrograms().filter(
    local => !mockPrograms.some(mock => mock.id === local.id)
  )
  return [...mockPrograms, ...localPrograms]
}

export async function listCompanySchoolPrograms(
  filters: CompanySchoolListFilters = {}
): Promise<Program[]> {
  if (!shouldUseCompanySchoolRemoteApi()) return getCompanySchoolMockList()
  assertRemoteReady()
  const page = await fetchAdminProgramsRemote(companySchoolListParams(filters))
  return (page.items ?? []).map(mapCompanySchoolListItemToProgram)
}

export async function getCompanySchoolProgram(programId: string): Promise<Program> {
  if (!shouldUseCompanySchoolRemoteApi()) return programService.getById(programId)
  assertRemoteReady()
  return mapCompanySchoolDetailToProgram(await fetchAdminProgramByIdRemote(programId))
}

export async function createCompanySchoolProgram(program: Program): Promise<Program> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = program
    return programService.create(data)
  }
  assertRemoteReady()
  const dto = await createAdminProgramRemote(mapCompanySchoolToCreateRequest(program))
  return mapCompanySchoolDetailToProgram(dto)
}

export async function updateCompanySchoolProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    const mergedPatch = patch ?? program
    const updatedLocal = updateCompanySchoolRegistrationLocalSaveProgram(
      programId,
      mergedPatch
    )
    if (updatedLocal) return updatedLocal

    const mockProgram = getCompanySchoolPrograms().find(item => item.id === programId)
    if (mockProgram) {
      Object.assign(mockProgram, mergedPatch, {
        id: mockProgram.id,
        createdAt: mockProgram.createdAt,
        updatedAt: new Date().toISOString(),
      })
      return mockProgram
    }

    const { id: _id, createdAt: _createdAt, ...data } = mergedPatch
    return programService.update(programId, data)
  }
  assertRemoteReady()
  const dto = await updateAdminProgramRemote(
    programId,
    mapCompanySchoolToUpdateRequest(program, patch)
  )
  return mapCompanySchoolDetailToProgram(dto)
}

export async function deleteCompanySchoolProgram(programId: string): Promise<void> {
  if (!shouldUseCompanySchoolRemoteApi()) {
    if (deleteCompanySchoolRegistrationLocalSaveProgram(programId)) return
    const mockPrograms = getCompanySchoolPrograms()
    const mockIndex = mockPrograms.findIndex(program => program.id === programId)
    if (mockIndex >= 0) {
      mockPrograms.splice(mockIndex, 1)
      return
    }
    await programService.delete(programId)
    return
  }
  assertRemoteReady()
  await deleteAdminProgramRemote(programId)
}
