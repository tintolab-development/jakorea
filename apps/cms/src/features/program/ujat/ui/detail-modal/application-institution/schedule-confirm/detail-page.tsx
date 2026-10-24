import { UjatInstitutionScheduleConfirmConfirmedDetailPage } from './confirmed-detail-page'

export function UjatInstitutionScheduleConfirmDetailPage({
  institutionId,
  programId,
  onBack,
  onStatusUpdated,
  onOpenScheduleAssign,
}: {
  institutionId: string
  programId?: string | null
  onBack: () => void
  onStatusUpdated: () => void
  onOpenScheduleAssign?: () => void
}) {
  return (
    <UjatInstitutionScheduleConfirmConfirmedDetailPage
      institutionId={institutionId}
      programId={programId}
      onBack={onBack}
      onStatusUpdated={onStatusUpdated}
      onOpenScheduleAssign={onOpenScheduleAssign}
    />
  )
}
