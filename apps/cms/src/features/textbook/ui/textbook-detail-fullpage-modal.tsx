import { useEffect, useState } from 'react'
import { BookOutlined } from '@ant-design/icons'
import { message } from 'antd'
import { CmsButton, CmsCheckbox, CmsInput, CmsRadio, CmsSelect } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailModalSidebar, type DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import type { TextbookCreateInput, TextbookEducationStage, TextbookRow } from '@/features/textbook/model/textbook.types'
import './textbook-detail-fullpage-modal.css'

const TEXTBOOK_DETAIL_LNB_ITEMS: DetailModalSidebarNavItem[] = [
  {
    key: 'textbook-detail',
    label: '교재 정보',
    icon: <BookOutlined className="detail-fullpage-modal__lnb-icon" />,
  },
]

export interface TextbookDetailFullPageModalProps {
  open: boolean
  textbook: TextbookRow | null
  mode: 'view' | 'edit'
  onClose: () => void
  onEdit: () => void
  onSave: (payload: TextbookCreateInput) => void
}

export function TextbookDetailFullPageModal({
  open,
  textbook,
  mode,
  onClose,
  onEdit,
  onSave,
}: TextbookDetailFullPageModalProps) {
  const [editForm, setEditForm] = useState<TextbookEditForm | null>(null)

  useEffect(() => {
    if (!open || !textbook) return
    setEditForm(toEditForm(textbook))
  }, [open, textbook])

  const isEditMode = mode === 'edit'
  if (!open || !textbook) return null
  if (!editForm) return null

  const handleSave = () => {
    const payload = toSubmitPayload(editForm)
    if (!payload) {
      message.warning('교육 대상을 1개 이상 선택해 주세요.')
      return
    }
    onSave(payload)
  }

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={`${textbook.businessArea}_${textbook.textbookName}`}
      className="textbook-detail-fullpage-modal"
      sidebar={
        <DetailModalSidebar
          navAriaLabel="교재 상세 메뉴"
          items={TEXTBOOK_DETAIL_LNB_ITEMS}
          activeKey="textbook-detail"
          activeChildKey=""
          expandedGroupKeys={[]}
          onSelectTop={() => {}}
          onSelectChild={() => {}}
        />
      }
      contentExtra={
        <div className="textbook-detail-fullpage-modal__header-actions">
          <CmsButton variant="primary" size="medium" onClick={isEditMode ? handleSave : onEdit}>
            {isEditMode ? '저장' : '정보 수정'}
          </CmsButton>
        </div>
      }
    >
      <div className="textbook-detail-fullpage-modal__root">
        <section className="textbook-detail-fullpage-modal__basic-info-section" aria-label="기본 정보">
          {!isEditMode ? (
            <DetailInfoForm title="기본 정보">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="등록일"
                  view={
                    <div
                      className="textbook-detail-fullpage-modal__registered-value"
                      role="group"
                      aria-label="등록일 정보"
                    >
                      <span>{formatDate(textbook.registeredAt)}</span>
                      <span className="textbook-detail-fullpage-modal__registered-divider" aria-hidden>
                        |
                      </span>
                      <span>{textbook.registrant}</span>
                    </div>
                  }
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          ) : null}
          <DetailInfoForm title="기본 정보" hideHeader={!isEditMode} mode={isEditMode ? 'edit' : 'view'}>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="교재명 (국문)"
                required
                view={<span>{textbook.textbookName}</span>}
                edit={
                  <CmsInput
                    value={editForm.textbookName}
                    onChange={event =>
                      setEditForm(prev => (prev ? { ...prev, textbookName: event.target.value } : prev))
                    }
                    inputSize="medium"
                    width="100%"
                  />
                }
              />
              <DetailInfoForm.Field
                label="교재명 (영문)"
                required
                view={<span>{textbook.textbookNameEn}</span>}
                edit={
                  <CmsInput
                    value={editForm.textbookNameEn}
                    onChange={event =>
                      setEditForm(prev => (prev ? { ...prev, textbookNameEn: event.target.value } : prev))
                    }
                    inputSize="medium"
                    width="100%"
                  />
                }
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="교육 분야"
                required
                view={<span>{textbook.businessArea}</span>}
                edit={
                  <CmsSelect
                    inputSize="medium"
                    value={editForm.businessArea}
                    onChange={value =>
                      setEditForm(prev => (prev ? { ...prev, businessArea: String(value ?? '') } : prev))
                    }
                    options={[
                      { label: '기업가정신', value: '기업가정신' },
                      { label: '금융교육', value: '금융교육' },
                      { label: '진로교육', value: '진로교육' },
                    ]}
                    style={{ width: 180 }}
                  />
                }
              />
              <DetailInfoForm.Field
                label="사용 여부"
                view={<span>{textbook.useStatus === 'USED' ? '사용' : '미사용'}</span>}
                required
                edit={
                  <CmsRadio.Group
                    className="textbook-detail-fullpage-modal__use-status-radio"
                    value={editForm.useStatus}
                    onChange={event =>
                      setEditForm(prev =>
                        prev
                          ? { ...prev, useStatus: event.target.value as TextbookCreateInput['useStatus'] }
                          : prev
                      )
                    }
                  >
                    <CmsRadio value="USED">사용</CmsRadio>
                    <CmsRadio value="UNUSED">미사용</CmsRadio>
                  </CmsRadio.Group>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
        </section>

        <DetailInfoForm title="교육 대상" className="textbook-detail-fullpage-modal__education-form">
          {editForm.educationStages.map(stage => (
            <DetailInfoForm.Row key={stage.key} type="single">
              <DetailInfoForm.Field
                label={stage.label}
                required
                mode={isEditMode ? 'edit' : 'view'}
                view={<EducationStageView stage={stage} />}
                edit={
                  <EducationStageView
                    stage={stage}
                    editable
                    onToggleAll={() => {
                      setEditForm(prev => {
                        if (!prev) return prev
                        return {
                          ...prev,
                          educationStages: prev.educationStages.map(current => {
                            if (current.key !== stage.key) return current
                            const nextSelected = !current.selected
                            return {
                              ...current,
                              selected: nextSelected,
                              grades: current.grades?.map(grade => ({
                                ...grade,
                                selected: nextSelected,
                              })),
                            }
                          }),
                        }
                      })
                    }}
                    onToggleOption={label => {
                      setEditForm(prev => {
                        if (!prev) return prev
                        return {
                          ...prev,
                          educationStages: prev.educationStages.map(current => {
                            if (current.key !== stage.key) return current
                            const nextGrades = current.grades?.map(grade =>
                              grade.label === label ? { ...grade, selected: !grade.selected } : grade
                            )
                            const hasSelectedOption = nextGrades?.some(grade => grade.selected) ?? false
                            const allSelected =
                              (nextGrades?.length ?? 0) > 0 &&
                              (nextGrades?.every(grade => grade.selected) ?? false)
                            return {
                              ...current,
                              selected: allSelected || (stage.key === 'kindergarten' && hasSelectedOption),
                              grades: nextGrades,
                            }
                          }),
                        }
                      })
                    }}
                  />
                }
              />
            </DetailInfoForm.Row>
          ))}
        </DetailInfoForm>
      </div>
    </DetailFullPageModal>
  )
}

function EducationStageView({
  stage,
  editable = false,
  onToggleAll,
  onToggleOption,
}: {
  stage: TextbookEducationStage
  editable?: boolean
  onToggleAll?: () => void
  onToggleOption?: (label: string) => void
}) {
  const optionLabels = getStageOptionLabels(stage.key)
  const gradeSelectedMap = new Map((stage.grades ?? []).map(grade => [grade.label, grade.selected]))
  const allLabel = getStageAllLabel(stage.key)

  return (
    <div className="textbook-detail-fullpage-modal__stage">
      {editable ? (
        <CmsCheckbox checked={stage.selected} onChange={onToggleAll} checkboxSize="medium">
          {allLabel}
        </CmsCheckbox>
      ) : (
        <label className="textbook-detail-fullpage-modal__check">
          <input type="checkbox" checked={stage.selected} disabled />
          <span>{allLabel}</span>
        </label>
      )}
      {optionLabels.map(label => {
        const selected = gradeSelectedMap.get(label) ?? (stage.key === 'kindergarten' && stage.selected)
        return (
          <span key={label}>
            {editable ? (
              <CmsCheckbox
                checked={selected}
                onChange={() => onToggleOption?.(label)}
                checkboxSize="medium"
              >
                {label}
              </CmsCheckbox>
            ) : (
              <label className="textbook-detail-fullpage-modal__check">
                <input type="checkbox" checked={selected} disabled />
                <span>{label}</span>
              </label>
            )}
          </span>
        )
      })}
    </div>
  )
}

type TextbookEditForm = {
  textbookName: string
  textbookNameEn: string
  businessArea: string
  useStatus: TextbookCreateInput['useStatus']
  educationStages: TextbookEducationStage[]
}

function toEditForm(textbook: TextbookRow): TextbookEditForm {
  return {
    textbookName: textbook.textbookName,
    textbookNameEn: textbook.textbookNameEn,
    businessArea: textbook.businessArea,
    useStatus: textbook.useStatus,
    educationStages: textbook.educationStages.map(stage => ({
      ...stage,
      grades:
        stage.grades?.map(grade => ({ ...grade })) ??
        (stage.key === 'kindergarten'
          ? ['유아', '유치원생'].map(label => ({
              label,
              selected: stage.selected,
            }))
          : undefined),
    })),
  }
}

function toSubmitPayload(form: TextbookEditForm): TextbookCreateInput | null {
  const selectedStage =
    form.educationStages.find(stage => stage.selected) ??
    form.educationStages.find(stage => (stage.grades ?? []).some(grade => grade.selected)) ??
    null

  if (!selectedStage) return null

  const selectedGrades = selectedStage?.grades?.filter(grade => grade.selected).map(grade => grade.label) ?? []
  const grade = selectedGrades.length === 0 || selectedGrades.length >= 2 ? '전학년' : selectedGrades[0]

  return {
    textbookName: form.textbookName.trim(),
    textbookNameEn: form.textbookNameEn.trim(),
    businessArea: form.businessArea,
    useStatus: form.useStatus,
    educationTarget: mapStageKeyToEducationTarget(selectedStage?.key ?? 'elementary'),
    grade,
    educationStages: form.educationStages.map(stage => ({
      ...stage,
      grades: stage.grades?.map(grade => ({ ...grade })),
    })),
  }
}

function mapStageKeyToEducationTarget(stageKey: TextbookEducationStage['key']): string {
  switch (stageKey) {
    case 'kindergarten':
      return '유아'
    case 'elementary':
      return '초등학교'
    case 'middle':
      return '중학교'
    case 'high':
      return '고등학교'
    case 'university':
      return '대학교'
    default:
      return '초등학교'
  }
}

function getStageAllLabel(stageKey: TextbookEducationStage['key']): string {
  switch (stageKey) {
    case 'elementary':
    case 'middle':
    case 'high':
      return '전학년'
    default:
      return '전체'
  }
}

function getStageOptionLabels(stageKey: TextbookEducationStage['key']): string[] {
  switch (stageKey) {
    case 'kindergarten':
      return ['유아', '유치원생']
    case 'elementary':
      return ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']
    case 'middle':
    case 'high':
      return ['1학년', '2학년', '3학년']
    case 'university':
      return []
    default:
      return []
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}(${getWeekday(date)}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getWeekday(date: Date): string {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return weekdays[date.getDay()] ?? '-'
}
