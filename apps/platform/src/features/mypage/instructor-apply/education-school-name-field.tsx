import { useState } from 'react'
import { CAREER_NET_UNIV_SCH1 } from '@jakorea/location/career-net'
import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import type { EducationDetailKey } from '@jakorea/domain/instructor/education-options'
import { SchoolSearchModal } from '@/features/auth/sign-up/ui/school-search-modal'
import { UniversitySearchModal } from '@/features/auth/sign-up/ui/university-search-modal'
import { PFTextInput } from '@/shared/ui'
import styles from './education-school-name-field.module.css'

const SCHOOL_NAME_FIELD_WIDTH = 260

export type EducationSchoolNameFieldProps = {
  /** 학력 상세 유형 — 고등=NEIS, 그 외=커리어넷 대학교 */
  detailKey: EducationDetailKey
  value: string
  onChange: (schoolName: string) => void
  disabled?: boolean
  className?: string
}

function resolveUniversityDefaultSch1(detailKey: EducationDetailKey): string {
  if (detailKey === 'college23') return CAREER_NET_UNIV_SCH1.college
  if (detailKey === 'college4') return CAREER_NET_UNIV_SCH1.university4
  return ''
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
  const isHighSchool = detailKey === 'high'

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

      {isHighSchool ? (
        <SchoolSearchModal
          open={open}
          schoolKindFilter="고등학교"
          onClose={() => setOpen(false)}
          onSelect={school => {
            onChange(school.name)
            setOpen(false)
          }}
        />
      ) : (
        <UniversitySearchModal
          open={open}
          title="소속/학교 검색"
          defaultSch1={resolveUniversityDefaultSch1(detailKey)}
          initialKeyword={value}
          onClose={() => setOpen(false)}
          onSelect={university => {
            onChange(university.name)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}
