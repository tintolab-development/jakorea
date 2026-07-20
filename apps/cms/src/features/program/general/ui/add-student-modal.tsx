/**
 * 학생 추가 등록 모달
 * 프로그램 상세 풀페이지 모달 > 프로그램 진행현황 > 참여기관 > 학생 추가 클릭 시 노출
 * 스펙: 제목 "학생 추가 등록", 설명 문구, 필수 학생명/성별/생년월일/학급, 선택 연락처/이메일/비고, 취소/등록 버튼
 */

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton, CmsInput, CmsRadioGroup, CmsSelect } from '@/shared/ui'
import {
  CmsDateTextInput,
  isValidCalendarDate,
  sanitizeDateTextInput,
} from '@/shared/ui/date-text-input'
import {
  addStudentFormSchema,
  type AddStudentFormValues,
  DEFAULT_ADD_STUDENT_FORM_VALUES,
} from '../model/school-detail-add-student-schema'
import './add-student-modal.css'
import { fieldValidationHelp } from '@/shared/utils/error-handler'

const GENDER_OPTIONS = [
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
] as const

export interface AddStudentModalProps {
  open: boolean
  onCancel: () => void
  onAdd: (values: AddStudentFormValues) => void
  /** 미전달 시 옵션 없음 — 상위에서 `buildStudentGradeClassOptions(classCount)` 전달 */
  gradeClassOptions?: Array<{ label: string; value: string }>
}

export function AddStudentModal({
  open,
  onCancel,
  onAdd,
  gradeClassOptions = [],
}: AddStudentModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: DEFAULT_ADD_STUDENT_FORM_VALUES,
  })

  useEffect(() => {
    if (open) {
      reset(DEFAULT_ADD_STUDENT_FORM_VALUES)
    }
  }, [open, reset])

  const onSubmit = (values: AddStudentFormValues) => {
    if (!isValidCalendarDate(sanitizeDateTextInput(values.birthDate))) {
      setError('birthDate', {
        type: 'validate',
        message: '생년월일 8자리를 입력해주세요',
      })
      return
    }

    onAdd(values)
    onCancel()
  }

  const footer = (
    <>
      <CmsButton variant="secondary" size="medium" onClick={onCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="medium" onClick={() => handleSubmit(onSubmit)()}>
        등록
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="학생 추가 등록"
      width={800}
      footer={footer}
      className="add-student-modal"
      description="프로그램에 참여하는 학생 정보를 추가 등록합니다."
    >
      <div className="add-student-modal__body">
        <form
          className="add-student-modal__form"
          onSubmit={e => {
            e.preventDefault()
            handleSubmit(onSubmit)(e)
          }}
          noValidate
        >
          <div className="add-student-modal__field">
            <label className="add-student-modal__label">
              학생명 <span className="add-student-modal__required" aria-hidden>*</span>
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  inputSize="medium"
                  width="100%"
                  placeholder="학생명을 입력하세요"
                />
              )}
            />
            {errors.name && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.name)}</span>
            )}
          </div>

          <div className="add-student-modal__field">
            <label className="add-student-modal__label">
              성별 <span className="add-student-modal__required" aria-hidden>*</span>
            </label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <CmsRadioGroup
                  {...field}
                  options={[...GENDER_OPTIONS]}
                  size="medium"
                  className="add-student-modal__radio-group"
                />
              )}
            />
            {errors.gender && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.gender)}</span>
            )}
          </div>

          <div className="add-student-modal__field">
            <label className="add-student-modal__label">
              생년월일 <span className="add-student-modal__required" aria-hidden>*</span>
            </label>
            <Controller
              name="birthDate"
              control={control}
              render={({ field }) => (
                <CmsDateTextInput
                  value={field.value ?? ''}
                  onValueChange={value => field.onChange(value.replace(/\D/g, '').slice(0, 8))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  inputSize="medium"
                  width="100%"
                  placeholder="생년월일 8자리를 입력하세요"
                  maxLength={10}
                />
              )}
            />
            {errors.birthDate && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.birthDate)}</span>
            )}
          </div>

          <div className="add-student-modal__field">
            <label className="add-student-modal__label">
              학급 <span className="add-student-modal__required" aria-hidden>*</span>
            </label>
            <Controller
              name="gradeClass"
              control={control}
              render={({ field }) => (
                <CmsSelect
                  {...field}
                  value={field.value || undefined}
                  inputSize="medium"
                  width="100%"
                  withAllOption={false}
                  placeholder="학급을 선택하세요"
                  options={gradeClassOptions}
                  disabled={gradeClassOptions.length === 0}
                />
              )}
            />
            {errors.gradeClass && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.gradeClass)}</span>
            )}
          </div>

          <div className="add-student-modal__field">
            <label className="add-student-modal__label">연락처</label>
            <Controller
              name="contact"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  inputSize="medium"
                  width="100%"
                  placeholder="연락처를 입력하세요"
                />
              )}
            />
            {errors.contact && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.contact)}</span>
            )}
          </div>

          <div className="add-student-modal__field">
            <label className="add-student-modal__label">이메일</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  inputSize="medium"
                  width="100%"
                  placeholder="이메일을 입력하세요"
                />
              )}
            />
            {errors.email && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.email)}</span>
            )}
          </div>

          <div className="add-student-modal__field">
            <label className="add-student-modal__label">비고</label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  inputSize="medium"
                  width="100%"
                  placeholder="비고를 입력하세요"
                />
              )}
            />
            {errors.notes && (
              <span className="add-student-modal__error">{fieldValidationHelp(errors.notes)}</span>
            )}
          </div>
        </form>
      </div>
    </ContentModal>
  )
}
