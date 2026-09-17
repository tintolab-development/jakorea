import { UjatInstitutionScheduleConfirmConfirmedDetailPage } from './confirmed-detail-page'

export function UjatInstitutionScheduleConfirmDetailPage({
  institutionId,
  programId,
  onBack,
  onStatusUpdated,
}: {
  institutionId: string
  programId?: string | null
  onBack: () => void
  onStatusUpdated: () => void
}) {
  return (
    <UjatInstitutionScheduleConfirmConfirmedDetailPage
      institutionId={institutionId}
      programId={programId}
      onBack={onBack}
      onStatusUpdated={onStatusUpdated}
    />
  )
}
