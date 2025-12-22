# JAKOREA 로고 이미지 경로 가이드

## 현재 설정된 경로

로고 이미지는 다음 경로에서 참조됩니다:
- **코드 경로**: `/logo/jakorea-logo.png`
- **실제 파일 위치**: `apps/cms/public/logo/jakorea-logo.png`

## Vite Public 폴더 규칙

Vite에서 `public` 폴더의 파일들은 빌드 시 루트(`/`)로 복사됩니다.

- `public/logo/jakorea-logo.png` → `/logo/jakorea-logo.png`로 접근
- `public/vite.svg` → `/vite.svg`로 접근

## 파일 저장 방법

1. JAKOREA 로고 이미지 파일을 준비합니다.
2. 파일명을 `jakorea-logo.png`로 저장합니다.
3. 다음 경로에 저장합니다:
   ```
   apps/cms/public/logo/jakorea-logo.png
   ```

## 대안: Import 방식 사용

만약 public 폴더 경로가 작동하지 않는다면, `src/assets/images` 폴더에 저장하고 import 방식으로 사용할 수 있습니다:

```typescript
import jakoreaLogo from '@/assets/images/jakorea-logo.png'

<img src={jakoreaLogo} alt="JA Korea" />
```

## 파일 형식 권장사항

- **PNG**: 투명 배경이 필요한 경우
- **SVG**: 벡터 이미지, 확대 시 깨지지 않음 (권장)
- **JPG**: 용량이 작지만 투명 배경 불가

## 권장 크기

- 최대 너비: 200px
- 최대 높이: 64px
- 해상도: 2x (Retina 디스플레이 대응)

