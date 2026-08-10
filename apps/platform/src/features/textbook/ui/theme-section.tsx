import type { TextbookThemeSection } from '../model/types'
import { PFText } from '@/shared/ui'
import { DirectoryListItem } from './directory-list-item'
import styles from './theme-section.module.css'

type ThemeSectionProps = {
  section: TextbookThemeSection
  onRowClick?: (contentId: string) => void
}

export function ThemeSection({ section, onRowClick }: ThemeSectionProps) {
  return (
    <section className={styles.section} aria-labelledby={`theme-${section.key}`}>
      <div className={styles.intro}>
        <PFText
          as="h2"
          id={`theme-${section.key}`}
          typo="hl-lg"
          color="black"
          className={styles.title}
        >
          {section.title}
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500" className={styles.description}>
          {section.description}
        </PFText>
      </div>

      <ul className={styles.list}>
        {section.rows.map(row => {
          const contentId = row.contentId
          return (
            <li key={row.id} className={styles.listItem}>
              <DirectoryListItem
                titles={row.titles}
                level={row.level}
                onClick={
                  contentId && onRowClick
                    ? () => {
                        onRowClick(contentId)
                      }
                    : undefined
                }
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
