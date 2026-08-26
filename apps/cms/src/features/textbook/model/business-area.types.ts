import type { TextbookBusinessArea } from '@/features/textbook/model/textbook-business-areas'

export type TextbookBusinessAreaRow = {
  id: string
  name: TextbookBusinessArea
  textbookCount: number
  deletable: boolean
}
