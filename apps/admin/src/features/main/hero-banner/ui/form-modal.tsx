import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Modal, Radio, Space, Typography, Upload, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { HeroBanner, HeroBannerDraft } from '../model/types'
import {
  HERO_BANNER_IMAGE_ACCEPT,
  HERO_BANNER_IMAGE_HINT,
  HERO_BANNER_IMAGE_MAX_BYTES,
} from '../model/types'
import styles from './form-modal.module.css'

const { Text } = Typography

function draftFromBanner(banner: HeroBanner | null): HeroBannerDraft {
  if (!banner) {
    return {
      active: true,
      imageUrl: '',
      imageName: undefined,
      topText: '',
      mainTitle: '',
      bottomText: '',
      linkUrl: '',
    }
  }
  return {
    active: banner.active,
    imageUrl: banner.imageUrl,
    imageName: banner.imageName,
    topText: banner.topText,
    mainTitle: banner.mainTitle,
    bottomText: banner.bottomText,
    linkUrl: banner.linkUrl,
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function HeroBannerFormModal({
  open,
  mode,
  banner,
  onCancel,
  onSubmit,
}: {
  open: boolean
  mode: 'create' | 'edit'
  banner: HeroBanner | null
  onCancel: () => void
  onSubmit: (draft: HeroBannerDraft) => void
}) {
  const [draft, setDraft] = useState<HeroBannerDraft>(() => draftFromBanner(banner))

  useEffect(() => {
    if (!open) return
    setDraft(draftFromBanner(banner))
  }, [open, banner])

  const validateImageFile = useCallback((file: File): string | null => {
    const okType =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      /\.(jpe?g|png)$/i.test(file.name)
    if (!okType) return 'JPG, PNG 형식만 등록할 수 있습니다.'
    if (file.size > HERO_BANNER_IMAGE_MAX_BYTES) return '파일은 최대 15MB까지 등록할 수 있습니다.'
    return null
  }, [])

  const handlePickFile = useCallback(
    async (file: File) => {
      const error = validateImageFile(file)
      if (error) {
        message.error(error)
        return false
      }
      try {
        const dataUrl = await readFileAsDataUrl(file)
        setDraft(prev => ({
          ...prev,
          imageUrl: dataUrl,
          imageName: file.name,
        }))
      } catch {
        message.error('이미지를 불러오지 못했습니다.')
      }
      return false
    },
    [validateImageFile]
  )

  const handleSubmit = useCallback(() => {
    if (!draft.imageUrl) {
      message.error('배너 이미지를 등록해 주세요.')
      return
    }
    onSubmit(draft)
  }, [draft, onSubmit])

  const isCreate = mode === 'create'

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={isCreate ? '히어로 배너 등록' : '히어로 배너 수정'}
      width={640}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onCancel}>취소</Button>
          <Button type="primary" onClick={handleSubmit}>
            {isCreate ? '배너 등록' : '배너 수정'}
          </Button>
        </Space>
      }
    >
      <div className={styles.form}>
        <div className={styles.field}>
          <div className={styles.label}>
            사용 여부 <span className={styles.required}>*</span>
          </div>
          <Radio.Group
            value={draft.active}
            onChange={e => setDraft(prev => ({ ...prev, active: e.target.value }))}
          >
            <Radio value={true}>사용</Radio>
            <Radio value={false}>미사용</Radio>
          </Radio.Group>
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            배너 이미지 <span className={styles.required}>*</span>
          </div>
          <Upload
            accept={HERO_BANNER_IMAGE_ACCEPT}
            showUploadList={false}
            beforeUpload={file => {
              void handlePickFile(file)
              return false
            }}
          >
            <Button icon={<PlusOutlined />}>파일 추가</Button>
          </Upload>
          <Text type="secondary" className={styles.hint}>
            {HERO_BANNER_IMAGE_HINT}
          </Text>
          {draft.imageUrl ? (
            <div className={styles.preview}>
              <img src={draft.imageUrl} alt={draft.imageName ?? '배너 미리보기'} />
              {draft.imageName ? (
                <Text type="secondary" className={styles.fileName}>
                  {draft.imageName}
                </Text>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>상단 문구</div>
          <Input
            value={draft.topText}
            onChange={e => setDraft(prev => ({ ...prev, topText: e.target.value }))}
            placeholder="상단 문구를 입력하세요"
            maxLength={100}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>메인 타이틀</div>
          <Input
            value={draft.mainTitle}
            onChange={e => setDraft(prev => ({ ...prev, mainTitle: e.target.value }))}
            placeholder="메인 타이틀을 입력하세요"
            maxLength={120}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>하단 문구</div>
          <Input
            value={draft.bottomText}
            onChange={e => setDraft(prev => ({ ...prev, bottomText: e.target.value }))}
            placeholder="하단 문구를 입력하세요"
            maxLength={200}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>연결 링크</div>
          <Input
            value={draft.linkUrl}
            onChange={e => setDraft(prev => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="연결 링크를 입력하세요"
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  )
}
