import { memo, useRef, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryPhilosophy } from '@/entities/ja-history/model/types'
import { CmsButton, CmsTextArea, ContentModal, REQUIRED_FIELDS_INCOMPLETE_ALERT, useCmsAlert } from '@/shared/ui'

const DraftTextArea = memo(function DraftTextArea({
  initialValue,
  rows,
  placeholder,
  ariaLabel,
  onValue,
}: {
  initialValue: string
  rows: number
  placeholder?: string
  ariaLabel: string
  onValue: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <CmsTextArea
      className="cms-textarea--fixed-rows"
      inputSize="large"
      width="100%"
      rows={rows}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={event => {
        const next = event.target.value
        setValue(next)
        onValue(next)
      }}
    />
  )
})

export type PhilosophyIntroFormValues = {
  title: string
  lead: string
}

type Props = {
  open: boolean
  initial: Pick<JaHistoryPhilosophy, 'title' | 'lead'>
  confirmLoading?: boolean
  onCancel: () => void
  onSubmit: (values: PhilosophyIntroFormValues) => void
}

function PhilosophyIntroFormBody({ initial, confirmLoading, onCancel, onSubmit }: Omit<Props, 'open'>) {
  const { showAlert } = useCmsAlert()
  const titleRef = useRef(initial.title)
  const leadRef = useRef(initial.lead)

  const handleSubmit = () => {
    const title = titleRef.current
    const lead = leadRef.current
    if (!title.trim() || !lead.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    onSubmit({ title, lead })
  }

  return (
    <ContentModal
      open
      onCancel={onCancel}
      title="믿음을 키우는 교육 수정"
      description="JA History의 믿음을 키우는 교육의 텍스트를 설정해 주세요."
      width={800}
      className="ja-history-modal"
      footer={
        <>
          <CmsButton
            variant="secondary"
            size="medium"
            type="button"
            onClick={onCancel}
            disabled={confirmLoading}
          >
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            loading={confirmLoading}
            disabled={confirmLoading}
            onClick={handleSubmit}
          >
            저장
          </CmsButton>
        </>
      }
    >
      <DetailInfoForm title="믿음을 키우는 교육 수정" hideHeader mode="edit" className="ja-history-form">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀"
            required
            view={null}
            edit={
              <DraftTextArea
                initialValue={titleRef.current}
                rows={2}
                placeholder="타이틀을 입력해 주세요"
                ariaLabel="타이틀"
                onValue={value => {
                  titleRef.current = value
                }}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="서브 텍스트"
            required
            view={null}
            edit={
              <DraftTextArea
                initialValue={leadRef.current}
                rows={4}
                placeholder="서브 텍스트를 입력해 주세요"
                ariaLabel="서브 텍스트"
                onValue={value => {
                  leadRef.current = value
                }}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ContentModal>
  )
}

export function PhilosophyIntroFormModal(props: Props) {
  if (!props.open) return null
  return <PhilosophyIntroFormBody {...props} />
}
