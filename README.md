# EUD Editor (StarCraft Data Editor)

Electron 기반으로 구축된 고성능 차세대 스타크래프트 에디터 프로젝트입니다. 
빠른 반응성, 우수한 UX 그리고 네이티브급 모션 렌더링을 제공하기 위해 최신 웹 기술과 **Rust WebAssembly(WASM)** 엔진을 결합하여 제작되었습니다.

---

## 🌟 주요 기능 및 구현 아키텍처 (Current Features)

### 1. 전역 Data Priority 파이프라인
* 스타크래프트의 핵심 데이터 파일들(Units.dat, Images.dat 등)을 파싱하여 메모리에 로드합니다.
* 향후 **Project State > Map(CHK) State > Base DAT** 순으로 값의 우선순위를 병합하여, 유저가 수정한 값이 원본 데이터 파일의 훼손 없이 즉각 반영되도록 설계되어 있습니다 (`datStore.js`).

### 2. IScript 기반 애니메이션 렌더링 엔진
* **IScript 바이너리 디코딩:** 스타크래프트의 고유 애니메이션 스크립트(.bin) 포맷을 파싱하여 JSON(`iscript_data.json`) 트리로 변환해 브라우저 런타임에서 직관적으로 다룰 수 있습니다.
* **리얼타임 모션 엔진 (`ImageGraphic.jsx`):** `Init`, `Walking`, `Death` 등 각 IScript 진입점(Entry Point)을 해석하고, `wait`, `goto`, `playfram` 명령 프레임을 실시간으로 연산하여 12~24 FPS로 캔버스에 직접 재생합니다.

### 3. 고성능 듀얼-레이어(Dual-Layer) 그래픽 처리
에디터의 가장 큰 난제인 수천 장의 GRP 프레임 로딩으로 인한 UI 렉 및 메모리 누수를 완전히 해결한 하이브리드 설계입니다.

* **Layer 1: 썸네일 리스트 뷰 (`ImagePreview.jsx`):** 
  에디터 첫 실행(Setup) 단계에서 999개의 모든 GRP 파일의 첫 프레임(0th)을 가벼운 **`WebP` 이미지 포맷으로 일괄 변환 및 디스크 로컬 캐싱**합니다. 사용자가 왼쪽 썸네일 리스트를 아무리 거칠게 스크롤링해도 React가 뻗지 않고 60fps로 매끄럽게 동작합니다. (`React.memo` 및 `useMemo` 적극 활용)
* **Layer 2: 포커스 애니메이션 뷰 (`ImageGraphic.jsx`):** 
  단일 선택된 유닛/이미지 탭의 상태 패널에서는 실제 픽셀값을 파싱하는 **Real-time Canvas Renderer**가 작동합니다. `Shadow` 렌더링 등 스타크래프트 특유의 팔레트 코드를 그대로 유지합니다.

### 4. 🦀 Rust WASM GRP 디코더 🚀
* **핵심 병목 해소:** JS V8 엔진의 2중 for/while 루프를 돌며 RLE 압축 구조를 풀던 과정을, 시스템 레벨과 가장 가까운 언어인 **Rust(WebAssembly)** 모듈(`src-rust/src/lib.rs`)로 이식했습니다.
* **즉각적 디코딩:** 프레임이 굉장히 많은 애니메이션 루프에서도 끊김 현상 없이 네이티브 C++ 속도로 바이트 버퍼 오프셋 연산을 수행하여 React UI의 완전한 반응성을 책임집니다.
* **안전한 우회 설계(Fallback):** 초기화 오류나 파일 구조 손상 시 즉시 기존 자바스크립트 엔진으로 우회하도록 설계되어 있습니다. (`grpDecoder.js`)

---

## 🛠 Project Setup

### 필수 요구사항 (Prerequisites)
* Node.js (v18+)
* **Rust Toolchain:** GRP WASM 모듈 빌드를 위해 [rustup](https://rustup.rs/) 및 `wasm-pack` 설치가 필요합니다.
```bash
cargo install wasm-pack
```

### Install & Build WASM

패키지 설치 및 Rust 코어 의존성을 WASM 모듈로 빌드합니다.
```bash
$ npm install
$ npm run build:wasm
```

### Development

개발용 Vite + Electron Hot-Reload 환경 시작
```bash
$ npm run dev
```

### Build App Executable

최종 배포용 윈도우/맥/리눅스 애플리케이션 빌드
```bash
# For Windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
