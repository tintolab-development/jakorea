import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import { useCmsAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { useParticipatingIndividualProgressAssignment } from '@/features/program/general/hooks/use-participating-individual-progress-assignment'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { getFormResponseFeedbackRemote } from '@/features/template/api/form-templates-api-client'
import { formResponseQueryKeys } from '@/features/template/api/form-response-query-keys'
import { useCreateFormResponseFeedbackMutation } from '@/features/template/hooks/use-create-form-response-feedback-mutation'
import {
  getFormResponseFeedbackErrorMessage,
  isFormResponseFeedbackStatusConflict,
} from '@/features/template/lib/form-response-feedback-error'
import { resolveFormResponseFeedbackDisplayContent } from '@/features/template/lib/form-response-feedback-list'
import { UjatAssignmentFeedbackModal } from '@/features/program/ujat/ui/detail-modal/progress/assignments/document-viewer/ujat-assignment-feedback-modal'
import { ParticipatingIndividualProgressAssignmentSessionPanel } from './participating-individual-progress-assignment-session-panel'
import type {
  ProgressAssignmentFeedbackTarget,
  ProgressAssignmentSurveyNavTab,
} from './participating-individual-progress-assignment-table'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'
import './participating-individual-progress-assignment-section.css'

export function ParticipatingIndividualProgressAssignmentSection({
  program,
  onNavigateToSurveyCategory,
}: {
  program: Program
  onNavigateToSurveyCategory: (tab: ProgressAssignmentSurveyNavTab) => void
}) {
  const {
    pendingFilters,
    appliedFilters,
    handleFilterChange,
    handleSearch,
    filterFields,
    sessionGroups,
    getSessionParticipants,
    loading,
  } = useParticipatingIndividualProgressAssignment(program)
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const createFeedbackMutation = useCreateFormResponseFeedbackMutation()
  const [feedbackTarget, setFeedbackTarget] = useState<ProgressAssignmentFeedbackTarget | null>(
    null
  )
  const feedbackResponseId = feedbackTarget?.row.assignmentFormResponseId

  // 시안 06-2 피드백 보기 — 보기 모드일 때만 기존 피드백 조회
  const feedbackQuery = useQuery({
    queryKey: formResponseQueryKeys.feedback(Number(feedbackResponseId)),
    queryFn: () => getFormResponseFeedbackRemote(Number(feedbackResponseId)),
    enabled: feedbackTarget?.mode === 'view' && feedbackResponseId != null,
    retry: false,
    staleTime: 15_000,
  })

  const existingFeedback = useMemo(() => {
    if (feedbackTarget?.mode !== 'view') return ''
    if (feedbackQuery.isLoading) return '불러오는 중…'
    if (feedbackQuery.isError) return '피드백을 불러오지 못했습니다.'
    return resolveFormResponseFeedbackDisplayContent(feedbackQuery.data) ?? ''
  }, [feedbackQuery.data, feedbackQuery.isError, feedbackQuery.isLoading, feedbackTarget?.mode])

  const invalidateAssignmentSubmissions = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.assignmentSubmissions(String(program.id)),
      }),
    [program.id, queryClient]
  )

  const closeFeedbackModal = useCallback(() => {
    if (createFeedbackMutation.isPending) return
    setFeedbackTarget(null)
  }, [createFeedbackMutation.isPending])

  // 시안 06-1 피드백 작성 — 회원 상세 과제 제출 내역 모달과 같은 등록 API·오류 문구
  const handleFeedbackSubmit = useCallback(
    async (feedback: string) => {
      const responseId = feedbackTarget?.row.assignmentFormResponseId
      if (responseId == null) {
        showAlert({ title: '안내', content: '피드백을 등록할 과제 응답 정보가 없습니다.' })
        return
      }
      if (createFeedbackMutation.isPending) return
      try {
        await createFeedbackMutation.mutateAsync({ responseId, body: { content: feedback } })
        setFeedbackTarget(null)
        void invalidateAssignmentSubmissions()
        showAlert({
          title: '안내',
          content: '피드백을 등록했습니다. 회원에게 확인 요청 알림이 발송됩니다.',
        })
      } catch (error) {
        handleError(error, { context: 'progressAssignmentSection.createFeedback' })
        if (isFormResponseFeedbackStatusConflict(error)) {
          void invalidateAssignmentSubmissions()
        }
        showAlert({ title: '등록 실패', content: getFormResponseFeedbackErrorMessage(error) })
      }
    },
    [createFeedbackMutation, feedbackTarget, invalidateAssignmentSubmissions, showAlert]
  )

  if (loading) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="participating-individual-progress-assignment-section school-detail-attendance-section">
      <FilterTableLayout
        className="school-detail-attendance-section__filter-layout"
        bordered={false}
        fields={filterFields}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        showFilter
        showTitle={false}
        hideExcelDownload
      >
        {sessionGroups.length === 0 ? (
          <div className="school-detail-attendance-section__empty">조회 결과가 없습니다.</div>
        ) : (
          <div className="school-detail-attendance-section__groups">
            {sessionGroups.map(session => (
              <ParticipatingIndividualProgressAssignmentSessionPanel
                key={session.id}
                session={session}
                appliedFilters={appliedFilters}
                getSessionParticipants={getSessionParticipants}
                onViewSurveyResponse={onNavigateToSurveyCategory}
                onOpenFeedback={setFeedbackTarget}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
      <UjatAssignmentFeedbackModal
        open={feedbackTarget != null}
        onCancel={closeFeedbackModal}
        mode={feedbackTarget?.mode ?? 'write'}
        volunteerName={feedbackTarget?.row.name.trim() || '참여자'}
        docTypeLabel="과제"
        existingFeedback={existingFeedback}
        submitting={createFeedbackMutation.isPending}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  )
}
