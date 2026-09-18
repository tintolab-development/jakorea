import { HistoryHeroSection, HistorySection } from '@/features/history'
import styles from './page.module.css'

export function HistoryPage() {
  return (
    <div className={styles.page}>
      <HistoryHeroSection />
      <HistorySection />
    </div>
  )
}
