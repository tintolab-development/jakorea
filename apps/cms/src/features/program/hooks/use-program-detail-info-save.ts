/**
 * 프로그램 상세 정보 탭 저장/리셋 및 추가 내용 HTML 수집
 * triggerSave: 폼 값 + 스키마 변환 + additionalContentHtml getter → onSaveEdit 호출
 * resetToProgram: 폼을 현재 program 값으로 리셋
 * registerGetAdditionalContentHtml: DetailInfoSection(에디터)에서 HTML 수집 getter 등록
 */

import { useCallback, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '../model/program-detail-edit-schema'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
} from '../model/program-detail-edit-schema'

export interface UseProgramDetailInfoSaveOptions {
  form: UseFormReturn<ProgramDetailEditFormValues>
  program: Program | null
  onSaveEdit?: (draft: Program) => Promise<void>
}

export function useProgramDetailInfoSave({
  form,
  program,
  onSaveEdit,
}: UseProgramDetailInfoSaveOptions) {
  const savingRef = useRef(false)
  const getAdditionalContentHtmlRef = useRef<() => string>(() => '')

  const registerGetAdditionalContentHtml = useCallback((getter: () => string) => {
    getAdditionalContentHtmlRef.current = getter
  }, [])

  const triggerSave = useCallback(async () => {
    if (savingRef.current || !onSaveEdit || !program) return
    savingRef.current = true
    try {
      const isValid = await form.trigger()
      if (!isValid) return
      const values = form.getValues()
      const patch = detailEditValuesToProgramPatch(values, program)
      const html = getAdditionalContentHtmlRef.current?.()
      const draftToSave: Program = {
        ...program,
        ...patch,
        ...(typeof html === 'string' ? { additionalContentHtml: html } : {}),
      }
      await onSaveEdit(draftToSave)
    } finally {
      savingRef.current = false
    }
  }, [form, program, onSaveEdit])

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset(programToDetailEditValues(program), { keepDefaultValues: false })
    }
  }, [form, program])

  return { triggerSave, resetToProgram, registerGetAdditionalContentHtml }
}
