import { useCallback, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { EducationSection } from '@/entities/main-content/model/types'
import { useSaveEducationSection } from '@/features/main-content/api/hooks'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsInput, useCmsAlert } from '@/shared/ui'

type Props = {
  data: EducationSection
}

export function EducationSectionCard({ data }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveEducationSection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<EducationSection>(data)

  const handleEdit = useCallback(() => {
    setDraft(data)
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
        content: '교육 프로그램 저장에 실패했습니다. 다시 시도해 주세요.',
      })
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
            label="타이틀 문구"
            view={titleValue || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft.title}
                onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                placeholder="타이틀 문구를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
