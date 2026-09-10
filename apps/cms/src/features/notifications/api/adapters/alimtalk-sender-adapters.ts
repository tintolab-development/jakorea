import type { SenderProfileResponse } from '@/shared/api/generated/notifications/schemas'

export type AlimtalkSenderProfileOption = {
  profileId: number
  senderKey: string
  displayName: string
  senderProfileType?: string
}

export function mapSenderProfileOptions(
  items: SenderProfileResponse[] | undefined
): AlimtalkSenderProfileOption[] {
  return (items ?? [])
    .filter(item => item.profileId != null && item.senderKey?.trim())
    .map(item => ({
      profileId: item.profileId!,
      senderKey: item.senderKey!.trim(),
      displayName: item.displayName?.trim() || item.senderKey!.trim(),
      senderProfileType: item.senderProfileType,
    }))
}
