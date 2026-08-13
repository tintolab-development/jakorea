import type {
  JaKoreaWorldwide,
  WorldwideBranch,
  WorldwideBranchId,
} from '@/entities/ja-korea-worldwide/model/types'
import type { WorldwideLinkResponse } from '@/shared/api/generated/ja-korea/schemas/worldwideLinkResponse'
import type { WorldwideResponse } from '@/shared/api/generated/ja-korea/schemas/worldwideResponse'
import type { WorldwideUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/worldwideUpdateRequest'

const LINK_CODE_TO_BRANCH_ID: Record<string, WorldwideBranchId> = {
  JA_WORLDWIDE: 'worldwide',
  JA_USA: 'usa',
  JA_EUROPE: 'europe',
  JA_MENA: 'mena',
  JA_ASIA_PACIFIC: 'asia-pacific',
  JA_AMERICAS: 'americas',
  JA_AFRICA: 'africa',
}

const BRANCH_ID_ORDER: WorldwideBranchId[] = [
  'worldwide',
  'usa',
  'europe',
  'mena',
  'asia-pacific',
  'americas',
  'africa',
]

const BRANCH_FALLBACK_NAME: Record<WorldwideBranchId, string> = {
  worldwide: 'JA Worldwide',
  usa: 'JUNIOR ACHIEVEMENT USA',
  europe: 'JA EUROPE',
  mena: 'INJAZ AL-ARAB JA MENA',
  'asia-pacific': 'JA ASIA PACIFIC',
  americas: 'JA AMERICAS includes Canada',
  africa: 'JA AFRICA',
}

function mapLinkToBranch(row: WorldwideLinkResponse, index: number): WorldwideBranch {
  const fromCode =
    row.linkCode && LINK_CODE_TO_BRANCH_ID[row.linkCode]
      ? LINK_CODE_TO_BRANCH_ID[row.linkCode]
      : undefined
  const id = fromCode ?? BRANCH_ID_ORDER[index] ?? 'worldwide'
  return {
    id,
    name: row.displayName?.trim() || BRANCH_FALLBACK_NAME[id],
    linkUrl: row.externalUrl ?? '',
    apiId: row.id ?? index + 1,
    version: row.version ?? 0,
  }
}

export function mapWorldwideResponseToDomain(row: WorldwideResponse): JaKoreaWorldwide {
  const links = row.links ?? []
  const byId = new Map<WorldwideBranchId, WorldwideBranch>()
  links.forEach((link, index) => {
    const branch = mapLinkToBranch(link, index)
    byId.set(branch.id, branch)
  })
  const branches = BRANCH_ID_ORDER.map((id, index) => {
    const existing = byId.get(id)
    if (existing) return existing
    return {
      id,
      name: BRANCH_FALLBACK_NAME[id],
      linkUrl: '',
      apiId: index + 1,
      version: 0,
    }
  })
  return {
    branches,
    bottomText: row.guidanceText ?? '',
    updatedAt: '',
    settingVersion: row.settingVersion ?? 0,
  }
}

export function toWorldwideUpdateRequest(data: JaKoreaWorldwide): WorldwideUpdateRequest {
  return {
    guidanceText: data.bottomText.trimEnd() || undefined,
    settingVersion: data.settingVersion,
    links: data.branches.map(branch => ({
      id: branch.apiId,
      externalUrl: branch.linkUrl.trim() || undefined,
      version: branch.version,
    })),
  }
}
