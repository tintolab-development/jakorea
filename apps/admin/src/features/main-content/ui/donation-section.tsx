import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { DonationSection } from '@/entities/main-content/model/types'
import { useSaveDonationSection } from '@/features/main-content/api/hooks'
import { CtaNestedTable } from '@/features/main-content/ui/nested-tables'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsTextArea, useCmsAlert } from '@/shared/ui'

const DONATION_DESCRIPTION =
  '후원 기업 목록은 [기업 후원 관리] > [후원사 관리]에서 등록 및 관리된 항목이 동일하게 노출됩니다.'

type Props = {
  data: DonationSection
}

export function DonationSectionCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveDonationSection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<DonationSection>(data)

  const handleEdit = useCallback(() => {
    setDraft({
      ...data,
      cta1: { ...data.cta1 },
      cta2: { ...data.cta2 },
    })
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
    } catch {
      showAlert({
        title: '저장 실패',
        content: '정기후원 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const mode = isEditing ? 'edit' : 'view'
  const titleText = isEditing ? draft.title : data.title
  const cta1 = isEditing ? draft.cta1 : data.cta1
  const cta2 = isEditing ? draft.cta2 : data.cta2

  const ctaTable = (
    <CtaNestedTable
      cta1={cta1}
      cta2={cta2}
      mode={mode}
      onChangeCta1={patch =>
        setDraft(prev => ({ ...prev, cta1: { ...prev.cta1, ...patch } }))
      }
      onChangeCta2={patch =>
        setDraft(prev => ({ ...prev, cta2: { ...prev.cta2, ...patch } }))
      }
    />
  )

  return (
    <MainContentSectionCard
      title="정기후원 관리"
      description={DONATION_DESCRIPTION}
      isEditing={isEditing}
      saving={saveMutation.isPending}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={() => {
        void handleSave()
      }}
    >
      <DetailInfoForm title="정기후원 관리" hideHeader mode={mode}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀 문구"
            view={<span className="main-content-preline">{titleText || '-'}</span>}
            edit={
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={draft.title}
                onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                placeholder="타이틀 문구를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="CTA 버튼" view={ctaTable} edit={ctaTable} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
