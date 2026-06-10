import {
  ParagraphCard,
  paragraphCardStaticHeading,
} from '@/features/template/ui/paragraph/shared/paragraph-card'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsButton } from '@/shared/ui'
import type { useGeminiRecruitmentAddForm } from '../../hooks/use-gemini-recruitment-add-form'
import { RichTextEditor } from '@/shared/rich-text'
import '@/features/posts/ui/notice-register-modal.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './add-form.css'

export type GeminiRecruitmentAddFormProps = {
  onCancel: () => void
  form: ReturnType<typeof useGeminiRecruitmentAddForm>
}

export function GeminiRecruitmentAddForm({ onCancel, form }: GeminiRecruitmentAddFormProps) {
  const {
    hydrated,
    title,
    setTitle,
    applicationPeriod,
    setApplicationPeriod,
    trainingRequestPeriod,
    setTrainingRequestPeriod,
    minStudentCount,
    handleMinStudentCountChange,
    editor,
  } = form

  if (!hydrated) {
    return <div className="gemini-recruitment-add-form" aria-hidden />
  }

  return (
    <div className="gemini-recruitment-add-form">
      <ParagraphCard
        className="gemini-recruitment-add-form__card gemini-recruitment-add-form__card--basic"
        editableHeading={paragraphCardStaticHeading('기본 정보', { required: true })}
      >
        <DetailInfoForm
          title="기본 정보"
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="공고명"
              edit={
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  placeholder="대표 프로그램명(국문)을 입력하세요"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="신청기간"
              edit={
                <CmsDateRangePicker
                  value={applicationPeriod}
                  onChange={dates => setApplicationPeriod(dates ?? null)}
                  format="YYYY. MM. DD"
                  width="100%"
                  placeholder={['시작일', '종료일']}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="연수 요청 가능기간"
              edit={
                <CmsDateRangePicker
                  value={trainingRequestPeriod}
                  onChange={dates => setTrainingRequestPeriod(dates ?? null)}
                  format="YYYY. MM. DD"
                  width="100%"
                  placeholder={['시작일', '종료일']}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="최소 수강 인원"
              edit={
                <CmsInput
                  inputSize="medium"
                  width={260}
                  type="number"
                  inputMode="numeric"
                  placeholder="최소 수강 인원을 입력하세요"
                  value={minStudentCount ?? 0}
                  onChange={e => handleMinStudentCountChange(e.target.value)}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </ParagraphCard>

      <ParagraphCard
        className="gemini-recruitment-add-form__card gemini-recruitment-add-form__card--training"
        editableHeading={paragraphCardStaticHeading('연수 내용', { required: true })}
      >
        <DetailInfoForm
          title="연수 내용"
          hideHeader
          mode="edit"
          className="program-registration-paragraph gemini-recruitment-add-form__training-form"
        >
          <DetailInfoForm.Row type="custom">
            <div className="notice-register-modal__section notice-register-modal__section--editor gemini-recruitment-add-form__editor">
              <div className="notice-register-modal__editor-host">
                <RichTextEditor editor={editor} />
              </div>
            </div>
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </ParagraphCard>

      <div className="gemini-recruitment-add-form__footer">
        <CmsButton type="button" variant="delete" size="large" width={140} onClick={onCancel}>
          등록 취소
        </CmsButton>
      </div>
    </div>
  )
}
