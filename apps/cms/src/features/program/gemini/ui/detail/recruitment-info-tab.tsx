import dayjs, { type Dayjs } from 'dayjs'
import type { Editor } from '@/shared/rich-text'
import { useCallback, useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import {
  recruitmentProgramProgressModifier,
  resolveRecruitmentAnnouncementDisplayLabel,
  resolveRecruitmentProgramProgressLabel,
} from '../../lib/recruitment/resolve-recruitment-display'
import { formatRecruitmentAuditDate } from '../../lib/recruitment/format-period'
import type { GeminiRecruitmentDetail } from '../../model/recruitment/detail-types'
import type { GeminiRecruitmentInfoEditDraft } from '../../model/recruitment/info-edit-draft'
import { toDateRangeValue } from '../../model/recruitment/info-edit-draft'
import { GeminiRecruitmentInstitutionFields } from '../recruitment/gemini-recruitment-institution-fields'
import { GeminiRecruitmentDetailFields } from '../recruitment/gemini-recruitment-detail-fields'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './recruitment-info-tab.css'

function commitDateRange(
  dates: [Dayjs | null, Dayjs | null] | null,
  onCommit: (start: string, end: string) => void
) {
  const start = dates?.[0]
  const end = dates?.[1]
  if (start == null || end == null) return
  onCommit(start.startOf('day').toISOString(), end.startOf('day').toISOString())
}

export function GeminiRecruitmentInfoTab({
  detail,
  todayKey,
  isEditMode = false,
  draft = null,
  onDraftChange,
  editor = null,
  editorMinHeight,
}: {
  detail: GeminiRecruitmentDetail
  todayKey: string
  isEditMode?: boolean
  draft?: GeminiRecruitmentInfoEditDraft | null
  onDraftChange?: (patch: Partial<GeminiRecruitmentInfoEditDraft>) => void
  editor?: Editor | null
  editorMinHeight?: string | number
}) {
  const resolvedDetail = useMemo((): GeminiRecruitmentDetail => {
    if (!isEditMode || draft == null) return detail
    return { ...detail, ...draft }
  }, [detail, draft, isEditMode])

  const fieldValues = useMemo(
    () => ({
      title: resolvedDetail.title,
      announcementPublished: resolvedDetail.announcementPublished,
      educationTargetLevels: resolvedDetail.educationTargetLevels,
      educationTargetDetail: resolvedDetail.educationTargetDetail,
      applicationPeriodStart: resolvedDetail.applicationPeriodStart,
      applicationPeriodEnd: resolvedDetail.applicationPeriodEnd,
      trainingRequestPeriodStart: resolvedDetail.trainingRequestPeriodStart,
      trainingRequestPeriodEnd: resolvedDetail.trainingRequestPeriodEnd,
      minStudentCount: resolvedDetail.minStudentCount,
      educationForm: resolvedDetail.educationForm,
      inquiryContactName: resolvedDetail.inquiryContactName,
      inquiryTel: resolvedDetail.inquiryTel,
      inquiryEmail: resolvedDetail.inquiryEmail,
      notesNotApplicable: resolvedDetail.notesNotApplicable,
      notes: resolvedDetail.notes,
      thumbnailFileName: resolvedDetail.thumbnailFileName,
      programDescription: resolvedDetail.programDescription,
      recruitmentGuide: resolvedDetail.recruitmentGuide,
      applicationMethod: resolvedDetail.applicationMethod,
      learningSupportContent: resolvedDetail.learningSupportContent,
      additionalContentMarkdown: resolvedDetail.additionalContentMarkdown,
      attachmentFileNames: resolvedDetail.attachmentFileNames,
    }),
    [resolvedDetail]
  )

  const announcementDisplayLabel = resolveRecruitmentAnnouncementDisplayLabel(
    resolvedDetail.applicationPeriodStart,
    dayjs(todayKey)
  )
  const programProgressLabel = resolveRecruitmentProgramProgressLabel(
    detail.id,
    resolvedDetail.applicationPeriodStart,
    resolvedDetail.applicationPeriodEnd,
    dayjs(todayKey)
  )
  const programProgressModifier = recruitmentProgramProgressModifier(programProgressLabel)

  const applicationPeriod = draft
    ? toDateRangeValue(draft.applicationPeriodStart, draft.applicationPeriodEnd)
    : null
  const trainingRequestPeriod = draft
    ? toDateRangeValue(draft.trainingRequestPeriodStart, draft.trainingRequestPeriodEnd)
    : null

  const contentMode = isEditMode && draft != null && onDraftChange != null ? 'edit' : 'view'

  const handleMinStudentCountChange = useCallback(
    (value: string) => {
      if (!onDraftChange) return
      onDraftChange({
        minStudentCount: value === '' ? null : Number.parseInt(value, 10),
      })
    },
    [onDraftChange]
  )

  return (
    <div className="gemini-recruitment-info-tab">
      <div className="gemini-recruitment-info-tab__recruitment-section">
        <DetailInfoForm
          title="모집 정보"
          mode={contentMode}
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최초 등록일"
              view={
                <>
                  {formatRecruitmentAuditDate(detail.createdAt)}
                  <DetailInfoForm.InputsSeparator />
                  {detail.createdByName || '-'}
                </>
              }
            />
            <DetailInfoForm.Field
              label="마지막 수정일"
              view={
                <>
                  {formatRecruitmentAuditDate(detail.updatedAt)}
                  <DetailInfoForm.InputsSeparator />
                  {detail.updatedByName || '-'}
                </>
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              readOnlyDisplay={contentMode === 'view'}
              view={announcementDisplayLabel}
              edit={
                draft != null && onDraftChange != null ? (
                  <ParticipantRecruitmentAnnouncementPublishedRadios
                    value={draft.announcementPublished}
                    onChange={next => onDraftChange({ announcementPublished: next })}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="프로그램 진행 현황"
              readOnlyDisplay
              view={
                <span
                  className={`gemini-recruitment-info-tab__progress gemini-recruitment-info-tab__progress--${programProgressModifier}`}
                >
                  {programProgressLabel}
                </span>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm
          title="모집 정보"
          hideHeader
          mode={contentMode}
          className="program-registration-paragraph"
        >
          {contentMode === 'edit' && draft != null && onDraftChange != null ? (
            <GeminiRecruitmentInstitutionFields
              mode="edit"
              values={fieldValues}
              showAnnouncementRow={false}
              applicationPeriod={applicationPeriod}
              onApplicationPeriodChange={dates =>
                commitDateRange(dates, (start, end) =>
                  onDraftChange({
                    applicationPeriodStart: start,
                    applicationPeriodEnd: end,
                  })
                )
              }
              trainingRequestPeriod={trainingRequestPeriod}
              onTrainingRequestPeriodChange={dates =>
                commitDateRange(dates, (start, end) =>
                  onDraftChange({
                    trainingRequestPeriodStart: start,
                    trainingRequestPeriodEnd: end,
                  })
                )
              }
              onMinStudentCountChange={handleMinStudentCountChange}
              onChange={patch => onDraftChange(patch as Partial<GeminiRecruitmentInfoEditDraft>)}
            />
          ) : (
            <GeminiRecruitmentInstitutionFields
              mode="view"
              values={fieldValues}
              showAnnouncementRow={false}
            />
          )}
        </DetailInfoForm>
      </div>

      <DetailInfoForm
        title="상세 정보"
        mode={contentMode}
        className="program-registration-paragraph gemini-recruitment-info-tab__detail-block"
      >
        <GeminiRecruitmentDetailFields
          mode={contentMode}
          values={fieldValues}
          editor={editor}
          editorMinHeight={editorMinHeight}
          readOnlyUpload={contentMode === 'view'}
          onChange={
            onDraftChange
              ? patch => onDraftChange(patch as Partial<GeminiRecruitmentInfoEditDraft>)
              : undefined
          }
        />
      </DetailInfoForm>
    </div>
  )
}
