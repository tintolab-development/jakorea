import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCmsAlert, CmsButton } from '@/shared/ui'
import { formatDateTimeDot } from '@/shared/lib/format-display'
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'
import {
  findNotificationForApplication,
  formatNotificationErrorMessage,
  getNotificationStatusLabel,
  getNotificationTypeLabel,
  getPublicApplicationDetailPath,
  canRetryNotification,
} from '../lib/mappings'
import type { PublicApplicationNotificationType } from '../model/types'
import {
  usePublicApplicationNotifications,
  useRetryPublicApplicationNotification,
} from '../api/hooks'
import './status-panel.css'

type Props = {
  open: boolean
  notificationType: PublicApplicationNotificationType
  aggregateId: string
}

function statusClassName(status: string): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function limitedErrorMessage(value: string | null): string {
  const message = value?.trim() ?? ''
  if (!message) return '-'
  return message.length > 300 ? `${message.slice(0, 300)}…` : message
}

export function PublicApplicationNotificationStatusPanel({
  open,
  notificationType,
  aggregateId,
}: Props) {
  const { showAlert } = useCmsAlert()
  const remoteEnabled = shouldUseHomepageRemoteApi()
  const query = usePublicApplicationNotifications(open)
  const retryMutation = useRetryPublicApplicationNotification()

  const notification = useMemo(
    () => findNotificationForApplication(query.data, notificationType, aggregateId),
    [aggregateId, notificationType, query.data]
  )
  const displayedNotification =
    retryMutation.data &&
    retryMutation.data.notificationType === notificationType &&
    String(retryMutation.data.aggregateId) === aggregateId
      ? retryMutation.data
      : notification

  const handleRetry = async () => {
    if (!displayedNotification || !canRetryNotification(displayedNotification.status)) return
    try {
      await retryMutation.mutateAsync(displayedNotification.id)
      await query.refetch()
    } catch (error) {
      showAlert(formatNotificationErrorMessage(error))
    }
  }

  return (
    <section
      className="public-application-notification-panel"
      aria-labelledby={`public-application-notification-${aggregateId}`}
    >
      <div className="public-application-notification-panel__header">
        <h3
          id={`public-application-notification-${aggregateId}`}
          className="public-application-notification-panel__title"
        >
          공개 접수 이메일 알림
        </h3>
        <span className="public-application-notification-panel__label">
          {getNotificationTypeLabel(notificationType)}
        </span>
      </div>

      {!remoteEnabled ? (
        <p className="public-application-notification-panel__message">
          원격 관리자 API 연결 후 알림 이력을 조회할 수 있습니다.
        </p>
      ) : query.isLoading ? (
        <p className="public-application-notification-panel__message">
          알림 이력을 불러오는 중입니다.
        </p>
      ) : query.isError ? (
        <div className="public-application-notification-panel__actions">
          <p className="public-application-notification-panel__message">
            {formatNotificationErrorMessage(query.error).content}
          </p>
          <CmsButton
            variant="secondary"
            size="small"
            type="button"
            onClick={() => {
              void query.refetch()
            }}
          >
            다시 조회
          </CmsButton>
        </div>
      ) : !displayedNotification ? (
        <p className="public-application-notification-panel__message">
          해당 신청의 알림 이력이 없습니다.
        </p>
      ) : (
        <>
          <div className="public-application-notification-panel__status-row">
            <span className="public-application-notification-panel__label">상태</span>
            <strong
              className={`public-application-notification-panel__status public-application-notification-panel__status--${statusClassName(displayedNotification.status)}`}
            >
              {getNotificationStatusLabel(displayedNotification.status)}
            </strong>
          </div>
          <dl className="public-application-notification-panel__details">
            <div className="public-application-notification-panel__detail">
              <dt>시도 횟수</dt>
              <dd>{displayedNotification.attempts}</dd>
            </div>
            <div className="public-application-notification-panel__detail">
              <dt>생성일시</dt>
              <dd>{formatDateTimeDot(displayedNotification.createdAt)}</dd>
            </div>
            <div className="public-application-notification-panel__detail">
              <dt>발송 완료일시</dt>
              <dd>{formatDateTimeDot(displayedNotification.sentAt)}</dd>
            </div>
            <div className="public-application-notification-panel__detail">
              <dt>다음 시도일시</dt>
              <dd>{formatDateTimeDot(displayedNotification.nextAttemptAt)}</dd>
            </div>
            {displayedNotification.status === 'FAILED' ? (
              <div className="public-application-notification-panel__detail public-application-notification-panel__error">
                <dt>최근 실패 사유</dt>
                <dd>{limitedErrorMessage(displayedNotification.lastError)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="public-application-notification-panel__actions">
            <Link
              className="public-application-notification-panel__link"
              to={getPublicApplicationDetailPath(notificationType, aggregateId)}
            >
              신청 상세 보기
            </Link>
            {displayedNotification.status === 'FAILED' ? (
              <CmsButton
                variant="secondary"
                size="small"
                type="button"
                loading={retryMutation.isPending}
                disabled={retryMutation.isPending}
                onClick={() => {
                  void handleRetry()
                }}
              >
                재시도
              </CmsButton>
            ) : (
              <CmsButton variant="secondary" size="small" type="button" disabled>
                재시도
              </CmsButton>
            )}
          </div>
        </>
      )}
    </section>
  )
}
