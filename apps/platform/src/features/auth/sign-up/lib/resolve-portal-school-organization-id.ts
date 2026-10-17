import { searchHomepageSchools } from '../api/client'

function normalizeSchoolName(value: string): string {
  return value.trim().replace(/\s+/g, '')
}

/**
 * NEIS 검색 선택 후 CMS에 등록된 학교가 있으면 `organizationId`를 찾는다.
 * 교사 가입 `teacher.organizationId` / `member.schoolOrganizationId` 연동용.
 */
export async function resolvePortalSchoolOrganizationId(input: {
  schoolName: string
  address?: string | null
}): Promise<number | null> {
  const keyword = input.schoolName.trim()
  if (!keyword) return null

  try {
    const response = await searchHomepageSchools({ keyword, page: 0, size: 20 })
    const items = response.content ?? []
    if (items.length === 0) return null

    const targetName = normalizeSchoolName(keyword)
    const nameMatches = items.filter(
      item => item.name && normalizeSchoolName(item.name) === targetName,
    )
    if (nameMatches.length === 0) return null

    const address = input.address?.trim()
    if (address && nameMatches.length > 1) {
      const withAddress = nameMatches.find(item => {
        const cmsAddress = item.address?.trim()
        if (!cmsAddress) return false
        return cmsAddress === address || cmsAddress.includes(address) || address.includes(cmsAddress)
      })
      if (withAddress?.organizationId != null) return withAddress.organizationId
    }

    const first = nameMatches.find(item => item.organizationId != null)
    return first?.organizationId ?? null
  } catch {
    return null
  }
}
