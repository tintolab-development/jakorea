import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { BookOutlined } from '@ant-design/icons'
import { CmsButton, CmsCheckbox, CmsInput, CmsRadio, CmsSelect } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DetailFullPageModal } from '@/shared/ui/detail-fullpage-modal'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import { isAwaitingFirstQueryData } from '@/shared/lib/is-awaiting-first-query-data'
import {
  DetailModalSidebar,
  type DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import {
  type TextbookBusinessArea,
} from '@/features/textbook/model/textbook-business-areas'
import { useTextbookBusinessAreaSelectOptions } from '@/features/textbook/hooks/use-business-areas-query'
import { useTextbookDetailQuery } from '@/features/textbook/hooks/use-textbook-detail-query'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import type {
  TextbookCreateInput,
  TextbookEducationStage,
  TextbookRow,
} from '@/features/textbook/model/textbook.types'
import {
  getStageAllLabel,
  getStageOptionLabels,
  isEducationStageGradeSelected,
  isEducationStageMasterChecked,
  normalizeEducationStages,
  summarizeEducationStages,
  toggleEducationStageAll,
  toggleEducationStageGrade,
} from '@/features/textbook/lib/textbook-education-stages'
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
  textbookId: string | null
  /** 목록 행 — 본문 선표시용이 아니라 셸 식별·mock 폴백용 */
  listTextbook: TextbookRow | null
  mode: 'view' | 'edit'
  onClose: () => void
  onEdit: () => void
  onSave: (payload: TextbookCreateInput) => void
}

export function TextbookDetailFullPageModal(props: TextbookDetailFullPageModalProps) {
  if (!props.open || !props.textbookId) return null
  return <TextbookDetailFullPageModalInner key={props.textbookId} {...props} textbookId={props.textbookId} />
}

type TextbookDetailFullPageModalInnerProps = Omit<TextbookDetailFullPageModalProps, 'textbookId'> & {
  textbookId: string
}

function TextbookDetailFullPageModalInner({
  open,
  textbookId,
  listTextbook,
  mode,
  onClose,
  onEdit,
  onSave,
}: TextbookDetailFullPageModalInnerProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const remoteEnabled = useDataManagementRemoteEnabled('textbooks', open)
  const { options: businessAreaOptions } = useTextbookBusinessAreaSelectOptions()
  const detailQuery = useTextbookDetailQuery(textbookId, open)
  const textbook = detailQuery.data ?? (remoteEnabled ? null : listTextbook)
  const isDetailLoading = remoteEnabled && isAwaitingFirstQueryData(detailQuery)
  const isDetailError = remoteEnabled && detailQuery.isError
  const [editForm, setEditForm] = useState<TextbookEditForm | null>(() =>
    textbook ? toEditForm(textbook) : null
  )

  useEffect(() => {
    if (!textbook) {
      setEditForm(null)
      return
    }
    setEditForm(toEditForm(textbook))
  }, [textbook])

  const isEditMode = mode === 'edit'
  const titleSource = textbook ?? listTextbook
  const title = titleSource
    ? `${titleSource.businessArea}_${titleSource.textbookName}`
    : '교재 상세'
  const headerBreadcrumbItems = [
    makeBreadcrumbItem(
      '교재 관리',
      location.pathname,
      buildSearchParams(searchParams, { delete: ['textbookId', 'textbookMode'] })
    ),
    { label: title },
  ]

  const handleSave = () => {
    if (!editForm) return
    const payload = toSubmitPayload(editForm)
    if (!payload) {
      return
    }
    onSave(payload)
  }

  const showBody = Boolean(textbook && editForm) && !isDetailLoading && !isDetailError

  return (
    <DetailFullPageModal
      open={open}
      onClose={onClose}
      title={title}
      loading={isDetailLoading}
      error={
        isDetailError
          ? '상세를 불러오지 못했습니다.'
          : !isDetailLoading && !textbook
            ? '교재를 찾을 수 없습니다.'
            : null
      }
      headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
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
        showBody ? (
          <div className="textbook-detail-fullpage-modal__header-actions">
            <CmsButton variant="primary" size="medium" onClick={isEditMode ? handleSave : onEdit}>
              {isEditMode ? '저장' : '정보 수정'}
            </CmsButton>
          </div>
        ) : null
      }
    >
      {showBody && textbook && editForm ? (
      <div className="textbook-detail-fullpage-modal__root">
        <section
          className="textbook-detail-fullpage-modal__basic-info-section"
          aria-label="기본 정보"
        >
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
                    <DetailInfoForm.InputsSeparator />
                    <span>{textbook.registrant}</span>
                  </div>
                }
              />
            </DetailInfoForm.Row>
          </DetailInfoForm>
          <DetailInfoForm title="기본 정보" hideHeader mode={isEditMode ? 'edit' : 'view'}>
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="교재명 (국문)"
                required
                view={<span>{textbook.textbookName}</span>}
                edit={
                  <CmsInput
                    value={editForm.textbookName}
                    onChange={event =>
                      setEditForm(prev =>
                        prev ? { ...prev, textbookName: event.target.value } : prev
                      )
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
                      setEditForm(prev =>
                        prev ? { ...prev, textbookNameEn: event.target.value } : prev
                      )
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
                      setEditForm(prev =>
                        prev
                          ? {
                              ...prev,
                              businessArea: (value ?? '') as TextbookBusinessArea,
                            }
                          : prev
                      )
                    }
                    options={businessAreaOptions}
                    style={{ width: 220 }}
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
                          ? {
                              ...prev,
                              useStatus: event.target.value as TextbookCreateInput['useStatus'],
                            }
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

        <DetailInfoForm
          title="교육 대상"
          className="textbook-detail-fullpage-modal__education-form"
        >
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
                          educationStages: toggleEducationStageAll(prev.educationStages, stage.key),
                        }
                      })
                    }}
                    onToggleOption={label => {
                      setEditForm(prev => {
                        if (!prev) return prev
                        return {
                          ...prev,
                          educationStages: toggleEducationStageGrade(
                            prev.educationStages,
                            stage.key,
                            label
                          ),
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
      ) : null}
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
  const allLabel = getStageAllLabel(stage.key)
  const masterChecked = isEducationStageMasterChecked(stage)

  return (
    <div className="textbook-detail-fullpage-modal__stage">
      {editable ? (
        <CmsCheckbox checked={masterChecked} onChange={onToggleAll} checkboxSize="medium">
          {allLabel}
        </CmsCheckbox>
      ) : (
        <CmsCheckbox checked={masterChecked} disabled checkboxSize="medium">
          {allLabel}
        </CmsCheckbox>
      )}
      {optionLabels.map(label => {
        const selected = isEducationStageGradeSelected(stage, label)
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
              <CmsCheckbox checked={selected} disabled checkboxSize="medium">
                {label}
              </CmsCheckbox>
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
  businessArea: TextbookBusinessArea
  useStatus: TextbookCreateInput['useStatus']
  educationStages: TextbookEducationStage[]
}

function toEditForm(textbook: TextbookRow): TextbookEditForm {
  return {
    textbookName: textbook.textbookName,
    textbookNameEn: textbook.textbookNameEn,
    businessArea: textbook.businessArea,
    useStatus: textbook.useStatus,
    educationStages: normalizeEducationStages(
      textbook.educationStages,
      textbook.educationTarget,
      textbook.grade
    ).map(stage => ({
      ...stage,
      grades: stage.grades?.map(grade => ({ ...grade })),
    })),
  }
}

function toSubmitPayload(form: TextbookEditForm): TextbookCreateInput | null {
  const summary = summarizeEducationStages(form.educationStages)
  const hasSelection = form.educationStages.some(
    stage => stage.selected || (stage.grades ?? []).some(grade => grade.selected)
  )
  if (!hasSelection) return null

  return {
    textbookName: form.textbookName.trim(),
    textbookNameEn: form.textbookNameEn.trim(),
    businessArea: form.businessArea,
    useStatus: form.useStatus,
    educationTarget: summary.educationTarget,
    grade: summary.grade,
    educationStages: form.educationStages.map(stage => ({
      ...stage,
      grades: stage.grades?.map(grade => ({ ...grade })),
    })),
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
