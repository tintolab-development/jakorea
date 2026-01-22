# 테스트 계정 정보

> **파일 경로**: `apps/cms/src/data/mock/users.ts`

---

## 📋 계정별 로그인 정보

### 🔐 관리자 (ADMIN) 계정

| 이메일 | 비밀번호 | 이름 | 권한 레벨 | 프로그램 역할 |
|--------|---------|------|----------|-------------|
| `admin1@jakorea.org` | `admin123!` | 김관리 | MASTER | OWNER |
| `admin2@jakorea.org` | `admin123!` | 이운영 | ADMIN | PARTNER |
| `admin3@jakorea.org` | `admin123!` | 박시스템 | GENERAL | ASSISTANT |
| `admin.inactive@jakorea.org` | `admin123!` | 비활성관리자 | GENERAL | ASSISTANT (비활성) |

### 👨‍🏫 강사 (INSTRUCTOR) 계정

| 이메일 | 비밀번호 | 이름 | 면접 상태 | 참여이력 |
|--------|---------|------|----------|---------|
| `instructor1@example.com` | `instructor123!` | 최강사 | APPROVED | 5건 |
| `instructor2@example.com` | `instructor123!` | 정멘토 | APPROVED | 3건 |
| `instructor3@example.com` | `instructor123!` | 강선생 | PENDING | 0건 |
| `instructor.new@jakorea.org` | `instructor123!` | 신규강사 | SCHEDULED | 0건 |
| `instructor.senior@jakorea.org` | `instructor123!` | 시니어강사 | NOT_REQUIRED | 25건 |

**특수 계정:**
- `instructor1@example.com`: 고정 `instructorId` (`instructor-1-fixed-id-for-testing`) - 정산 테스트용

### 🏫 학교 (SCHOOL) 계정

| 이메일 | 비밀번호 | 이름 | 학교명 | 직책 |
|--------|---------|------|--------|------|
| `school1@example.com` | `school123!` | 서울초등학교 | 서울초등학교 | 교사 |
| `school2@example.com` | `school123!` | 부산중학교 | 부산중학교 | 담당교사 |
| `school3@example.com` | `school123!` | 대구고등학교 | 대구고등학교 | 교감 |

### 👤 개인(참여자) (INDIVIDUAL) 계정

| 이메일 | 비밀번호 | 이름 | 전화번호 |
|--------|---------|------|---------|
| `individual1@example.com` | `individual123!` | 장학생 | 010-1111-2222 |
| `individual2@example.com` | `individual123!` | 임참여 | 010-2222-3333 |
| `individual3@example.com` | `individual123!` | 한청년 | 010-3333-4444 |
| `individual.active@jakorea.org` | `individual123!` | 활동참여자 | 010-4444-5555 |
| `individual.inactive@jakorea.org` | `individual123!` | 휴면참여자 | 010-5555-6666 (비활성) |

---

## 🔍 계정 정보 확인 방법

### 1. 코드에서 확인
```typescript
// 파일: apps/cms/src/data/mock/users.ts
import { mockUsers, getUserByEmail } from '@/data/mock/users'

// 이메일로 사용자 찾기
const user = getUserByEmail('admin1@jakorea.org')
console.log(user) // { email: 'admin1@jakorea.org', password: 'admin123!', ... }
```

### 2. 브라우저 콘솔에서 확인
```javascript
// 개발 환경에서만 사용 가능
// localStorage에서 현재 로그인한 사용자 확인
const currentUser = JSON.parse(localStorage.getItem('auth_user'))
console.log(currentUser)
```

### 3. 로그인 페이지에서 테스트
- 경로: `/login`
- 이메일과 비밀번호 입력 후 로그인
- 역할은 자동으로 판별됨

---

## 📝 참고사항

1. **모든 비밀번호는 Mock 데이터용**이며, 실제 프로덕션에서는 해시된 값 사용
2. **비활성 계정**은 `isActive: false`로 설정되어 로그인 불가
3. **강사 계정** 중 `instructor1@example.com`은 정산 테스트용 고정 ID 사용
4. **역할별 리다이렉트 경로**:
   - ADMIN → `/admin`
   - INSTRUCTOR → `/instructor`
   - SCHOOL → `/school`
   - INDIVIDUAL → `/my`

---

**마지막 업데이트**: 2025-01-20
