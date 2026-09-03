export const SETTLEMENT_BANK_OPTIONS = [
  { value: 'kb', label: '국민은행' },
  { value: 'shinhan', label: '신한은행' },
  { value: 'woori', label: '우리은행' },
  { value: 'hana', label: '하나은행' },
  { value: 'nh', label: '농협은행' },
  { value: 'ibk', label: '기업은행' },
  { value: 'kakao', label: '카카오뱅크' },
]

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
