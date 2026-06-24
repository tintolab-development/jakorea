import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ContentModal, CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  RegionAttendanceManagerAssignments,
  RegionAttendanceManagerScheduleItem,
} from './attendance-manager'
import './attendance-manager-modal.css'

const MODAL_Z_INDEX = 1100

export type RegionAttendanceManagerModalProps = {
  open: boolean
  scheduleItems: ReadonlyArray<RegionAttendanceManagerScheduleItem>
  onCancel: () => void
  onSave: (assignments: RegionAttendanceManagerAssignments) => void
}

export function RegionAttendanceManagerModal({
  open,
  scheduleItems,
  onCancel,
  onSave,
}: RegionAttendanceManagerModalProps) {
  const { showAlert } = useCmsAlert()
  const [selections, setSelections] = useState<Record<string, string | undefined>>({})
  const scheduleItemRows = useMemo(() => {
    const rows: RegionAttendanceManagerScheduleItem[][] = []
    for (let i = 0; i < scheduleItems.length; i += 2) {
      rows.push(scheduleItems.slice(i, i + 2))
    }
    return rows
  }, [scheduleItems])

  useEffect(() => {
    if (!open) return

    const initial: Record<string, string | undefined> = {}
    for (const item of scheduleItems) {
      initial[item.columnId] = item.currentManagerId
    }
    setSelections(initial)
  }, [open, scheduleItems])

  const handleCancel = useCallback(() => {
    setSelections({})
    onCancel()
  }, [onCancel])

  const handleSave = useCallback(() => {
    const missingLabels = scheduleItems
      .filter(item => {
        if (item.volunteerOptions.length === 0) return false
        const selected = selections[item.columnId]
        return (
          selected == null ||
          !item.volunteerOptions.some(option => option.value === selected)
        )
      })
      .map(item => item.label)

    if (missingLabels.length > 0) {
      showAlert({
        title: '안내',
        content:
          missingLabels.length === 1
            ? `**[${missingLabels[0]}]** 일정의 출결 담당자를 선택해 주세요.`
            : `출결 담당자를 지정하지 않은 일정이 있습니다.\n${missingLabels.map(label => `· ${label}`).join('\n')}`,
      })
      return
    }

    const assignments: RegionAttendanceManagerAssignments = {}
    for (const item of scheduleItems) {
      const volunteerId = selections[item.columnId]
      if (volunteerId && item.volunteerOptions.some(option => option.value === volunteerId)) {
        assignments[item.columnId] = volunteerId
      }
    }

    onSave(assignments)
    setSelections({})
  }, [onSave, scheduleItems, selections, showAlert])

  const footer = (
    <div className="ujat-region-attendance-manager-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" type="button" onClick={handleSave}>
        저장
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="출결 담당자 설정"
      width={1000}
      zIndex={MODAL_Z_INDEX}
      className="ujat-region-attendance-manager-modal"
      wrapClassName="ujat-region-attendance-manager-modal-wrap"
      footer={footer}
      description="교육 진행일정 별로 출결 담당자를 지정해 주세요."
    >
      <div className="ujat-region-attendance-manager-modal__scroll">
        <DetailInfoForm
          title="출결 담당자 설정"
          hideHeader
          mode="edit"
          className="ujat-region-attendance-manager-modal__form"
        >
          {scheduleItemRows.map(row => (
            <DetailInfoForm.Row
              key={row.map(item => item.columnId).join('-')}
              type="double"
              className={
                row.length === 1 ? 'ujat-region-attendance-manager-modal__row--single-item' : undefined
              }
            >
              {row.map(item => (
                <DetailInfoForm.Field
                  key={item.columnId}
                  label={item.label}
                  labelWidth={240}
                  view={selections[item.columnId] ?? '-'}
                  edit={
                    <CmsSelect
                      inputSize="large"
                      width="100%"
                      withAllOption={false}
                      placeholder={
                        item.volunteerOptions.length === 0
                          ? '배정된 봉사자가 없습니다'
                          : '출결 담당자를 선택해 주세요'
                      }
                      value={selections[item.columnId]}
                      disabled={item.volunteerOptions.length === 0}
                      onChange={value =>
                        setSelections(prev => ({
                          ...prev,
                          [item.columnId]: value == null ? undefined : String(value),
                        }))
                      }
                      options={[...item.volunteerOptions]}
                      aria-label={`${item.label} 출결 담당자`}
                    />
                  }
                />
              ))}
            </DetailInfoForm.Row>
          ))}
        </DetailInfoForm>
      </div>
    </ContentModal>
  )
}
