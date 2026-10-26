export type FaqCategory = '프로그램' | '계정' | '정산' | '회원가입'

export type InquiryTab = 'faq' | 'inquiry'

export type FaqItem = {
  id: string
  category: string
  title: string
  question: string
  answer: string
  order: number
}

export type InquiryListParams = {
  tab: InquiryTab
  category: string
  page: number
}

export type OneToOneInquiryStatus = 'pending' | 'answered'

export type OneToOneInquiryItem = {
  id: string
  category: string
  title: string
  status: OneToOneInquiryStatus
  createdAt: string
  answeredAt?: string
  programName: string
  question: string
  answer?: string
  order: number
}

export type OneToOneInquiryWritePayload = {
  programValue: string
  programName: string
  category: string
  title: string
  content: string
}
