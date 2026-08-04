import { Select, Spin } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { getLogsApiErrorMessage } from '@/features/logs/api/admin-logs-service'
import { useSystemIssueDetailQuery } from '@/features/logs/hooks/use-system-issue-detail-query'
import { useUpdateSystemIssueStatus } from '@/features/logs/hooks/use-update-system-issue-status'
import { CmsButton, ContentModal, useCmsAlert } from '@/shared/ui'
import { LogsQueryError } from './logs-query-error'

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'OPEN' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'RESOLVED', label: 'RESOLVED' },
  { value: 'IGNORED', label: 'IGNORED' },
]

interface BugIssueDetailModalProps {
  open: boolean
  issueId: number | null
  onClose: () => void
}

export function BugIssueDetailModal({ open, issueId, onClose }: BugIssueDetailModalProps) {
  const { showAlert } = useCmsAlert()
  const { data, isLoading, isError, error } = useSystemIssueDetailQuery(
    open ? issueId : null,
    open
  )
  const updateStatus = useUpdateSystemIssueStatus()
  const [statusDraft, setStatusDraft] = useState('')

  useEffect(() => {
    if (data?.issueStatus) {
      setStatusDraft(data.issueStatus)
    }
  }, [data?.issueStatus])

  const handleSaveStatus = async () => {
    if (!issueId || !statusDraft.trim()) return
    try {
      await updateStatus.mutateAsync({ issueId, status: statusDraft.trim() })
      showAlert({ title: '저장 완료', content: '이슈 상태가 변경되었습니다.' })
    } catch (e) {
      showAlert({
        title: '저장 실패',
        content: getLogsApiErrorMessage(e, '이슈 상태 변경에 실패했습니다.'),
      })
    }
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="버그/이슈 상세"
      width={800}
      footer={
        <>
          <CmsButton variant="secondary" onClick={onClose}>
            닫기
          </CmsButton>
          <CmsButton
            variant="primary"
            loading={updateStatus.isPending}
            disabled={!data || statusDraft === data.issueStatus}
            onClick={() => void handleSaveStatus()}
          >
            상태 저장
          </CmsButton>
        </>
      }
    >
      {isLoading ? (
        <Spin />
      ) : isError ? (
        <LogsQueryError
          message={getLogsApiErrorMessage(error, '버그/이슈 상세를 불러오지 못했습니다.')}
        />
      ) : data ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <DetailInfoForm title="이슈 상세" hideHeader mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="이슈 ID" view={data.issueId} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="유형" view={data.issueType} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="심각도" view={data.severity} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="화면" view={data.screenKey} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="API 경로" view={data.apiPath} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="메시지" view={data.message} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="요약" view={data.detailSummary} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="발생 일시" view={dayjs(data.createdAt).format('YYYY.MM.DD HH:mm:ss')} />
              </DetailInfoForm.Row>
              {data.resolvedAt && (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field label="해결 일시" view={dayjs(data.resolvedAt).format('YYYY.MM.DD HH:mm:ss')} />
                </DetailInfoForm.Row>
              )}
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="스택트레이스" view={data.stackTraceAvailable ? '있음' : '없음'} />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>상태</span>
            <Select
              style={{ minWidth: 200 }}
              value={statusDraft || undefined}
              options={STATUS_OPTIONS}
              onChange={setStatusDraft}
            />
          </div>
        </>
      ) : (
        <LogsQueryError message="이슈 정보를 찾을 수 없습니다." />
      )}
    </ContentModal>
  )
}
