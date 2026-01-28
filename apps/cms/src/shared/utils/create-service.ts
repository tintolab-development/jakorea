/**
 * CRUD 서비스 인터페이스 및 팩토리
 * Phase 2: API 서비스 레이어 패턴 통일
 */

/**
 * 기본 CRUD 서비스 인터페이스
 */
export interface CrudService<T> {
  /**
   * 모든 항목 조회
   */
  getAll(): Promise<T[]>

  /**
   * ID로 항목 조회
   */
  getById(id: string): Promise<T>

  /**
   * 항목 생성
   */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>

  /**
   * 항목 수정
   */
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T>

  /**
   * 항목 삭제
   */
  delete(id: string): Promise<void>
}

/**
 * 동기 조회 헬퍼 함수를 포함한 확장 서비스 인터페이스
 */
export interface ExtendedCrudService<T> extends CrudService<T> {
  /**
   * ID로 항목 이름 조회 (동기)
   */
  getNameById: (id: string) => string

  /**
   * ID로 항목 전체 조회 (동기)
   */
  getByIdSync: (id: string) => T | undefined

  /**
   * 모든 항목 조회 (동기)
   */
  getAllSync: () => T[]
}

/**
 * 서비스 생성 옵션
 */
export interface CreateServiceOptions<T> {
  /**
   * ID 생성 함수
   */
  generateId?: (prefix: string) => string

  /**
   * 이름 필드 키 (getNameById에서 사용)
   */
  nameField?: keyof T
}

/**
 * 기본 ID 생성 함수
 */
function defaultGenerateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * CRUD 서비스 생성 헬퍼
 *
 * @example
 * ```typescript
 * const instructorService = createCrudService<Instructor>({
 *   prefix: 'instructor',
 *   mockData: mockInstructors,
 *   mockDataMap: mockInstructorsMap,
 * })
 * ```
 */
export function createCrudService<
  T extends { id: string; createdAt: string | Date; updatedAt: string | Date },
>(options: {
  prefix: string
  mockData: T[]
  mockDataMap: Map<string, T>
  generateId?: (prefix: string) => string
  nameField?: keyof T
}): ExtendedCrudService<T> {
  const {
    prefix,
    mockData,
    mockDataMap,
    generateId = defaultGenerateId,
    nameField = 'name' as keyof T,
  } = options

  return {
    async getAll(): Promise<T[]> {
      return Promise.resolve([...mockData])
    },

    async getById(id: string): Promise<T> {
      const item = mockDataMap.get(id)
      if (!item) {
        throw new Error(`${prefix} not found: ${id}`)
      }
      return Promise.resolve(item)
    },

    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      const newItem: T = {
        ...data,
        id: generateId(prefix),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as T
      mockData.push(newItem)
      mockDataMap.set(newItem.id, newItem)
      return Promise.resolve(newItem)
    },

    async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T> {
      const item = mockDataMap.get(id)
      if (!item) {
        throw new Error(`${prefix} not found: ${id}`)
      }
      const updatedItem: T = {
        ...item,
        ...data,
        updatedAt: new Date().toISOString(),
      }
      const index = mockData.findIndex(i => i.id === id)
      if (index !== -1) {
        mockData[index] = updatedItem
      }
      mockDataMap.set(id, updatedItem)
      return Promise.resolve(updatedItem)
    },

    async delete(id: string): Promise<void> {
      const index = mockData.findIndex(i => i.id === id)
      if (index === -1) {
        throw new Error(`${prefix} not found: ${id}`)
      }
      mockData.splice(index, 1)
      mockDataMap.delete(id)
      return Promise.resolve()
    },

    getNameById: (id: string): string => {
      const item = mockDataMap.get(id)
      return (item?.[nameField] as string) || id
    },

    getByIdSync: (id: string): T | undefined => {
      return mockDataMap.get(id)
    },

    getAllSync: (): T[] => {
      return [...mockData]
    },
  }
}
