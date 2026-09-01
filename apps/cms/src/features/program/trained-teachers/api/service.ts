import { getTrainedTeachersPrograms } from '@/data/mock/trained-teachers-programs'
import { programService } from '@/entities/program/api/program-service'
import {
  deleteCompanySchoolRegistrationLocalSaveProgram,
  readTrainedTeachersRegistrationLocalSavePrograms,
  updateCompanySchoolRegistrationLocalSaveProgram,
} from '@/features/program/general/lib/registration-local-save'
import {
  bulkDeleteAdminProgramsRemote,
  createAdminProgramRemote,
  deleteAdminProgramRemote,
  fetchAdminProgramByIdRemote,
  fetchAdminProgramsRemote,
  updateAdminProgramRemote,
} from '@/features/program/general/api/programs-api-client'
import type { Program } from '@/types/domain'
import {
  mapTrainedTeacherDetailToProgram,
  mapTrainedTeacherListItemToProgram,
  mapTrainedTeacherToCreateRequest,
  mapTrainedTeacherToUpdateRequest,
} from './adapters'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import {
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
  type TrainedTeachersCommonInfoSavePayload,
} from './info-detail-adapters'
import {
  fetchTrainedTeacherInfoDetailRemote,
  patchTrainedTeacherInfoDetailRemote,
} from './info-detail-client'
import { trainedTeacherListParams, type TrainedTeacherListFilters } from './list-params'

/** remote list 스냅샷 — 상세 분기(isTrainedTeachersDetailProgram)용 */
let remoteIdSnapshot: Set<string> | null = null

export function getTrainedTeacherRemoteIdSnapshot(): Set<string> | null {
  return remoteIdSnapshot
}

function setRemoteIdSnapshot(programs: Program[]): void {
  remoteIdSnapshot = new Set(programs.map(p => p.id).filter(Boolean))
}

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 API가 활성화되지 않았습니다. 원격 JWT, programs 모듈, VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true(또는 trainedTeacherPrograms) 설정을 확인해 주세요.'
  )
}

export function getTrainedTeachersMockList(): Program[] {
  const mockPrograms = getTrainedTeachersPrograms()
  const localPrograms = readTrainedTeachersRegistrationLocalSavePrograms().filter(
    local => !mockPrograms.some(mock => mock.id === local.id)
  )
  return [...mockPrograms, ...localPrograms]
}

export async function listTrainedTeacherPrograms(
  filters: TrainedTeacherListFilters = {}
): Promise<Program[]> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    remoteIdSnapshot = null
    return getTrainedTeachersMockList()
  }
  assertRemoteReady()
  const page = await fetchAdminProgramsRemote(trainedTeacherListParams(filters))
  const programs = (page.items ?? []).map(mapTrainedTeacherListItemToProgram)
  setRemoteIdSnapshot(programs)
  return programs
}

export async function getTrainedTeacherProgram(programId: string): Promise<Program> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    const local = getTrainedTeachersMockList().find(item => item.id === programId)
    if (local) return local
    return programService.getById(programId)
  }
  assertRemoteReady()
  const program = mapTrainedTeacherDetailToProgram(await fetchAdminProgramByIdRemote(programId))
  try {
    const infoDetail = await fetchTrainedTeacherInfoDetailRemote(programId)
    return mergeTrainedTeacherInfoDetailIntoProgram(program, infoDetail)
  } catch {
    // info detail 실패 시 programs 코어 detail만 반환 (Phase 2 soft-fail)
    return program
  }
}

export async function createTrainedTeacherProgram(program: Program): Promise<Program> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...data } = program
    return programService.create(data)
  }
  assertRemoteReady()
  const dto = await createAdminProgramRemote(mapTrainedTeacherToCreateRequest(program))
  const mapped = mapTrainedTeacherDetailToProgram(dto)
  if (remoteIdSnapshot) remoteIdSnapshot.add(mapped.id)
  else remoteIdSnapshot = new Set([mapped.id])
  return mapped
}

export async function updateTrainedTeacherProgram(
  programId: string,
  program: Program,
  patch?: Partial<Program>
): Promise<Program> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    const mergedPatch = patch ?? program
    const updatedLocal = updateCompanySchoolRegistrationLocalSaveProgram(
      programId,
      mergedPatch
    )
    if (updatedLocal) return updatedLocal

    const mockProgram = getTrainedTeachersPrograms().find(item => item.id === programId)
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
    mapTrainedTeacherToUpdateRequest(program, patch)
  )
  const mapped = mapTrainedTeacherDetailToProgram(dto)
  try {
    const infoDetail = await fetchTrainedTeacherInfoDetailRemote(programId)
    return mergeTrainedTeacherInfoDetailIntoProgram(mapped, infoDetail)
  } catch {
    return mapped
  }
}

/** 공통 정보 LNB — trained-teacher/detail PATCH */
export async function updateTrainedTeacherProgramInfoDetail(
  programId: string,
  payload: TrainedTeachersCommonInfoSavePayload
): Promise<Program> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    const current = await getTrainedTeacherProgram(programId)
    const next: Program = {
      ...current,
      educatedTeachers: payload.educatedTeachers ?? current.educatedTeachers,
      generalCommonInfo: {
        ...current.generalCommonInfo,
        ...payload.commonInfo,
      },
      updatedAt: new Date().toISOString(),
    }
    return updateTrainedTeacherProgram(programId, next, {
      educatedTeachers: next.educatedTeachers,
      generalCommonInfo: next.generalCommonInfo,
    })
  }
  assertRemoteReady()
  const dto = await patchTrainedTeacherInfoDetailRemote(
    programId,
    mapTrainedTeacherInfoSaveToRequest(payload)
  )
  const base = await fetchAdminProgramByIdRemote(programId)
  return mergeTrainedTeacherInfoDetailIntoProgram(mapTrainedTeacherDetailToProgram(base), dto)
}

export async function deleteTrainedTeacherProgram(programId: string): Promise<void> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    if (deleteCompanySchoolRegistrationLocalSaveProgram(programId)) return
    const mockPrograms = getTrainedTeachersPrograms()
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
  remoteIdSnapshot?.delete(programId)
}

export async function deleteTrainedTeacherPrograms(programIds: string[]): Promise<void> {
  if (programIds.length === 0) return

  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    for (const programId of programIds) {
      await deleteTrainedTeacherProgram(programId)
    }
    return
  }

  assertRemoteReady()
  await bulkDeleteAdminProgramsRemote(programIds)
  for (const programId of programIds) {
    remoteIdSnapshot?.delete(programId)
  }
}
