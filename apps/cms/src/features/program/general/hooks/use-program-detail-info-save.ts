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
 * - 기본 저장 페이로드는 `detailEditValuesToProgramPatch(form.getValues(), program)`.
 * - 교육받은 교사 커리큘럼/일정 테이블은 폼에 없어 `triggerSave(extraCommonInfo)` 로 합친다.
 */

import { useCallback, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  detailEditValuesToProgramPatch,
  narrowProgramDetailPatchForCommonInfoSave,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { showUpdateCompletedAlert } from '@/shared/ui'
import {
  applyRecruitmentDetailInfoFields,
  type ProgramDetailRecruitmentAudience,
} from '@/features/program/shared/lib/apply-recruitment-additional-content-html'

export interface UseProgramDetailInfoSaveOptions {
  form: UseFormReturn<ProgramDetailEditFormValues>
  program: Program | null
  /** resetToProgram 시 사용. 없으면 `programToDetailEditValues` */
  mapToValues?: (program: Program) => ProgramDetailEditFormValues
  /** draft = 화면용 병합본, patch = remote PATCH에 실을 변경 키만 */
  onSaveEdit?: (draft: Program, patch: Partial<Program>) => Promise<void>
  /** 지정 시 해당 스키마로만 검증 — 모집 정보 탭 부분 저장용 */
  validateSchema?: z.ZodType<unknown>
  /** true면 remote PATCH 에서 모집·회차 필드 제외 (1사1교·교육받은 교사 공통정보 탭) */
  commonInfoPatchOnly?: boolean
  /** 모집 탭 저장 — 프로그램 설명·추가 내용 등을 해당 *RecruitmentInfo SSOT에도 넣는다 */
  recruitmentAudience?: ProgramDetailRecruitmentAudience
}

export type ProgramDetailInfoSaveExtraCommon = Partial<
  NonNullable<Program['generalCommonInfo']>
>

export function useProgramDetailInfoSave({
  form,
  program,
  mapToValues,
  onSaveEdit,
  validateSchema,
  commonInfoPatchOnly = false,
  recruitmentAudience,
}: UseProgramDetailInfoSaveOptions) {
  const savingRef = useRef(false)
  const saveFailureRef = useRef<'validation' | 'api' | null>(null)
  const getAdditionalContentHtmlRef = useRef<() => string>(() => '')

  const registerGetAdditionalContentHtml = useCallback((getter: () => string) => {
    getAdditionalContentHtmlRef.current = getter
  }, [])

  const takeSaveFailure = useCallback(() => {
    const kind = saveFailureRef.current
    saveFailureRef.current = null
    return kind
  }, [])

  const triggerSave = useCallback(
    async (extraCommonInfo?: ProgramDetailInfoSaveExtraCommon): Promise<boolean> => {
      if (savingRef.current || !onSaveEdit || !program) return false
      savingRef.current = true
      saveFailureRef.current = null
      try {
        const isValid =
          validateSchema != null
            ? validateSchema.safeParse(form.getValues()).success
            : await form.trigger()
        if (!isValid) {
          saveFailureRef.current = 'validation'
          return false
        }
        const values = form.getValues()
        const patch = detailEditValuesToProgramPatch(values, program)
        const html = getAdditionalContentHtmlRef.current?.()
        const extraDefined = extraCommonInfo
          ? Object.fromEntries(
              Object.entries(extraCommonInfo).filter(([, value]) => value !== undefined)
            )
          : undefined
        const generalCommonInfo =
          extraDefined && Object.keys(extraDefined).length > 0
            ? { ...patch.generalCommonInfo, ...extraDefined }
            : patch.generalCommonInfo
        let remotePatch: Partial<Program> = {
          ...patch,
          ...(typeof html === 'string' ? { additionalContentHtml: html } : {}),
          ...(generalCommonInfo ? { generalCommonInfo } : {}),
        }
        if (recruitmentAudience) {
          remotePatch = applyRecruitmentDetailInfoFields(
            remotePatch,
            program,
            recruitmentAudience,
            {
              description: values.description,
              recruitmentGuide: values.recruitmentGuide,
              applicationMethod: values.applicationMethod,
              learningSupportContent: values.learningSupportContent,
              ...(typeof html === 'string' ? { additionalContentHtml: html } : {}),
              otherNotes: values.otherNotes,
            }
          )
        }
        if (commonInfoPatchOnly) {
          remotePatch = narrowProgramDetailPatchForCommonInfoSave(remotePatch)
        }
        const draftToSave: Program = {
          ...program,
          ...remotePatch,
          generalCommonInfo: {
            ...program.generalCommonInfo,
            ...remotePatch.generalCommonInfo,
          },
        }
        await onSaveEdit(draftToSave, remotePatch)
        showUpdateCompletedAlert()
        return true
      } catch {
        saveFailureRef.current = 'api'
        return false
      } finally {
        savingRef.current = false
      }
    },
    [commonInfoPatchOnly, form, program, onSaveEdit, recruitmentAudience, validateSchema]
  )

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset((mapToValues ?? programToDetailEditValues)(program), { keepDefaultValues: false })
    }
  }, [form, mapToValues, program])

  return { triggerSave, resetToProgram, registerGetAdditionalContentHtml, takeSaveFailure }
}
