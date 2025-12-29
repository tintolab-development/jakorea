# Custom Hooks 작성 가이드

## 관심사 분리 원칙

각 Custom Hook은 하나의 명확한 관심사만 다뤄야 합니다.

### ✅ 좋은 예시: 데이터 페칭만 담당

```typescript
// features/instructor/model/use-instructor-list.ts
export function useInstructorList() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    instructorService
      .getAll()
      .then(setInstructors)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { instructors, loading, error }
}
```

### ✅ 좋은 예시: 필터링만 담당

```typescript
// features/instructor/model/use-instructor-filters.ts
export function useInstructorFilters() {
  const [filters, setFilters] = useState<InstructorFilters>({
    name: '',
    region: '',
  })

  const updateFilter = useCallback((key: keyof InstructorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ name: '', region: '' })
  }, [])

  return { filters, updateFilter, resetFilters }
}
```

### ✅ 좋은 예시: 페이지네이션만 담당

```typescript
// shared/hooks/use-pagination.ts
export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
  }, [initialPage, initialPageSize])

  return { page, pageSize, setPage, setPageSize, reset }
}
```

## 의존성 관리

Hook의 의존성을 명확히 하고, 불필요한 재렌더링을 방지합니다.

### ❌ 나쁜 예시: 의존성 누락

```typescript
export function useInstructorList(filters: InstructorFilters) {
  const [instructors, setInstructors] = useState<Instructor[]>([])

  useEffect(() => {
    instructorService.getAll().then(data => {
      const filtered = data.filter(/* 필터링 로직 */)
      setInstructors(filtered)
    })
  }) // 의존성 배열 누락!

  return instructors
}
```

### ✅ 좋은 예시: 의존성 명시, 메모이제이션 활용

```typescript
export function useInstructorList(filters: InstructorFilters) {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)

  const filterInstructors = useCallback(
    (data: Instructor[]) => {
      return data.filter(inst => {
        if (filters.name && !inst.name.includes(filters.name)) return false
        if (filters.region && inst.region !== filters.region) return false
        return true
      })
    },
    [filters.name, filters.region] // 의존성 명시
  )

  useEffect(() => {
    setLoading(true)
    instructorService
      .getAll()
      .then(filterInstructors)
      .then(setInstructors)
      .finally(() => setLoading(false))
  }, [filterInstructors]) // 의존성 배열에 포함

  return { instructors, loading }
}
```

## 재사용성 고려

범용적인 Hook은 `shared/hooks/`에 배치하고, Feature별 Hook은 `features/*/model/`에 배치합니다.

### 범용 Hook 예시

```typescript
// shared/hooks/use-async.ts
interface UseAsyncOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(asyncFn: () => Promise<T>, options: UseAsyncOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn()
      setData(result)
      options.onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [asyncFn, options.onSuccess, options.onError])

  useEffect(() => {
    if (options.immediate !== false) {
      execute()
    }
  }, [execute, options.immediate])

  return { data, loading, error, execute }
}
```

### Feature별 Hook 예시

```typescript
// features/instructor/model/use-instructor-list.ts
export function useInstructorList() {
  return useAsync(() => instructorService.getAll(), {
    immediate: true,
  })
}
```

## 테스트 가능성

Hook을 독립적으로 테스트할 수 있도록 의존성을 주입 가능하게 만듭니다.

```typescript
// ✅ 좋은 예시: 의존성 주입 가능
interface UseInstructorListOptions {
  service?: typeof instructorService
}

export function useInstructorList(options: UseInstructorListOptions = {}) {
  const service = options.service || instructorService
  const { data, loading, error, execute } = useAsync(() => service.getAll(), {
    immediate: true,
  })

  return {
    instructors: data || [],
    loading,
    error,
    refetch: execute,
  }
}
```

## Hook 조합 (Composition)

여러 Hook을 조합하여 복잡한 로직을 구성합니다.

```typescript
// features/instructor/model/use-instructor-list-with-filters.ts
export function useInstructorListWithFilters() {
  const { filters, updateFilter, resetFilters } = useInstructorFilters()
  const { page, pageSize, setPage, setPageSize } = usePagination()
  const { instructors, loading, error } = useInstructorList()

  const filteredInstructors = useMemo(() => {
    return instructors.filter(inst => {
      if (filters.name && !inst.name.includes(filters.name)) return false
      if (filters.region && inst.region !== filters.region) return false
      return true
    })
  }, [instructors, filters])

  const paginatedInstructors = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredInstructors.slice(start, end)
  }, [filteredInstructors, page, pageSize])

  const handleFilterChange = useCallback(
    (key: keyof InstructorFilters, value: string) => {
      updateFilter(key, value)
      setPage(1)
    },
    [updateFilter, setPage]
  )

  return {
    instructors: paginatedInstructors,
    loading,
    error,
    filters,
    pagination: { page, pageSize, total: filteredInstructors.length },
    onFilterChange: handleFilterChange,
    onPaginationChange: { setPage, setPageSize },
    resetFilters,
  }
}
```

## Hook 작성 체크리스트

- [ ] 단일 책임 원칙을 따르는가?
- [ ] 의존성 배열이 올바르게 설정되었는가?
- [ ] 불필요한 재렌더링을 방지하기 위해 메모이제이션을 사용하는가?
- [ ] 테스트 가능하도록 의존성을 주입 가능하게 만들었는가?
- [ ] 재사용 가능한 Hook은 `shared/hooks/`에 배치했는가?
- [ ] Feature별 Hook은 `features/*/model/`에 배치했는가?
- [ ] 타입이 명확하게 정의되었는가?

## 관련 규칙

- [컴포넌트 패턴](./component-patterns.md)
- [상태 관리](../state/state-management.md)


