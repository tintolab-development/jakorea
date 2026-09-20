/**
 * 프로그램 소개 관리 — localStorage mock (Homepage API 미설정·실패 fallback)
 * fieldCode 4종, 섹션 수 가변
 */

import type {
  ProgramIntroCategoryDocument,
  ProgramIntroFieldCode,
  ProgramIntroImage,
  ProgramIntroItem,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { PROGRAM_INTRO_FIELD_CODES } from '@/entities/education-program-intro/model/types'
import { getProgramImageSlotCount } from '@/features/education-program-intro/lib/image-slots'

const STORAGE_KEY = 'admin.jakorea.educationProgramIntro.v2'

export const EDUCATION_PROGRAM_INTRO_CHANGED_EVENT =
  'jakorea:education-program-intro-changed' as const

type StoreFile = {
  version: 2
  documents: Record<ProgramIntroFieldCode, ProgramIntroCategoryDocument>
}

type SectionSeed = {
  sectionKey: string
  programType: string
  typeDescription: string
  representativeProgram: string
  sponsorName: string
  representativeDescription: string
}

function placeholderImage(sortOrder: number): ProgramIntroImage {
  return {
    fileName: `image-${sortOrder}.jpg`,
    fileUrl: '',
    alt: `image-${sortOrder}`,
    sortOrder,
  }
}

function emptyImages(count: number): ProgramIntroImage[] {
  return Array.from({ length: count }, (_, i) => placeholderImage(i + 1))
}

function padImages(images: ProgramIntroImage[], count: number): ProgramIntroImage[] {
  const next = images.slice(0, count)
  while (next.length < count) next.push(null)
  return next
}

function cloneImage(image: ProgramIntroImage): ProgramIntroImage {
  if (!image) return null
  return {
    fileName: image.fileName,
    fileUrl: image.fileUrl,
    alt: image.alt,
    sortOrder: image.sortOrder,
    width: image.width,
    height: image.height,
    assetId: image.assetId,
  }
}

function cloneItem(item: ProgramIntroItem, programIndex: number): ProgramIntroItem {
  const count = getProgramImageSlotCount(programIndex)
  return {
    sectionKey: item.sectionKey,
    sortOrder: item.sortOrder,
    programType: item.programType,
    typeDescription: item.typeDescription,
    images: padImages(item.images.map(cloneImage), count),
    representativeProgram: item.representativeProgram,
    sponsorName: item.sponsorName,
    representativeDescription: item.representativeDescription,
  }
}

function buildSections(seeds: readonly SectionSeed[]): ProgramIntroItem[] {
  return seeds.map((seed, index) => ({
    sectionKey: seed.sectionKey,
    sortOrder: index + 1,
    programType: seed.programType,
    typeDescription: seed.typeDescription,
    images: emptyImages(getProgramImageSlotCount(index)),
    representativeProgram: seed.representativeProgram,
    sponsorName: seed.sponsorName,
    representativeDescription: seed.representativeDescription,
  }))
}

function buildDocument(
  fieldCode: ProgramIntroFieldCode,
  mainText: string,
  sections: readonly SectionSeed[],
): ProgramIntroCategoryDocument {
  return {
    fieldCode,
    mainText,
    version: 0,
    sections: buildSections(sections),
    updatedAt: '2026-09-20T00:00:00.000Z',
  }
}

function buildSeedDocuments(): Record<ProgramIntroFieldCode, ProgramIntroCategoryDocument> {
  return {
    CAREER_EMPLOYMENT: buildDocument(
      'CAREER_EMPLOYMENT',
      '청소년이 자신의 진로를 주도적으로 탐색하고,\n성공적인 취업에 필요한 역량을 갖출 수 있도록 교육합니다.',
      [
        {
          sectionKey: 'explore',
          programType: '진로 탐색 프로그램',
          typeDescription:
            '청소년이 다양한 직업의 세계를 폭넓게 살펴보면서 막연했던 진로의 선택지를 구체적으로 넓혀가는 프로그램입니다.',
          representativeProgram: 'Global Career Discovery',
          sponsorName: 'SAP',
          representativeDescription:
            'SAP의 임직원이 멘토로 참여해 고등학생이 진로를 주도적으로 설계할 수 있도록 지원합니다.',
        },
        {
          sectionKey: 'experience',
          programType: '직무 체험 프로그램',
          typeDescription:
            '청소년이 관심 있는 산업과 직무를 교실 밖 현장에서 직접 경험해보는 프로그램입니다.',
          representativeProgram: 'BETTER GROUND High School',
          sponsorName: 'KRAFTON',
          representativeDescription:
            '게임 분야 진로를 희망하는 고등학생에게 현직자 멘토링과 전문적인 교육을 제공합니다.',
        },
        {
          sectionKey: 'strengthen',
          programType: '취업 역량 강화 프로그램',
          typeDescription:
            '성공적인 취업에 필요한 실무 역량을 강화하고, 실제 취업까지 연결될 수 있도록 지원하는 프로그램입니다.',
          representativeProgram: 'Build Your Opportunities',
          sponsorName: 'Starbucks',
          representativeDescription:
            '스타벅스 바리스타 파트너가 멘토로 활동하며 학생들에게 취업 준비 및 사회생활 기술을 제공합니다.',
        },
      ],
    ),
    ECONOMICS_FINANCE: buildDocument(
      'ECONOMICS_FINANCE',
      '청소년이 시장경제의 원리를 이해하고 경제 지식을 습득해\n생활 속에서 합리적인 의사 결정을 할 수 있도록 돕습니다.',
      [
        {
          sectionKey: 'ujat',
          programType: '대학생 경제교육봉사단 UJAT',
          typeDescription:
            '2006년부터 20년 넘게 지속되어 온 JA의 대표 경제교육 프로그램입니다.',
          representativeProgram: '',
          sponsorName: '',
          representativeDescription: '',
        },
        {
          sectionKey: 'employee',
          programType: '임직원 참여형 경제·금융 교육',
          typeDescription:
            '기업 임직원이 교육자로 참여해 청소년과 교감하며 직접 경제·금융교육을 진행하는 프로그램입니다.',
          representativeProgram: '꿀잼 어린이 금융교육',
          sponsorName: '메트라이프생명 사회공헌재단',
          representativeDescription:
            '메트라이프생명 소속 보험재무설계사(FSR)가 지역 초등학생에게 직접 경제교육을 진행합니다.',
        },
        {
          sectionKey: 'instructor',
          programType: '강사 파견 경제·금융 교육',
          typeDescription:
            '전국 초·중·고등학교에 전문 경제교육 강사단을 파견하는 JA Korea의 대표 경제교육입니다.',
          representativeProgram: '1사1교 경제·금융교육',
          sponsorName: '',
          representativeDescription:
            '금융 분야 기업과 학교를 매칭하는 1사1교 경제·금융교육은 전문 강사가 학교에 직접 찾아가 교육합니다.',
        },
      ],
    ),
    ENTREPRENEURSHIP: buildDocument(
      'ENTREPRENEURSHIP',
      '청소년이 기업과 기업가의 사회적 역할 및 기능을 이해하고,\n기업가정신의 핵심 역량을 갖출 수 있도록 맞춤형 체험 교육을 제공합니다.',
      [
        {
          sectionKey: 'startup',
          programType: '실물 창업 프로그램',
          typeDescription:
            '청소년이 창업의 전 과정을 직접 실현해보는 체험형 기업가정신 교육입니다.',
          representativeProgram: 'Company of the Year',
          sponsorName: '',
          representativeDescription:
            '창업을 통해 주변 문제에 대한 해결 방안을 모색해보는 JA의 대표 기업가정신 교육 프로그램입니다.',
        },
        {
          sectionKey: 'contest',
          programType: '비즈니스 경연대회',
          typeDescription:
            '비즈니스 전략을 수립 및 발표하는 과정을 통해 기업가정신을 함양합니다.',
          representativeProgram: 'International Trade Challenge',
          sponsorName: 'FedEx',
          representativeDescription:
            '고등학생이 실제 무역 사례를 분석하고 발표하는 과정을 겪으며 기업가로 성장할 수 있도록 돕는 국제무역창업대회입니다.',
        },
        {
          sectionKey: 'elementary',
          programType: '초·중등 기업가정신 교육',
          typeDescription:
            '초·중학생의 눈높이에 맞춰 참여형 교육과 놀이를 결합한 체험형 기업가정신 교육을 운영합니다.',
          representativeProgram: '기발한 초등 CEO 교실',
          sponsorName: '한국경제인협회',
          representativeDescription:
            '가족과 마을을 중심으로 경제의 기초 개념을 익히고, 장난감을 활용해 기업 운영의 전 과정을 경험합니다.',
        },
      ],
    ),
    DIGITAL_LITERACY: buildDocument(
      'DIGITAL_LITERACY',
      '과학 기술을 기반으로 지식과 정보를 습득하는 방법을 익히고,\n디지털 플랫폼을 통해 문제를 해결할 수 있도록 지원합니다.',
      [
        {
          sectionKey: 'ai-literacy',
          programType: 'AI 리터러시 교육',
          typeDescription:
            '생성형 AI를 안전하고 효과적으로 활용할 수 있도록 지원하는 교육 프로그램입니다.',
          representativeProgram: 'Google AI Educator Series(GES)',
          sponsorName: 'Google for Education',
          representativeDescription:
            '생성형 AI인 Gemini를 활용해 교사 업무 생산성을 높이고 학생에게 양질의 학습 경험을 제공하는 프로그램입니다.',
        },
        {
          sectionKey: 'sw-ai',
          programType: 'SW·AI 역량강화 교육',
          typeDescription:
            '청소년과 청년이 소프트웨어, AI 등 첨단 산업에서 활용되는 디지털 도구를 효과적으로 사용할 수 있도록 지원합니다.',
          representativeProgram: '삼성SW·AI아카데미(SSAFY)',
          sponsorName: 'SAMSUNG',
          representativeDescription:
            'SW·AI 기술을 산업 현장에서 활용할 수 있도록 체험형 교육을 제공합니다.',
        },
      ],
    ),
  }
}

function isFieldCode(value: unknown): value is ProgramIntroFieldCode {
  return (
    typeof value === 'string' &&
    (PROGRAM_INTRO_FIELD_CODES as readonly string[]).includes(value)
  )
}

function normalizeImage(raw: unknown, index: number): ProgramIntroImage {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as {
    fileName?: unknown
    fileUrl?: unknown
    alt?: unknown
    sortOrder?: unknown
    width?: unknown
    height?: unknown
    assetId?: unknown
  }
  if (typeof obj.fileName !== 'string' || obj.fileName.length === 0) return null
  return {
    fileName: obj.fileName,
    fileUrl: typeof obj.fileUrl === 'string' ? obj.fileUrl : '',
    alt: typeof obj.alt === 'string' ? obj.alt : obj.fileName,
    sortOrder: typeof obj.sortOrder === 'number' && obj.sortOrder > 0 ? obj.sortOrder : index + 1,
    width: typeof obj.width === 'number' ? obj.width : undefined,
    height: typeof obj.height === 'number' ? obj.height : undefined,
    assetId: typeof obj.assetId === 'number' && obj.assetId > 0 ? obj.assetId : undefined,
  }
}

function normalizeItem(
  raw: Partial<ProgramIntroItem> | undefined,
  programIndex: number,
  seed: ProgramIntroItem,
): ProgramIntroItem {
  const count = getProgramImageSlotCount(programIndex)
  const imagesRaw = Array.isArray(raw?.images)
    ? raw.images.map((image, index) => normalizeImage(image, index))
    : seed.images
  return {
    sectionKey:
      typeof raw?.sectionKey === 'string' && raw.sectionKey.trim()
        ? raw.sectionKey
        : seed.sectionKey,
    sortOrder:
      typeof raw?.sortOrder === 'number' && raw.sortOrder > 0 ? raw.sortOrder : programIndex + 1,
    programType: typeof raw?.programType === 'string' ? raw.programType : seed.programType,
    typeDescription:
      typeof raw?.typeDescription === 'string' ? raw.typeDescription : seed.typeDescription,
    images: padImages(imagesRaw, count),
    representativeProgram:
      typeof raw?.representativeProgram === 'string'
        ? raw.representativeProgram
        : seed.representativeProgram,
    sponsorName: typeof raw?.sponsorName === 'string' ? raw.sponsorName : seed.sponsorName,
    representativeDescription:
      typeof raw?.representativeDescription === 'string'
        ? raw.representativeDescription
        : seed.representativeDescription,
  }
}

function normalizeDocument(
  fieldCode: ProgramIntroFieldCode,
  raw: Partial<ProgramIntroCategoryDocument> | undefined,
  seed: ProgramIntroCategoryDocument,
): ProgramIntroCategoryDocument {
  const sectionsRaw = Array.isArray(raw?.sections) ? raw.sections : seed.sections
  const sections = seed.sections.map((seedSection, index) =>
    normalizeItem(sectionsRaw[index], index, seedSection),
  )
  return {
    fieldCode,
    mainText: typeof raw?.mainText === 'string' ? raw.mainText : seed.mainText,
    version: typeof raw?.version === 'number' ? raw.version : seed.version,
    sections,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : seed.updatedAt,
  }
}

function readFile(): StoreFile {
  const seed = buildSeedDocuments()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 2, documents: seed }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 2 || !parsed.documents || typeof parsed.documents !== 'object') {
      return { version: 2, documents: seed }
    }
    const documents = { ...seed }
    for (const fieldCode of PROGRAM_INTRO_FIELD_CODES) {
      documents[fieldCode] = normalizeDocument(fieldCode, parsed.documents[fieldCode], seed[fieldCode])
    }
    return { version: 2, documents }
  } catch {
    return { version: 2, documents: seed }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(EDUCATION_PROGRAM_INTRO_CHANGED_EVENT))
}

export function readProgramIntroCategory(
  fieldCode: ProgramIntroFieldCode,
): ProgramIntroCategoryDocument {
  if (!isFieldCode(fieldCode)) {
    throw new Error(`Invalid program intro field: ${String(fieldCode)}`)
  }
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  const doc = file.documents[fieldCode]
  return {
    ...doc,
    sections: doc.sections.map((section, index) => cloneItem(section, index)),
  }
}

export function saveProgramIntroCategory(
  input: ProgramIntroSaveInput,
): ProgramIntroCategoryDocument {
  if (!isFieldCode(input.fieldCode)) {
    throw new Error(`Invalid program intro field: ${String(input.fieldCode)}`)
  }
  const file = readFile()
  const now = new Date().toISOString()
  const next: ProgramIntroCategoryDocument = {
    fieldCode: input.fieldCode,
    mainText: input.mainText,
    version: input.version + 1,
    sections: input.sections.map((section, index) => cloneItem(section, index)),
    updatedAt: now,
  }
  writeFile({
    version: 2,
    documents: {
      ...file.documents,
      [input.fieldCode]: next,
    },
  })
  return next
}

export function cloneProgramIntroDocument(
  doc: ProgramIntroCategoryDocument,
): ProgramIntroCategoryDocument {
  return {
    fieldCode: doc.fieldCode,
    mainText: doc.mainText,
    version: doc.version,
    sections: doc.sections.map((section, index) => cloneItem(section, index)),
    updatedAt: doc.updatedAt,
  }
}
