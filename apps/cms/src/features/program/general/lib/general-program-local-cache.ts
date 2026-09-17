/**
 * 일반 프로그램 상세 편집 세션 캐시 (등록 임시저장과 별도).
 * 관리 카탈로그 mock이 아닌, 상세 저장 직후 동일 세션 resolve용.
 */

import type { Program } from '@/types/domain'
import { findGeneralRegistrationLocalSaveProgramById } from '@/features/program/general/lib/registration-local-save'

const generalProgramDetailSaves = new Map<string, Program>()

export function saveGeneralProgramDetailSnapshot(program: Program): void {
  generalProgramDetailSaves.set(program.id, JSON.parse(JSON.stringify(program)) as Program)
}

export function resolveGeneralProgramLocalById(id: string): Program | undefined {
  return findGeneralRegistrationLocalSaveProgramById(id) ?? generalProgramDetailSaves.get(id)
}
