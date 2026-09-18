import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { TemplateFullpageModalFooterAction } from '@/features/template/ui/template-management/template-fullpage-modal'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'
import {
  UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  normalizeUjatProgramRegistrationStepKey,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import { useUjatProgramRegistrationFlow } from '@/features/program/ujat/hooks/use-ujat-program-registration-flow'
import { UjatProgramRegistrationBodyHeader } from '@/features/program/ujat/ui/registration/ujat-program-registration-body-header'
import { clearUjatRegistrationOperationalFormDrafts } from '@/features/program/ujat/lib/ujat-registration-operational-form-drafts'
import type { Program } from '@/types/domain'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  clearRegistrationDraftForFreshStart,
  peekWritingFormDraftOverwrite,
  PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  shouldRemoveRegistrationDraftAfterCompletion,
  shouldSkipRegistrationDraftRestore,
} from '@/features/program/shared/lib/registration-draft-notice'
import { RegistrationDraftOverwriteConfirmModal } from '@/features/program/shared/ui/registration/draft-overwrite-confirm-modal'
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { isLocalStorageQuotaExceededError } from '@/features/template/lib/writing-form-template-local-save'

const UJAT_REGISTRATION_MODAL_TITLE = 'UJAT 프로그램 등록'

const DRAFT_SAVE_FAILURE_QUOTA_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'
const DRAFT_SAVE_FAILURE_GENERIC_MESSAGE =
  '임시 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.'

function draftSaveFailureMessage(error: unknown): string {
  return isLocalStorageQuotaExceededError(error)
    ? DRAFT_SAVE_FAILURE_QUOTA_MESSAGE
    : DRAFT_SAVE_FAILURE_GENERIC_MESSAGE
}

export type UjatProgramRegistrationFullpageModalProps = {
  open: boolean
  onClose: () => void
  onProgramRegistrationSaved?: (program: Program) => void
}

export function UjatProgramRegistrationFullpageModal({
  open,
  onClose,
  onProgramRegistrationSaved,
}: UjatProgramRegistrationFullpageModalProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert } = useCmsAlert()

  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const [overwriteTitle, setOverwriteTitle] = useState('')
  const [overwriteSaving, setOverwriteSaving] = useState(false)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)

  // 안내 팝업에서 「이어서 작성」을 명시한 경우만 저장본을 복원한다.
  const skipDraftRestore = shouldSkipRegistrationDraftRestore(
    searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
  )
  const shouldRemoveSavedDraftAfterCompletion =
    shouldRemoveRegistrationDraftAfterCompletion(
      searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    )

  const initialStep = useMemo(() => {
    const raw = searchParams.get(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    return normalizeUjatProgramRegistrationStepKey(raw)
  }, [searchParams])

  const syncStepToUrl = useCallback(
    (step: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, step)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open) return
    if (searchParams.has(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)) return
    const next = new URLSearchParams(searchParams)
    next.set(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
    setSearchParams(next, { replace: true })
  }, [open, searchParams, setSearchParams])

  useEffect(() => {
    if (open) return
    setOverwriteOpen(false)
    setOverwriteTitle('')
    setOverwriteSaving(false)
    setDraftSaveSuccessOpen(false)
  }, [open])

  const flow = useUjatProgramRegistrationFlow(open, {
    initialStep,
    onProgramRegistrationSaved,
    onStepChange: syncStepToUrl,
    skipDraftRestore,
  })

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(UJAT_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    next.delete(REGISTRATION_DRAFT_MODE_QUERY_KEY)
    next.delete('userPreview')
    setSearchParams(next, { replace: true })
    onClose()
  }, [onClose, searchParams, setSearchParams])

  const handlePreview = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.set('userPreview', TEMPLATE_USER_PREVIEW_ACTIVE)
    setSearchParams(next, { replace: false })
    flow.handlePreview()
  }, [flow, searchParams, setSearchParams])

  const runDraftSave = useCallback(async () => {
    try {
      await flow.persistDraftSilent()
      setDraftSaveSuccessOpen(true)
    } catch (error) {
      console.debug('ujatProgramRegistration draft save failed', error)
      showAlert({
        title: '임시 저장 실패',
        content: draftSaveFailureMessage(error),
      })
    }
  }, [flow, showAlert])

  const handleSaveClick = useCallback(() => {
    const templateId = flow.currentStepDef.templateId
    const existing = peekWritingFormDraftOverwrite(templateId, {
      titleFallbackTemplateIds: [PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE],
    })
    if (existing != null) {
      setOverwriteTitle(existing.title)
      setOverwriteOpen(true)
      return
    }
    void runDraftSave()
  }, [flow.currentStepDef.templateId, runDraftSave])

  const handleOverwriteConfirm = useCallback(() => {
    void (async () => {
      setOverwriteSaving(true)
      try {
        await flow.persistDraftSilent()
        setOverwriteOpen(false)
        setDraftSaveSuccessOpen(true)
      } catch (error) {
        console.debug('ujatProgramRegistration draft overwrite save failed', error)
        showAlert({
          title: '임시 저장 실패',
          content: draftSaveFailureMessage(error),
        })
      } finally {
        setOverwriteSaving(false)
      }
    })()
  }, [flow, showAlert])

  const footerActions = useMemo((): TemplateFullpageModalFooterAction[] | undefined => {
    if (flow.phase === 'program') {
      return [
        {
          label: '모집 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('recruitment'),
        },
      ]
    }
    if (flow.phase === 'recruitment') {
      return [
        {
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        },
        {
          label: '신청 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('application'),
        },
      ]
    }
    if (flow.phase === 'application') {
      return [
        {
          label: '모집 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('recruitment'),
        },
        {
          label: '프로그램 등록 완료',
          variant: 'primary',
          showArrow: false,
          disabled: flow.isCompletingRegistration,
          onClick: () => {
            void flow
              .handleCompleteRegistration()
              .then(() => {
                // 모집·신청 초안은 등록 완료 후 항상 제거
                clearUjatRegistrationOperationalFormDrafts()
                if (!shouldRemoveSavedDraftAfterCompletion) return
                clearRegistrationDraftForFreshStart(PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE)
              })
              .catch(error => {
                console.debug('UJAT program registration completion failed', error)
                showAlert({
                  title: '프로그램 등록 실패',
                  content: '입력 내용은 유지됩니다. 잠시 후 다시 시도해 주세요.',
                })
              })
          },
        },
      ]
    }
    return undefined
  }, [flow, shouldRemoveSavedDraftAfterCompletion, showAlert])

  return (
    <>
      <TemplateFullpageModal
        open={open}
        onClose={handleClose}
        title={UJAT_REGISTRATION_MODAL_TITLE}
        titleReadOnly
        templateTabType="writing"
        registrationUserMode
        onPreview={handlePreview}
        onSave={handleSaveClick}
        bodyHeaderLeading={
          <UjatProgramRegistrationBodyHeader
            activeStep={flow.activeStep}
            onSelectStep={flow.selectStep}
          />
        }
        footerActions={flow.isDraftLoading ? undefined : footerActions}
        leftContent={flow.isDraftLoading ? <FormDraftLoading /> : flow.panels.leftContent}
        rightNavigation={flow.isDraftLoading ? null : flow.panels.rightNavigation}
      />
      <RegistrationDraftOverwriteConfirmModal
        open={overwriteOpen}
        draftTitle={overwriteTitle}
        confirmLoading={overwriteSaving}
        onCancel={() => {
          if (overwriteSaving) return
          setOverwriteOpen(false)
        }}
        onConfirm={handleOverwriteConfirm}
      />
      <RegistrationDraftSaveSuccessModal
        open={draftSaveSuccessOpen}
        onConfirm={() => setDraftSaveSuccessOpen(false)}
      />
    </>
  )
}
