import { describe, expect, it } from 'vitest'
import { isK12SchoolAffiliationName } from '@/features/program/general/lib/k12-school-affiliation'

describe('isK12SchoolAffiliationName', () => {
  it.each(['부영초등학교', '서울중학교', '인천가온고등학교', '서울외국어고등학교'])(
    'treats %s as a K-12 school',
    name => {
      expect(isK12SchoolAffiliationName(name)).toBe(true)
    }
  )

  it.each(['', '   ', '한국대학교', '서울전문대학', 'JA강사단', '한국외국어대학교'])(
    'does not treat %s as a K-12 school',
    name => {
      expect(isK12SchoolAffiliationName(name)).toBe(false)
    }
  )
})
