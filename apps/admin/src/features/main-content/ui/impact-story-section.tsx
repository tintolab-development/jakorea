import { useCallback, useMemo, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { ImpactStoryOption, ImpactStorySection } from '@/entities/main-content/model/types'
import { useSaveImpactStorySection } from '@/features/main-content/api/hooks'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import { CmsInput, CmsSelect, CmsTextArea, useCmsAlert } from '@/shared/ui'

type Props = {
  data: ImpactStorySection
  options: ImpactStoryOption[]
}

export function ImpactStorySectionCard({ data, options }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveImpactStorySection()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ImpactStorySection>(data)

  const selectOptions = useMemo(
    () => options.map(opt => ({ value: opt.id, label: opt.title })),
    [options]
  )

  const featuredTitle = useMemo(() => {
    const id = isEditing ? draft.featuredContentId : data.featuredContentId
    return options.find(opt => opt.id === id)?.title ?? '-'
  }, [data.featuredContentId, draft.featuredContentId, isEditing, options])

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
        content: '임팩트 스토리 저장에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }, [draft, saveMutation, showAlert])

  const mode = isEditing ? 'edit' : 'view'
  const titleText = isEditing ? draft.title : data.title
  const youtubeUrl = isEditing ? draft.youtubeUrl : data.youtubeUrl

  return (
    <MainContentSectionCard
      title="임팩트 스토리 관리"
      isEditing={isEditing}
      saving={saveMutation.isPending}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={() => {
        void handleSave()
      }}
    >
      <DetailInfoForm title="임팩트 스토리 관리" hideHeader mode={mode}>
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
          <DetailInfoForm.Field
            label="메인 영상 유튜브 링크"
            view={youtubeUrl || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft.youtubeUrl}
                onChange={e => setDraft(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="유튜브 링크를 입력하세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대표 콘텐츠 설정"
            view={featuredTitle}
            edit={
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption={false}
                options={selectOptions}
                value={draft.featuredContentId}
                onChange={value =>
                  setDraft(prev => ({
                    ...prev,
                    featuredContentId: String(value ?? ''),
                  }))
                }
                placeholder="대표 콘텐츠를 선택하세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
