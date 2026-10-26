import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useCallback, useState } from 'react'
import { Spin } from 'antd'
import type { Program } from '@/types/domain'
import type { SurveyAnswerResponse } from '@/shared/api/generated/dashboard/schemas/surveyAnswerResponse'
import { TealHeaderModal, useCmsAlert } from '@/shared/ui'
import { handleError } from '@/shared/utils/error-handler'
import { fetchGeneralProgramSurveyResponseDetail } from '@/features/program/general/api/admin-general-programs-service'
import type { ParticipatingIndividualSurveyViewKey } from '@/features/program/general/model/participating-individual-participants'
import { useParticipatingIndividualProgressAssignment } from '@/features/program/general/hooks/use-participating-individual-progress-assignment'
import { ParticipatingIndividualProgressAssignmentSessionPanel } from './participating-individual-progress-assignment-session-panel'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './school-detail-attendance-section.css'
import './participating-individual-progress-assignment-section.css'

export function ParticipatingIndividualProgressAssignmentSection({ program }: { program: Program }) {
  const { showAlert } = useCmsAlert()
  const [surveyViewTitle, setSurveyViewTitle] = useState('설문조사 보기')
  const [surveyViewAnswers, setSurveyViewAnswers] = useState<SurveyAnswerResponse[] | null>(null)
  const [surveyViewLoading, setSurveyViewLoading] = useState(false)

  const openSurveyResponseView = useCallback(
    async (title: string, response: ParticipatingIndividualSurveyViewKey) => {
      setSurveyViewAnswers(null)
      setSurveyViewTitle(title)
      setSurveyViewLoading(true)
      try {
        const detail = await fetchGeneralProgramSurveyResponseDetail(
          program.id,
          String(response.templateVersionId),
          String(response.formResponseId)
        )
        if (detail == null) {
          showAlert({ title: '안내', content: '설문 응답을 불러올 수 없습니다.' })
          return
        }
        setSurveyViewAnswers(detail.answers ?? [])
      } catch (error) {
        handleError(error, { context: 'openProgressAssignmentSurveyResponse' })
      } finally {
        setSurveyViewLoading(false)
      }
    },
    [program.id, showAlert]
  )

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
                onViewSurveyResponse={openSurveyResponseView}
                surveyViewLoading={surveyViewLoading}
              />
            ))}
          </div>
        )}
      </FilterTableLayout>
      <TealHeaderModal
        open={surveyViewAnswers != null}
        onCancel={() => setSurveyViewAnswers(null)}
        title={surveyViewTitle}
        size="compact"
      >
        {surveyViewAnswers != null && surveyViewAnswers.length === 0 ? (
          <p className="participating-individual-progress-assignment-section__survey-empty">
            제출된 답변이 없습니다.
          </p>
        ) : (
          <dl className="participating-individual-progress-assignment-section__survey-answers">
            {(surveyViewAnswers ?? []).map((answer, index) => (
              <div
                key={answer.answerId ?? `${answer.questionId ?? index}-${index}`}
                className="participating-individual-progress-assignment-section__survey-row"
              >
                <dt>
                  {answer.questionLabel?.trim() || answer.questionKey?.trim() || `문항 ${index + 1}`}
                </dt>
                <dd>{answer.answerDisplayText?.trim() || answer.answerValueJson?.trim() || '-'}</dd>
              </div>
            ))}
          </dl>
        )}
      </TealHeaderModal>
    </div>
  )
}
