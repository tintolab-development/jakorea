# Volunteer 브랜치 작업 가이드라인

## 목적

이 브랜치에서는 **봉사자 권한에 대한 화면만 관리**하며, **강사/관리자 화면에 영향을 주지 않도록** 주의해야 합니다.

## 핵심 원칙 ⚠️

**다른 권한(강사/관리자)에 영향이 갈 것 같으면 기존 컴포넌트를 수정하지 말고 새로운 컴포넌트를 만들어서 진행하세요.**

이 원칙을 따르면:

- 강사/관리자 기능에 대한 부작용(side effect)을 완전히 차단할 수 있습니다
- 봉사자 전용 기능을 독립적으로 개발할 수 있습니다
- 코드 리뷰 시 영향 범위를 명확히 파악할 수 있습니다

## 권한 구분

### 1. 메뉴 권한 설정 (`menu-config.tsx`)

#### 봉사자 전용 메뉴

- `allowedRoles: ['VOLUNTEER']` - 봉사자만 접근 가능
- 예시:
  - `/volunteers/my/programs` - 봉사 프로그램 (봉사자용)
  - 봉사 이력 관리

#### 강사 전용 메뉴

- `allowedRoles: ['INSTRUCTOR']` - 강사만 접근 가능
- 예시:
  - `/instructors/*` - 강사 관리 (관리자용)
  - `/programs/my` - 내가 신청한 프로그램
  - `/programs/my/active` - 강의 프로그램
  - `/programs/satisfaction` - 만족도 조사
  - `/settlements/my` - 정산 이력/현황
  - 강사 이력 관리

#### 관리자 전용 메뉴

- `allowedRoles: ['ADMIN']` - 관리자만 접근 가능
- 예시:
  - `/volunteers` - 봉사자 관리 (관리자용)
  - `/volunteers/programs` - 봉사 프로그램 관리 (관리자용)
  - `/instructors` - 강사진 관리
  - `/settlements` - 정산 관리

#### 공유 메뉴

- `allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT']` - 여러 권한 공유
- 예시:
  - `/programs` - 진행 프로그램
  - `/programs/favorites` - 관심 프로그램 관리
  - `/notices` - 공지사항
  - `/posts/faq` - FAQ
  - `/posts/inquiries` - 문의하기

### 2. 경로 구분

#### 봉사자용 경로 (수정 가능)

- `/volunteers/my/*` - 봉사자 본인 화면
  - `/volunteers/my/programs` - 본인 봉사 프로그램 목록

#### 관리자용 봉사자 경로 (수정 금지)

- `/volunteers` - 봉사자 목록 (관리자용)
- `/volunteers/programs` - 봉사 프로그램 관리 (관리자용)
- `/volunteers/:id` - 봉사자 상세 (관리자용)

#### 강사 관련 경로 (수정 금지)

- `/instructors/*` - 강사 관리 관련 모든 경로
- `/programs/my/*` - 강사 본인 프로그램 관련 경로
- `/programs/satisfaction` - 만족도 조사
- `/settlements/my` - 강사 정산
- `/settlements` - 관리자 정산 관리

### 3. 코드 수정 시 주의사항

#### ✅ 수정 가능한 파일/기능

1. **봉사자 전용 페이지**
   - `apps/cms/src/pages/volunteers/my-volunteer-program-list-page.tsx`
   - 봉사자 전용 컴포넌트/피처
   - `apps/cms/src/features/volunteer/*` (봉사자 전용 기능)

2. **공유 컴포넌트 (조건부 수정 가능)**
   - ⚠️ **주의**: 다른 권한에 영향이 갈 것 같으면 **새로운 컴포넌트를 만들어서 진행**
   - 봉사자 권한 체크가 명확히 구분된 경우만 수정
   - 예: `user?.role === 'VOLUNTEER'` 조건이 있는 경우

3. **메뉴 설정**
   - `menu-config.tsx`에서 봉사자 전용 메뉴만 수정
   - `allowedRoles: ['VOLUNTEER']` 항목만 수정

#### 🆕 새로운 컴포넌트 생성 가이드

**다른 권한에 영향이 갈 것 같을 때는 기존 컴포넌트를 수정하지 말고 새로운 컴포넌트를 만드세요.**

##### 예시 시나리오

**시나리오 1: 공유 컴포넌트에 봉사자 전용 기능 추가가 필요한 경우**

```typescript
// ❌ 나쁜 예: 기존 컴포넌트 수정
// features/program/ui/program-list.tsx
export function ProgramList({ ... }) {
  // 기존 강사/관리자 로직
  if (user?.role === 'INSTRUCTOR') {
    // 강사 전용 로직
  }

  // 봉사자 전용 로직 추가 - 위험!
  if (user?.role === 'VOLUNTEER') {
    // 봉사자 전용 로직
  }
}

// ✅ 좋은 예: 새로운 컴포넌트 생성
// features/volunteer/ui/volunteer-program-list.tsx
export function VolunteerProgramList({ ... }) {
  // 봉사자 전용 로직만 포함
  // 강사/관리자 기능과 완전히 분리
}
```

**시나리오 2: 공유 페이지에 봉사자 전용 뷰가 필요한 경우**

```typescript
// ❌ 나쁜 예: 기존 페이지 수정
// pages/programs/program-list-page.tsx
export function ProgramListPage() {
  // 기존 강사/관리자 로직
  if (user?.role === 'INSTRUCTOR') {
    return <InstructorView />
  }

  // 봉사자 뷰 추가 - 위험!
  if (user?.role === 'VOLUNTEER') {
    return <VolunteerView />
  }
}

// ✅ 좋은 예: 새로운 페이지 생성
// pages/volunteers/my-volunteer-program-list-page.tsx
export function MyVolunteerProgramListPage() {
  // 봉사자 전용 페이지
  // 강사/관리자 페이지와 완전히 분리
}
```

**시나리오 3: 공유 훅에 봉사자 전용 로직이 필요한 경우**

```typescript
// ❌ 나쁜 예: 기존 훅 수정
// shared/hooks/use-program-data.ts
export function useProgramData() {
  // 기존 강사/관리자 로직
  if (user?.role === 'INSTRUCTOR') {
    // 강사 전용 로직
  }

  // 봉사자 로직 추가 - 위험!
  if (user?.role === 'VOLUNTEER') {
    // 봉사자 전용 로직
  }
}

// ✅ 좋은 예: 새로운 훅 생성
// features/volunteer/hooks/use-volunteer-program-data.ts
export function useVolunteerProgramData() {
  // 봉사자 전용 훅
  // 강사/관리자 훅과 완전히 분리
}
```

##### 새로운 컴포넌트 생성 체크리스트

새로운 컴포넌트를 만들 때:

- [ ] 컴포넌트 이름에 `volunteer` 또는 `Volunteer` 접두사/접미사 포함
- [ ] `features/volunteer/` 또는 `pages/volunteers/` 디렉토리에 배치
- [ ] 봉사자 권한 체크 (`user?.role === 'VOLUNTEER'`) 포함
- [ ] 강사/관리자 관련 로직이 포함되지 않았는지 확인
- [ ] 기존 컴포넌트와의 의존성 최소화

#### ❌ 수정 금지 파일/기능

1. **강사 전용 페이지/기능**
   - `apps/cms/src/pages/instructors/*`
   - `apps/cms/src/pages/programs/my-program-*.tsx`
   - `apps/cms/src/pages/programs/program-satisfaction-page.tsx`
   - `apps/cms/src/pages/settlements/my-settlement-*.tsx`
   - `apps/cms/src/features/instructor/*`

2. **관리자 전용 페이지**
   - `apps/cms/src/pages/volunteers/volunteer-list-page.tsx` (관리자용)
   - `apps/cms/src/pages/volunteers/volunteer-program-list-page.tsx` (관리자용)
   - `apps/cms/src/pages/settlements/settlement-*.tsx` (관리자용)

3. **공유 컴포넌트 (조건부 수정 금지)**
   - 강사/관리자 권한 체크가 포함된 로직 수정 금지
   - 예: `user?.role === 'INSTRUCTOR'` 또는 `user?.role === 'ADMIN'` 조건이 있는 경우

### 4. 권한 체크 패턴

#### 올바른 권한 체크 예시

```typescript
// ✅ 봉사자 전용 기능
if (user?.role === 'VOLUNTEER') {
  // 봉사자 전용 로직
}

// ✅ 봉사자와 강사 공유 기능
if (user?.role === 'INSTRUCTOR' || user?.role === 'VOLUNTEER') {
  // 공유 로직
}

// ✅ 봉사자만 제외
if (user?.role !== 'VOLUNTEER') {
  // 강사/관리자 로직
}
```

#### 주의해야 할 패턴

```typescript
// ⚠️ 이런 패턴은 강사 기능에도 영향을 줄 수 있음
if (user?.role === 'INSTRUCTOR' || user?.role === 'VOLUNTEER') {
  // 이 로직을 수정할 때는 강사 기능에 영향이 없는지 확인 필요
}

// ❌ 이런 수정은 절대 금지
if (user?.role === 'INSTRUCTOR') {
  // 강사 전용 로직 - 수정 금지
}
```

### 5. 테스트 체크리스트

수정 후 다음을 확인해야 합니다:

- [ ] 봉사자 권한으로 로그인 시 봉사자 화면이 정상 작동하는가?
- [ ] 강사 권한으로 로그인 시 강사 화면이 정상 작동하는가? (영향 없음 확인)
- [ ] 관리자 권한으로 로그인 시 관리자 화면이 정상 작동하는가? (영향 없음 확인)
- [ ] 메뉴에서 봉사자 전용 메뉴만 보이는가?
- [ ] 메뉴에서 강사 전용 메뉴가 정상적으로 보이는가?
- [ ] 공유 메뉴가 모든 권한에서 정상 작동하는가?

### 6. 파일 구조 참고

```
apps/cms/src/
├── pages/
│   ├── volunteers/
│   │   ├── my-volunteer-program-list-page.tsx  ✅ 수정 가능 (봉사자용)
│   │   ├── volunteer-list-page.tsx             ❌ 수정 금지 (관리자용)
│   │   └── volunteer-program-list-page.tsx     ❌ 수정 금지 (관리자용)
│   ├── instructors/                           ❌ 수정 금지 (강사 관리)
│   ├── programs/
│   │   ├── my-program-*.tsx                    ❌ 수정 금지 (강사용)
│   │   └── program-satisfaction-page.tsx       ❌ 수정 금지 (강사용)
│   └── settlements/
│       ├── my-settlement-*.tsx                 ❌ 수정 금지 (강사용)
│       └── settlement-*.tsx                     ❌ 수정 금지 (관리자용)
├── features/
│   ├── volunteer/                              ✅ 수정 가능 (봉사자 전용)
│   └── instructor/                             ❌ 수정 금지 (강사 전용)
└── shared/
    └── config/
        └── menu-config.tsx                     ⚠️ 봉사자 메뉴만 수정
```

## 요약

1. **핵심 원칙**: 다른 권한에 영향이 갈 것 같으면 **새로운 컴포넌트를 만들어서 진행**
2. **봉사자 전용 경로/기능만 수정**: `/volunteers/my/*` 및 봉사자 전용 컴포넌트
3. **강사/관리자 경로는 절대 수정하지 않음**
4. **공유 기능 수정 시**: 새로운 컴포넌트 생성 우선, 수정은 최후의 수단
5. **권한 체크 로직 수정 시 주의 깊게 검토**
6. **수정 후 모든 권한으로 테스트하여 영향도 확인**

## 컴포넌트 생성 vs 수정 결정 트리

```
기존 컴포넌트를 수정해야 하는가?
│
├─ 봉사자 전용 컴포넌트인가?
│  └─ YES → ✅ 수정 가능
│
├─ 강사/관리자 전용 컴포넌트인가?
│  └─ YES → ❌ 수정 금지
│
└─ 공유 컴포넌트인가?
   │
   ├─ 봉사자 전용 기능만 추가하는가?
   │  └─ YES → 🆕 새로운 컴포넌트 생성 권장
   │
   ├─ 강사/관리자 로직에 영향이 없는가?
   │  └─ NO → 🆕 새로운 컴포넌트 생성 필수
   │
   └─ 영향도가 불확실한가?
      └─ YES → 🆕 새로운 컴포넌트 생성 권장
```
