# 수료증 양식 등록 폼 기능 확장 - 구현 완료 요약

**작성일**: 2026-01-28  
**상태**: ✅ 구현 완료

---

## 📋 구현 완료 사항

### 1. 타입 정의 확장 ✅
- `CertificateTextField` 인터페이스 추가
- `FileTemplateContent`에 `backgroundImageUrl`, `textFields` 필드 추가
- 위치: `apps/cms/src/types/template.ts`

### 2. PDF 생성 유틸리티 ✅
- `generateCertificatePdf`: 배경 이미지 + 텍스트 오버레이를 PDF로 변환
- `generatePdfFromElement`: HTML 요소를 PDF로 변환 (대안 방법)
- 위치: `apps/cms/src/shared/utils/certificate-pdf-generator.ts`
- 의존성: `jspdf`, `html2canvas`

### 3. 컴포넌트 구현 ✅

#### 3.1 배경 이미지 업로드 컴포넌트
- 파일: `apps/cms/src/features/certificate-template/ui/certificate-background-upload.tsx`
- 기능:
  - 이미지 파일 업로드 (JPG, PNG, 최대 10MB)
  - 이미지 미리보기
  - 이미지 제거

#### 3.2 텍스트 필드 편집 컴포넌트
- 파일: `apps/cms/src/features/certificate-template/ui/certificate-text-fields-editor.tsx`
- 기능:
  - 텍스트 필드 추가/삭제
  - 위치 설정 (X, Y 좌표)
  - 폰트 크기, 색상, 정렬 설정

#### 3.3 미리보기 컴포넌트
- 파일: `apps/cms/src/features/certificate-template/ui/certificate-preview.tsx`
- 기능:
  - 배경 이미지 + 텍스트 오버레이 실시간 미리보기
  - 테스트 값 입력
  - PDF 다운로드

### 4. 수료증 양식 등록 폼 통합 ✅
- 파일: `apps/cms/src/pages/templates/template-files-page.tsx`
- 변경 사항:
  - 수료증 카테고리 선택 시 전용 섹션 표시
  - 2단 레이아웃 (편집 영역 + 미리보기)
  - 모달 너비 동적 조정 (수료증: 1400px, 일반: 720px)

### 5. 의존성 설치 ✅
- `jspdf`: ^2.5.2
- `html2canvas`: ^1.4.1
- 위치: `apps/cms/package.json`

---

## 🎯 사용 방법

### 수료증 양식 등록

1. **기본 정보 입력**
   - 제목, 설명, 상태, 버전 등 기본 정보 입력
   - 카테고리를 "수료증"으로 선택

2. **배경 이미지 업로드**
   - "배경 이미지 업로드" 버튼 클릭
   - JPG 또는 PNG 파일 선택 (최대 10MB)
   - 이미지 미리보기 확인

3. **텍스트 필드 설정**
   - "텍스트 필드 추가" 버튼으로 필드 추가
   - 각 필드의 위치, 폰트 크기, 색상, 정렬 설정
   - 예시:
     - 수료자 이름: X=100, Y=200, 폰트 크기=24
     - 프로그램명: X=100, Y=250, 폰트 크기=20
     - 발급일: X=100, Y=300, 폰트 크기=16

4. **미리보기 및 테스트**
   - 오른쪽 미리보기 영역에서 실시간 확인
   - 테스트 값 입력하여 최종 확인

5. **PDF 다운로드**
   - "PDF 다운로드" 버튼으로 PDF 생성 및 다운로드
   - A4 크기 (210mm x 297mm), 300 DPI

6. **저장**
   - "등록" 또는 "수정" 버튼으로 저장

---

## 📁 파일 구조

```
apps/cms/src/
├── features/
│   └── certificate-template/
│       └── ui/
│           ├── certificate-background-upload.tsx
│           ├── certificate-text-fields-editor.tsx
│           └── certificate-preview.tsx
├── shared/
│   └── utils/
│       └── certificate-pdf-generator.ts
├── pages/
│   └── templates/
│       └── template-files-page.tsx (수정)
└── types/
    └── template.ts (수정)
```

---

## 🔧 기술 스택

- **PDF 생성**: jsPDF + html2canvas
- **이미지 처리**: HTML5 Canvas API
- **UI 컴포넌트**: Ant Design 5
- **상태 관리**: React Hook Form

---

## ⚠️ 주의사항

### 1. 이미지 업로드
- 현재는 Mock 구현 (로컬 Blob URL 사용)
- 실제 서버 연동 시 `fileUploadService.upload()` 사용 필요
- CORS 이슈: 외부 이미지 URL 사용 시 서버 CORS 설정 필요

### 2. PDF 생성
- 고해상도 PDF 생성 시 메모리 사용량 증가
- 큰 이미지 파일은 압축 또는 리사이즈 고려
- 폰트: 기본 Arial 사용, 커스텀 폰트 사용 시 PDF에 포함 필요

### 3. 텍스트 위치
- 좌표는 픽셀 단위
- 배경 이미지 크기에 따라 조정 필요
- 미리보기에서 실시간 확인 가능

---

## 🚀 향후 개선 사항

1. **드래그 앤 드롭 위치 설정**
   - 텍스트 필드 위치를 마우스로 드래그하여 설정

2. **템플릿 저장/불러오기**
   - 자주 사용하는 템플릿 저장 기능

3. **변수 치환**
   - 실제 수료증 발급 시 동적 값 치환

4. **서버 연동**
   - 이미지 업로드 서버 연동
   - PDF 생성 서버 API 연동

5. **다양한 PDF 크기 지원**
   - A4 외 다른 크기 옵션

---

## ✅ 테스트 체크리스트

- [x] 이미지 업로드 기능
- [x] 이미지 미리보기
- [x] 텍스트 필드 추가/삭제
- [x] 텍스트 위치 및 스타일 설정
- [x] 실시간 미리보기
- [x] PDF 생성 및 다운로드
- [x] 수료증 카테고리 선택 시 전용 UI 표시
- [x] 데이터 저장 및 불러오기

---

**마지막 업데이트**: 2026-01-28
