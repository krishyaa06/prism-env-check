<!-- ═════════════ HEADER ═════════════ -->
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:07060f,50:3DDC97,100:00D2FF&height=200&section=header&text=Prism%20Env%20Check&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Validate%20.env%20vs%20.env.example&descAlignY=58&descSize=16" width="100%" alt="Prism Env Check" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=19&duration=2600&pause=800&color=3DDC97&center=true&vCenter=true&width=680&lines=envcheck;%E2%9C%96+DATABASE_URL+missing;envcheck+--gen;%23+%40type%3Durl+%40optional" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://github.com/krishyaa06/prism-env-check/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/krishyaa06/prism-env-check/ci.yml?branch=main&style=for-the-badge&label=CI&logo=githubactions&logoColor=white" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Node.js-%E2%89%A518.17-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/dependencies-0-3DDC97?style=for-the-badge" alt="Zero dependencies" />
  <a href="LICENSE"><img src="https://img.shields.io/github/license/krishyaa06/prism-env-check?style=for-the-badge&color=00D2FF" alt="License" /></a>
</p>

<p align="center">
  <img src="assets/screenshots/demo.png" width="90%" alt="Prism Env Check screenshot" />
</p>

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/aqua.png" width="100%" alt="" />

## ⚡ Overview

**Prism Env Check** (`envcheck`) compares your `.env` with `.env.example` and tells you exactly what's wrong before your app crashes at runtime: missing keys, empty values, `changeme` placeholders, duplicates and undocumented extras. Add tiny comment annotations to `.env.example` (`# @type=url`, `# @enum=dev|prod`, `# @pattern=^sk-`) and it becomes a typed schema — no extra config file, no dependencies.

## ✨ Features

- Finds **missing, empty, duplicate and placeholder** values (`changeme`, `your-key-here`, `<token>`)
- **Schema in comments**: `@type=url|port|email|int|number|boolean|json`, `@enum=a|b`, `@pattern`, `@min` / `@max`, `@optional`
- `--gen` creates `.env.example` from `.env` with **secrets blanked** and types inferred
- `--show` prints your env with secrets masked (`sk-••••••90`) — safe for screenshots
- `--process` validates the real `process.env` in CI / Docker; `--strict` flags undocumented keys
- Full dotenv parsing: `export`, quotes, inline comments, multi-line values. Exit 1 on errors

## 🚀 Quick Start

```bash
# run without installing
npx github:krishyaa06/prism-env-check 

# or install globally
npm install -g github:krishyaa06/prism-env-check
envcheck --gen
```

Requires Node.js 18.17+. No dependencies.

## 🛠️ Usage

```text
envcheck                         check .env against .env.example
envcheck -e .env.local -x .env.example
envcheck --gen                   create .env.example from .env (secrets blanked)
envcheck --show                  print .env with secrets masked

  -e, --env <file>       env file          (default: .env)
  -x, --example <file>   example / schema  (default: .env.example)
      --process          check process.env instead of a file
      --strict           undocumented keys are errors
      --json             machine-readable output
```

### Schema annotations

```bash
# .env.example
PORT=3000              # @type=port
NODE_ENV=development   # @enum=development|production|test
DATABASE_URL=          # @type=url
JWT_SECRET=            # @min=32 @secret
OPENAI_API_KEY=        # @pattern=^sk-
DEBUG=false            # @type=boolean @optional
```

Every key is **required** unless marked `@optional`. Annotations can be inline or on the comment line above.

### Run before dev

```json
"scripts": { "predev": "envcheck" }
```

## 📁 Project Structure

```text
prism-env-check/
├── assets/
│   ├── logo.png
│   └── logo.svg
├── bin/
│   └── envcheck.js   # CLI entry
├── examples/
│   ├── .env.example   # annotated schema example
│   └── broken.env   # demo env with mistakes
├── src/
│   ├── index.js   # parser, schema, checker, generator
│   └── ui.js   # colours, tables
├── test/
│   └── envcheck.test.js
├── .gitignore
├── LICENSE
├── README.md
└── package.json
```

## 🧪 Tests

```bash
npm test
```

Tests use the built-in `node:test` runner, so there is nothing to install. CI runs them on Node 20 and 22.

## 🤝 Contributing

1. Fork the repo and create a branch: `git checkout -b feature/my-idea`
2. Make your change and add a test in `test/`
3. Run `npm test` and open a Pull Request

## 🔷 Part of Prism Protocol

Prism Env Check is one of the open-source tools built by [Prism Protocol](https://dc.gg/prismprotocol), a tech community where young builders learn, ship and compete together.

## 👤 Author

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/krishyaa06"><img src="https://github.com/krishyaa06.png" width="90" style="border-radius:50%" alt="Soumya Bhandare" /><br><b>Soumya Bhandare</b></a><br>
      <sub>Founder @ Prism Protocol</sub>
    </td>
    <td>
      <a href="https://dc.gg/prismprotocol"><img src="https://img.shields.io/badge/Discord-Prism%20Protocol-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a><br>
      <a href="https://instagram.com/prism_protocol_"><img src="https://img.shields.io/badge/Instagram-@prism__protocol__-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram" /></a><br>
      <a href="https://x.com/krishyaa06"><img src="https://img.shields.io/badge/X-@krishyaa06-000000?style=for-the-badge&logo=x&logoColor=white" alt="X" /></a>
    </td>
  </tr>
</table>

## 📄 License

Released under the [MIT License](LICENSE).

<p align="center">
  <b>If you like this project, consider giving it a ⭐</b><br>
  <sub>"Build. Create. Compete." · Made with ⚡ by Prism Protocol</sub>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00D2FF,50:3DDC97,100:07060f&height=110&section=footer" width="100%" alt="" />
