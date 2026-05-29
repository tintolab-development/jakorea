import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui/cms-button'
import './ujat-survey-poll-results.css'

export type UjatSurveyRegisteredActionsSurvey = {
  status: 'before_start' | 'in_progress' | 'finished'
  responseCount: number
  participantTotal: number
}

type UjatSurveyRegisteredActionsProps = {
  survey: UjatSurveyRegisteredActionsSurvey
  onShareClick: () => void
  onAddClick: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick?: () => void
}

function canDownloadSurveyResults(survey: UjatSurveyRegisteredActionsSurvey): boolean {
  return survey.status === 'finished' || survey.responseCount >= survey.participantTotal
}

export function UjatSurveyRegisteredActions({
  survey,
  onShareClick,
  onAddClick,
  onOpenTemplatePreview,
  onDownloadClick,
}: UjatSurveyRegisteredActionsProps) {
  const hasResponses = survey.responseCount > 0
  const downloadEnabled = canDownloadSurveyResults(survey)

  if (!hasResponses) {
    return (
      <div className="ujat-survey-registered-actions">
        <CmsButton
          className="ujat-survey-registered-actions__share-button"
          width={160}
          onClick={onShareClick}
        >
          설문조사 공유
        </CmsButton>
        <CmsButton
          className="ujat-survey-registered-actions__add-button"
          width={160}
          onClick={onAddClick}
        >
          설문조사 추가
        </CmsButton>
      </div>
    )
  }

  return (
    <div className="ujat-survey-registered-actions">
      <CmsButton
        className="ujat-survey-registered-actions__download-button"
        variant="secondary"
        size="large"
        icon={<DownloadOutlined />}
        disabled={!downloadEnabled}
        onClick={onDownloadClick}
      >
        설문조사 결과 다운로드
      </CmsButton>
      <CmsButton
        className="ujat-survey-registered-actions__preview-button"
        variant="secondary"
        size="large"
        onClick={onOpenTemplatePreview}
      >
        설문 양식 보기
      </CmsButton>
      <CmsButton
        className="ujat-survey-registered-actions__share-button"
        width={160}
        onClick={onShareClick}
      >
        설문조사 공유
      </CmsButton>
      <CmsButton
        className="ujat-survey-registered-actions__add-button"
        width={160}
        onClick={onAddClick}
      >
        설문조사 추가
      </CmsButton>
    </div>
  )
}

export { canDownloadSurveyResults }
