import { PFInfoReview, PFText } from '@/shared/ui'
import {
  formatInstructorCalculatedTransportAmount,
  formatInstructorOneWayDistanceKm,
  formatInstructorTransportWon,
  type InstructorTransportPreview,
} from '../lib/instructor-transport-preview'
import styles from './instructor-transport-fee-block.module.css'

type InstructorTransportFeeBlockProps = {
  preview: InstructorTransportPreview | null
}

export function InstructorTransportFeeBlock({ preview }: InstructorTransportFeeBlockProps) {
  return (
    <div className={styles.root}>
      <PFInfoReview
        accentFirstRow={false}
        rows={[
          {
            label: '자택과 출강지 간의 거리',
            value: formatInstructorOneWayDistanceKm(preview?.oneWayDistanceKm),
          },
          { label: '유류비', value: formatInstructorTransportWon(preview?.fuelCostWon) },
          { label: '톨비', value: formatInstructorTransportWon(preview?.tollFeeWon) },
        ]}
      />
      <div className={styles.total}>
        <PFText typo="bd-md-sb" color="black">
          총 산정 교통비
        </PFText>
        <PFText typo="bd-md-sb" color="black">
          {formatInstructorCalculatedTransportAmount(preview)}
        </PFText>
      </div>
    </div>
  )
}
