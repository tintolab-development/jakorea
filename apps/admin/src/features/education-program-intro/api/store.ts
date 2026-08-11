/**
 * 프로그램 소개 관리 — localStorage mock (API 연동 전)
 * 탭(분야) 3종 고정
 */

import type {
  ProgramIntroCategoryDocument,
  ProgramIntroCategoryKey,
  ProgramIntroImage,
  ProgramIntroItem,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { getProgramImageSlotCount } from '@/features/education-program-intro/lib/image-slots'

const STORAGE_KEY = 'admin.jakorea.educationProgramIntro.v1'

export const EDUCATION_PROGRAM_INTRO_CHANGED_EVENT =
  'jakorea:education-program-intro-changed' as const

const CATEGORY_KEYS: readonly ProgramIntroCategoryKey[] = ['career', 'economy', 'digital']

type StoreFile = {
  version: 1
  categories: Record<ProgramIntroCategoryKey, ProgramIntroCategoryDocument>
}

function placeholderImage(fileName = 'text.jpg'): ProgramIntroImage {
  return { fileName, fileUrl: '' }
}

function emptyImages(count: number): ProgramIntroImage[] {
  return Array.from({ length: count }, () => null)
}

function padImages(images: ProgramIntroImage[], count: number): ProgramIntroImage[] {
  const next = images.slice(0, count)
  while (next.length < count) next.push(null)
  return next
}

function cloneItem(item: ProgramIntroItem, programIndex: number): ProgramIntroItem {
  const count = getProgramImageSlotCount(programIndex)
  return {
    programType: item.programType,
    typeDescription: item.typeDescription,
    images: padImages(
      item.images.map(img => (img ? { fileName: img.fileName, fileUrl: img.fileUrl } : null)),
      count
    ),
    representativeProgram: item.representativeProgram,
    sponsorName: item.sponsorName,
    representativeDescription: item.representativeDescription,
  }
}

function buildCareerSeed(): ProgramIntroCategoryDocument {
  return {
    categoryKey: 'career',
    mainText:
      'JA Korea는 청소년들이 스스로의 적성과 흥미를 발견하고, 미래 직업 세계를 탐색하며, 실질적인 취업 역량을 기를 수 있도록 체계적인 진로·취업 교육을 제공합니다.',
    programs: [
      {
        programType: '진로 탐색 프로그램',
        typeDescription:
          'JA Korea의 진로 탐색 프로그램은 청소년들이 자신의 적성과 흥미를 발견하고, 다양한 직업 세계를 이해할 수 있도록 돕습니다. 멘토링과 체험 활동을 통해 진로에 대한 구체적인 비전을 세울 수 있습니다.',
        images: [placeholderImage(), placeholderImage()],
        representativeProgram: 'Global Career Discovery',
        sponsorName: 'SAP',
        representativeDescription:
          'SAP와 함께하는 Global Career Discovery는 글로벌 기업의 업무 환경을 체험하고, 다양한 직무의 멘토들과 교류하며 진로를 탐색하는 프로그램입니다. 멘토는 학생들의 진로 고민을 듣고 실질적인 조언을 제공합니다.',
      },
      {
        programType: '직무 체험 프로그램',
        typeDescription:
          '직무 체험 프로그램은 실제 기업·직무 환경을 경험하며 진로 선택에 필요한 이해를 넓히도록 설계되었습니다. 현장 멘토와 함께하는 활동을 통해 직업 세계를 구체적으로 탐색합니다.',
        images: [placeholderImage()],
        representativeProgram: 'BETTER GROUND High School',
        sponsorName: 'KRAFTON',
        representativeDescription:
          'KRAFTON과 함께하는 BETTER GROUND High School은 게임·디지털 산업의 직무를 체험하고, 현업 멘토와 소통하며 진로를 구체화하는 프로그램입니다.',
      },
      {
        programType: '취업 역량 강화 프로그램',
        typeDescription:
          '취업 역량 강화 프로그램은 실무에 필요한 역량과 태도를 키워 청소년의 취업 준비를 지원합니다. 멘토링과 실습을 통해 자신감을 높입니다.',
        images: [placeholderImage(), placeholderImage(), placeholderImage()],
        representativeProgram: 'Build Your Opportunities',
        sponsorName: 'Starbucks',
        representativeDescription:
          'Starbucks와 함께하는 Build Your Opportunities는 바리스타 멘토링을 통해 서비스·커뮤니케이션 역량을 키우고, 실질적인 취업 준비를 돕는 프로그램입니다.',
      },
    ],
    updatedAt: '2026-08-01T00:00:00.000Z',
  }
}

function buildPlaceholderCategory(
  key: Exclude<ProgramIntroCategoryKey, 'career'>,
  label: string
): ProgramIntroCategoryDocument {
  return {
    categoryKey: key,
    mainText: `JA Korea는 ${label} 분야에서 청소년의 성장과 배움을 지원하는 프로그램을 제공합니다.`,
    programs: [
      {
        programType: `${label} 프로그램 유형 01`,
        typeDescription: `${label} 프로그램 유형에 대한 설명을 입력하세요.`,
        images: emptyImages(2),
        representativeProgram: '대표 프로그램명',
        sponsorName: '후원사명',
        representativeDescription: '대표 프로그램에 대한 설명을 입력하세요.',
      },
      {
        programType: `${label} 프로그램 유형 02`,
        typeDescription: `${label} 프로그램 유형에 대한 설명을 입력하세요.`,
        images: emptyImages(1),
        representativeProgram: '대표 프로그램명',
        sponsorName: '후원사명',
        representativeDescription: '대표 프로그램에 대한 설명을 입력하세요.',
      },
      {
        programType: `${label} 프로그램 유형 03`,
        typeDescription: `${label} 프로그램 유형에 대한 설명을 입력하세요.`,
        images: emptyImages(3),
        representativeProgram: '대표 프로그램명',
        sponsorName: '후원사명',
        representativeDescription: '대표 프로그램에 대한 설명을 입력하세요.',
      },
    ],
    updatedAt: '2026-08-01T00:00:00.000Z',
  }
}

function buildSeedCategories(): Record<ProgramIntroCategoryKey, ProgramIntroCategoryDocument> {
  return {
    career: buildCareerSeed(),
    economy: buildPlaceholderCategory('economy', '경제·금융'),
    digital: buildPlaceholderCategory('digital', '디지털 리터러시'),
  }
}

function isCategoryKey(value: unknown): value is ProgramIntroCategoryKey {
  return value === 'career' || value === 'economy' || value === 'digital'
}

function normalizeImage(raw: unknown): ProgramIntroImage {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as { fileName?: unknown; fileUrl?: unknown }
  if (typeof obj.fileName !== 'string' || obj.fileName.length === 0) return null
  return {
    fileName: obj.fileName,
    fileUrl: typeof obj.fileUrl === 'string' ? obj.fileUrl : '',
  }
}

function normalizeItem(raw: Partial<ProgramIntroItem> | undefined, programIndex: number): ProgramIntroItem {
  const count = getProgramImageSlotCount(programIndex)
  const imagesRaw = Array.isArray(raw?.images) ? raw.images.map(normalizeImage) : emptyImages(count)
  return {
    programType: typeof raw?.programType === 'string' ? raw.programType : '',
    typeDescription: typeof raw?.typeDescription === 'string' ? raw.typeDescription : '',
    images: padImages(imagesRaw, count),
    representativeProgram:
      typeof raw?.representativeProgram === 'string' ? raw.representativeProgram : '',
    sponsorName: typeof raw?.sponsorName === 'string' ? raw.sponsorName : '',
    representativeDescription:
      typeof raw?.representativeDescription === 'string' ? raw.representativeDescription : '',
  }
}

function normalizeDocument(
  key: ProgramIntroCategoryKey,
  raw: Partial<ProgramIntroCategoryDocument> | undefined,
  seed: ProgramIntroCategoryDocument
): ProgramIntroCategoryDocument {
  const programsRaw = Array.isArray(raw?.programs) ? raw.programs : seed.programs
  const programs: [ProgramIntroItem, ProgramIntroItem, ProgramIntroItem] = [
    normalizeItem(programsRaw[0], 0),
    normalizeItem(programsRaw[1], 1),
    normalizeItem(programsRaw[2], 2),
  ]
  return {
    categoryKey: key,
    mainText: typeof raw?.mainText === 'string' ? raw.mainText : seed.mainText,
    programs,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : seed.updatedAt,
  }
}

function readFile(): StoreFile {
  const seed = buildSeedCategories()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, categories: seed }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1 || !parsed.categories || typeof parsed.categories !== 'object') {
      return { version: 1, categories: seed }
    }
    const categories = { ...seed }
    for (const key of CATEGORY_KEYS) {
      categories[key] = normalizeDocument(key, parsed.categories[key], seed[key])
    }
    return { version: 1, categories }
  } catch {
    return { version: 1, categories: seed }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(EDUCATION_PROGRAM_INTRO_CHANGED_EVENT))
}

export function readProgramIntroCategory(
  categoryKey: ProgramIntroCategoryKey
): ProgramIntroCategoryDocument {
  if (!isCategoryKey(categoryKey)) {
    throw new Error(`Invalid program intro category: ${String(categoryKey)}`)
  }
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return {
    ...file.categories[categoryKey],
    programs: [
      cloneItem(file.categories[categoryKey].programs[0], 0),
      cloneItem(file.categories[categoryKey].programs[1], 1),
      cloneItem(file.categories[categoryKey].programs[2], 2),
    ],
  }
}

export function saveProgramIntroCategory(
  input: ProgramIntroSaveInput
): ProgramIntroCategoryDocument {
  if (!isCategoryKey(input.categoryKey)) {
    throw new Error(`Invalid program intro category: ${String(input.categoryKey)}`)
  }
  const file = readFile()
  const now = new Date().toISOString()
  const next: ProgramIntroCategoryDocument = {
    categoryKey: input.categoryKey,
    mainText: input.mainText,
    programs: [
      cloneItem(input.programs[0], 0),
      cloneItem(input.programs[1], 1),
      cloneItem(input.programs[2], 2),
    ],
    updatedAt: now,
  }
  writeFile({
    version: 1,
    categories: {
      ...file.categories,
      [input.categoryKey]: next,
    },
  })
  return next
}

export function cloneProgramIntroDocument(
  doc: ProgramIntroCategoryDocument
): ProgramIntroCategoryDocument {
  return {
    categoryKey: doc.categoryKey,
    mainText: doc.mainText,
    programs: [
      cloneItem(doc.programs[0], 0),
      cloneItem(doc.programs[1], 1),
      cloneItem(doc.programs[2], 2),
    ],
    updatedAt: doc.updatedAt,
  }
}
