import { useState, type ReactNode } from 'react'
import { Tooltip } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { CmsButton } from '@/shared/ui'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { Program } from '@/types/domain'
import {
  BUSINESS_PERIOD_EXTEND_BUTTON_LABEL,
  BUSINESS_PERIOD_EXTEND_DISABLED_EDIT_TOOLTIP,
  canShowBusinessPeriodExtendButton,
  isBusinessPeriodExtendUiEnabled,
  isProgramBusinessPeriodEnded,
} from '@/features/program/shared/lib/business-period-extend'
import { invalidateProgramAdminDetailQueries } from '@/features/program/shared/lib/invalidate-program-detail-queries'
import { BusinessPeriodExtendModal } from '@/features/program/shared/ui/business-period-extend-modal'
import './business-period-extend-toolbar.css'

export interface BusinessPeriodExtendToolbarProps {
  program: Program
  editDisabled?: boolean
  children: ReactNode
}

export function BusinessPeriodExtendToolbar({
  program,
  editDisabled = false,
  children,
}: BusinessPeriodExtendToolbarProps) {
  const queryClient = useQueryClient()
  const user = useAuthStore(state => state.user)
  const [open, setOpen] = useState(false)
  const periodEnded = isProgramBusinessPeriodEnded(program.endDate)
  const showExtend = canShowBusinessPeriodExtendButton(program, user)
  const wrapDisabledEdit = Boolean(editDisabled && periodEnded)

  const editControl = wrapDisabledEdit ? (
    <Tooltip title={BUSINESS_PERIOD_EXTEND_DISABLED_EDIT_TOOLTIP}>
      <span className="business-period-extend-toolbar__disabled-wrap">{children}</span>
    </Tooltip>
  ) : (
    children
  )

  if (!isBusinessPeriodExtendUiEnabled()) {
    return editControl
  }

  return (
    <>
      <div className="business-period-extend-toolbar">
        {editControl}
        {showExtend ? (
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            className="cms-button--toolbar-auto"
            onClick={() => setOpen(true)}
          >
            {BUSINESS_PERIOD_EXTEND_BUTTON_LABEL}
          </CmsButton>
        ) : null}
      </div>
      <BusinessPeriodExtendModal
        open={open}
        programId={program.id}
        currentEndDate={program.endDate}
        onCancel={() => setOpen(false)}
        onSuccess={() => invalidateProgramAdminDetailQueries(queryClient, program.id)}
      />
    </>
  )
}
