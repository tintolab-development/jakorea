/**
 * 프로그램 조회 — 임시저장(local draft)만 동기 resolve.
 * 관리 목록·상세·CRUD는 유형별 remote 서비스 사용.
 */

import type { Program, ProgramRound } from '@/types/domain'
import {
  findGeneralRegistrationLocalSaveProgramById,
} from '@/features/program/general/lib/registration-local-save'
import {
  findUjatRegistrationLocalSaveProgramById,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import { applyUjatRecruitInstitutionTemplateDefaults } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import { applyUjatRecruitVolunteerTemplateDefaults } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { applyUjatRegistrationTemplateDefaults } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { isUjatProgramId } from '@/features/program/ujat/lib/ujat-program-detail-meta'
import { UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX } from '@/features/program/ujat/lib/ujat-registration-local-save'
import type { UserRole } from '@/types/user'

function resolveDraftProgramById(id: string): Program | undefined {
  return (
    findGeneralRegistrationLocalSaveProgramById(id) ??
    findUjatRegistrationLocalSaveProgramById(id)
  )
}

function withUjatRecruitTemplateDefaults(program: Program): Program {
  const base =
    isUjatProgramId(program.id) || program.id.startsWith(UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
      ? applyUjatRegistrationTemplateDefaults(program)
      : program
  return applyUjatRecruitVolunteerTemplateDefaults(
    applyUjatRecruitInstitutionTemplateDefaults(base)
  )
}

const REMOTE_ONLY_MESSAGE =
  '프로그램 목록·등록은 유형별 Admin programs API를 사용하세요. mock 카탈로그는 제거되었습니다.'

export const programService = {
  getAll: async (_userRole?: UserRole | null, _userId?: string): Promise<Program[]> => {
    void _userRole
    void _userId
    return []
  },

  getById: async (id: string): Promise<Program> => {
    const program = resolveDraftProgramById(id)
    if (!program) {
      throw new Error(`Program not found: ${id}`)
    }
    return withUjatRecruitTemplateDefaults(program)
  },

  create: async (
    _data: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>,
    _creatorUserId?: string
  ): Promise<Program> => {
    void _data
    void _creatorUserId
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  update: async (
    _id: string,
    _data: Partial<Omit<Program, 'id' | 'createdAt'>>
  ): Promise<Program> => {
    void _id
    void _data
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  delete: async (_id: string): Promise<void> => {
    void _id
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  updateRound: async (
    _programId: string,
    _roundId: string,
    _data: Partial<Omit<ProgramRound, 'id' | 'programId'>>
  ): Promise<ProgramRound> => {
    void _programId
    void _roundId
    void _data
    throw new Error(REMOTE_ONLY_MESSAGE)
  },

  getNameById: (id: string): string => {
    const program = resolveDraftProgramById(id)
    return program?.title || id
  },

  getByIdSync: (id: string): Program | undefined => {
    const program = resolveDraftProgramById(id)
    return program ? withUjatRecruitTemplateDefaults(program) : undefined
  },

  getAllSync: (): Program[] => [],

  getBySponsorId: async (_sponsorId: string): Promise<Program[]> => {
    void _sponsorId
    return []
  },
}
