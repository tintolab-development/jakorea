/**
 * 프로그램 상세 정보 수정 폼 (react-hook-form + zod)
 * - defaultValues는 마운트 시 한 번만 적용되므로, program 변경 시 reset으로 동기화 (sponsor-form/instructor-form 패턴)
 * - 수정 모드 진입 전 부모에서 resetToProgram() 호출해 폼에 프로그램 값 채운 뒤 isEditMode 전환 권장
 */

import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Program } from '@/types/domain'
import {
  programDetailEditSchema,
  type ProgramDetailEditFormValues,
  programToDetailEditValues,
} from '../model/program-detail-edit-schema'

export interface UseProgramDetailEditFormOptions {
  program: Program | null
  isEditMode: boolean
}

export function useProgramDetailEditForm({
  program,
  isEditMode,
}: UseProgramDetailEditFormOptions): UseFormReturn<ProgramDetailEditFormValues> {
  const defaultValues = useMemo<ProgramDetailEditFormValues>(() => {
    if (program) return programToDetailEditValues(program)
    return {
      title: '',
      category: 'school',
      type: 'offline',
      rounds: [],
    }
  }, [program])

  const form = useForm<ProgramDetailEditFormValues>({
    resolver: zodResolver(programDetailEditSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const { reset } = form

  // program 변경 시 폼 값 동기화 (다른 react-hook-form 수정 폼과 동일 패턴)
  useEffect(() => {
    if (program) {
      reset(programToDetailEditValues(program))
    }
  }, [program, reset])

  // 수정 모드 진입 직후 폼을 프로그램 값으로 채움 (페인트 전 실행해 빈 값 노출 방지)
  useLayoutEffect(() => {
    if (isEditMode && program) {
      reset(programToDetailEditValues(program))
    }
  }, [isEditMode, program, reset])

  return form
}
