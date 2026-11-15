import { useEffect, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ContentModal } from '@/shared/ui/content-modal'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  getDefaultManualNotifyAt,
  isFutureNotificationTime,
} from '@/shared/lib/notification-schedule'
import { formatYmdHmWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/features/program/shared/model/program-wage-info'
import {
  ADMIN_PERMISSION_SELECT_OPTIONS,
} from '@/features/user/shared/lib/admin-permission-display'
import { toInstructorRoleReviewScheduledAt } from '@/features/user/permission-management/lib/instructor-role-review-notify'
import './instructor-permission-approve-modal.css'

export type InstructorPermissionApproveNotifyTiming = 'immediate' | 'manual'

export interface InstructorPermissionApprovePayload {
  feeGrade: string
  notifyTiming: InstructorPermissionApproveNotifyTiming
  /** 직접 설정일 때만 ISO. 즉시 발송이면 생략 */
  scheduledAt?: string
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
      /** 강사 일괄 승인 — 대표(첫) 회원명 `[이름] 님 외 N명` */
      userDisplayName?: string
    })

export function InstructorPermissionApproveModal(
  props: InstructorPermissionApproveModalProps
) {
  const { open, onCancel, onConfirm, zIndex, variant, permissionKind = 'instructor' } = props
  const { showAlert } = useCmsAlert()
  const isAdmin = permissionKind === 'admin'
  const [feeGrade, setFeeGrade] = useState<string | undefined>(undefined)
  const [notifyTiming, setNotifyTiming] =
    useState<InstructorPermissionApproveNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setFeeGrade(undefined)
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
  }, [open, isAdmin])

  const displayName =
    variant === 'single' ? (props.userDisplayName.trim() || '회원') : null
  const memberCount = variant === 'bulk' ? props.memberCount : 0
  const bulkLeadName = variant === 'bulk' ? (props.userDisplayName ?? '').trim() || '회원' : null
  const bulkOthersCount = Math.max(memberCount - 1, 0)

  const handleNotifyTimingChange = (next: InstructorPermissionApproveNotifyTiming) => {
    setNotifyTiming(next)
    if (next === 'manual') {
      setManualNotifyAt(getDefaultManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  const handleConfirm = () => {
    const grade = feeGrade?.trim()
    if (!grade) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    if (notifyTiming === 'manual' && !manualNotifyAt) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    if (notifyTiming === 'manual' && !isFutureNotificationTime(manualNotifyAt)) {
      showAlert({
        title: '알림 발송 일시 확인',
        content: '현재 시각보다 최소 1분 이후의 시간을 선택해 주세요.',
      })
      return
    }
    onConfirm({
      feeGrade: grade,
      notifyTiming,
      scheduledAt: toInstructorRoleReviewScheduledAt(notifyTiming, manualNotifyAt),
    })
  }

  const title =
    variant === 'bulk'
      ? isAdmin
        ? '관리자 권한 일괄 승인 안내'
        : '강사 권한 일괄 승인 안내'
      : isAdmin
        ? '관리자 권한 승인 안내'
        : '강사 권한 승인 안내'

  return (
    <>
      <ContentModal
      open={open}
      onCancel={onCancel}
      title={title}
      width={600}
      className="instructor-permission-approve-modal"
      zIndex={zIndex}
      footer={
        <div className="instructor-permission-approve-modal__footer">
          <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" size="medium" type="button" onClick={handleConfirm}>
            승인
          </CmsButton>
        </div>
      }
    >
      <div ref={modalContentRef} className="instructor-permission-approve-modal__content">
        <p className="instructor-permission-approve-modal__lead">
          {variant === 'single' ? (
            <>
              <strong>[{displayName}]</strong> 님의 {isAdmin ? '관리자' : '강사'} 권한 요청을 승인하시겠습니까?
            </>
          ) : isAdmin ? (
            <>
              선택한 <strong>{memberCount}명의 회원</strong>의 관리자 권한 요청을 승인하시겠습니까?
            </>
          ) : (
            <>
              <strong>
                [{bulkLeadName}] 님 외 {bulkOthersCount}명
              </strong>
              의 강사 권한 요청을 승인하시겠습니까?
            </>
          )}
        </p>
        <p className="instructor-permission-approve-modal__sub">
          {isAdmin
            ? '해당 회원에게 부여할 권한 유형을 선택해 주세요'
            : '승인 시 해당 회원은 강사로 활동이 가능합니다.'}
        </p>

        <div className="instructor-permission-approve-modal__field">
          <span className="instructor-permission-approve-modal__label">
            {isAdmin ? '권한 설정' : '강사비 등급 지정'}
            <span className="instructor-permission-approve-modal__required" aria-hidden="true">
              *
            </span>
          </span>
          {isAdmin ? (
            <CmsSelect
              inputSize="medium"
              width="100%"
              placeholder="관리자 권한을 선택해 주세요"
              value={feeGrade}
              onChange={v => {
                setFeeGrade(typeof v === 'string' ? v : undefined)
              }}
              options={ADMIN_PERMISSION_SELECT_OPTIONS}
            />
          ) : (
            <CmsSelect
              inputSize="medium"
              width="100%"
              placeholder="강사비 등급을 선택해 주세요"
              value={feeGrade}
              onChange={v => setFeeGrade(v as string | undefined)}
              options={INSTRUCTOR_FEE_GRADE_OPTIONS}
            />
          )}
        </div>

        <div className="instructor-permission-approve-modal__field">
          <span className="instructor-permission-approve-modal__label">
            알림 발송
            <span className="instructor-permission-approve-modal__required" aria-hidden="true">
              *
            </span>
          </span>
          <CmsRadio.Group
            size="medium"
            value={notifyTiming}
            onChange={e =>
              handleNotifyTimingChange(e.target.value as InstructorPermissionApproveNotifyTiming)
            }
          >
            <CmsRadio value="immediate">즉시</CmsRadio>
            <span ref={manualRadioAnchorRef} className="instructor-permission-approve-modal__manual-anchor">
              <CmsRadio
                value="manual"
                onClick={() => {
                  if (notifyTiming === 'manual') {
                    setManualNotifyAt(prev => prev ?? getDefaultManualNotifyAt())
                    setDateTimePickerOpen(true)
                  }
                }}
              >
                직접 설정
                {notifyTiming === 'manual' && manualNotifyAt != null ? (
                  <span className="instructor-permission-approve-modal__manual-summary">
                    {' '}
                    ({formatYmdHmWithKoreanWeekday(manualNotifyAt)})
                  </span>
                ) : null}
              </CmsRadio>
            </span>
          </CmsRadio.Group>
        </div>
      </div>
      </ContentModal>
      <DateTimePickerPopover
        open={open && notifyTiming === 'manual' && dateTimePickerOpen}
        onClose={() => setDateTimePickerOpen(false)}
        anchorRef={manualRadioAnchorRef}
        dismissExcludeRef={modalContentRef}
        value={manualNotifyAt ?? getDefaultManualNotifyAt()}
        onChange={setManualNotifyAt}
        onApply={value => {
          setManualNotifyAt(value)
          setDateTimePickerOpen(false)
        }}
        zIndex={(zIndex ?? 2500) + 100}
      />
    </>
  )
}
