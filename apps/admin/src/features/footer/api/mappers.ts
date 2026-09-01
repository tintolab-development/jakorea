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
  return {
    organizationName: input.name.trim(),
    address: input.address.trim() || undefined,
    postalCode: input.zipCode.trim() || undefined,
    representativeName: input.representative.trim() || undefined,
    businessRegistrationNumber: input.businessNumber.trim() || undefined,
    phone: input.phone.trim() || undefined,
    fax: input.fax.trim() || undefined,
    email: input.email.trim() || undefined,
    logoAssetId,
    version,
  }
}

export function mapFooterPartnerToDomain(row: FooterPartnerResponse): FooterRelatedLogo | null {
  const partnerId = row.partnerId
  if (partnerId == null) return null
  const name = row.organizationName?.trim() ?? ''
  const logoUrl = row.logo?.publicUrl ?? ''
  const hasContent = Boolean(name || logoUrl)
  return {
    id: footerPartnerIdToFeId(partnerId),
    partnerId,
    sortOrder: row.displayOrder ?? 0,
    isActive: Boolean(row.enabled),
    hasContent,
    name,
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
): FooterPartnerUpdateRequest {
  const name = row.name.trim()
  return {
    enabled: row.isActive,
    organizationName: name.length > 0 ? name : undefined,
    logoAssetId,
    version: row.version,
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
