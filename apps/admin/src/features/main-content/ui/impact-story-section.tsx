import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { ImpactStoryOption, ImpactStorySection } from '@/entities/main-content/model/types'
import { useImpactStoryDetail, useUpdateImpactStory } from '@/features/impact-stories/api/hooks'
import { useSaveImpactStorySection } from '@/features/main-content/api/hooks'
import { mainContentSaveFailureAlert } from '@/features/main-content/lib/mutation-failure-alert'
import { MainContentSectionCard } from '@/features/main-content/ui/section-card'
import {
  CmsInput,
  CmsSelect,
  CmsTextArea,
  FileSelectField,
  FILE_SELECT_IMAGE_MAX_TOTAL_BYTES,
  useCmsAlert,
} from '@/shared/ui'

import './impact-story-section.css'

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png'
const IMAGE_GUIDE = [
  '- 대표 콘텐츠로 선택한 스토리의 홈 썸네일입니다.',
  '- 파일은 최대 20MB까지 JPG, PNG 형식만 등록 가능합니다.',
] as const
const MAX_BYTES = FILE_SELECT_IMAGE_MAX_TOTAL_BYTES

type Props = {
  data: ImpactStorySection
  options: ImpactStoryOption[]
}

function isAllowedImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = file.name.toLowerCase()
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

function mimeFromFile(file: File): 'image/jpeg' | 'image/png' {
  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    return 'image/png'
  }
  return 'image/jpeg'
}

function CoverPreview({ src, alt, loading }: { src?: string; alt: string; loading?: boolean }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    setBroken(false)
  }, [src])
  const show = Boolean(src) && !broken && !loading
  return (
    <div className="main-content-cover__preview">
      {show ? (
        <img src={src} alt={alt} onError={() => setBroken(true)} />
      ) : (
        <p className="main-content-cover__empty">{loading ? '' : '이미지 없음'}</p>
      )}
    </div>
  )
}

export function ImpactStorySectionCard({ data, options }: Props) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveImpactStorySection()
  const updateStoryMutation = useUpdateImpactStory()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ImpactStorySection>(data)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState('')

  const selectOptions = useMemo(
    () => options.map(opt => ({ value: opt.id, label: opt.title })),
    [options]
  )

  const featuredId = isEditing ? draft.featuredContentId : data.featuredContentId
  const featuredTitle = useMemo(() => {
    return options.find(opt => opt.id === featuredId)?.title ?? '-'
  }, [featuredId, options])

  const storyQuery = useImpactStoryDetail(featuredId || undefined, Boolean(featuredId))
  const coverLoading = Boolean(featuredId) && storyQuery.isPending
  const savedCoverUrl = storyQuery.data?.thumbnail?.dataUrl
  const savedCoverName = storyQuery.data?.thumbnail?.name
  const coverUrl = pendingPreview || savedCoverUrl
  const coverNames = pendingFile ? [pendingFile.name] : savedCoverName ? [savedCoverName] : []

  const handleEdit = useCallback(() => {
    setDraft(data)
    setPendingFile(null)
    setPendingPreview('')
    setIsEditing(true)
  }, [data])

  const handleCancel = useCallback(() => {
    setDraft(data)
    setPendingFile(null)
    setPendingPreview('')
    setIsEditing(false)
  }, [data])

  const handleCoverFiles = useCallback(
    (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedImageFile(file)) {
        showAlert({ title: '파일 형식', content: 'JPG, PNG 형식만 등록할 수 있습니다.' })
        return
      }
      if (file.size > MAX_BYTES) {
        showAlert({ title: '파일 용량', content: '파일은 최대 20MB까지 등록 가능합니다.' })
        return
      }
      setPendingFile(file)
      const reader = new FileReader()
      reader.onload = () => setPendingPreview(String(reader.result ?? ''))
      reader.readAsDataURL(file)
    },
    [showAlert]
  )

  const handleSave = useCallback(async () => {
    try {
      const story = storyQuery.data
      if (pendingFile) {
        if (!draft.featuredContentId) {
          showAlert({ title: '입력 확인', content: '대표 콘텐츠를 먼저 선택해 주세요.' })
          return
        }
        if (!story || story.id !== draft.featuredContentId) {
          showAlert({
            title: '저장 실패',
            content: '대표 스토리를 불러오지 못했습니다. 다시 시도해 주세요.',
          })
          return
        }
        await updateStoryMutation.mutateAsync({
          id: story.id,
          categoryId: story.categoryId,
          title: story.title,
          contentMarkdown: story.contentMarkdown,
          isPublic: story.isPublic,
          isPinned: story.isPinned,
          publishedAt: story.publishedAt,
          authorName: story.authorName,
          thumbnail: {
            id: `thumb-${Date.now()}`,
            name: pendingFile.name,
            mime: mimeFromFile(pendingFile),
            file: pendingFile,
          },
          attachments: story.attachments,
        })
      }
      await saveMutation.mutateAsync(draft)
      setPendingFile(null)
      setPendingPreview('')
      setIsEditing(false)
    } catch (error) {
      showAlert(mainContentSaveFailureAlert(error, '임팩트 스토리'))
    }
  }, [draft, pendingFile, saveMutation, showAlert, storyQuery.data, updateStoryMutation])

  const mode = isEditing ? 'edit' : 'view'
  const titleText = isEditing ? draft.title : data.title
  const youtubeUrl = isEditing ? draft.youtubeUrl : data.youtubeUrl
  const saving = saveMutation.isPending || updateStoryMutation.isPending

  return (
    <MainContentSectionCard
      title="임팩트 스토리 관리"
      isEditing={isEditing}
      saving={saving}
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
                placeholder="타이틀 문구를 입력해 주세요"
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
                placeholder="유튜브 링크를 입력해 주세요"
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
                onChange={value => {
                  setPendingFile(null)
                  setPendingPreview('')
                  setDraft(prev => ({
                    ...prev,
                    featuredContentId: String(value ?? ''),
                  }))
                }}
                placeholder="대표 콘텐츠를 선택하세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="대표 콘텐츠 이미지"
            view={
              <div className="main-content-cover">
                <CoverPreview src={savedCoverUrl} alt="" loading={coverLoading} />
              </div>
            }
            edit={
              <div className="main-content-cover">
                <CoverPreview src={coverUrl} alt="" loading={!pendingPreview && coverLoading} />
                <FileSelectField
                  className="main-content-cover__field"
                  multiple={false}
                  accept={IMAGE_ACCEPT}
                  buttonLabel="파일 추가"
                  fileNames={coverNames}
                  maxTotalBytes={FILE_SELECT_IMAGE_MAX_TOTAL_BYTES}
                  guideLines={[...IMAGE_GUIDE]}
                  onFilesChange={files => handleCoverFiles(files)}
                  onRemoveFile={() => {
                    setPendingFile(null)
                    setPendingPreview('')
                  }}
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </MainContentSectionCard>
  )
}
