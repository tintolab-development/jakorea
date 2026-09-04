export const ALIMTALK_SEND_ALL_PROGRAM_ID = 'all'
export const ALIMTALK_SEND_PICKER_PAGE_SIZE = 5

export type AlimtalkSendTiming = 'immediate' | 'scheduled'
export type AlimtalkSendParticipationType = 'participant' | 'volunteer' | 'instructor' | ''
export type AlimtalkSendRecipientSource = 'program' | 'manual'

export type AlimtalkSendRecipient = {
  id: string
  participationType: AlimtalkSendParticipationType
  name: string
  phone: string
  source: AlimtalkSendRecipientSource
  /** BE RecipientRequest.actorType — MEMBER / DIRECT 등 */
  actorType?: string
  actorId?: number
}
