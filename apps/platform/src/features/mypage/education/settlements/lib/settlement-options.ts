export const SETTLEMENT_TRANSIT_OPTIONS = [
  { value: 'bus', label: '버스(시내·시외·고속 등)' },
  { value: 'subway', label: '지하철' },
  { value: 'train', label: '기차(KTX·SRT·무궁화호 등)' },
  { value: 'flight', label: '항공기' },
  { value: 'other', label: '기타' },
]

export const SETTLEMENT_TRIP_TYPE_OPTIONS = [
  { value: 'one_way' as const, label: '편도' },
  { value: 'round_trip' as const, label: '왕복' },
]
