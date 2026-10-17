import { Fragment } from 'react'
import transparencyGradientUrl from '@/assets/background_gradient/transparency-gradient.png'
import {
  ExpenseTable,
  FinanceDonutChart,
  PrincipleList,
  ReportLinks,
  RevenueTable,
  usePublicTransparency,
} from '@/features/transparency'
import { PFButton, PFLoadingSpinner, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function TransparencyPage() {
  const { view, isPending, isError, refetch } = usePublicTransparency()

  if (isPending) {
    return (
      <section className={styles.page}>
        <div className={styles.content}>
          <PFLoadingSpinner centered label="투명경영 정보를 불러오는 중" />
        </div>
      </section>
    )
  }

  if (isError || !view) {
    return (
      <section className={styles.page}>
        <div className={styles.content}>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
            투명경영 정보를 불러오지 못했습니다.
          </PFText>
          <PFButton variant="tertiary" size="large" onClick={refetch}>
            다시 시도
          </PFButton>
        </div>
      </section>
    )
  }

  const heroLines = view.heroTitle.split('\n')

  return (
    <section className={styles.page}>
      <div
        className={styles.pageBackground}
        style={{ backgroundImage: `url(${transparencyGradientUrl})` }}
        aria-hidden="true"
      />

      <div className={styles.content}>
        <header className={styles.hero}>
          {view.heroLabel ? (
            <PFText as="span" typo="hl-lg" color="primary-700" className={styles.heroLabel}>
              {view.heroLabel}
            </PFText>
          ) : null}
          <PFText as="h1" typo="page-title-md" color="black" className={styles.heroTitle}>
            {heroLines.map((line, index) => (
              <Fragment key={`${line}-${index}`}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </PFText>
        </header>

        <div className={styles.principles}>
          <PrincipleList principles={view.principles} />
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
              summary={view.revenueSummary}
              height={725}
              ariaLabel="수익총계 도넛 차트"
            />
            <div className={styles.financeTable}>
              <RevenueTable summary={view.revenueSummary} order={view.revenueOrder} />
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
              summary={view.expenseSummary}
              height={735}
              ariaLabel="지출총계 도넛 차트"
            />
            <div className={styles.financeTable}>
              <ExpenseTable
                groups={view.expenseGroups}
                totalAmount={view.expenseSummary.totalAmount}
              />
            </div>
          </section>

          <ReportLinks disclosureUrl={view.disclosureUrl} />
        </div>
      </div>
    </section>
  )
}
