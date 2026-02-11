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
      sponsorId: '',
      managerName: '',
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
      // #region agent log
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null
      fetch('http://127.0.0.1:7242/ingest/17f6fbd2-a727-4bc2-b32f-9b76dc9e6837', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'use-program-detail-edit-form.ts:reset-before',
          message: 'form-reset-edit-mode',
          data: {
            activeTag: (activeEl as HTMLElement)?.tagName ?? null,
            activeClass: (activeEl as HTMLElement)?.className?.slice(0, 60) ?? null,
            scrollY: typeof window !== 'undefined' ? window.scrollY : null,
          },
          timestamp: Date.now(),
          hypothesisId: 'C',
        }),
      }).catch(() => {})
      // #endregion
      reset(programToDetailEditValues(program))
    }
  }, [isEditMode, program, reset])

  return form
}
