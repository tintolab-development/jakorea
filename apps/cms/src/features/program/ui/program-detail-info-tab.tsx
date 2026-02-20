/**
 * 프로그램 상세 정보 탭 (관리자 상세 페이지)
 * 3개 섹션 컴포넌트를 조합하는 컨테이너
 * 수정 모드: react-hook-form + zod, 기존 프로그램 값으로 defaultValues 채움
 */

import { forwardRef, useImperativeHandle } from 'react'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { Card } from 'antd'
import { BasicInfoSection } from './basic-info-section'
import { DetailInfoSection } from './detail-info-section'
import { CurriculumSection } from './curriculum-section'
import { useProgramDetailEditForm } from '../hooks/use-program-detail-edit-form'
import { useProgramDetailInfoSave } from '../hooks/use-program-detail-info-save'
import './program-detail-info-tab.css'

export interface ProgramDetailInfoTabProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus | null
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
    isEditMode = false,
    onCancelEdit: _onCancelEdit,
    onSaveEdit,
  },
  ref
) {
  const lifecycleStatus = lifecycleStatusProp ?? program.lifecycleStatus ?? undefined
  const form = useProgramDetailEditForm({ program, isEditMode })
  const { triggerSave, resetToProgram, registerGetAdditionalContentHtml } =
    useProgramDetailInfoSave({ form, program, onSaveEdit })

  useImperativeHandle(ref, () => ({ triggerSave, resetToProgram }), [triggerSave, resetToProgram])

  return (
    <div className="program-detail-info-tab">
      <Card className="program-detail-info-tab__card" bordered={false}>
        <BasicInfoSection
          program={program}
          sponsorName={sponsorName}
          createdByName={createdByName}
          updatedByName={updatedByName}
          lifecycleStatus={lifecycleStatus}
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
