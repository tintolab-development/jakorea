import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Radio,
  Space,
  Typography,
  Upload,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { MainPopup, MainPopupDraft } from '../model/types'
import {
  MAIN_POPUP_IMAGE_ACCEPT,
  MAIN_POPUP_IMAGE_HINT,
  MAIN_POPUP_IMAGE_MAX_BYTES,
} from '../model/types'
import { formatPopupDateTime } from '../lib/format'
import styles from './form-modal.module.css'

const { Text } = Typography
const { RangePicker } = DatePicker

function draftFromPopup(popup: MainPopup | null): MainPopupDraft {
  if (!popup) {
    return {
      active: true,
      imageUrl: '',
      imageName: undefined,
      name: '',
      altText: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      linkEnabled: false,
      linkUrl: '',
    }
  }
  return {
    active: popup.active,
    imageUrl: popup.imageUrl,
    imageName: popup.imageName,
    name: popup.name,
    altText: popup.altText,
    startDate: popup.startDate,
    endDate: popup.endDate,
    linkEnabled: popup.linkEnabled,
    linkUrl: popup.linkUrl,
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

export function MainPopupFormModal({
  open,
  mode,
  popup,
  onCancel,
  onSubmit,
  onDelete,
}: {
  open: boolean
  mode: 'create' | 'edit'
  popup: MainPopup | null
  onCancel: () => void
  onSubmit: (draft: MainPopupDraft) => void
  onDelete?: () => void
}) {
  const [draft, setDraft] = useState<MainPopupDraft>(() => draftFromPopup(popup))

  useEffect(() => {
    if (!open) return
    setDraft(draftFromPopup(popup))
  }, [open, popup])

  const handlePickFile = useCallback(async (file: File) => {
    const okType =
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      /\.(jpe?g|png)$/i.test(file.name)
    if (!okType) {
      message.error('JPG, PNG 형식만 등록할 수 있습니다.')
      return false
    }
    if (file.size > MAIN_POPUP_IMAGE_MAX_BYTES) {
      message.error('파일은 최대 15MB까지 등록할 수 있습니다.')
      return false
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setDraft(prev => ({ ...prev, imageUrl: dataUrl, imageName: file.name }))
    } catch {
      message.error('이미지를 불러오지 못했습니다.')
    }
    return false
  }, [])

  const handleSubmit = useCallback(() => {
    if (!draft.imageUrl) {
      message.error('이미지를 등록해 주세요.')
      return
    }
    if (!draft.name.trim()) {
      message.error('팝업명을 입력해 주세요.')
      return
    }
    if (!draft.startDate || !draft.endDate) {
      message.error('게시 기간을 지정해 주세요.')
      return
    }
    if (dayjs(draft.endDate).isBefore(dayjs(draft.startDate), 'day')) {
      message.error('종료일은 시작일 이후여야 합니다.')
      return
    }
    if (draft.linkEnabled && !draft.linkUrl.trim()) {
      message.error('연결 링크를 입력해 주세요.')
      return
    }
    onSubmit(draft)
  }, [draft, onSubmit])

  const rangeValue: [Dayjs, Dayjs] | null =
    draft.startDate && draft.endDate
      ? [dayjs(draft.startDate), dayjs(draft.endDate)]
      : null

  const isCreate = mode === 'create'

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={isCreate ? '팝업 등록' : '팝업 수정'}
      width={640}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          {!isCreate && onDelete ? (
            <Button danger onClick={onDelete}>
              팝업 삭제
            </Button>
          ) : (
            <span />
          )}
          <Space>
            <Button onClick={onCancel}>취소</Button>
            <Button type="primary" onClick={handleSubmit}>
              {isCreate ? '팝업 등록' : '팝업 수정'}
            </Button>
          </Space>
        </div>
      }
    >
      <div className={styles.form}>
        {!isCreate && popup ? (
          <div className={styles.metaRow}>
            <div className={styles.field}>
              <div className={styles.label}>등록일시</div>
              <Text>{formatPopupDateTime(popup.createdAt)}</Text>
            </div>
            <div className={styles.field}>
              <div className={styles.label}>사용 여부</div>
              <Radio.Group
                value={draft.active}
                onChange={e => setDraft(prev => ({ ...prev, active: e.target.value }))}
              >
                <Radio value={true}>사용</Radio>
                <Radio value={false}>미사용</Radio>
              </Radio.Group>
            </div>
          </div>
        ) : (
          <div className={styles.field}>
            <div className={styles.label}>사용 여부</div>
            <Radio.Group
              value={draft.active}
              onChange={e => setDraft(prev => ({ ...prev, active: e.target.value }))}
            >
              <Radio value={true}>사용</Radio>
              <Radio value={false}>미사용</Radio>
            </Radio.Group>
          </div>
        )}

        <div className={styles.field}>
          <div className={styles.label}>
            이미지 <span className={styles.required}>*</span>
          </div>
          <Upload
            accept={MAIN_POPUP_IMAGE_ACCEPT}
            showUploadList={false}
            beforeUpload={file => {
              void handlePickFile(file)
              return false
            }}
          >
            <Button icon={<PlusOutlined />}>파일 추가</Button>
          </Upload>
          <Text type="secondary" className={styles.hint}>
            {MAIN_POPUP_IMAGE_HINT}
          </Text>
          {draft.imageUrl ? (
            <div className={styles.preview}>
              <img src={draft.imageUrl} alt={draft.altText || draft.imageName || '미리보기'} />
            </div>
          ) : null}
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            팝업명 <span className={styles.required}>*</span>
          </div>
          <Input
            value={draft.name}
            onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
            placeholder="팝업명을 입력하세요"
            maxLength={100}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>대체 텍스트</div>
          <Input
            value={draft.altText}
            onChange={e => setDraft(prev => ({ ...prev, altText: e.target.value }))}
            placeholder="대체 텍스트를 입력하세요"
            maxLength={200}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>
            게시 기간 <span className={styles.required}>*</span>
          </div>
          <RangePicker
            value={rangeValue}
            onChange={dates => {
              setDraft(prev => ({
                ...prev,
                startDate: dates?.[0]?.format('YYYY-MM-DD') ?? '',
                endDate: dates?.[1]?.format('YYYY-MM-DD') ?? '',
              }))
            }}
            style={{ width: '100%' }}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>연결 링크</div>
          <Radio.Group
            value={draft.linkEnabled}
            onChange={e => setDraft(prev => ({ ...prev, linkEnabled: e.target.value }))}
          >
            <Radio value={true}>연결</Radio>
            <Radio value={false}>미연결</Radio>
          </Radio.Group>
          <Input
            value={draft.linkUrl}
            disabled={!draft.linkEnabled}
            onChange={e => setDraft(prev => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="연결 링크를 입력하세요"
            maxLength={500}
          />
        </div>
      </div>
    </Modal>
  )
}
