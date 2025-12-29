# CMS 프로젝트 필수 라이브러리 목록

## 📦 현재 설치된 라이브러리

```json
{
  "dependencies": {
    "@ant-design/cssinjs": "^2.0.1",
    "@jakorea/ui": "workspace:*",
    "@jakorea/utils": "workspace:*",
    "antd": "^5.28.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

---

## ✅ 필수 라이브러리 (PROJECT_GUIDE.md 기준)

### 1. 라우팅

```bash
pnpm --filter cms add react-router-dom
```

- **용도**: React Router 설정, 라우팅 관리
- **버전**: `^7.1.3` (LMS와 동일)

### 2. 상태 관리

```bash
pnpm --filter cms add zustand
```

- **용도**: 전역 상태 관리 (Feature별 스토어)
- **버전**: `^5.0.2` (LMS와 동일)

### 3. 폼 관리

```bash
pnpm --filter cms add react-hook-form
pnpm --filter cms add @hookform/resolvers
```

- **용도**: 폼 상태 관리 및 검증
- **버전**:
  - `react-hook-form`: `^7.54.2`
  - `@hookform/resolvers`: `^3.9.1`

### 4. 스키마 검증

```bash
pnpm --filter cms add zod
```

- **용도**: 폼 스키마 검증 (React Hook Form과 함께 사용)
- **버전**: `^3.24.1`

### 5. 테이블 관리

```bash
pnpm --filter cms add @tanstack/react-table
```

- **용도**: 테이블 필터링, 정렬, 페이지네이션
- **버전**: `^8.20.5`

### 6. API 호출 (Mock 단계)

```bash
pnpm --filter cms add axios
```

- **용도**: Mock API 호출, 향후 실제 API 연동 시 사용
- **버전**: `^1.7.9`

### 7. 날짜 처리

```bash
pnpm --filter cms add date-fns
```

- **용도**: 날짜 포맷팅, 계산, 비교
- **버전**: `^4.1.0`

---

## 🎯 MVP 기능별 필수 라이브러리

### Phase 4: 정산 관리

```bash
pnpm --filter cms add exceljs
```

- **용도**: 정산 문서 생성 (Excel 파일)
- **버전**: `^4.4.0`
- **참고**: MVP_ROADMAP.md Phase 4.1에서 사용

### Phase 5: 대시보드 (선택사항)

```bash
pnpm --filter cms add recharts
```

- **용도**: 대시보드 차트 (프로그램별 현황 등)
- **버전**: `^2.15.0`
- **참고**: MVP_ROADMAP.md Phase 5.1에서 선택사항으로 언급

---

## 💡 추가 권장 라이브러리

### 1. 파일 다운로드

```bash
pnpm --filter cms add file-saver
pnpm --filter cms add -D @types/file-saver
```

- **용도**: 정산 문서 다운로드 기능
- **버전**: `^2.0.5`
- **이유**: ExcelJS로 생성한 파일을 브라우저에서 다운로드

### 2. 날짜/시간 선택기 (Ant Design 확장)

```bash
pnpm --filter cms add dayjs
```

- **용도**: Ant Design DatePicker와 함께 사용, 날짜 포맷팅
- **버전**: `^1.11.13`
- **참고**: Ant Design은 내부적으로 dayjs를 사용하므로 일관성 유지

### 3. 유틸리티 함수 (선택사항)

```bash
pnpm --filter cms add lodash-es
pnpm --filter cms add -D @types/lodash-es
```

- **용도**: 배열/객체 조작, 유틸리티 함수
- **버전**: `^4.17.21`
- **참고**: `@jakorea/utils`에서 제공하는 경우 생략 가능

### 4. 폼 파일 업로드

```bash
# Ant Design Upload 컴포넌트 사용 (이미 antd에 포함)
# 추가 라이브러리 불필요
```

- **용도**: 증빙 파일 업로드 (강사 정산 제출 폼)
- **참고**: Ant Design의 `Upload` 컴포넌트 사용

### 5. 캘린더 컴포넌트 (선택사항)

```bash
# Ant Design Calendar 컴포넌트 사용 (이미 antd에 포함)
# 또는
pnpm --filter cms add react-big-calendar
pnpm --filter cms add -D @types/react-big-calendar
```

- **용도**: 일정 관리 캘린더 뷰
- **참고**: Ant Design의 `Calendar` 컴포넌트로 충분할 수 있음

### 6. 상태 관리 DevTools (개발 환경)

```bash
pnpm --filter cms add -D @tanstack/react-table-devtools
```

- **용도**: React Table 디버깅 (개발 환경)
- **버전**: `^8.20.5`
- **참고**: 개발 환경에서만 사용

### 7. 에러 바운더리 (선택사항)

```bash
pnpm --filter cms add react-error-boundary
```

- **용도**: 에러 처리 및 에러 바운더리
- **버전**: `^4.0.13`
- **참고**: 프로덕션 환경에서 에러 처리 개선

### 8. 로딩 상태 관리 (선택사항)

```bash
# Ant Design Spin 컴포넌트 사용 (이미 antd에 포함)
# 또는
pnpm --filter cms add nprogress
pnpm --filter cms add -D @types/nprogress
```

- **용도**: 페이지 전환 시 로딩 인디케이터
- **버전**: `^0.2.0`
- **참고**: Ant Design의 `Spin` 컴포넌트로 충분할 수 있음

### 9. 알림/토스트 (이미 포함)

```bash
# Ant Design message/notification 컴포넌트 사용
# 추가 라이브러리 불필요
```

- **용도**: 사용자 알림, 성공/에러 메시지
- **참고**: Ant Design의 `message`, `notification` 컴포넌트 사용

### 10. 모달/다이얼로그 (이미 포함)

```bash
# Ant Design Modal 컴포넌트 사용
# 추가 라이브러리 불필요
```

- **용도**: 모달, 다이얼로그
- **참고**: Ant Design의 `Modal`, `Drawer` 컴포넌트 사용

---

## 📋 전체 설치 명령어 (필수)

```bash
# 필수 라이브러리 일괄 설치
pnpm --filter cms add \
  react-router-dom@^7.1.3 \
  zustand@^5.0.2 \
  react-hook-form@^7.54.2 \
  @hookform/resolvers@^3.9.1 \
  zod@^3.24.1 \
  @tanstack/react-table@^8.20.5 \
  axios@^1.7.9 \
  date-fns@^4.1.0 \
  exceljs@^4.4.0
```

---

## 📋 전체 설치 명령어 (권장 포함)

```bash
# 필수 + 권장 라이브러리 일괄 설치
pnpm --filter cms add \
  react-router-dom@^7.1.3 \
  zustand@^5.0.2 \
  react-hook-form@^7.54.2 \
  @hookform/resolvers@^3.9.1 \
  zod@^3.24.1 \
  @tanstack/react-table@^8.20.5 \
  axios@^1.7.9 \
  date-fns@^4.1.0 \
  exceljs@^4.4.0 \
  file-saver@^2.0.5 \
  dayjs@^1.11.13

# 타입 정의
pnpm --filter cms add -D \
  @types/file-saver@^2.0.13
```

---

## 🎨 Ant Design 관련 (이미 설치됨)

다음 기능들은 Ant Design에 이미 포함되어 있어 추가 설치 불필요:

- ✅ **Form**: `Form`, `Form.Item`, `Input`, `Select`, `DatePicker` 등
- ✅ **Table**: `Table` (@tanstack/react-table과 함께 사용)
- ✅ **Layout**: `Layout`, `Header`, `Sider`, `Content`, `Footer`
- ✅ **Navigation**: `Menu`, `Breadcrumb`
- ✅ **Feedback**: `Spin`, `Alert`, `Message`, `Notification`, `Modal`, `Drawer`
- ✅ **Data Display**: `Card`, `List`, `Descriptions`, `Tag`, `Badge`
- ✅ **Data Entry**: `Upload`, `Switch`, `Checkbox`, `Radio`
- ✅ **기타**: `Button`, `Icon`, `Typography`, `Divider`, `Space`, `Grid`

---

## 📊 라이브러리 우선순위

### 🔴 최우선 (즉시 설치 필요)

1. `react-router-dom` - 라우팅 필수
2. `zustand` - 상태 관리 필수
3. `react-hook-form` + `@hookform/resolvers` + `zod` - 폼 관리 필수
4. `@tanstack/react-table` - 테이블 필터링 필수

### 🟡 높음 (Phase 1-2에서 필요)

5. `axios` - Mock API 호출
6. `date-fns` - 날짜 처리

### 🟢 중간 (Phase 4에서 필요)

7. `exceljs` - 정산 문서 생성
8. `file-saver` - 파일 다운로드

### ⚪ 선택사항 (필요 시 추가)

9. `recharts` - 대시보드 차트
10. `dayjs` - Ant Design DatePicker와의 일관성
11. `lodash-es` - 유틸리티 함수 (필요 시)
12. `react-error-boundary` - 에러 처리 개선

---

## 🔗 참고 문서

- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) - 프로젝트 가이드
- [MVP_ROADMAP.md](../../MVP_ROADMAP.md) - MVP 로드맵
- [Ant Design 공식 문서](https://ant.design/docs/react/introduce)
- [TanStack Table 공식 문서](https://tanstack.com/table/latest)

---

**마지막 업데이트**: 2024년




