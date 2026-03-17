/**
 * 프로그램 상세 정보 수정 폼 인스턴스·동기화
 * - 비즈니스: program 변경 시 폼 동기화, 수정 모드 진입 시 최신 program으로 reset
 * - useEffect(program, reset): program 변경 시 폼 값 동기화 (다른 수정 폼과 동일 패턴)
 * - useLayoutEffect(isEditMode, program, reset): 수정 모드 진입 시 한 번 더 reset으로 "정보 수정" 클릭 시점 program 기준 채움 (빈 값 노출 방지)
 * - 수정 모드 진입 전 부모에서 resetToProgram() 호출 후 isEditMode 전환 권장
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
      sponsorId: '',
      managerName: '',
      description: '',
      learningSupportContent: '',
    }
  }, [program])

  const form = useForm<ProgramDetailEditFormValues>({
    resolver: zodResolver(programDetailEditSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const { reset } = form

  // program 변경 시 폼 값 동기화
  useEffect(() => {
    if (program) {
      reset(programToDetailEditValues(program))
    }
  }, [program, reset])

  // 수정 모드 진입 시 폼을 최신 program 값으로 채움 (useLayoutEffect로 페인트 전 실행)
  useLayoutEffect(() => {
    if (isEditMode && program) {
      reset(programToDetailEditValues(program))
    }
  }, [isEditMode, program, reset])

  return form
}
