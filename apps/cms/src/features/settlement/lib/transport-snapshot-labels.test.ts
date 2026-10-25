import { describe, expect, it } from 'vitest'
import {
  formatTransportSnapshotFuelTypeLabel,
  formatTransportSnapshotProviderLabel,
} from './transport-snapshot-labels'

describe('transport-snapshot-labels', () => {
  it('거리 산정 업체 API 코드를 한글로 표시한다', () => {
    expect(formatTransportSnapshotProviderLabel('NAVER_MAPS')).toBe('네이버 지도')
    expect(formatTransportSnapshotProviderLabel('tmap')).toBe('티맵')
    expect(formatTransportSnapshotProviderLabel('')).toBe('-')
    expect(formatTransportSnapshotProviderLabel('UNKNOWN_PROVIDER')).toBe('-')
  })

  it('유류 종류 API 코드를 한글로 표시하고 한글 원문은 유지한다', () => {
    expect(formatTransportSnapshotFuelTypeLabel('GASOLINE')).toBe('휘발유')
    expect(formatTransportSnapshotFuelTypeLabel('DIESEL')).toBe('경유')
    expect(formatTransportSnapshotFuelTypeLabel('휘발유')).toBe('휘발유')
    expect(formatTransportSnapshotFuelTypeLabel('UNKNOWN_FUEL')).toBe('-')
  })
})
