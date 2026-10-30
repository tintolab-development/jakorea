import { useEffect, useMemo, useState } from 'react'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import { CmsButton, CmsInput, CmsRadio, CmsSelect, ContentModal, useCmsAlert } from '@/shared/ui'
import {
  isTextbookRegisterBusinessAreaFilled,
  type TextbookBusinessArea,
} from '@/features/textbook/model/textbook-business-areas'
import { useTextbookBusinessAreaSelectOptions } from '@/features/textbook/hooks/use-business-areas-query'
import {
  TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS,
  TEXTBOOK_EDUCATION_TARGETS,
  type TextbookEducationTarget,
} from '@/features/textbook/model/textbook-education-targets'
import {
  gradesByTargetFromRegisterValues,
  syncTextbookRegisterGradesAfterTargetsChange,
  nextTextbookRegisterGradeValuesForTargets,
  parseTextbookRegisterGradeValuesForTargets,
  parseTextbookRegisterGradeValuesFromStages,
  textbookRegisterGradeOptionsForTargets,
} from '@/features/textbook/model/textbook-grade-options'
import {
  buildEducationStagesFromSelections,
  parseEducationTargetLabels,
  summarizeEducationStages,
} from '@/features/textbook/lib/textbook-education-stages'
import type { TextbookCreateInput } from '@/features/textbook/model/textbook.types'
import './textbook-register-modal.css'

export type TextbookRegisterPayload = TextbookCreateInput

export interface TextbookRegisterModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (payload: TextbookRegisterPayload) => void
  initialValues?: Partial<TextbookRegisterPayload> | null
  mode?: 'create' | 'edit'
}

type RegisterFormState = Omit<
  TextbookCreateInput,
  'businessArea' | 'educationStages' | 'educationTarget' | 'grade' | 'useStatus'
> & {
  textbookName: string
  textbookNameEn: string
  businessArea: TextbookBusinessArea | ''
  educationTargets: TextbookEducationTarget[]
  grades: string[]
  useStatus: TextbookCreateInput['useStatus'] | ''
}

const emptyForm = (): RegisterFormState => ({
  useStatus: '',
  textbookName: '',
  textbookNameEn: '',
  businessArea: '',
  educationTargets: [],
  grades: [],
})

function orderedEducationTargets(values: readonly string[]): TextbookEducationTarget[] {
  const selected = new Set(values)
  return TEXTBOOK_EDUCATION_TARGETS.filter(target => selected.has(target))
}

function toRegisterForm(initialValues?: Partial<TextbookRegisterPayload> | null): RegisterFormState {
  const fromStages = parseTextbookRegisterGradeValuesFromStages(initialValues?.educationStages)
  const educationTargets =
    fromStages.targets.length > 0
      ? fromStages.targets
      : parseEducationTargetLabels(initialValues?.educationTarget ?? '')
  return {
    useStatus: initialValues?.useStatus ?? '',
    textbookName: initialValues?.textbookName ?? '',
    textbookNameEn: initialValues?.textbookNameEn ?? '',
    businessArea: initialValues?.businessArea ?? '',
    educationTargets,
    grades:
      fromStages.grades.length > 0
        ? syncTextbookRegisterGradesAfterTargetsChange(
            educationTargets,
            fromStages.grades
          )
        : parseTextbookRegisterGradeValuesForTargets(
            educationTargets,
            initialValues?.grade ?? ''
          ),
  }
}

export function TextbookRegisterModal({
  open,
  onCancel,
  onSubmit,
  initialValues,
  mode = 'create',
}: TextbookRegisterModalProps) {
  const [form, setForm] = useState<RegisterFormState>(emptyForm)
  const { options: businessAreaOptions } = useTextbookBusinessAreaSelectOptions(open)
  const { showAlert } = useCmsAlert()

  useEffect(() => {
    if (!open) return
    setForm(toRegisterForm(initialValues))
  }, [open, initialValues])

  const gradeOptions = useMemo(
    () => textbookRegisterGradeOptionsForTargets(form.educationTargets),
    [form.educationTargets]
  )

  const handleSubmit = () => {
    if (
      form.useStatus !== 'USED' &&
      form.useStatus !== 'UNUSED'
    ) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    const gradesByTarget = gradesByTargetFromRegisterValues(form.educationTargets, form.grades)
    const missingGradeTarget = form.educationTargets.some(
      target => (gradesByTarget.get(target) ?? []).length === 0
    )
    if (
      !form.textbookName.trim() ||
      !form.textbookNameEn.trim() ||
      !isTextbookRegisterBusinessAreaFilled(form.businessArea) ||
      form.educationTargets.length === 0 ||
      missingGradeTarget
    ) {
      showAlert({
        title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
        content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
      })
      return
    }
    const educationStages = buildEducationStagesFromSelections(
      form.educationTargets,
      gradesByTarget
    )
    const summary = summarizeEducationStages(educationStages)
    onSubmit({
      useStatus: form.useStatus,
      textbookName: form.textbookName.trim(),
      textbookNameEn: form.textbookNameEn.trim(),
      businessArea: form.businessArea,
      educationTarget: summary.educationTarget,
      grade: summary.grade,
      educationStages,
    })
  }

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title={mode === 'edit' ? '교재 정보 수정' : '교재 등록'}
      width={600}
      className="textbook-register-modal"
      wrapClassName="textbook-register-modal-wrap"
      footer={
        <div className="textbook-register-modal__footer">
          <CmsButton variant="secondary" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton variant="primary" type="button" onClick={handleSubmit}>
            {mode === 'edit' ? '수정' : '등록'}
          </CmsButton>
        </div>
      }
    >
      <div className="textbook-register-modal__form">
        <div className="textbook-register-modal__field">
          <CmsRadio.Group
            label="사용 여부"
            required
            size="large"
            value={form.useStatus || undefined}
            onChange={e => setForm(prev => ({ ...prev, useStatus: e.target.value }))}
          >
            <CmsRadio value="USED">사용</CmsRadio>
            <CmsRadio value="UNUSED">미사용</CmsRadio>
          </CmsRadio.Group>
        </div>

        <div className="textbook-register-modal__row">
          <div className="textbook-register-modal__field">
            <CmsInput
              label="교재명(국문)"
              required
              value={form.textbookName}
              onChange={e => setForm(prev => ({ ...prev, textbookName: e.target.value }))}
              placeholder="교재명을 입력해 주세요."
              inputSize="large"
              width="100%"
            />
          </div>
          <div className="textbook-register-modal__field">
            <CmsInput
              label="교재명(영문)"
              required
              value={form.textbookNameEn}
              onChange={e => setForm(prev => ({ ...prev, textbookNameEn: e.target.value }))}
              placeholder="교재명을 입력해 주세요."
              inputSize="large"
              width="100%"
            />
          </div>
        </div>

        <div className="textbook-register-modal__row">
          <div className="textbook-register-modal__field">
            <CmsSelect
              label="사업 분야"
              required
              withAllOption={false}
              inputSize="large"
              placeholder="사업 분야를 선택해 주세요."
              value={form.businessArea || undefined}
              onChange={value =>
                setForm(prev => ({
                  ...prev,
                  businessArea: (value ?? '') as TextbookBusinessArea | '',
                }))
              }
              options={businessAreaOptions}
              width="100%"
            />
          </div>
          <div className="textbook-register-modal__field">
            <CmsSelect
              label="교육 대상"
              required
              mode="multiple"
              withAllOption={false}
              inputSize="large"
              placeholder="교육 대상을 선택해 주세요."
              value={form.educationTargets}
              onChange={value => {
                const incoming = Array.isArray(value) ? value.map(String) : []
                const nextTargets = orderedEducationTargets(incoming)
                setForm(prev => ({
                  ...prev,
                  educationTargets: nextTargets,
                  grades: syncTextbookRegisterGradesAfterTargetsChange(
                    nextTargets,
                    prev.grades ?? []
                  ),
                }))
              }}
              options={TEXTBOOK_EDUCATION_TARGET_SELECT_OPTIONS}
              width="100%"
            />
          </div>
        </div>

        <div className="textbook-register-modal__field">
          <CmsSelect
            label="대상 학년"
            required
            mode="multiple"
            withAllOption={false}
            inputSize="large"
            placeholder={
              form.educationTargets.length > 0
                ? '대상 학년을 선택해 주세요.'
                : '교육 대상을 선택해 주세요.'
            }
            value={form.educationTargets.length > 0 ? form.grades ?? [] : []}
            disabled={form.educationTargets.length === 0}
            onChange={value => {
              const incoming = Array.isArray(value) ? value.map(String) : []
              setForm(prev => ({
                ...prev,
                grades: nextTextbookRegisterGradeValuesForTargets(
                  prev.educationTargets,
                  prev.grades ?? [],
                  incoming
                ),
              }))
            }}
            options={gradeOptions}
            width="100%"
          />
        </div>
      </div>
    </ContentModal>
  )
}
