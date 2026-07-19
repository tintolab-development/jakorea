import dayjs from 'dayjs'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  GEMINI_RECRUITMENT_DETAIL_TEXT_FIELDS,
  GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS,
  GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS,
} from '../../lib/recruitment/add-form-options'
import type { GeminiRecruitmentAddFormSnapshot } from '../../lib/recruitment/add-local-save'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './add-preview-modal.css'

function formatPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return '-'
  const a = dayjs(start)
  const b = dayjs(end)
  if (!a.isValid() || !b.isValid()) return '-'
  return `${a.format('YYYY. MM. DD')} ~ ${b.format('YYYY. MM. DD')}`
}

function resolveEducationTargets(levels: string[]): string {
  if (levels.length === 0) return '-'
  return levels
    .map(level => GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS.find(o => o.value === level)?.label)
    .filter(Boolean)
    .join(', ')
}

function resolveEducationForm(value: string): string {
  return GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS.find(o => o.value === value)?.label ?? '-'
}

function resolveAnnouncementPublished(value: string): string {
  return ANNOUNCEMENT_PUBLISHED_OPTIONS.find(o => o.value === value)?.label ?? '-'
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div className="gemini-recruitment-add-preview-modal__row">
      <dt className="gemini-recruitment-add-preview-modal__label">{label}</dt>
      <dd className="gemini-recruitment-add-preview-modal__value">{value}</dd>
    </div>
  )
}

export function GeminiRecruitmentAddPreviewModal({
  open,
  snapshot,
  onClose,
}: {
  open: boolean
  snapshot: GeminiRecruitmentAddFormSnapshot | null
  onClose: () => void
}) {
  if (snapshot == null) return null

  const detailTextValues = {
    programDescription: snapshot.programDescription,
    recruitmentGuide: snapshot.recruitmentGuide,
    applicationMethod: snapshot.applicationMethod,
    learningSupportContent: snapshot.learningSupportContent,
  }

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="공고 미리보기"
      size="large"
      width={1000}
      className="gemini-recruitment-add-preview-modal"
      footer={
        <CmsButton variant="secondary" size="large" type="button" onClick={onClose}>
          닫기
        </CmsButton>
      }
    >
      <div className="gemini-recruitment-add-preview-modal__body">
        <p className="gemini-recruitment-add-preview-modal__hint">
          사용자 화면 공고 미리보기입니다. (Platform 연동 전 mock 표시)
        </p>
        <article className="gemini-recruitment-add-preview-modal__article">
          <h2 className="gemini-recruitment-add-preview-modal__title">
            {snapshot.title.trim() || '(공고명 없음)'}
          </h2>
          <dl className="gemini-recruitment-add-preview-modal__list">
            <PreviewRow
              label="공고 게시 여부"
              value={resolveAnnouncementPublished(snapshot.announcementPublished)}
            />
            <PreviewRow
              label="교육 대상"
              value={resolveEducationTargets(snapshot.educationTargetLevels)}
            />
            <PreviewRow label="교육 대상 상세" value={snapshot.educationTargetDetail} />
            <PreviewRow
              label="기관 모집 기간"
              value={formatPeriod(snapshot.applicationPeriodStart, snapshot.applicationPeriodEnd)}
            />
            <PreviewRow
              label="연수 요청 가능기간"
              value={formatPeriod(
                snapshot.trainingRequestPeriodStart,
                snapshot.trainingRequestPeriodEnd
              )}
            />
            <PreviewRow
              label="최소 수강 인원"
              value={
                snapshot.minStudentCount != null ? `${snapshot.minStudentCount}명` : '-'
              }
            />
            <PreviewRow
              label="교육 형태"
              value={resolveEducationForm(snapshot.educationForm)}
            />
            <PreviewRow label="문의처" value={snapshot.inquiryContactName} />
            <PreviewRow label="Tel" value={snapshot.inquiryTel} />
            <PreviewRow label="E-mail" value={snapshot.inquiryEmail} />
            {!snapshot.notesNotApplicable ? (
              <PreviewRow label="비고" value={snapshot.notes} />
            ) : null}
            {GEMINI_RECRUITMENT_DETAIL_TEXT_FIELDS.map(field => (
              <PreviewRow
                key={field.key}
                label={field.label}
                value={detailTextValues[field.key]}
              />
            ))}
            {snapshot.additionalContentMarkdown.trim() ? (
              <PreviewRow label="추가 내용" value={snapshot.additionalContentMarkdown} />
            ) : null}
          </dl>
        </article>
      </div>
    </ContentModal>
  )
}
