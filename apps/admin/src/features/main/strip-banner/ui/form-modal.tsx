import { useCallback, useEffect, useState } from 'react'
import { Button, DatePicker, Input, Modal, Radio, Space, Typography, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { StripBanner, StripBannerDraft } from '../model/types'
import { STRIP_BANNER_TEXT_MAX } from '../model/types'
import { formatPopupDateTime } from '@/features/main/popup/lib/format'
import styles from './form-modal.module.css'

const { Text } = Typography
const { RangePicker } = DatePicker

function draftFromBanner(banner: StripBanner | null): StripBannerDraft {
  if (!banner) {
    return {
      active: true,
      text: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      linkEnabled: false,
      linkUrl: '',
    }
  }
  return {
    active: banner.active,
    text: banner.text,
    startDate: banner.startDate,
    endDate: banner.endDate,
    linkEnabled: banner.linkEnabled,
    linkUrl: banner.linkUrl,
  }
}

export function StripBannerFormModal({
  open,
  mode,
  banner,
  onCancel,
  onSubmit,
  onDelete,
}: {
  open: boolean
  mode: 'create' | 'edit'
  banner: StripBanner | null
  onCancel: () => void
  onSubmit: (draft: StripBannerDraft) => void
  onDelete?: () => void
}) {
  const [draft, setDraft] = useState<StripBannerDraft>(() => draftFromBanner(banner))

  useEffect(() => {
    if (!open) return
    setDraft(draftFromBanner(banner))
  }, [open, banner])

  const handleSubmit = useCallback(() => {
    if (!draft.text.trim()) {
      message.error('배너 문구를 입력해 주세요.')
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
      title={isCreate ? '띠배너 등록' : '띠배너 수정'}
      width={640}
      destroyOnClose
      footer={
        <div className={styles.footer}>
          {!isCreate && onDelete ? (
            <Button danger onClick={onDelete}>
              배너 삭제
            </Button>
          ) : (
            <span />
          )}
          <Space>
            <Button onClick={onCancel}>취소</Button>
            <Button type="primary" onClick={handleSubmit}>
              {isCreate ? '배너 등록' : '배너 수정'}
            </Button>
          </Space>
        </div>
      }
    >
      <div className={styles.form}>
        {!isCreate && banner ? (
          <div className={styles.metaRow}>
            <div className={styles.field}>
              <div className={styles.label}>등록일시</div>
              <Text>{formatPopupDateTime(banner.createdAt)}</Text>
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
            배너 문구 <span className={styles.required}>*</span>
          </div>
          <Input
            value={draft.text}
            onChange={e => setDraft(prev => ({ ...prev, text: e.target.value }))}
            placeholder="배너 문구를 입력하세요"
            maxLength={STRIP_BANNER_TEXT_MAX}
            showCount
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
