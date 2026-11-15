import { useId, useState } from 'react'
import { PFAlertModal, PFButton, PFModal, PFText, PFTextInput } from '@/shared/ui'
import type { ProgramApplicationType } from '@/features/mypage/education/applications/api/types'
import {
  useApplicationScheduleAttendanceQuery,
  useSubmitApplicationScheduleCheckIn,
} from '@/features/mypage/education/applications/api/activity-hooks'
import { VolunteerAssignmentPanelSkeleton } from '@/features/mypage/shared/ui'
import type { EducationScheduleItem } from '@/features/mypage/education/schedules/model/types'
import { formatDisplayDateTime } from '@/shared/lib/format-display-date'
import type { PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import { resolvePlatformErrorAlert } from '@/shared/lib/platform-error-alert'
import {
  resolveScheduleAttendanceQueryErrorMessage,
  resolveScheduleCheckInErrorMessage,
  SCHEDULE_CHECK_IN_FAILED_MESSAGE,
} from '../lib/history'
import { joinSchedulePlaceLabel } from '../lib/map-attendance'
import styles from './check-in-modal.module.css'

type UjatCheckInModalProps = {
  open: boolean
  item: EducationScheduleItem | null
  applicationType: ProgramApplicationType | null | undefined
  applicationId: string | null | undefined
  onClose: () => void
}

export function UjatCheckInModal({
  open,
  item,
  applicationType,
  applicationId,
  onClose,
}: UjatCheckInModalProps) {
  const descriptionId = useId()
  const scheduleId = item?.scheduleId ?? null
  const query = useApplicationScheduleAttendanceQuery(applicationType, applicationId, scheduleId, {
    enabled: open && scheduleId != null,
  })
  const checkInMutation = useSubmitApplicationScheduleCheckIn(applicationType, applicationId)
  /** 출석 실패 — 시안 「처리 실패 / 처리 제한 / 네트워크 오류」 팝업, 코드별 안내는 설명에 */
  const [errorAlert, setErrorAlert] = useState<PlatformAlertCopy | null>(null)
  const sessionTime =
    item?.progressTimeLabel?.trim() ||
    formatDisplayDateTime(item?.heldAt) ||
    '-'
  const assignedPlace = joinSchedulePlaceLabel(
    query.data?.organizationName ?? query.data?.locationName ?? item?.locationName,
    query.data?.classLabel ?? item?.classLabel,
  )
  const canSubmit =
    scheduleId != null &&
    !query.isLoading &&
    !query.isError &&
    query.data?.canCheckIn !== false &&
    !checkInMutation.isPending

  return (
    <PFModal
      // Figma 11005:342147 우상단 닫기(X) — 제출 중에는 닫지 못하게 숨긴다
      showCloseButton={!checkInMutation.isPending}
      open={open}
      onClose={onClose}
      title="출석하기"
      size="md"
      ariaDescribedBy={descriptionId}
      // 안내 팝업이 열려 있으면 Escape는 팝업만 닫는다
      closeOnEscape={!checkInMutation.isPending && errorAlert == null}
    >
      <div className={styles.body}>
        <div id={descriptionId} className={styles.description}>
          <PFText as="p" typo="bd-md-rg" color="neutral-warm-600">
            지정된 모집 장소에 도착 후 출석을 확인해 주세요. 수업시간 30분 전까지 모집 장소에
            도착해야 하며, 이후 출석 건은 지각 처리됩니다.
          </PFText>
        </div>
        {query.isLoading ? (
          <VolunteerAssignmentPanelSkeleton statusMessage="출석 정보를 불러오는 중입니다." />
        ) : query.isError ? (
          <>
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {resolveScheduleAttendanceQueryErrorMessage(query.error)}
            </PFText>
            <PFButton type="button" variant="tertiary" size="large" onClick={() => void query.refetch()}>
              다시 시도
            </PFButton>
          </>
        ) : (
          <div className={styles.fields}>
            <PFTextInput size="xlarge" label="수업 시간" value={sessionTime} disabled />
            <PFTextInput size="xlarge" label="배정 기관 및 학급" value={assignedPlace} disabled />
          </div>
        )}
        <div className={styles.actions}>
          <PFButton
            type="button"
            variant="secondary"
            size="xlarge"
            disabled={checkInMutation.isPending}
            onClick={onClose}
          >
            취소
          </PFButton>
          <PFButton
            type="button"
            variant="primary"
            size="xlarge"
            disabled={!canSubmit}
            onClick={() => {
              if (scheduleId == null || !canSubmit) return
              checkInMutation.mutate(scheduleId, {
                onSuccess: onClose,
                onError: error =>
                  setErrorAlert(
                    resolvePlatformErrorAlert(error, {
                      serverMessage: e => {
                        const message = resolveScheduleCheckInErrorMessage(e)
                        return message === SCHEDULE_CHECK_IN_FAILED_MESSAGE ? '' : message
                      },
                    }),
                  ),
              })
            }}
          >
            {checkInMutation.isPending ? '출석 중…' : '출석'}
          </PFButton>
        </div>
      </div>
      <PFAlertModal
        open={errorAlert != null}
        title={errorAlert?.title ?? ''}
        description={errorAlert?.description}
        onConfirm={() => setErrorAlert(null)}
      />
    </PFModal>
  )
}
