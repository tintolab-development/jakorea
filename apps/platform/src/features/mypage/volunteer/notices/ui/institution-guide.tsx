import { useEffect, useId, useMemo, useRef, useState } from 'react'
import chevronDownUrl from '@/shared/assets/icons/chevron-down-black.svg'
import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFOptionList, PFText } from '@/shared/ui'
import { VOLUNTEER_INSTITUTION_GUIDE_FIELDS } from '../lib/guide-fields'
import {
  getMockVolunteerInstitutionGuide,
  listMockVolunteerAssignedInstitutionNames,
} from '../lib/mock-institution-guides'
import styles from './institution-guide.module.css'

type VolunteerInstitutionGuideProps = {
  lastParticipatedSession?: number
}

export function VolunteerInstitutionGuide({
  lastParticipatedSession,
}: VolunteerInstitutionGuideProps) {
  const schoolNames = useMemo(
    () => listMockVolunteerAssignedInstitutionNames(lastParticipatedSession),
    [lastParticipatedSession]
  )
  const [selectedSchool, setSelectedSchool] = useState(schoolNames[0] ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const guide = selectedSchool ? getMockVolunteerInstitutionGuide(selectedSchool) : null

  useEffect(() => {
    if (!schoolNames.includes(selectedSchool)) {
      setSelectedSchool(schoolNames[0] ?? '')
    }
  }, [schoolNames, selectedSchool])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (wrapRef.current?.contains(target)) return
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (schoolNames.length === 0) {
    return null
  }

  const options = schoolNames.map(name => ({ value: name, label: name }))

  return (
    <section className={styles.root} aria-label="기관 안내사항">
      <div className={styles.selectWrap} ref={wrapRef}>
        <button
          type="button"
          className={styles.trigger}
          aria-label="배정된 기관 선택"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onClick={() => setIsOpen(open => !open)}
        >
          <span className={styles.triggerCopy}>
            <PFText as="span" typo="hl-lg" color="black" className={styles.schoolName}>
              {selectedSchool}
            </PFText>
            <PFText as="span" typo="bd-md-rg" color="neutral-cool-500" className={styles.hint}>
              배정된 기관을 선택해 이용안내를 확인해 주세요.
            </PFText>
          </span>
          <img className={styles.chevron} src={chevronDownUrl} alt="" aria-hidden="true" />
        </button>
        {isOpen ? (
          <PFOptionList
            id={menuId}
            className={styles.menu}
            options={options}
            selectedValue={selectedSchool}
            onSelect={value => {
              setSelectedSchool(value)
              setIsOpen(false)
            }}
          />
        ) : null}
      </div>

      {guide ? (
        <PFFormFieldTable>
          {VOLUNTEER_INSTITUTION_GUIDE_FIELDS.map(field => (
            <PFFormFieldRow key={field.key}>
              <PFFormField label={field.label} labelWidth="wider">
                {guide[field.key]}
              </PFFormField>
            </PFFormFieldRow>
          ))}
        </PFFormFieldTable>
      ) : null}
    </section>
  )
}
