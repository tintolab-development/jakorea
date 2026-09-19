import { PFText } from '@/shared/ui'
import {
  educationSurveyListStatusLabel,
  type EducationSurveyListEntry,
} from '../lib/mock-survey-list'
import styles from './survey-list.module.css'

export type EducationSurveyListProps = {
  items: readonly EducationSurveyListEntry[]
  selectedId: string
  onSelect: (id: string) => void
}

export function EducationSurveyList({ items, selectedId, onSelect }: EducationSurveyListProps) {
  return (
    <nav className={styles.list} aria-label="설문 목록">
      <ul className={styles.ul}>
        {items.map(item => {
          const selected = item.id === selectedId
          const statusLabel = educationSurveyListStatusLabel(item.status)
          return (
            <li key={item.id}>
              <button
                type="button"
                className={selected ? styles.itemSelected : styles.item}
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelect(item.id)}
              >
                <PFText
                  as="span"
                  typo={selected ? 'bd-md-bd' : 'bd-md-md'}
                  color={selected ? 'primary-700' : 'neutral-cool-600'}
                  className={styles.title}
                >
                  {item.title}
                </PFText>
                <PFText
                  as="span"
                  typo="label-md"
                  color={item.status === 'in_progress' ? 'primary-500' : 'neutral-cool-500'}
                  className={styles.status}
                >
                  {statusLabel}
                </PFText>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
