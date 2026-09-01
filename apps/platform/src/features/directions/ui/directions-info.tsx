import { PFText } from '@/shared/ui'
import { DIRECTIONS_ORG_NAME } from '../lib/constants'
import type { DirectionsInfo as DirectionsInfoModel } from '../model/types'
import styles from './directions-info.module.css'

type DirectionsInfoProps = {
  info: DirectionsInfoModel
}

export function DirectionsInfoSection({ info }: DirectionsInfoProps) {
  return (
    <div className={styles.root}>
      <div className={styles.identity}>
        <PFText as="p" typo="hl-lg" color="primary-500" className={styles.orgName}>
          {DIRECTIONS_ORG_NAME}
        </PFText>
        <PFText as="h2" typo="hd-md" color="black" className={styles.addressKo}>
          {info.addressKo}
        </PFText>
        <PFText as="p" typo="bd-lg-sb" className={styles.addressEn}>
          {info.addressEn}
        </PFText>
      </div>

      <dl className={styles.contacts}>
        <div className={styles.contactItem}>
          <PFText as="dt" typo="bd-sm-rg" color="primary-500" className={styles.contactLabel}>
            Telephone
          </PFText>
          <PFText as="dd" typo="bd-lg-sb" color="black" className={styles.contactValue}>
            {info.phone}
          </PFText>
        </div>
        <div className={styles.contactItem}>
          <PFText as="dt" typo="bd-sm-rg" color="primary-500" className={styles.contactLabel}>
            Fax
          </PFText>
          <PFText as="dd" typo="bd-lg-sb" color="black" className={styles.contactValue}>
            {info.fax}
          </PFText>
        </div>
        <div className={styles.contactItem}>
          <PFText as="dt" typo="bd-sm-rg" color="primary-500" className={styles.contactLabel}>
            Email
          </PFText>
          <PFText as="dd" typo="bd-lg-sb" color="black" className={styles.contactValue}>
            {info.email}
          </PFText>
        </div>
      </dl>
    </div>
  )
}
