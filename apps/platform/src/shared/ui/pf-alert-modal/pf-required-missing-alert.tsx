import type { RequiredMissingAlertCopy } from '@/shared/lib/required-missing-alert'
import { PFText } from '../pf-text'
import { PFAlertModal } from './pf-alert-modal'
import styles from './pf-required-missing-alert.module.css'

type PFRequiredMissingAlertProps = {
  /** null이면 닫힘 */
  copy: RequiredMissingAlertCopy | null
  onConfirm: () => void
}

/**
 * 필수 입력 누락 안내 팝업 — Figma 14550-2349.
 * 누락 1개는 설명 한 줄, 여러 개는 회색 목록 상자 + 안내 문구.
 */
export function PFRequiredMissingAlert({ copy, onConfirm }: PFRequiredMissingAlertProps) {
  return (
    <PFAlertModal
      open={copy != null}
      title={copy?.title ?? ''}
      description={copy?.list ? undefined : copy?.description}
      extraClassName={styles.extra}
      onConfirm={onConfirm}
    >
      {copy?.list ? (
        <>
          <div className={styles.box}>
            <ul className={styles.items}>
              {copy.list.items.map(item => (
                <li key={item}>
                  <PFText as="span" typo="bd-sm-md" color="black">
                    · {item}
                  </PFText>
                </li>
              ))}
            </ul>
          </div>
          <PFText as="p" typo="bd-md-rg" color="neutral-warm-600" className={styles.guide}>
            {copy.list.guide}
          </PFText>
        </>
      ) : null}
    </PFAlertModal>
  )
}
