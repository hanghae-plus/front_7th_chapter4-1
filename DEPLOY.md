# GitHub Pages 배포 가이드

## 📋 배포 개요

이 프로젝트는 **SSG (Static Site Generation)** 방식으로 빌드된 정적 파일을 GitHub Pages에 배포합니다.

- **배포 URL**: https://jumoooo.github.io/front_7th_chapter4-1/
- **배포 방식**: SSG (Static Site Generation)
- **자동 배포**: GitHub Actions를 통한 자동 배포

---

## 🚀 배포 방법

### 방법 1: GitHub Actions 자동 배포 (권장)

1. **GitHub 저장소 설정**
   - 저장소 → Settings → Pages
   - Source: `GitHub Actions` 선택
   - Save

2. **main 브랜치에 푸시**

   ```bash
   git push origin main
   ```

3. **자동 배포 확인**
   - Actions 탭에서 워크플로우 실행 확인
   - 배포 완료 후 약 1-2분 후 접속 가능

### 방법 2: 수동 배포

```bash
# 1. SSG 빌드
pnpm run build:ssg

# 2. 루트 index.html 복사
cp index.html dist/

# 3. GitHub Pages에 배포
pnpm run deploy
```

---

## 📁 배포 디렉토리 구조

```
dist/
├── index.html          # 루트 선택 페이지
├── vanilla/            # Vanilla JavaScript SSG 빌드 결과
│   ├── index.html
│   ├── product/
│   │   └── [상품ID]/
│   │       └── index.html
│   └── assets/
└── react/              # React SSG 빌드 결과
    ├── index.html
    ├── product/
    │   └── [상품ID]/
    │       └── index.html
    └── assets/
```

---

## 🔗 접속 경로

- **루트**: https://jumoooo.github.io/front_7th_chapter4-1/
- **Vanilla**: https://jumoooo.github.io/front_7th_chapter4-1/vanilla/
- **React**: https://jumoooo.github.io/front_7th_chapter4-1/react/

---

## ⚙️ GitHub Actions 워크플로우

`.github/workflows/deploy.yml` 파일이 다음을 수행합니다:

1. **빌드**
   - Vanilla SSG 빌드
   - React SSG 빌드
   - 루트 `index.html` 복사

2. **배포**
   - `dist/` 폴더를 GitHub Pages에 배포

**트리거 조건**:

- `main` 브랜치에 push
- 수동 실행 (workflow_dispatch)

---

## ✅ 배포 확인

배포 후 다음을 확인하세요:

1. **루트 페이지**: https://jumoooo.github.io/front_7th_chapter4-1/
   - Vanilla/React 선택 페이지 표시 확인

2. **Vanilla 데모**: https://jumoooo.github.io/front_7th_chapter4-1/vanilla/
   - 상품 목록 표시 확인
   - 상품 상세 페이지 접근 확인

3. **React 데모**: https://jumoooo.github.io/front_7th_chapter4-1/react/
   - 상품 목록 표시 확인
   - 상품 상세 페이지 접근 확인

---

## 🔧 문제 해결

### 배포가 안 될 때

1. **GitHub Pages 설정 확인**
   - Settings → Pages → Source가 `GitHub Actions`인지 확인

2. **워크플로우 실행 확인**
   - Actions 탭에서 최근 워크플로우 실행 상태 확인

3. **빌드 에러 확인**
   - Actions 탭에서 빌드 로그 확인

### 경로 문제

- base 경로는 `/front_7th_chapter4-1/vanilla/`와 `/front_7th_chapter4-1/react/`로 설정되어 있습니다.
- 변경이 필요하면 `vite.config.js`와 `vite.config.ts`를 수정하세요.

---

## 📝 참고사항

- 모든 페이지는 **SSG 방식**으로 빌드됩니다.
- 빌드된 파일은 `dist/` 폴더에 생성됩니다.
- `.gitignore`에 `dist/`가 포함되어 있어 로컬에는 커밋되지 않습니다.
- GitHub Actions가 빌드 후 자동으로 배포합니다.
