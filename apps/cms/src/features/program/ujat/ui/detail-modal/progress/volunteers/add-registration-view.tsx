/**
 * 교육 진행 > 참여 봉사자 — 관리자 대리 작성(풀페이지 우측 임베드)
 * 완료 시 프로그램 신청 양식 version 저장이 아니라 volunteer-participants/register POST.
 */

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { findWritingTemplateRowByDefinitionId } from '@/features/template/lib/writing-template-create-helpers'
import {
  lookupTemplateRegistry,
  resolvePreviewHeaderTitle,
} from '@/features/template/model/template-registry/template-registry'
import {
  getUjatApplicationVolunteerOverlayRecord,
  useProgramParticipantApplicationEditor,
} from '@/features/template/hooks/use-program-participant-application-editor'
import { CmsButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { registerVolunteerParticipantRemote } from '@/features/program/general/api/program-progress-api-client'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import {
  notifyProgramApiUnavailable,
} from '@/features/program/shared/lib/program-api-unavailable'
import { parseUjatVolAddMemberIdParam } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { UjatEducationProgressVolunteerAddRegistrationForm } from './add-registration-form'
import {
  EMPTY_UJAT_VOLUNTEER_ADD_REGISTRATION_CONSENTS,
  type UjatVolunteerAddRegistrationConsentState,
} from './terms-consent-section'
import { buildUjatVolunteerParticipantRegisterRequest } from './ujat-volunteer-participant-register-request'
import { hasIncompleteUjatPreviousTermUploads } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-previous-term-paragraph'
import { UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-keys'
import './add-registration-view.css'

/** 등록 submit 전 memberId 검증 — 단위 테스트용 export */
export function resolveVolunteerRegisterMemberId(memberId: string): number | null {
  const parsed = parseUjatVolAddMemberIdParam(memberId)
  return parsed == null ? null : Number(parsed)
}

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
  program: Program
  volunteerHalf: UjatVolunteerRecruitHalf
  onClose: () => void
  onComplete: (memberId: string) => void
}

export function UjatEducationProgressVolunteerAddRegistrationView({
  memberId,
  program,
  volunteerHalf,
  onClose,
  onComplete,
}: UjatEducationProgressVolunteerAddRegistrationViewProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [consents, setConsents] = useState<UjatVolunteerAddRegistrationConsentState>(
    () => ({ ...EMPTY_UJAT_VOLUNTEER_ADD_REGISTRATION_CONSENTS })
  )
  const templateName = useMemo(() => resolveVolunteerApplicationTemplateName(), [])
  const participantVm = useProgramParticipantApplicationEditor(
    true,
    templateName,
    'ujat-application-volunteer',
    {
      program,
      ujatRecruitParagraphProps: {
        volunteerHalf,
        sectionTitle: '',
      },
    }
  )

  const handleComplete = async () => {
    if (submitting) return
    const numericMemberId = resolveVolunteerRegisterMemberId(memberId)
    if (numericMemberId == null) {
      showAlert({ title: '안내', content: '등록할 봉사자를 다시 선택해 주세요.' })
      return
    }

    const remoteEnabled =
      shouldUseUjatApplicationsRemoteApi() || shouldUseProgramProgressHttpRemoteApi()
    if (!remoteEnabled) {
      notifyProgramApiUnavailable(
        'ujat-progress-volunteer-register',
        'UJAT 진행 현황 · 봉사자 추가 등록'
      )
      return
    }

    const overlay = getUjatApplicationVolunteerOverlayRecord()
    if (
      hasIncompleteUjatPreviousTermUploads(
        overlay[UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]
      )
    ) {
      showAlert({
        title: '안내',
        content: '수료증 업로드가 끝나지 않았거나 실패한 파일이 있습니다. 확인 후 다시 시도해 주세요.',
      })
      return
    }

    const built = buildUjatVolunteerParticipantRegisterRequest({
      memberId: numericMemberId,
      paragraphs: participantVm.draft.paragraphs,
      terms: consents,
      overlay,
      applicationType: participantVm.ujatVolunteerApplicationType,
    })
    if (!built.ok) {
      showAlert({ title: built.title, content: built.message })
      return
    }

    setSubmitting(true)
    try {
      await registerVolunteerParticipantRemote(program.id, built.request)
      await queryClient.invalidateQueries({
        queryKey: ujatQueryKeys.volunteerApplicationsRoot(program.id),
      })
      onComplete(memberId)
    } catch (error) {
      showAlert({
        title: '봉사자 등록 실패',
        content: getGeneralProgramApiErrorMessage(
          error,
          '봉사자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        ),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ujat-volunteer-add-registration ujat-volunteer-add-registration--embed">
      <div className="ujat-volunteer-add-registration__scroll">
        <UjatEducationProgressVolunteerAddRegistrationForm
          vm={participantVm}
          memberId={memberId}
          programId={program.id}
          consents={consents}
          onConsentsChange={setConsents}
        />
      </div>

      <footer className="ujat-volunteer-add-registration__footer">
        <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          disabled={submitting}
          onClick={() => void handleComplete()}
        >
          추가 등록
        </CmsButton>
      </footer>
    </div>
  )
}
