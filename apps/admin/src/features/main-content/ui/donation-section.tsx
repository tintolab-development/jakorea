import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { DonationSection } from '@/entities/main-content/model/types'
import { useSaveDonationSection } from '@/features/main-content/api/hooks'
import {
  mainContentSaveFailureAlert,
  readMainContentFieldErrors,
} from '@/features/main-content/lib/mutation-failure-alert'
import {
  hasFieldErrors,
  MAIN_CONTENT_LIMITS,
  type MainContentFieldErrors,
  validateDonationSection,
} from '@/features/main-content/lib/validate'
import { MainContentFieldControl } from '@/features/main-content/ui/field-control'
import { CtaNestedTable } from '@/features/main-content/ui/nested-tables'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsTextArea, useCmsAlert } from '@/shared/ui'

const DONATION_DESCRIPTION =
  '후원 기업 목록은 [후원하기 관리] > [기업후원] > [후원사 목록 관리]에서 등록 및 관리된 항목이 동일하게 노출됩니다.'

type Props = {
  data: DonationSection
}

export function DonationSectionCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveDonationSection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<DonationSection>(data)
  const [fieldErrors, setFieldErrors] = useState<MainContentFieldErrors>({})

  const handleEdit = useCallback(() => {
    setDraft({
      ...data,
      cta1: { ...data.cta1 },
      cta2: { ...data.cta2 },
    })
    setFieldErrors({})
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setFieldErrors({})
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    const invalid = validateDonationSection(draft)
    if (hasFieldErrors(invalid)) {
      setFieldErrors(invalid)
      return
    }
    try {
      await saveMutation.mutateAsync(draft)
      setFieldErrors({})
      setIsEditing(false)
    } catch (error) {
      const mapped = readMainContentFieldErrors(error)
      if (mapped) {
        setFieldErrors(mapped)
        return
      }
      showAlert(mainContentSaveFailureAlert(error, '정기후원'))
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
      fieldErrors={fieldErrors}
      onChangeCta1={patch => {
        setFieldErrors(prev => ({
          ...prev,
          ...(patch.label != null ? { cta1Label: '' } : {}),
          ...(patch.linkUrl != null ? { cta1Url: '' } : {}),
        }))
        setDraft(prev => ({ ...prev, cta1: { ...prev.cta1, ...patch } }))
      }}
      onChangeCta2={patch => {
        setFieldErrors(prev => ({
          ...prev,
          ...(patch.label != null ? { cta2Label: '' } : {}),
          ...(patch.linkUrl != null ? { cta2Url: '' } : {}),
        }))
        setDraft(prev => ({ ...prev, cta2: { ...prev.cta2, ...patch } }))
      }}
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
            label="타이틀 텍스트"
            required
            view={<span className="main-content-preline">{titleText || '-'}</span>}
            edit={
              <MainContentFieldControl error={fieldErrors.title}>
                <CmsTextArea
                  className="cms-textarea--fixed-rows"
                  inputSize="medium"
                  width="100%"
                  rows={2}
                  maxLength={MAIN_CONTENT_LIMITS.donationTitle}
                  status={fieldErrors.title ? 'error' : undefined}
                  value={draft.title}
                  onChange={e => {
                    setFieldErrors(prev => ({ ...prev, title: '' }))
                    setDraft(prev => ({ ...prev, title: e.target.value }))
                  }}
                  placeholder="타이틀 텍스트를 입력하세요"
                />
              </MainContentFieldControl>
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
