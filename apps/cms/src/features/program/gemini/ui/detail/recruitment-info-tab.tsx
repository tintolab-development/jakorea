import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { Editor } from '@tiptap/react'
import { useMemo } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { StatusBadge } from '@/shared/components/status-badge'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { RichTextEditor } from '@/shared/rich-text'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import type { GeminiRecruitmentDetail } from '../../model/recruitment/detail-types'
import type { GeminiRecruitmentInfoEditDraft } from '../../model/recruitment/info-edit-draft'
import { toDateRangeValue } from '../../model/recruitment/info-edit-draft'
import {
  formatRecruitmentAuditDate,
  formatRecruitmentPeriodRange,
} from '../../lib/recruitment/format-period'
import {
  geminiRecruitmentStatusToEnrollmentDisplay,
  resolveRecruitmentStatus,
} from '../../lib/recruitment/resolve-status'
import '@/features/posts/ui/notice-register-modal.css'
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

function resolveAnnouncementPublishedLabel(
  value: GeminiRecruitmentDetail['announcementPublished']
): string {
  return (
    ANNOUNCEMENT_PUBLISHED_OPTIONS.find(option => option.value === value)?.label ?? '-'
  )
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
  const status = resolveRecruitmentStatus(
    detail.applicationPeriodStart,
    detail.applicationPeriodEnd,
    dayjs(todayKey)
  )

  const resolvedDetail = useMemo((): GeminiRecruitmentDetail => {
    if (!isEditMode || draft == null) return detail
    return { ...detail, ...draft }
  }, [detail, draft, isEditMode])

  const applicationRange = draft
    ? toDateRangeValue(draft.applicationPeriodStart, draft.applicationPeriodEnd)
    : null
  const trainingRequestRange = draft
    ? toDateRangeValue(draft.trainingRequestPeriodStart, draft.trainingRequestPeriodEnd)
    : null

  const basicInfoMode = isEditMode && draft != null && onDraftChange != null ? 'edit' : 'view'

  return (
    <div className="gemini-recruitment-info-tab">
      <div className="gemini-recruitment-info-tab__basic-info" role="group" aria-label="기본 정보">
        <DetailInfoForm title="기본 정보" mode="view" className="program-registration-paragraph">
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
        </DetailInfoForm>

        <DetailInfoForm
          title="기본 정보"
          hideHeader
          mode={basicInfoMode}
          className="program-registration-paragraph gemini-recruitment-info-tab__basic-info-block"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              view={resolveAnnouncementPublishedLabel(resolvedDetail.announcementPublished)}
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
              label="공고명"
              view={resolvedDetail.title}
              edit={
                draft != null && onDraftChange != null ? (
                  <CmsInput
                    inputSize="medium"
                    width="100%"
                    placeholder="공고명을 입력하세요"
                    value={draft.title}
                    onChange={e => onDraftChange({ title: e.target.value })}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="신청 기간"
              view={formatRecruitmentPeriodRange(
                resolvedDetail.applicationPeriodStart,
                resolvedDetail.applicationPeriodEnd
              )}
              edit={
                draft != null && onDraftChange != null ? (
                  <CmsDateRangePicker
                    value={applicationRange}
                    onChange={dates =>
                      commitDateRange(dates, (start, end) =>
                        onDraftChange({
                          applicationPeriodStart: start,
                          applicationPeriodEnd: end,
                        })
                      )
                    }
                    format="YYYY. MM. DD"
                    width="100%"
                    placeholder={['시작일', '종료일']}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="연수 요청 가능 기간"
              view={formatRecruitmentPeriodRange(
                resolvedDetail.trainingRequestPeriodStart,
                resolvedDetail.trainingRequestPeriodEnd
              )}
              edit={
                draft != null && onDraftChange != null ? (
                  <CmsDateRangePicker
                    value={trainingRequestRange}
                    onChange={dates =>
                      commitDateRange(dates, (start, end) =>
                        onDraftChange({
                          trainingRequestPeriodStart: start,
                          trainingRequestPeriodEnd: end,
                        })
                      )
                    }
                    format="YYYY. MM. DD"
                    width="100%"
                    placeholder={['시작일', '종료일']}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최소 수강 인원"
              view={resolvedDetail.minStudentCount.toLocaleString('ko-KR')}
              edit={
                draft != null && onDraftChange != null ? (
                  <CmsInput
                    inputSize="medium"
                    width={260}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={draft.minStudentCount}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '')
                      if (digits === '') return
                      onDraftChange({ minStudentCount: Number(digits) })
                    }}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="프로그램 진행 현황"
              readOnlyDisplay
              view={
                <StatusBadge
                  domain="programEnrollment"
                  status={geminiRecruitmentStatusToEnrollmentDisplay(status)}
                  variant="text"
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <DetailInfoForm
        title="연수 내용"
        mode={isEditMode && draft != null && onDraftChange != null ? 'edit' : 'view'}
        className="gemini-recruitment-info-tab__training"
      >
        <DetailInfoForm.Row type="custom">
          {isEditMode && draft != null && onDraftChange != null ? (
            <div className="notice-register-modal__section notice-register-modal__section--editor gemini-recruitment-info-tab__editor">
              <div className="notice-register-modal__editor-host">
                <RichTextEditor
                  editor={editor}
                  minHeight={editorMinHeight}
                />
              </div>
            </div>
          ) : (
            <div className="gemini-recruitment-info-tab__training-body">
              {resolvedDetail.trainingContent}
            </div>
          )}
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
