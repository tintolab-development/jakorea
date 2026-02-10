/**
 * 프로그램 상세 정보 탭 (관리자 상세 페이지)
 * 3개 섹션 컴포넌트를 조합하는 컨테이너
 * 수정 모드: react-hook-form + zod, 기존 프로그램 값으로 defaultValues 채움
 */

import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { Card } from 'antd'
import { BasicInfoSection } from './basic-info-section'
import { DetailInfoSection } from './detail-info-section'
import { CurriculumSection } from './curriculum-section'
import { useProgramDetailEditForm } from '../hooks/use-program-detail-edit-form'
import {
  detailEditValuesToProgramPatch,
  programToDetailEditValues,
} from '../model/program-detail-edit-schema'
import './program-detail-info-tab.css'

export interface ProgramDetailInfoTabProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus | null
  onLifecycleStatusChange?: (status: ProgramLifecycleStatus) => void
  isEditMode?: boolean
  onCancelEdit?: () => void
  onSaveEdit?: (draft: Program) => Promise<void>
}

export const ProgramDetailInfoTab = forwardRef<
  { triggerSave: () => Promise<void>; resetToProgram: () => void },
  ProgramDetailInfoTabProps
>(function ProgramDetailInfoTab(
  {
    program,
    sponsorName,
    createdByName,
    updatedByName,
    lifecycleStatus: lifecycleStatusProp,
    onLifecycleStatusChange,
    isEditMode = false,
    onCancelEdit: _onCancelEdit,
    onSaveEdit,
  },
  ref
) {
  const lifecycleStatus = lifecycleStatusProp ?? program.lifecycleStatus ?? undefined
  const savingRef = useRef(false)
  const getAdditionalContentHtmlRef = useRef<() => string>(() => '')

  const form = useProgramDetailEditForm({ program, isEditMode })

  const registerGetAdditionalContentHtml = (getter: () => string) => {
    getAdditionalContentHtmlRef.current = getter
  }

  const triggerSave = async () => {
    if (savingRef.current || !onSaveEdit) return
    savingRef.current = true
    try {
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
  }

  const resetToProgram = () => {
    if (program) form.reset(programToDetailEditValues(program))
  }
  useImperativeHandle(
    ref,
    () => ({ triggerSave, resetToProgram }),
    [program, onSaveEdit, form]
  )

  return (
    <div className="program-detail-info-tab">
      <Card className="program-detail-info-tab__card" bordered={false}>
        <BasicInfoSection
          program={program}
          sponsorName={sponsorName}
          createdByName={createdByName}
          updatedByName={updatedByName}
          lifecycleStatus={lifecycleStatus}
          onLifecycleStatusChange={onLifecycleStatusChange}
          isEditMode={isEditMode}
          form={isEditMode ? form : undefined}
        />
        <DetailInfoSection
          program={program}
          isEditMode={isEditMode}
          form={isEditMode ? form : undefined}
          onRegisterGetAdditionalContentHtml={registerGetAdditionalContentHtml}
        />
        <CurriculumSection
          program={program}
          isEditMode={isEditMode}
          form={isEditMode ? form : undefined}
        />
      </Card>
    </div>
  )
})
