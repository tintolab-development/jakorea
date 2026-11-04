import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { EducationSection } from '@/entities/main-content/model/types'
import { useSaveEducationSection } from '@/features/main-content/api/hooks'
import {
  mainContentSaveFailureAlert,
  readMainContentFieldErrors,
} from '@/features/main-content/lib/mutation-failure-alert'
import {
  hasFieldErrors,
  MAIN_CONTENT_LIMITS,
  type MainContentFieldErrors,
  validateEducationSection,
} from '@/features/main-content/lib/validate'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsInput, showSaveCompletedAlert, useCmsAlert } from '@/shared/ui'

type Props = {
  data: EducationSection
}

export function EducationSectionCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveEducationSection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<EducationSection>(data)
  const [fieldErrors, setFieldErrors] = useState<MainContentFieldErrors>({})

  const handleEdit = useCallback(() => {
    setDraft(data)
    setFieldErrors({})
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setFieldErrors({})
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    const invalid = validateEducationSection(draft)
    if (hasFieldErrors(invalid)) {
      setFieldErrors(invalid)
      return
    }
    try {
      await saveMutation.mutateAsync(draft)
      setFieldErrors({})
      setIsEditing(false)
      showSaveCompletedAlert()
    } catch (error) {
      const mapped = readMainContentFieldErrors(error)
      if (mapped) {
        setFieldErrors(mapped)
        return
      }
      showAlert(mainContentSaveFailureAlert(error, '교육 프로그램'))
    }
  }, [draft, saveMutation, showAlert])

  const mode = isEditing ? 'edit' : 'view'
  const titleValue = isEditing ? draft.title : data.title

  return (
    <MainContentSectionCard
      title="교육 프로그램 관리"
      isEditing={isEditing}
      saving={saveMutation.isPending}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={() => {
        void handleSave()
      }}
    >
      <DetailInfoForm title="교육 프로그램 관리" hideHeader mode={mode}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀 텍스트"
            required
            view={titleValue || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft.title}
                maxLength={MAIN_CONTENT_LIMITS.educationTitle}
                error={Boolean(fieldErrors.title)}
                message={fieldErrors.title}
                onChange={e => {
                  setFieldErrors(prev => ({ ...prev, title: '' }))
                  setDraft(prev => ({ ...prev, title: e.target.value }))
                }}
                placeholder="타이틀 텍스트를 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
