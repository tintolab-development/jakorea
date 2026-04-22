import { useEffect, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ContentModal } from '@/shared/ui/content-modal'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import './instructor-permission-approve-modal.css'

export type InstructorPermissionApproveNotifyTiming = 'immediate' | 'manual'

export interface InstructorPermissionApprovePayload {
  feeGrade: string
  notifyTiming: InstructorPermissionApproveNotifyTiming
}

export type PermissionApproveModalKind = 'instructor' | 'admin'

type InstructorPermissionApproveModalBaseProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: InstructorPermissionApprovePayload) => void
  zIndex?: number
  /** 기본값 instructor — admin 시 문구만 관리자 권한 기준으로 표시 */
  permissionKind?: PermissionApproveModalKind
}

export type InstructorPermissionApproveModalProps =
  | (InstructorPermissionApproveModalBaseProps & {
      variant: 'single'
      userDisplayName: string
    })
  | (InstructorPermissionApproveModalBaseProps & {
      variant: 'bulk'
      memberCount: number
    })

export function InstructorPermissionApproveModal(
  props: InstructorPermissionApproveModalProps
) {
  const { open, onCancel, onConfirm, zIndex, variant, permissionKind = 'instructor' } = props
  const isAdmin = permissionKind === 'admin'
  const [feeGrade, setFeeGrade] = useState<string | undefined>(undefined)
  const [feeGradeError, setFeeGradeError] = useState('')
  const [notifyTiming, setNotifyTiming] =
    useState<InstructorPermissionApproveNotifyTiming>('immediate')

  useEffect(() => {
    if (!open) return
    setFeeGrade(isAdmin ? 'manager' : undefined)
    setFeeGradeError('')
    setNotifyTiming('immediate')
  }, [open, isAdmin])

  const displayName =
    variant === 'single' ? (props.userDisplayName.trim() || '회원') : null
  const memberCount = variant === 'bulk' ? props.memberCount : 0

  const handleConfirm = () => {
    const grade = feeGrade?.trim()
    if (!grade) {
      setFeeGradeError(isAdmin ? '권한 유형을 선택해 주세요.' : '강사비 등급을 선택해 주세요.')
      return
    }
    setFeeGradeError('')
    onConfirm({ feeGrade: grade, notifyTiming })
  }

  const title =
    variant === 'bulk'
      ? isAdmin
        ? '관리자 권한 일괄 승인'
        : '강사 권한 일괄 승인'
      : isAdmin
        ? '관리자 권한 승인'
        : '강사 권한 승인'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={520}
      className="instructor-permission-approve-modal"
      zIndex={zIndex}
      footer={
        <div className="instructor-permission-approve-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="medium" type="button" onClick={handleConfirm}>
            권한 승인
          </CmsButton>
        </div>
      }
    >
      <div className="instructor-permission-approve-modal__content">
        <p className="instructor-permission-approve-modal__lead">
          {variant === 'single' ? (
            <>
              <strong>[{displayName}]</strong> 님의 {isAdmin ? '관리자' : '강사'} 권한 요청을 승인하시겠습니까?
            </>
          ) : (
            <>
              선택한 <strong>{memberCount}명의 회원</strong>의 {isAdmin ? '관리자' : '강사'} 권한 요청을
              승인하시겠습니까?
            </>
          )}
        </p>
        <p className="instructor-permission-approve-modal__sub">
          {isAdmin
            ? '해당 사용자에게 부여할 권한 유형을 선택해 주세요.'
            : '승인 시 해당 사용자는 강사로 활동이 가능합니다.'}
        </p>

        <div className="instructor-permission-approve-modal__field">
          <span className="instructor-permission-approve-modal__label">{isAdmin ? '권한 설정' : '강사비 등급 지정'}</span>
          {isAdmin ? (
            <CmsRadio.Group
              size="large"
              value={feeGrade}
              onChange={e => {
                setFeeGrade(e.target.value as AdminPermissionTagVariant)
                if (feeGradeError) setFeeGradeError('')
              }}
            >
              <CmsRadio value="manager">{ADMIN_PERMISSION_TAG_LABEL.manager}</CmsRadio>
              <CmsRadio value="partner">{ADMIN_PERMISSION_TAG_LABEL.partner}(PM/파트너)</CmsRadio>
              <CmsRadio value="viewer">{ADMIN_PERMISSION_TAG_LABEL.viewer}</CmsRadio>
            </CmsRadio.Group>
          ) : (
            <CmsSelect
              inputSize="large"
              width="100%"
              placeholder="강사비 등급을 선택해 주세요"
              allowClear
              value={feeGrade}
              onChange={v => {
                setFeeGrade(v as string | undefined)
                if (feeGradeError) setFeeGradeError('')
              }}
              options={INSTRUCTOR_FEE_GRADE_OPTIONS}
            />
          )}
          {feeGradeError ? (
            <span className="instructor-permission-approve-modal__field-error" role="alert">
              {feeGradeError}
            </span>
          ) : null}
        </div>

        <div className="instructor-permission-approve-modal__field">
          <span className="instructor-permission-approve-modal__label">알림 발송</span>
          <CmsRadio.Group
            size="large"
            value={notifyTiming}
            onChange={e =>
              setNotifyTiming(e.target.value as InstructorPermissionApproveNotifyTiming)
            }
          >
            <CmsRadio value="immediate">즉시</CmsRadio>
            <CmsRadio value="manual">직접 설정</CmsRadio>
          </CmsRadio.Group>
        </div>
      </div>
    </ContentModal>
  )
}
