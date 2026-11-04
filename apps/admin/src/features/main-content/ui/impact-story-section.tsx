import { useCallback, useMemo, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { ImpactStoryOption, ImpactStorySection } from '@/entities/main-content/model/types'
import { useSaveImpactStorySection } from '@/features/main-content/api/hooks'
import { mainContentSaveFailureAlert } from '@/features/main-content/lib/mutation-failure-alert'
import { MainContentRequiredLabel } from '@/features/main-content/ui/nested-tables'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT,
  CmsInput,
  CmsSelect,
  CmsTextArea,
  showUpdateCompletedAlert,
  useCmsAlert,
} from '@/shared/ui'

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

  const featuredId = isEditing ? draft.featuredContentId : data.featuredContentId
  const featuredTitle = useMemo(() => {
    return options.find(opt => opt.id === featuredId)?.title ?? '-'
  }, [featuredId, options])

  const handleEdit = useCallback(() => {
    setDraft(data)
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setIsEditing(false)
  }, [data])

  const handleSave = useCallback(async () => {
    if (!draft.title.trim() || !draft.youtubeUrl.trim() || !draft.featuredContentId.trim()) {
      showAlert(REQUIRED_FIELDS_INCOMPLETE_ALERT)
      return
    }
    try {
      await saveMutation.mutateAsync(draft)
      setIsEditing(false)
      showUpdateCompletedAlert()
    } catch (error) {
      showAlert(mainContentSaveFailureAlert(error, '임팩트 스토리'))
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
            label={
              <MainContentRequiredLabel required={isEditing}>타이틀 텍스트</MainContentRequiredLabel>
            }
            view={<span className="main-content-preline">{titleText || '-'}</span>}
            edit={
              <CmsTextArea
                className="cms-textarea--fixed-rows"
                inputSize="medium"
                width="100%"
                rows={2}
                value={draft.title}
                onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
                placeholder="타이틀 텍스트를 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label={
              <MainContentRequiredLabel required={isEditing}>
                메인 영상 유튜브 링크
              </MainContentRequiredLabel>
            }
            view={youtubeUrl || '-'}
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={draft.youtubeUrl}
                onChange={e => setDraft(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                placeholder="유튜브 링크를 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label={
              <MainContentRequiredLabel required={isEditing}>대표 콘텐츠 설정</MainContentRequiredLabel>
            }
            view={featuredTitle}
            edit={
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption={false}
                options={selectOptions}
                value={draft.featuredContentId}
                onChange={value => {
                  setDraft(prev => ({
                    ...prev,
                    featuredContentId: String(value ?? ''),
                  }))
                }}
                placeholder="대표 콘텐츠를 선택해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
