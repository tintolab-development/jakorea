import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'
import { TemplateFullpageModal } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { TemplateFullpageModalFooterAction } from '@/features/template/ui/template-management/template-fullpage-modal'
import type { Program } from '@/types/domain'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import {
  GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY,
  normalizeGeneralProgramRegistrationStepKey,
} from '@/features/program/general/model/registration-flow'
import { useGeneralProgramRegistrationFlow } from '@/features/program/general/hooks/use-registration-flow'
import { GeneralProgramRegistrationBodyHeader } from '@/features/program/general/ui/registration/registration-body-header'
import {
  peekWritingFormDraftOverwrite,
  REGISTRATION_DRAFT_MODE_FRESH,
  REGISTRATION_DRAFT_MODE_QUERY_KEY,
  clearRegistrationDraftForFreshStart,
  type ProgramRegistrationDraftTemplateCode,
} from '@/features/program/shared/lib/registration-draft-notice'
import { RegistrationDraftOverwriteConfirmModal } from '@/features/program/shared/ui/registration/draft-overwrite-confirm-modal'
import { RegistrationDraftSaveSuccessModal } from '@/features/program/shared/ui/registration/draft-save-success-modal'
import { RegistrationCompleteSuccessModal } from '@/features/program/shared/ui/registration/registration-complete-success-modal'
import { FormDraftLoading } from '@/features/template/ui/form-draft-loading'
import { useCmsAlert } from '@/shared/ui'
import { removeWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'

const GENERAL_REGISTRATION_MODAL_TITLE = '일반 프로그램 등록'
const COMPANY_SCHOOL_REGISTRATION_MODAL_TITLE = '1사1교 프로그램 등록'
const TRAINED_TEACHERS_REGISTRATION_MODAL_TITLE = '교육받은 교사 프로그램 등록'

const DRAFT_SAVE_FAILURE_MESSAGE =
  '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'

export type GeneralProgramRegistrationFullpageModalProps = {
  open: boolean
  onClose: () => void
  onProgramRegistrationSaved?: (program?: Program) => void
  registrationFormVariant?: ProgramRegistrationFormVariant
}

export function GeneralProgramRegistrationFullpageModal({
  open,
  onClose,
  onProgramRegistrationSaved,
  registrationFormVariant = 'general',
}: GeneralProgramRegistrationFullpageModalProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showAlert } = useCmsAlert()

  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const [overwriteTitle, setOverwriteTitle] = useState('')
  const [overwriteSaving, setOverwriteSaving] = useState(false)
  const [draftSaveSuccessOpen, setDraftSaveSuccessOpen] = useState(false)
  const [completeSuccessOpen, setCompleteSuccessOpen] = useState(false)
  const pendingCreatedProgramRef = useRef<Program | undefined>(undefined)

  const skipDraftRestore =
    searchParams.get(REGISTRATION_DRAFT_MODE_QUERY_KEY) === REGISTRATION_DRAFT_MODE_FRESH

  const initialStep = useMemo(() => {
    const raw = searchParams.get(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
    return normalizeGeneralProgramRegistrationStepKey(raw)
  }, [searchParams])

  const syncStepToUrl = useCallback(
    (step: string) => {
      const next = new URLSearchParams(searchParams)
      next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, step)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    if (!open) return
    if (searchParams.has(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)) return
    const next = new URLSearchParams(searchParams)
    next.set(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY, 'program')
    setSearchParams(next, { replace: true })
  }, [open, searchParams, setSearchParams])

  useEffect(() => {
    if (open) return
    setOverwriteOpen(false)
    setOverwriteTitle('')
    setOverwriteSaving(false)
    setDraftSaveSuccessOpen(false)
    setCompleteSuccessOpen(false)
    pendingCreatedProgramRef.current = undefined
  }, [open])

  const handleRegistrationCreated = useCallback((program?: Program) => {
    pendingCreatedProgramRef.current = program
    setCompleteSuccessOpen(true)
  }, [])

  const flow = useGeneralProgramRegistrationFlow(open, {
    initialStep,
    onProgramRegistrationSaved: handleRegistrationCreated,
    onStepChange: syncStepToUrl,
    registrationFormVariant,
    skipDraftRestore,
  })

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
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
      console.debug('generalProgramRegistration draft save failed', error)
      showAlert({
        title: '임시 저장 실패',
        content: DRAFT_SAVE_FAILURE_MESSAGE,
      })
    }
  }, [flow, showAlert])

  const handleSaveClick = useCallback(() => {
    const templateId = flow.currentStepDef.templateId
    const existing = peekWritingFormDraftOverwrite(templateId, {
      titleFallbackTemplateIds: [flow.registrationTemplateId],
    })
    if (existing != null) {
      setOverwriteTitle(existing.title)
      setOverwriteOpen(true)
      return
    }
    void runDraftSave()
  }, [flow.currentStepDef.templateId, flow.registrationTemplateId, runDraftSave])

  const handleOverwriteConfirm = useCallback(() => {
    void (async () => {
      setOverwriteSaving(true)
      try {
        await flow.persistDraftSilent()
        setOverwriteOpen(false)
        setDraftSaveSuccessOpen(true)
      } catch (error) {
        console.debug('generalProgramRegistration draft overwrite save failed', error)
        showAlert({
          title: '임시 저장 실패',
          content: DRAFT_SAVE_FAILURE_MESSAGE,
        })
      } finally {
        setOverwriteSaving(false)
      }
    })()
  }, [flow, showAlert])

  const handleCompleteSuccessConfirm = useCallback(() => {
    const created = pendingCreatedProgramRef.current
    pendingCreatedProgramRef.current = undefined
    setCompleteSuccessOpen(false)
    const registrationTemplateCode = flow.registrationTemplateId as ProgramRegistrationDraftTemplateCode
    clearRegistrationDraftForFreshStart(registrationTemplateCode)
    removeWritingFormTemplateSave(flow.currentStepDef.templateId)
    onProgramRegistrationSaved?.(created)
  }, [flow.currentStepDef.templateId, flow.registrationTemplateId, onProgramRegistrationSaved])

  const footerActions = useMemo((): TemplateFullpageModalFooterAction[] | undefined => {
    if (flow.phase === 'program') {
      if (flow.hasRecruitmentPhase) {
        return [
          {
            label: '모집 정보 작성하기',
            variant: 'primary',
            showArrow: true,
            onClick: () => flow.goToPhase('recruitment'),
          },
        ]
      }
      if (flow.hasApplicationPhase) {
        return [
          {
            label: '신청 정보 작성하기',
            variant: 'primary',
            showArrow: true,
            onClick: () => flow.goToPhase('application'),
          },
        ]
      }
      return undefined
    }
    if (flow.phase === 'recruitment') {
      const actions: TemplateFullpageModalFooterAction[] = [
        {
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        },
      ]
      if (flow.hasApplicationPhase) {
        actions.push({
          label: '신청 정보 작성하기',
          variant: 'primary',
          showArrow: true,
          onClick: () => flow.goToPhase('application'),
        })
      }
      return actions
    }
    if (flow.phase === 'application') {
      const actions: TemplateFullpageModalFooterAction[] = []
      if (flow.hasRecruitmentPhase) {
        actions.push({
          label: '모집 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('recruitment'),
        })
      } else {
        actions.push({
          label: '공통 정보 돌아가기',
          variant: 'secondary',
          onClick: () => flow.goToPhase('program'),
        })
      }
      actions.push({
        label: '프로그램 등록 완료',
        variant: 'primary',
        showArrow: false,
        onClick: flow.handleCompleteRegistration,
      })
      return actions
    }
    return undefined
  }, [flow])

  return (
    <>
      <TemplateFullpageModal
        open={open}
        onClose={handleClose}
        title={
          registrationFormVariant === 'economy'
            ? COMPANY_SCHOOL_REGISTRATION_MODAL_TITLE
            : registrationFormVariant === 'trainedTeachers'
              ? TRAINED_TEACHERS_REGISTRATION_MODAL_TITLE
              : GENERAL_REGISTRATION_MODAL_TITLE
        }
        titleReadOnly
        templateTabType="writing"
        registrationUserMode
        onPreview={handlePreview}
        onSave={handleSaveClick}
        bodyHeaderLeading={
          <GeneralProgramRegistrationBodyHeader
            activeStep={flow.activeStep}
            visibleRecruitTabKeys={flow.visibleRecruitTabKeys}
            visibleApplicationTabKeys={flow.visibleApplicationTabKeys}
            onSelectStep={flow.selectStep}
          />
        }
        footerActions={footerActions}
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
      <RegistrationCompleteSuccessModal
        open={completeSuccessOpen}
        onConfirm={handleCompleteSuccessConfirm}
      />
    </>
  )
}
