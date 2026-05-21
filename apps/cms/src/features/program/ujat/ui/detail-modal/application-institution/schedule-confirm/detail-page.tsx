import { UjatInstitutionScheduleConfirmConfirmedDetailPage } from './confirmed-detail-page'

export function UjatInstitutionScheduleConfirmDetailPage({
  institutionId,
  onBack,
  onStatusUpdated,
}: {
  institutionId: string
  onBack: () => void
  onStatusUpdated: () => void
}) {
  return (
    <UjatInstitutionScheduleConfirmConfirmedDetailPage
      institutionId={institutionId}
      onBack={onBack}
      onStatusUpdated={onStatusUpdated}
    />
  )
}
