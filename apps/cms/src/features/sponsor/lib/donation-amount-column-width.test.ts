import { describe, expect, it } from 'vitest'
import {
  DONATION_AMOUNT_COLUMN_MIN_WIDTH,
  donationAmountColumnWidth,
  formatDonationAmount,
  sponsorListTableMinWidth,
} from './donation-amount-column-width'

describe('formatDonationAmount', () => {
  it('formats with thousands separators and 원', () => {
    expect(formatDonationAmount(0)).toBe('0원')
    expect(formatDonationAmount(4_555_555_555_555)).toBe('4,555,555,555,555원')
  })
})

describe('donationAmountColumnWidth', () => {
  it('stays at the default when amounts are short', () => {
    expect(donationAmountColumnWidth([0, 91_500_000])).toBeGreaterThanOrEqual(
      DONATION_AMOUNT_COLUMN_MIN_WIDTH
    )
    expect(donationAmountColumnWidth([0])).toBe(DONATION_AMOUNT_COLUMN_MIN_WIDTH)
  })

  it('grows for a long formatted amount', () => {
    const width = donationAmountColumnWidth([4_555_555_555_555])
    expect(width).toBeGreaterThan(DONATION_AMOUNT_COLUMN_MIN_WIDTH)
    expect(sponsorListTableMinWidth(width)).toBeGreaterThan(width)
  })
})
