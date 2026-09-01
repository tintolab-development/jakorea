/**
 * 교육 진행 > 참여 봉사자 — 관리자 대리 작성(풀페이지 우측 임베드)
 * UJAT 프로그램 봉사자 신청 폼과 동일 항목·블록 내용, 스크린샷 레이아웃
 */

import { useMemo } from 'react'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import { CmsButton } from '@/shared/ui'
import { UjatEducationProgressVolunteerAddRegistrationForm } from './add-registration-form'
import './add-registration-view.css'

const UJAT_VOLUNTEER_APPLICATION_TEMPLATE_ID = 'application-ujat-volunteer'

function resolveVolunteerApplicationTemplateName(): string {
  return (
    findWritingTemplateRowByDefinitionId(UJAT_VOLUNTEER_APPLICATION_TEMPLATE_ID)?.templateName ??
    resolvePreviewHeaderTitle(
      lookupTemplateRegistry(UJAT_VOLUNTEER_APPLICATION_TEMPLATE_ID),
      undefined
    )
  )
}

export type UjatEducationProgressVolunteerAddRegistrationViewProps = {
  memberId: string
  onClose: () => void
  onComplete: (memberId: string) => void
}

export function UjatEducationProgressVolunteerAddRegistrationView({
  memberId,
  onClose,
  onComplete,
}: UjatEducationProgressVolunteerAddRegistrationViewProps) {
  const templateName = useMemo(() => resolveVolunteerApplicationTemplateName(), [])
  const participantVm = useProgramParticipantApplicationEditor(
    true,
    templateName,
    'ujat-application-volunteer'
  )

  const handleComplete = () => {
    participantVm.handleSave()
    onComplete(memberId)
  }

  return (
    <div className="ujat-volunteer-add-registration ujat-volunteer-add-registration--embed">
      <div className="ujat-volunteer-add-registration__scroll">
        <UjatEducationProgressVolunteerAddRegistrationForm vm={participantVm} />
      </div>

      <footer className="ujat-volunteer-add-registration__footer">
        <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
        <CmsButton variant="primary" size="large" type="button" onClick={handleComplete}>
          추가 등록
        </CmsButton>
      </footer>
    </div>
  )
}
