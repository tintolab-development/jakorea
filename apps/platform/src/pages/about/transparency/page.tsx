import { Fragment } from 'react'
import transparencyGradientUrl from '@/assets/background_gradient/transparency-gradient.png'
import {
  ExpenseTable,
  FinanceDonutChart,
  MOCK_EXPENSE_DETAIL_GROUPS,
  MOCK_EXPENSE_SUMMARY,
  MOCK_REVENUE_SUMMARY,
  MOCK_REVENUE_TABLE_ORDER,
  MOCK_TRANSPARENCY_PRINCIPLES,
  PrincipleList,
  ReportLinks,
  RevenueTable,
  TRANSPARENCY_HERO_TITLE,
} from '@/features/transparency'
import { PFText } from '@/shared/ui'
import styles from './page.module.css'

export function TransparencyPage() {
  return (
    <section className={styles.page}>
      <div
        className={styles.pageBackground}
        style={{ backgroundImage: `url(${transparencyGradientUrl})` }}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <header className={styles.hero}>
          <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
            투명한 운영으로 신뢰를 이어갑니다.
          </PFText>
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {TRANSPARENCY_HERO_TITLE.split('\n').map((line, index) => (
              <Fragment key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </PFText>
        </header>

        <div className={styles.principles}>
          <PrincipleList principles={MOCK_TRANSPARENCY_PRINCIPLES} />
        </div>

        <div className={styles.financeArea}>
          <section className={styles.financeSection} aria-labelledby="revenue-total">
            <PFText
              as="h2"
              id="revenue-total"
              typo="page-title-md"
              color="black"
              className={styles.financeTitle}
            >
              수익총계
            </PFText>
            <FinanceDonutChart
              summary={MOCK_REVENUE_SUMMARY}
              height={700}
              ariaLabel="수익총계 도넛 차트"
            />
            <div className={styles.financeTable}>
              <RevenueTable
                summary={MOCK_REVENUE_SUMMARY}
                order={MOCK_REVENUE_TABLE_ORDER}
              />
            </div>
          </section>

          <section className={styles.financeSection} aria-labelledby="expense-total">
            <PFText
              as="h2"
              id="expense-total"
              typo="page-title-md"
              color="black"
              className={styles.financeTitle}
            >
              지출총계
            </PFText>
            <FinanceDonutChart
              summary={MOCK_EXPENSE_SUMMARY}
              height={900}
              ariaLabel="지출총계 도넛 차트"
            />
            <div className={styles.financeTable}>
              <ExpenseTable
                groups={MOCK_EXPENSE_DETAIL_GROUPS}
                totalAmount={MOCK_EXPENSE_SUMMARY.totalAmount}
              />
            </div>
          </section>

          <ReportLinks />
        </div>
      </div>
    </section>
  )
}
