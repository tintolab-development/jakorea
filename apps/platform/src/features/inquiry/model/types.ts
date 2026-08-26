export type FaqCategory = '프로그램' | '계정' | '정산' | '회원가입'

export type InquiryTab = 'faq' | 'inquiry'

export type FaqItem = {
  id: string
  category: FaqCategory
  title: string
  question: string
  answer: string
  order: number
}

export type InquiryListParams = {
  tab: InquiryTab
  category: FaqCategory | '전체'
  page: number
}

export type OneToOneInquiryStatus = 'pending' | 'answered'

export type OneToOneInquiryItem = {
  id: string
  category: FaqCategory
  title: string
  status: OneToOneInquiryStatus
  createdAt: string
  programName: string
  question: string
  answer?: string
  order: number
}
