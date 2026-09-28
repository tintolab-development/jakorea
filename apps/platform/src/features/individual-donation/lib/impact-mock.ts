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
