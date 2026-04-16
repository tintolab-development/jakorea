import { useState } from 'react'
import { AppButton, ContentModal } from '@/shared/ui'
import './notification-settings-modal.css'

type NotificationSettingValue = 'enabled' | 'disabled'

interface NotificationSettingItem {
  id: string
  label: string
}

const NOTIFICATION_SETTING_ITEMS: NotificationSettingItem[] = [
  { id: 'item-1', label: '알림 항목명 1' },
  { id: 'item-2', label: '알림 항목명 2' },
  { id: 'item-3', label: '알림 항목명 3' },
]

interface NotificationSettingsModalProps {
  open: boolean
  onCancel: () => void
  onSave?: (settings: Record<string, NotificationSettingValue>) => void
}

export function NotificationSettingsModal({ open, onCancel, onSave }: NotificationSettingsModalProps) {
  const [settings, setSettings] = useState<Record<string, NotificationSettingValue>>({
    'item-1': 'enabled',
    'item-2': 'enabled',
    'item-3': 'enabled',
  })

  const handleChange = (id: string, value: NotificationSettingValue) => {
    setSettings(prev => ({ ...prev, [id]: value }))
  }

  const handleSave = () => {
    onSave?.(settings)
    onCancel()
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="알림 설정"
      description="알림을 받으실 항목을 설정해 주세요."
      width={800}
      className="notification-settings-modal"
      footer={
        <>
          <AppButton variant="cancel" size="large" onClick={onCancel}>
            닫기
          </AppButton>
          <AppButton variant="primary" size="large" onClick={handleSave}>
            설정
          </AppButton>
        </>
      }
    >
      <div className="notification-settings-modal__table" role="table" aria-label="알림 항목 설정">
        {NOTIFICATION_SETTING_ITEMS.map(item => {
          const value = settings[item.id] ?? 'enabled'
          return (
            <div className="notification-settings-modal__row" role="row" key={item.id}>
              <div className="notification-settings-modal__th" role="rowheader">
                {item.label}
              </div>
              <div className="notification-settings-modal__td" role="cell">
                <label className="notification-settings-modal__option">
                  <input
                    type="radio"
                    name={item.id}
                    checked={value === 'enabled'}
                    onChange={() => handleChange(item.id, 'enabled')}
                  />
                  <span className="notification-settings-modal__option-label notification-settings-modal__option-label--enabled">
                    설정
                  </span>
                </label>
                <label className="notification-settings-modal__option">
                  <input
                    type="radio"
                    name={item.id}
                    checked={value === 'disabled'}
                    onChange={() => handleChange(item.id, 'disabled')}
                  />
                  <span className="notification-settings-modal__option-label">해제</span>
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </ContentModal>
  )
}
