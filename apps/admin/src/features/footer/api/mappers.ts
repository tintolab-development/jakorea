import type {
  FooterAdminDoc,
  FooterOrgInfo,
  FooterOrgInfoSaveInput,
  FooterRelatedLogo,
  FooterTopMenu,
} from '@/entities/footer/model/types'
import type { FooterAdminResponse } from '@/shared/api/generated/site/schemas/footerAdminResponse'
import type { FooterMenuResponse } from '@/shared/api/generated/site/schemas/footerMenuResponse'
import type { FooterMenuUpdateItem } from '@/shared/api/generated/site/schemas/footerMenuUpdateItem'
import type { FooterMenusUpdateRequest } from '@/shared/api/generated/site/schemas/footerMenusUpdateRequest'
import type { FooterOrganizationResponse } from '@/shared/api/generated/site/schemas/footerOrganizationResponse'
import type { FooterOrganizationUpdateRequest } from '@/shared/api/generated/site/schemas/footerOrganizationUpdateRequest'
import type { FooterPartnerOrderItem } from '@/shared/api/generated/site/schemas/footerPartnerOrderItem'
import type { FooterPartnerResponse } from '@/shared/api/generated/site/schemas/footerPartnerResponse'
import type { FooterPartnerUpdateRequest } from '@/shared/api/generated/site/schemas/footerPartnerUpdateRequest'

/** FE id → API menuCode */
export const FE_FOOTER_MENU_ID_TO_CODE: Record<string, string> = {
  'footer-menu-terms': 'TERMS',
  'footer-menu-privacy': 'PRIVACY',
  'footer-menu-directions': 'DIRECTIONS',
  'footer-menu-nts-disclosure': 'NTS_DISCLOSURE',
  'footer-menu-nts-report': 'NTS_EVASION_REPORT',
  'footer-menu-donate': 'DONATION',
  'footer-menu-receipt': 'DONATION_RECEIPT',
}

const MENU_CODE_TO_FE_ID: Record<string, string> = Object.fromEntries(
  Object.entries(FE_FOOTER_MENU_ID_TO_CODE).map(([id, code]) => [code, id]),
)

export function footerPartnerIdToFeId(partnerId: number): string {
  return `footer-logo-${partnerId}`
}

export function feIdToPartnerId(feId: string): number {
  const match = /^footer-logo-(\d+)$/.exec(feId)
  if (!match) throw new Error(`Unknown footer partner id: ${feId}`)
  return Number(match[1])
}

export function toApiFooterMenuCode(feId: string): string {
  const code = FE_FOOTER_MENU_ID_TO_CODE[feId]
  if (!code) throw new Error(`Unknown footer menu id: ${feId}`)
  return code
}

export function mapFooterMenuResponseToDomain(row: FooterMenuResponse): FooterTopMenu | null {
  const menuCode = row.menuCode
  if (!menuCode) return null
  const id = MENU_CODE_TO_FE_ID[menuCode]
  if (!id) return null
  const isInternal = row.linkType === 'INTERNAL'
  return {
    id,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    name: row.label?.trim() || id,
    isInternal,
    linkUrl: isInternal ? '' : (row.externalUrl ?? ''),
    version: row.version ?? 0,
  }
}

export function mapFooterMenusToDomain(rows: FooterMenuResponse[] | undefined): FooterTopMenu[] {
  return (rows ?? [])
    .map(mapFooterMenuResponseToDomain)
    .filter((row): row is FooterTopMenu => row != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function toFooterMenusUpdateRequest(menus: FooterTopMenu[]): FooterMenusUpdateRequest {
  if (menus.length !== 7) {
    throw new Error(`Footer menus update requires exactly 7 items, got ${menus.length}`)
  }
  const items: FooterMenuUpdateItem[] = menus.map(row => {
    const trimmed = row.linkUrl.trim()
    return {
      menuCode: toApiFooterMenuCode(row.id),
      enabled: row.isActive,
      displayOrder: row.sortOrder,
      // 내부 메뉴는 URL을 보내지 않는다. 외부 메뉴의 빈 문자열도 생략되어 서버에서 null로 지워진다.
      externalUrl: row.isInternal ? undefined : trimmed.length > 0 ? trimmed : undefined,
      version: row.version,
    }
  })
  return { menus: items }
}

export function mapFooterOrganizationToDomain(
  row: FooterOrganizationResponse | undefined,
): FooterOrgInfo {
  const logo = row?.logo
  return {
    name: row?.organizationName ?? '',
    address: row?.address ?? '',
    zipCode: row?.postalCode ?? '',
    representative: row?.representativeName ?? '',
    businessNumber: row?.businessRegistrationNumber ?? '',
    phone: row?.phone ?? '',
    fax: row?.fax ?? '',
    email: row?.email ?? '',
    organizationDescription: row?.organizationDescription?.trim() || undefined,
    logoUrl: logo?.publicUrl ?? '',
    logoFileName: logo?.originalName,
    logoAssetId: logo?.assetId,
    updatedAt: '',
    version: row?.version ?? 0,
  }
}

export function toFooterOrganizationUpdateRequest(
  input: FooterOrgInfoSaveInput,
  version: number,
  logoAssetId: number | undefined,
): FooterOrganizationUpdateRequest {
  const description = input.organizationDescription?.trim()
  return {
    organizationName: input.name.trim(),
    // 생략된 optional 문자열·asset id는 Jackson이 null로 읽고, 서버는 null을 삭제로 저장한다.
    organizationDescription: description || undefined,
    address: input.address.trim() || undefined,
    postalCode: input.zipCode.trim() || undefined,
    representativeName: input.representative.trim() || undefined,
    businessRegistrationNumber: input.businessNumber.trim() || undefined,
    phone: input.phone.trim() || undefined,
    fax: input.fax.trim() || undefined,
    email: input.email.trim() || undefined,
    logoAssetId,
    version,
  } as FooterOrganizationUpdateRequest
}

type FooterPartnerLinkWire = FooterPartnerResponse & {
  externalUrl?: string | null
  linkUrl?: string | null
}

function readPartnerLinkUrl(row: FooterPartnerResponse): string {
  const wire = row as FooterPartnerLinkWire
  const raw = wire.externalUrl ?? wire.linkUrl
  return typeof raw === 'string' ? raw.trim() : ''
}

export function mapFooterPartnerToDomain(row: FooterPartnerResponse): FooterRelatedLogo | null {
  const partnerId = row.partnerId
  if (partnerId == null) return null
  const name = row.organizationName?.trim() ?? ''
  const logoUrl = row.logo?.publicUrl ?? ''
  const linkUrl = readPartnerLinkUrl(row)
  const hasContent = Boolean(name || logoUrl)
  return {
    id: footerPartnerIdToFeId(partnerId),
    partnerId,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    hasContent,
    name,
    linkUrl,
    logoUrl,
    logoFileName: row.logo?.originalName,
    logoAssetId: row.logo?.assetId,
    version: row.version ?? 0,
  }
}

export function mapFooterPartnersToDomain(
  rows: FooterPartnerResponse[] | undefined,
): FooterRelatedLogo[] {
  return (rows ?? [])
    .map(mapFooterPartnerToDomain)
    .filter((row): row is FooterRelatedLogo => row != null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function toFooterPartnerUpdateRequest(
  row: FooterRelatedLogo,
  logoAssetId: number | undefined,
): FooterPartnerUpdateRequest & { externalUrl?: string } {
  const name = row.name.trim()
  const linkUrl = row.linkUrl.trim()
  return {
    enabled: row.isActive,
    organizationName: name.length > 0 ? name : undefined,
    logoAssetId,
    version: row.version,
    ...(linkUrl.length > 0 ? { externalUrl: linkUrl } : {}),
  }
}

export function toFooterPartnerOrderRequest(
  rows: FooterRelatedLogo[],
): { partners: FooterPartnerOrderItem[] } {
  if (rows.length !== 4) {
    throw new Error(`Footer partner reorder requires exactly 4 items, got ${rows.length}`)
  }
  return {
    partners: rows.map(row => ({
      partnerId: row.partnerId,
      displayOrder: row.sortOrder,
      version: row.version,
    })),
  }
}

export function mapFooterAdminResponseToDomain(row: FooterAdminResponse): FooterAdminDoc {
  return {
    topMenus: mapFooterMenusToDomain(row.menus),
    orgInfo: mapFooterOrganizationToDomain(row.organization),
    relatedLogos: mapFooterPartnersToDomain(row.partners),
  }
}
