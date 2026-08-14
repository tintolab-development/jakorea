import whyImage01Url from '../image/why-image-01.png'
import whyImage02Url from '../image/why-image-02.png'
import whyImage03Url from '../image/why-image-03.png'

export type DonationImpactCategory = 'story' | 'press' | 'report'

export type DonationImpactItem = {
  id: string
  category: DonationImpactCategory
  categoryLabel: string
  title: string
  dateLabel: string
  imageUrl: string
  href: string
  placeholderColor: string
}

/** 개인후원 전용 mock — 임팩트 스토리 API/목과 분리 */
export const DONATION_IMPACT_ITEMS: readonly DonationImpactItem[] = [
  {
    id: 'donation-impact-1',
    category: 'story',
    categoryLabel: '스토리',
    title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
    dateLabel: '2026년 05월 08일',
    imageUrl: whyImage01Url,
    href: '#',
    placeholderColor: '#c5e8eb',
  },
  {
    id: 'donation-impact-2',
    category: 'press',
    categoryLabel: '언론보도',
    title: "영화 꿈나무를 위한 꿈의 무대 ‘2025 Dream Stage’",
    dateLabel: '2026년 05월 08일',
    imageUrl: whyImage02Url,
    href: '#',
    placeholderColor: '#c8d4e8',
  },
  {
    id: 'donation-impact-3',
    category: 'story',
    categoryLabel: '스토리',
    title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울 “금융교육”',
    dateLabel: '2026년 05월 08일',
    imageUrl: whyImage03Url,
    href: '#',
    placeholderColor: '#c5e8eb',
  },
  {
    id: 'donation-impact-4',
    category: 'story',
    categoryLabel: '스토리',
    title: '아이들의 열정과 금융 지식을 함께 키운 메트라이프 꿈꿈 어린이 금융교육!',
    dateLabel: '2024년 05월 08일',
    imageUrl: whyImage01Url,
    href: '#',
    placeholderColor: '#c5e8eb',
  },
  {
    id: 'donation-impact-5',
    category: 'report',
    categoryLabel: '보고서',
    title: "영화 꿈나무를 위한 꿈의 무대, '2025 Dream Stage'",
    dateLabel: '2024년 05월 08일',
    imageUrl: whyImage02Url,
    href: '#',
    placeholderColor: '#d0d5e0',
  },
  {
    id: 'donation-impact-6',
    category: 'story',
    categoryLabel: '스토리',
    title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
    dateLabel: '2024년 05월 08일',
    imageUrl: whyImage03Url,
    href: '#',
    placeholderColor: '#c5e8eb',
  },
]
