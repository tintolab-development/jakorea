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
import type { FieldPath, UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  detailEditValuesToProgramPatch,
  narrowProgramDetailPatchForCommonInfoSave,
  programToDetailEditValues,
  volunteerDocumentInterviewNestedPatch,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { showUpdateCompletedAlert } from '@/shared/ui'
import {
  extractApiErrorCode,
  extractApiErrorField,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'
import { resolveProgramDetailSaveApiFormField } from '@/features/program/shared/lib/program-detail-save-api-error'
import { applyAudienceProgramOperationToRecruitmentWindows } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { omitRecruitmentTabScheduleFields } from '@/features/program/shared/lib/persist-recruitment-row-save'
import {
  applyRecruitmentDetailInfoFields,
  type ProgramDetailRecruitmentAudience,
  type ProgramDetailRecruitmentNotesField,
} from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'
import { isGeneralRecruitmentRowProgram } from '@/features/program/general/lib/is-general-recruitment-row-program'
import {
  buildMergedRegistrationOverlayForRecruitSave,
  mergeOverlayOnlyVolunteerInterviewSchedule,
  mergeVolunteerRecruitmentInfoAfterOverlayApply,
} from '@/features/program/general/lib/detail-operational-save-merge'

export { mergeVolunteerRecruitmentInfoAfterOverlayApply }

export interface UseProgramDetailInfoSaveOptions {
  form: UseFormReturn<ProgramDetailEditFormValues>
  program: Program | null
  /** resetToProgram 시 사용. 없으면 `programToDetailEditValues` */
  mapToValues?: (program: Program) => ProgramDetailEditFormValues
  /** draft = 화면용 병합본, patch = remote PATCH에 실을 변경 키만 */
  onSaveEdit?: (draft: Program, patch: Partial<Program>, baseline: Program) => Promise<void>
  /** 지정 시 해당 스키마로만 검증 — 모집 정보 탭 부분 저장용 */
  validateSchema?: z.ZodType<unknown>
  /** true면 remote PATCH 에서 모집·회차 필드 제외 (1사1교·교육받은 교사 공통정보 탭) */
  commonInfoPatchOnly?: boolean
  /** 모집 탭 저장 — 프로그램 설명·추가 내용 등을 해당 *RecruitmentInfo SSOT에도 넣는다 */
  recruitmentAudience?: ProgramDetailRecruitmentAudience
  /** 모집 비고 폼 필드. 기본: 참여자 remarks · 강사 instructorRecruitmentRemarks(일반) / otherNotes · 봉사자 oneLineIntroduction */
  recruitmentNotesField?: ProgramDetailRecruitmentNotesField
  /** 교육받은 교사 원격 모드: 브라우저 overlay를 저장 payload의 source로 사용하지 않음 */
  strictRemote?: boolean
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
  recruitmentNotesField,
  strictRemote = false,
}: UseProgramDetailInfoSaveOptions) {
  const savingRef = useRef(false)
  const saveFailureRef = useRef<'validation' | 'api' | null>(null)
  const getAdditionalContentHtmlRef = useRef<(() => string) | null>(null)

  const registerGetAdditionalContentHtml = useCallback((getter: () => string) => {
    getAdditionalContentHtmlRef.current = getter
  }, [])

  const getAdditionalContentHtml = useCallback(
    () => getAdditionalContentHtmlRef.current?.(),
    []
  )

  const takeSaveFailure = useCallback(() => {
    const kind = saveFailureRef.current
    saveFailureRef.current = null
    return kind
  }, [])

  const triggerSave = useCallback(
    async (
      extraCommonInfo?: ProgramDetailInfoSaveExtraCommon,
      options?: { skipSuccessAlert?: boolean }
    ): Promise<boolean> => {
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
        const patch = detailEditValuesToProgramPatch(values, program, {
          recruitmentAudience,
        })
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
          remotePatch = {
            ...remotePatch,
            ...applyAudienceProgramOperationToRecruitmentWindows(
              program,
              values,
              recruitmentAudience
            ),
          }
          const writesRowFields = isGeneralRecruitmentRowProgram(program)
          const notesField =
            recruitmentNotesField ??
            (recruitmentAudience === 'instructor'
              ? writesRowFields
                ? 'instructorRecruitmentRemarks'
                : 'otherNotes'
              : recruitmentAudience === 'volunteer'
                ? 'oneLineIntroduction'
                : 'remarks')
          const notesNotApplicable =
            recruitmentAudience === 'participant'
              ? values.participantRecruitmentNotesNotApplicable === 'not_applicable'
              : recruitmentAudience === 'volunteer'
                ? values.volunteerRecruitmentNotesNotApplicable === 'not_applicable'
                : undefined
          const contact =
            recruitmentAudience === 'instructor'
              ? {
                  contactName: values.instructorRecruitmentContactOrganizationName,
                  contactPhone: values.instructorContactPhone,
                  contactEmail: values.instructorContactEmail,
                }
              : recruitmentAudience === 'volunteer'
                ? {
                    contactName: values.volunteerRecruitmentContactOrganizationName,
                    contactPhone: values.volunteerContactPhone,
                    contactEmail: values.volunteerContactEmail,
                  }
                : {
                    contactName: values.recruitmentContactOrganizationName,
                    contactPhone: values.contactPhone,
                    contactEmail: values.contactEmail,
                  }
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
              remarks:
                recruitmentAudience === 'instructor' && notesField !== 'otherNotes'
                  ? values.instructorRecruitmentRemarks
                  : values[notesField],
              notesNotApplicable,
              ...(writesRowFields
                ? {
                    contactName: contact.contactName ?? '',
                    contactPhone: contact.contactPhone ?? '',
                    contactEmail: contact.contactEmail ?? '',
                    ...(recruitmentAudience !== 'participant'
                      ? { otherMatters: values.otherNotes ?? '' }
                      : {}),
                  }
                : {}),
            }
          )
          if (recruitmentAudience === 'volunteer') {
            const existingVolunteer = program.generalCommonInfo?.volunteerRecruitmentInfo as
              | {
                  documentPassAnnouncementDate?: string
                  documentPassAnnouncementMethod?: string
                  interviewStartDate?: string
                  interviewEndDate?: string
                  interviewMethod?: string
                }
              | undefined
            const nestedInterview = volunteerDocumentInterviewNestedPatch(
              values,
              existingVolunteer
            )
            remotePatch = {
              ...remotePatch,
              generalCommonInfo: {
                ...remotePatch.generalCommonInfo,
                volunteerRecruitmentInfo: {
                  ...remotePatch.generalCommonInfo?.volunteerRecruitmentInfo,
                  ...nestedInterview,
                },
              },
            }
          }
          if (writesRowFields && notesField !== 'remarks') {
            // 비고는 모집 행 remarks 전용 — 프로그램 oneLineIntroduction·otherMatters로 새지 않게 한다.
            const { [notesField]: _rowNotes, ...withoutNotes } = remotePatch as Record<string, unknown>
            remotePatch = withoutNotes as Partial<Program>
          }
          if (remotePatch.generalCommonInfo) {
            // 모집 폼의 announcementTitle(행에 없으면 '')이 공통정보 공고명을 비우지 않게 한다.
            remotePatch = {
              ...remotePatch,
              generalCommonInfo: {
                ...remotePatch.generalCommonInfo,
                announcementTitle: program.generalCommonInfo?.announcementTitle,
              },
            }
          }
          const mergedRegistrationOverlay = buildMergedRegistrationOverlayForRecruitSave({
            program,
            remotePatch,
            values,
            audience: recruitmentAudience,
            strictRemote,
          })

          if (recruitmentAudience === 'volunteer') {
            remotePatch = mergeOverlayOnlyVolunteerInterviewSchedule(
              program,
              remotePatch,
              mergedRegistrationOverlay,
              values
            )
          }

          const draftForResync: Program = {
            ...program,
            ...remotePatch,
            generalCommonInfo: {
              ...program.generalCommonInfo,
              ...remotePatch.generalCommonInfo,
            },
          }
          remotePatch = {
            ...remotePatch,
            registrationOverlay: resyncGeneralRecruitOverlayFromProgram(
              draftForResync,
              mergedRegistrationOverlay
            ),
          }
        }
        if (recruitmentAudience) {
          remotePatch = omitRecruitmentTabScheduleFields(remotePatch)
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
        await onSaveEdit(draftToSave, remotePatch, program)
        if (!options?.skipSuccessAlert) {
          showUpdateCompletedAlert()
        }
        return true
      } catch (error) {
        const data =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined
        const message = extractApiErrorMessage(data, { fallback: '' })
        const field = resolveProgramDetailSaveApiFormField({
          apiField: extractApiErrorField(data),
          message,
          errorCode: extractApiErrorCode(data),
        })
        if (field && message) {
          form.setError(field as FieldPath<ProgramDetailEditFormValues>, {
            type: 'server',
            message,
          })
        }
        saveFailureRef.current = 'api'
        return false
      } finally {
        savingRef.current = false
      }
    },
    [
      commonInfoPatchOnly,
      form,
      program,
      onSaveEdit,
      recruitmentAudience,
      recruitmentNotesField,
      strictRemote,
      validateSchema,
    ]
  )

  const resetToProgram = useCallback(() => {
    if (program) {
      form.reset((mapToValues ?? programToDetailEditValues)(program), { keepDefaultValues: false })
    }
  }, [form, mapToValues, program])

  return {
    triggerSave,
    resetToProgram,
    registerGetAdditionalContentHtml,
    getAdditionalContentHtml,
    takeSaveFailure,
  }
}
