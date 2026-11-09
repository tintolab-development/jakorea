import { useCallback, useEffect, useState } from 'react'
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import '@jakorea/form-template-runtime/detail-info-form.css'
import type { JaHistoryCta } from '@/entities/ja-history/model/types'
import { useSaveJaHistoryCta } from '@/features/ja-history/api/hooks'
import {
  FileSelectField,
  isFileSelectTotalSizeExceeded,
  notifyFileSelectTotalSizeExceeded,
  showSaveCompletedAlert,
  useCmsAlert,
  ThumbnailPlaceholder,
} from '@/shared/ui'
import { HistoryCopy, InlineText, MediaPreview, SectionFrame, jaHistorySaveAlert } from './chrome'
import { CtaButtonsNestedTable } from './cta-buttons-nested-table'
import { isAllowedJaHistoryImage, JA_HISTORY_IMAGE_ACCEPT, readJaHistoryImage } from './image-file'

/** CTA 이미지(JA_HISTORY_CTA_IMAGE) 서버 업로드 한도 */
const CTA_IMAGE_MAX_BYTES = 15 * 1024 * 1024

const IMAGE_GUIDE_LINES = [
  '- 파일은 JPG, PNG 형식만 등록 가능하며, 최대 15MB까지 첨부할 수 있습니다.',
  '- 권장 이미지 사이즈는 680 × 400px입니다.',
]

export function CtaSection({ cta }: { cta: JaHistoryCta }) {
  const { showAlert } = useCmsAlert()
  const saveMutation = useSaveJaHistoryCta()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cta)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (!editing) {
      setDraft(cta)
      setImageFile(null)
    }
  }, [cta, editing])

  const patch = (partial: Partial<JaHistoryCta>) => {
    setDraft(prev => ({ ...prev, ...partial }))
  }

  const handleFilesChange = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      if (!isAllowedJaHistoryImage(file)) {
        showAlert({
          title: '파일 형식 오류',
          content: '등록할 수 없는 파일 형식입니다.',
        })
        return
      }
      if (
        isFileSelectTotalSizeExceeded({
          incoming: [file],
          maxTotalBytes: CTA_IMAGE_MAX_BYTES,
        })
      ) {
        notifyFileSelectTotalSizeExceeded(CTA_IMAGE_MAX_BYTES)
        return
      }
      try {
        const dataUrl = await readJaHistoryImage(file)
        setDraft(prev => ({
          ...prev,
          image: { ...prev.image, url: dataUrl, fileName: file.name, assetId: undefined },
        }))
        setImageFile(file)
      } catch {
        showAlert({
          title: '파일 읽기 실패',
          content: '이미지를 불러오지 못했습니다. 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  return (
    <SectionFrame
      title="JA 살펴보기"
      marker={false}
      editing={editing}
      saving={saveMutation.isPending}
      onEdit={() => setEditing(true)}
      onCancel={() => {
        setDraft(cta)
        setImageFile(null)
        setEditing(false)
      }}
      onSave={() => {
        // 이미지를 바꾸지 않았으면 imageAssetId를 생략 → 서버가 현재 이미지를 유지
        void saveMutation
          .mutateAsync({
            title: draft.title,
            body: draft.body,
            primaryLabel: draft.primaryLabel,
            primaryHref: draft.primaryHref,
            secondaryLabel: draft.secondaryLabel,
            secondaryHref: draft.secondaryHref,
            ...(imageFile
              ? { imageUrl: draft.image.url, imageFileName: draft.image.fileName, imageFile }
              : {}),
          })
          .then(
            () => {
              setEditing(false)
              showSaveCompletedAlert()
            },
            error => {
              showAlert(
                jaHistorySaveAlert(error, 'JA 살펴보기 저장에 실패했습니다. 다시 시도해 주세요.')
              )
            }
          )
      }}
    >
      <DetailInfoForm
        title="JA 살펴보기"
        hideHeader
        mode={editing ? 'edit' : 'view'}
        className="ja-history-form"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="타이틀"
            view={<HistoryCopy value={cta.title} />}
            edit={
              <InlineText
                editing={editing}
                value={draft.title}
                onChange={title => patch({ title })}
                rows={2}
                label="타이틀"
                placeholder="타이틀을 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="서브 텍스트"
            view={<HistoryCopy value={cta.body} />}
            edit={
              <InlineText
                editing={editing}
                value={draft.body}
                onChange={body => patch({ body })}
                rows={3}
                label="서브 텍스트"
                placeholder="서브 텍스트를 입력해 주세요"
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="이미지"
            view={<MediaPreview media={cta.image} size="cta" />}
            edit={
              /* Figma 2118:134439 Table / Common / Cell / File — 미리보기 72×72 · 파일명 옆 삭제 X · 파일 추가+안내 */
              <div className="file-select-image-cell">
                <div className="file-select-image-cell__preview">
                  {draft.image.url ? (
                    <img src={draft.image.url} alt={draft.image.alt || 'JA 살펴보기 이미지 미리보기'} />
                  ) : (
                    <ThumbnailPlaceholder />
                  )}
                </div>
                <FileSelectField
                  disabled={!editing}
                  multiple={false}
                  accept={JA_HISTORY_IMAGE_ACCEPT}
                  buttonLabel="파일 추가"
                  fileNames={draft.image.fileName ? [draft.image.fileName] : []}
                  maxTotalBytes={CTA_IMAGE_MAX_BYTES}
                  guideLines={IMAGE_GUIDE_LINES}
                  onFilesChange={files => {
                    void handleFilesChange(files)
                  }}
                  // CTA 이미지는 삭제 기능이 없다. 새로 고른 파일만 취소해 저장된 이미지로 되돌린다.
                  onRemoveFile={
                    imageFile
                      ? () => {
                          setDraft(prev => ({ ...prev, image: cta.image }))
                          setImageFile(null)
                        }
                      : undefined
                  }
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="CTA 버튼"
            view={
              <CtaButtonsNestedTable
                editing={false}
                primary={{ label: cta.primaryLabel, href: cta.primaryHref }}
                secondary={{ label: cta.secondaryLabel, href: cta.secondaryHref }}
                onChangePrimary={() => undefined}
                onChangeSecondary={() => undefined}
              />
            }
            edit={
              <CtaButtonsNestedTable
                editing={editing}
                primary={{ label: draft.primaryLabel, href: draft.primaryHref }}
                secondary={{ label: draft.secondaryLabel, href: draft.secondaryHref }}
                onChangePrimary={next =>
                  patch({
                    primaryLabel: next.label ?? draft.primaryLabel,
                    primaryHref: next.href ?? draft.primaryHref,
                  })
                }
                onChangeSecondary={next =>
                  patch({
                    secondaryLabel: next.label ?? draft.secondaryLabel,
                    secondaryHref: next.href ?? draft.secondaryHref,
                  })
                }
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </SectionFrame>
  )
}
