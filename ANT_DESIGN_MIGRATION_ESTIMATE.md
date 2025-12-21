# Ant Design 마이그레이션 작업량 추정

## 📊 현재 프로젝트 현황

### 사용 중인 디자인 시스템
- **Material Design 3** (`@material/web` v2.4.1)
- 커스텀 래퍼 컴포넌트 22개
- 25개 페이지 파일에서 사용
- 50개 파일에서 M3 관련 코드 (890개 매치)

### 주요 컴포넌트 목록
1. `MdButton` - 버튼
2. `MdTextField` - 텍스트 입력
3. `MdSelect` / `MdSelectOption` - 셀렉트
4. `MdCheckbox` - 체크박스
5. `MdChip` / `MdChipSet` - 칩
6. `MdCard` - 카드
7. `MdPagination` - 페이지네이션
8. `MdSkeleton` - 스켈레톤 로딩
9. `MdFileUpload` - 파일 업로드
10. `MdSpinner` - 로딩 스피너
11. 커스텀 Skeleton 컴포넌트들 (Table, Detail, CardGrid, List)

## 🔄 Ant Design 마이그레이션 작업량 추정

### 1. 의존성 설치 및 설정 (0.5일)
- `antd` 패키지 설치
- `@ant-design/icons` 설치
- Ant Design ConfigProvider 설정
- 테마 커스터마이징 (색상 토큰 매핑)
- CSS import 설정

### 2. 컴포넌트 매핑 및 래퍼 생성 (3-4일)

#### 직접 매핑 가능한 컴포넌트 (1:1 대응)
| M3 컴포넌트 | Ant Design 컴포넌트 | 작업량 |
|------------|-------------------|--------|
| `MdButton` | `Button` | 0.5일 |
| `MdTextField` | `Input` | 0.5일 |
| `MdSelect` | `Select` | 1일 (API 차이 큼) |
| `MdCheckbox` | `Checkbox` | 0.5일 |
| `MdCard` | `Card` | 0.5일 |
| `MdPagination` | `Pagination` | 0.5일 |
| `MdSkeleton` | `Skeleton` | 0.5일 |
| `MdSpinner` | `Spin` | 0.5일 |

#### 커스텀 컴포넌트 재구현 (2-3일)
- `MdChip` → `Tag` 또는 커스텀 구현
- `MdFileUpload` → `Upload` 컴포넌트 재구현
- Skeleton 컴포넌트들 → Ant Design `Skeleton` 기반 재구현

**소계: 3-4일**

### 3. 페이지별 컴포넌트 교체 (5-7일)

#### 페이지 분류 및 작업량
- **List 페이지 (8개)**: 테이블, 필터, 페이지네이션 교체
  - `ApplicationsList`, `ProgramsList`, `InstructorsList`, `SchoolsList`, `SponsorsList`, `MatchingsList`, `SettlementsList`, `SchedulesCalendar`
  - 각 페이지당 0.5-1일
  - **소계: 4-6일**

- **Detail 페이지 (8개)**: 카드 레이아웃, 정보 표시
  - `ApplicationDetail`, `ProgramDetail`, `InstructorDetail`, `SchoolDetail`, `SponsorDetail`, `MatchingDetail`, `SettlementDetail`, `ScheduleDetail`
  - 각 페이지당 0.3-0.5일
  - **소계: 2.5-4일**

- **Form 페이지 (8개)**: 폼 필드, 유효성 검사
  - `ApplicationForm`, `ProgramForm`, `InstructorForm`, `SchoolForm`, `SponsorForm`, `MatchingForm`, `ScheduleForm`, `SettlementSubmissionForm`
  - 각 페이지당 0.5-1일 (react-hook-form과의 통합)
  - **소계: 4-8일**

- **기타 페이지 (1개)**
  - `Dashboard`
  - **소계: 0.5일**

**소계: 5-7일** (병렬 작업 시 단축 가능)

### 4. 스타일링 및 CSS 정리 (2-3일)
- M3 CSS 변수 제거
- Ant Design 테마 토큰 적용
- 커스텀 CSS 수정 (50개 파일)
- 반응형 디자인 재확인
- **소계: 2-3일**

### 5. 테이블 컴포넌트 마이그레이션 (1-2일)
- `@tanstack/react-table` → Ant Design `Table`
- 컬럼 정의 재작성
- 정렬, 필터링 로직 재구현
- **소계: 1-2일**

### 6. 테스트 및 버그 수정 (2-3일)
- 각 페이지 기능 테스트
- UI/UX 일관성 확인
- 반응형 테스트
- 브라우저 호환성 테스트
- 버그 수정
- **소계: 2-3일**

### 7. 문서 업데이트 (0.5일)
- 컴포넌트 사용 가이드 업데이트
- 디자인 가이드라인 수정
- **소계: 0.5일**

## 📅 총 작업량 추정

### 최소 시나리오 (최적화된 경우)
- **총 작업일**: 14-15일 (약 3주)
- **인력**: 1-2명
- **병렬 작업 가능**: 페이지별 작업은 병렬 가능

### 일반 시나리오 (현실적인 경우)
- **총 작업일**: 18-20일 (약 4주)
- **인력**: 1-2명
- **버퍼 포함**: 예상치 못한 이슈 대비

### 최대 시나리오 (보수적인 경우)
- **총 작업일**: 25-30일 (약 5-6주)
- **인력**: 1-2명
- **포함 사항**: 
  - 복잡한 커스텀 컴포넌트 재구현
  - 디자인 시스템 완전 재정립
  - 광범위한 테스트

## ⚠️ 주요 리스크 및 고려사항

### 기술적 리스크
1. **API 차이**
   - M3와 Ant Design의 API가 다름
   - 특히 `Select`, `Form` 컴포넌트 차이가 큼
   - react-hook-form 통합 방식 변경 필요

2. **스타일링 차이**
   - M3는 CSS 변수 기반, Ant Design은 Less/SCSS 기반
   - 테마 커스터마이징 방식 완전히 다름
   - 반응형 브레이크포인트 차이

3. **번들 크기**
   - Ant Design은 Tree-shaking 지원하지만 여전히 큰 편
   - 현재 `@material/web` 대비 번들 크기 증가 가능

4. **타입 정의**
   - Ant Design은 TypeScript 지원 우수
   - 하지만 기존 타입 정의와 충돌 가능

### 비즈니스 리스크
1. **개발 중단**
   - 마이그레이션 기간 동안 신규 기능 개발 지연
   - 버그 수정 우선순위 조정 필요

2. **QA 리소스**
   - 모든 페이지 재테스트 필요
   - 사용자 테스트 권장

3. **학습 곡선**
   - Ant Design API 학습 필요
   - 팀원 교육 시간 포함

## 💡 마이그레이션 전략 제안

### 단계적 마이그레이션 (권장)
1. **Phase 1**: 공통 컴포넌트 래퍼 생성 (1주)
2. **Phase 2**: List 페이지부터 시작 (1주)
3. **Phase 3**: Detail 페이지 (0.5주)
4. **Phase 4**: Form 페이지 (1주)
5. **Phase 5**: 테스트 및 정리 (0.5주)

### 병렬 작업 전략
- 컴포넌트 래퍼 작업과 페이지 작업 병렬 가능
- 페이지별로 독립적으로 작업 가능
- 코드 리뷰 및 통합 주기적 진행

## 📈 Ant Design 선택 시 장점

1. **풍부한 컴포넌트**
   - 60개 이상의 컴포넌트 제공
   - Form, Table, DatePicker 등 즉시 사용 가능

2. **성숙한 생태계**
   - 널리 사용되는 라이브러리
   - 풍부한 문서와 예제
   - 커뮤니티 지원

3. **TypeScript 지원**
   - 완전한 타입 정의 제공
   - 타입 안정성 향상

4. **테마 커스터마이징**
   - Less 변수 기반 테마 시스템
   - 런타임 테마 변경 가능

5. **국제화(i18n)**
   - 다국어 지원 내장
   - 한국어 로케일 제공

## 📉 Ant Design 선택 시 단점

1. **번들 크기**
   - 전체 import 시 큰 번들 크기
   - Tree-shaking 필수

2. **디자인 제약**
   - Ant Design 고유의 디자인 언어
   - 완전한 커스터마이징 어려움

3. **의존성**
   - moment.js (날짜 처리) - 무거움
   - rc-components 의존성

4. **학습 곡선**
   - 새로운 API 학습 필요
   - 기존 M3 지식 활용 불가

## 🎯 결론

**예상 작업 기간**: **3-6주** (인력 1-2명 기준)

**권장 접근법**:
- 단계적 마이그레이션
- 병렬 작업 활용
- 충분한 테스트 시간 확보

**대안 고려사항**:
- 현재 M3 시스템이 잘 작동 중이라면 마이그레이션 필요성 재검토
- 부분적 도입 고려 (특정 컴포넌트만 Ant Design 사용)
- 하이브리드 접근 (M3 + Ant Design 혼용)





