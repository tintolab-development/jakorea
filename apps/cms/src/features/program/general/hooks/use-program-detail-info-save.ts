/**
 * 프로그램 상세 정보 탭 저장/리셋 및 추가 내용 HTML 수집
 * triggerSave: 폼 값 + 스키마 변환 + additionalContentHtml getter → onSaveEdit 호출
 * resetToProgram: 폼을 현재 program 값으로 리셋
 * registerGetAdditionalContentHtml: project-info-detail-info-section(에디터)에서 HTML 수집 getter 등록
 *
 * ─── Zod 검증 연동 ───────────────────────────────────────────────────────────
 * - `form.trigger()` → `zodResolver(programDetailEditSchema)` 기반 전 필드 검증.
 *   trigger 를 건너뛰거나 수동으로 patch 만내면 스키마와 UI 불일치 가능.
 *
 * ─── 병합 시 주의 ───────────────────────────────────────────────────────────
 * - 저장 페이로드는 `detailEditValuesToProgramPatch(form.getValues(), program)` 만 사용.
 *   patch 에 없는 폼 필드는 API 로 전달되지 않음 (`program-detail-edit-schema.ts` 주석 참고).
 */

import { useCallback, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'

export interface UseProgramDetailInfoSaveOptions {
  form: UseFormReturn<ProgramDetailEditFormValues>
  program: Program | null
  onSaveEdit?: (draft: Program) => Promise<void>
  /** 지정 시 해당 스키마로만 검증 — 모집 정보 탭 부분 저장용 */
  validateSchema?: z.ZodType<unknown>
}

export function useProgramDetailInfoSave({
  form,
  program,
  onSaveEdit,
  validateSchema,
}: UseProgramDetailInfoSaveOptions) {
  const savingRef = useRef(false)
  const getAdditionalContentHtmlRef = useRef<() => string>(() => '')

  const registerGetAdditionalContentHtml = useCallback((getter: () => string) => {
    getAdditionalContentHtmlRef.current = getter
  }, [])

  const triggerSave = useCallback(async (): Promise<boolean> => {
    if (savingRef.current || !onSaveEdit || !program) return false
    savingRef.current = true
    try {
      const isValid =
        validateSchema != null
          ? validateSchema.safeParse(form.getValues()).success
          : await form.trigger()
      if (!isValid) return false
      const values = form.getValues()
      const patch = detailEditValuesToProgramPatch(values, program)
      const html = getAdditionalContentHtmlRef.current?.()
      const draftToSave: Program = {
        ...program,
        ...patch,
        ...(typeof html === 'string' ? { additionalContentHtml: html } : {}),
      }
      await onSaveEdit(draftToSave)
      return true
    } catch {
      return false
    } finally {
      savingRef.current = false
    }
  }, [form, program, onSaveEdit, validateSchema])

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset(programToDetailEditValues(program), { keepDefaultValues: false })
    }
  }, [form, program])

  return { triggerSave, resetToProgram, registerGetAdditionalContentHtml }
}
