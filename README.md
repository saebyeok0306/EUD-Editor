# EUD Editor (StarCraft Data Editor)

Electron 기반으로 구축된 스타크래프트 에디터 프로젝트입니다.  
AI랑 결합한 차세대 EUD 에디터를 목표로 하고 있지만, 취미로 시작한 프로젝트라 언제 중단될지 모릅니다.🔥

![image](/md/image.png)


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
