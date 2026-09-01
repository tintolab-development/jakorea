import { useState } from 'react'
import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import type { EducationDetailKey } from '@jakorea/domain/instructor/education-options'
import { SchoolSearchModal } from '@/features/auth/sign-up'
import { PFTextInput } from '@/shared/ui'
import styles from './education-school-name-field.module.css'

const SCHOOL_NAME_FIELD_WIDTH = 260

export type EducationSchoolNameFieldProps = {
  /** 학력 상세 유형 — 고등=NEIS, 전문대/4년제=CareerNet */
  detailKey: EducationDetailKey
  value: string
  onChange: (schoolName: string) => void
  disabled?: boolean
  className?: string
}

function resolveLockedSchoolLevel(detailKey: EducationDetailKey): string | undefined {
  if (detailKey === 'high') return '고등학교'
  if (detailKey === 'college23') return '전문대학'
  if (detailKey === 'college4') return '대학교'
  return undefined
}

/** 학력사항 학교명 — 검색 모달 트리거 (width 260, placeholder 학교명) */
export function EducationSchoolNameField({
  detailKey,
  value,
  onChange,
  disabled = false,
  className,
}: EducationSchoolNameFieldProps) {
  const [open, setOpen] = useState(false)

  const openModal = () => {
    if (disabled) return
    setOpen(true)
  }

  return (
    <>
      <PFTextInput
        variant="formPage"
        size="large"
        width={SCHOOL_NAME_FIELD_WIDTH}
        hasIcon
        readOnly
        disabled={disabled}
        className={[styles.trigger, className].filter(Boolean).join(' ')}
        placeholder={PH.educationSchoolName}
        value={value}
        aria-label="학교명 검색"
        onClick={openModal}
        onKeyDown={event => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openModal()
          }
        }}
        onValueChange={next => {
          // clear 버튼만 값 변경 허용
          if (!next) onChange('')
        }}
      />

      <SchoolSearchModal
        open={open}
        title="소속/학교 검색"
        schoolKindFilter={resolveLockedSchoolLevel(detailKey)}
        onClose={() => setOpen(false)}
        onSelect={school => {
          onChange(school.name)
          setOpen(false)
        }}
      />
    </>
  )
}
