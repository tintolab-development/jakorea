import type { RefObject } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type {
  RegisteredSurvey,
  SurveyAudienceTab,
  SurveyProgressStatus,
  SurveyPollRawResponse,
  SurveyResultQuestionSummary,
} from '../../lib/survey-management/survey-management-types'
import type { SurveyActionLabels, SurveyEmptyCopy, SurveyNoResponseCopy } from '../../lib/survey-management/survey-copy'
import { SurveyEmptyState } from './survey-empty-state'
import { SurveyNoResponseState } from './survey-no-response-state'
import { SurveyPollResultsView } from './survey-poll-results-view'
import { SurveyRegisteredActions } from './survey-registered-actions'

export type SatisfactionSurveyViewProps<TKey extends string> = {
  surveysByAudience: Partial<Record<TKey, RegisteredSurvey>>
  activeAudience: TKey
  audienceTabs: ReadonlyArray<SurveyAudienceTab<TKey>>
  className?: string
  emptyCopy: SurveyEmptyCopy
  noResponseCopy: SurveyNoResponseCopy
  actionLabels: SurveyActionLabels
  showAudienceTabs?: boolean
  showShareButton?: boolean
  onAudienceChange: (audience: TKey) => void
  onRegisterClick: () => void
  onShareClick: () => void
  onDeleteClick: () => void
  onOpenTemplatePreview: () => void
  onDownloadClick: () => void
  downloadEnabled?: boolean
  scheduleTabs?: ReadonlyArray<{ key: string; label: string }>
  activeScheduleKey?: string
  onScheduleTabChange?: (key: string) => void
  resultsExportRef?: RefObject<HTMLDivElement | null>
  resultsResponses?: SurveyPollRawResponse[]
  /** 결과 집계 기준 게시 version (remote 바인딩) */
  resultsTemplateVersionId?: number
  /** summary API 행 (remote) — `null`이면 로딩 중 */
  resultsQuestionSummaries?: SurveyResultQuestionSummary[] | null
  /** 미등록 상태에서도 탭 줄 오른쪽에 공유 버튼 노출 (일반 시안 1141:267527) */
  showShareButtonWhenEmpty?: boolean
  /** 진행 전 본문 제목 — 생략 시 `noResponseCopy.title` → 「{대상}용 만족도조사는 아직 진행 전입니다.」 */
  noResponseTitle?: string
  /** 진행 전 본문 「설문 양식 보기」 — 상단에 같은 버튼이 있으면 false. 기본 true */
  showNoResponsePreviewButton?: boolean
  /** 진행 전 본문 삭제 버튼 — 전체 일정(합산) 선택처럼 삭제 대상이 하나가 아닐 때 false. 기본 true */
  showNoResponseDeleteButton?: boolean
  /** 상단 버튼(다운로드·양식 보기·공유) 노출 판단용 상태 — 생략 시 선택 설문 상태 */
  headerActionsStatus?: SurveyProgressStatus
  /** 결과 요약 진행 상태 뱃지 노출 */
  showResultsStatusBadge?: boolean
}

export function SatisfactionSurveyView<TKey extends string>({
  surveysByAudience,
  activeAudience,
  audienceTabs,
  className,
  emptyCopy,
  noResponseCopy,
  actionLabels,
  showAudienceTabs = true,
  showShareButton = true,
  onAudienceChange,
  onRegisterClick,
  onShareClick,
  onDeleteClick,
  onOpenTemplatePreview,
  onDownloadClick,
  downloadEnabled = true,
  scheduleTabs,
  activeScheduleKey,
  onScheduleTabChange,
  resultsExportRef,
  resultsResponses,
  resultsTemplateVersionId,
  resultsQuestionSummaries,
  showShareButtonWhenEmpty = false,
  noResponseTitle,
  showNoResponsePreviewButton = true,
  showNoResponseDeleteButton = true,
  headerActionsStatus,
  showResultsStatusBadge = false,
}: SatisfactionSurveyViewProps<TKey>) {
  const activeSurvey = surveysByAudience[activeAudience]
  const rootClassName = [
    'program-detail-fullpage-modal__info-tab',
    activeSurvey == null
      ? 'survey-management-satisfaction'
      : 'survey-management-registered survey-management-satisfaction',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const trailingActions =
    activeSurvey != null ? (
      <SurveyRegisteredActions
        survey={
          headerActionsStatus != null
            ? { ...activeSurvey, status: headerActionsStatus }
            : activeSurvey
        }
        labels={actionLabels}
        layout="satisfaction"
        showAddButton={false}
        showShareButton={showShareButton}
        onShareClick={onShareClick}
        onOpenTemplatePreview={onOpenTemplatePreview}
        onDownloadClick={onDownloadClick}
        downloadEnabled={downloadEnabled}
      />
    ) : showShareButtonWhenEmpty && showShareButton ? (
      <div className="survey-management-registered-actions survey-management-registered-actions--satisfaction">
        <CmsButton
          className="survey-management-registered-actions__share-button"
          onClick={onShareClick}
        >
          {actionLabels.share}
        </CmsButton>
      </div>
    ) : null

  const audienceTabRow = showAudienceTabs ? (
    <CmsTextTabs
      className="survey-management-registered__tabs"
      variant="list"
      activeKey={activeAudience}
      onChange={key => onAudienceChange(key as TKey)}
      items={audienceTabs.map(tab => ({ key: tab.key, label: tab.label }))}
      trailing={trailingActions}
    />
  ) : activeSurvey != null ? (
    <div className="survey-management-registered__tabs">{trailingActions}</div>
  ) : null

  if (activeSurvey == null) {
    return (
      <div className={rootClassName}>
        {showAudienceTabs ? (
          audienceTabRow
        ) : showShareButtonWhenEmpty && trailingActions != null ? (
          // 대상 탭 없는 화면(1사1교 시안 16268:600810) — 등록 전에도 우측 상단 「만족도조사 공유」
          <div className="survey-management-registered__tabs">{trailingActions}</div>
        ) : null}
        <SurveyEmptyState
          title={emptyCopy.title}
          description={emptyCopy.description}
          secondaryDescription={emptyCopy.secondaryDescription}
          registerButtonLabel={emptyCopy.registerButton}
          embedded
          onRegisterClick={onRegisterClick}
        />
      </div>
    )
  }

  const activeAudienceLabel =
    audienceTabs.find(tab => tab.key === activeAudience)?.label ?? '참여자'

  return (
    <div className={rootClassName}>
      {audienceTabRow}
      <div className="survey-management-satisfaction__body">
        {scheduleTabs != null && scheduleTabs.length > 1 && onScheduleTabChange != null ? (
          <CmsSelect
            className="survey-management-satisfaction__schedule-select survey-management-satisfaction__schedule-select--inline"
            width={240}
            withAllOption={false}
            allowClear={false}
            options={scheduleTabs.map(tab => ({ label: tab.label, value: tab.key }))}
            value={activeScheduleKey ?? scheduleTabs[0]?.key}
            onChange={value => onScheduleTabChange(String(value ?? ''))}
          />
        ) : null}
        {activeSurvey.status === 'before_start' ? (
          <SurveyNoResponseState
            title={
              noResponseTitle ??
              noResponseCopy.title ??
              `${activeAudienceLabel}용 만족도조사는 아직 진행 전입니다.`
            }
            description={noResponseCopy.description}
            deleteButtonLabel={noResponseCopy.deleteButton}
            previewButtonLabel={noResponseCopy.previewButton}
            canDelete={activeSurvey.status === 'before_start'}
            showPreviewButton={showNoResponsePreviewButton}
            showDeleteButton={showNoResponseDeleteButton}
            embedded
            onDeleteClick={onDeleteClick}
            onOpenTemplatePreview={onOpenTemplatePreview}
          />
        ) : (
          <div ref={resultsExportRef}>
            <SurveyPollResultsView
              templateId={activeSurvey.templateId}
              templateVersionId={resultsTemplateVersionId}
              responseCount={activeSurvey.responseCount}
              participantTotal={activeSurvey.participantTotal}
              responses={resultsResponses}
              questionSummaries={resultsQuestionSummaries}
              pdfTitle="만족도조사 결과"
              {...(showResultsStatusBadge ? { statusBadge: activeSurvey.status } : {})}
            />
          </div>
        )}
      </div>
    </div>
  )
}
