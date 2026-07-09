import { useCallback, useEffect, useMemo } from 'react'
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

const GENERAL_REGISTRATION_MODAL_TITLE = '일반 프로그램 등록'
const COMPANY_SCHOOL_REGISTRATION_MODAL_TITLE = '1사1교 프로그램 등록'
const TRAINED_TEACHERS_REGISTRATION_MODAL_TITLE = '교육받은 교사 프로그램 등록'

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

  const flow = useGeneralProgramRegistrationFlow(open, {
    initialStep,
    onProgramRegistrationSaved,
    onStepChange: syncStepToUrl,
    registrationFormVariant,
  })

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(searchParams)
    next.delete(GENERAL_PROGRAM_REGISTRATION_FLOW_QUERY_KEY)
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
      onSave={flow.handleSave}
      bodyHeaderLeading={
        <GeneralProgramRegistrationBodyHeader
          activeStep={flow.activeStep}
          visibleRecruitTabKeys={flow.visibleRecruitTabKeys}
          visibleApplicationTabKeys={flow.visibleApplicationTabKeys}
          onSelectStep={flow.selectStep}
        />
      }
      footerActions={footerActions}
      leftContent={flow.panels.leftContent}
      rightNavigation={flow.panels.rightNavigation}
    />
  )
}
