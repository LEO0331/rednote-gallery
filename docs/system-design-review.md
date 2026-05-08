# RedNote Gallery System Design Review (EN / 繁體中文)

## 1) Executive Summary (English)
This project is a static, client-rendered gallery designed for GitHub Pages deployment.
It intentionally avoids backend infrastructure, databases, upload APIs, and build pipelines.
All records are maintained directly in `app.js`, and all image files are committed in `badges/`.

Core strengths:
- Very low operational complexity and near-zero hosting cost.
- Deterministic deployment and reproducible outputs from Git commits.
- Strong fit for portfolio-style, manually curated content.

Core constraints:
- Manual content updates do not scale well for high update frequency.
- Entire dataset is shipped to browser on each page load.
- No server-side search/indexing, auth, or dynamic image processing.

---

## 2) 系統摘要（繁體中文）
本專案是部署於 GitHub Pages 的「純靜態、前端渲染」圖庫。
設計上刻意不使用後端、資料庫、上傳 API 與建置流程。
所有資料由 `app.js` 內陣列維護，所有圖片直接放在 `badges/` 並跟 Git 一起版本控管。

主要優勢：
- 維運複雜度極低、託管成本幾乎為零。
- 部署結果可重現（以 Git commit 為準）。
- 非常適合作品集型、人工策展型內容。

主要限制：
- 內容更新完全手動，更新頻率高時擴充性有限。
- 每次載入都要把資料一起送到瀏覽器。
- 沒有伺服器端搜尋、權限控管、動態圖片處理能力。

---

## 3) Architecture Overview (English)
### Runtime architecture
- `index.html`: static shell, metadata, semantic sections, modal container.
- `style.css`: responsive layout, theme variables (light/dark), interaction styles.
- `app.js`: single runtime controller for data, localization, filtering, sorting, modal, and persistence.
- `badges/*`: static image assets.

### Delivery architecture
- Host target: GitHub Pages.
- CI gates in GitHub Actions:
- Unit tests + coverage threshold.
- Playwright E2E tests.
- Lighthouse assertions.
- Deploy only after quality gates pass.

### Security model (frontend-only)
- CSP meta policy with `default-src 'self'` and restricted resource types.
- Image path allowlist regex: `^badges/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp|gif)$`.
- Escaping rendered text via `escapeHtml()` before injecting HTML strings.

---

## 4) 架構總覽（繁體中文）
### 執行期架構
- `index.html`：靜態頁面骨架、SEO metadata、主要區塊、modal 容器。
- `style.css`：RWD 版面、明暗主題變數、互動樣式。
- `app.js`：單一前端控制器，處理資料、語系、篩選、排序、燈箱與偏好儲存。
- `badges/*`：靜態圖片資產。

### 交付架構
- 部署目標：GitHub Pages。
- GitHub Actions 品質閘：
- 單元測試與 coverage 門檻。
- Playwright E2E。
- Lighthouse 品質檢查。
- 全部通過後才部署。

### 前端安全模型
- 使用 CSP meta，核心為 `default-src 'self'`。
- 圖片路徑正規表示式白名單驗證。
- 文字在插入 HTML 前先走 `escapeHtml()`。

---

## 5) Key Design Decisions and Tradeoffs (English)
### Decision A: Static site + repo-stored images
Why chosen:
- Aligns with zero-backend requirement.
- Easiest to audit and rollback using Git history.
- Fast publish path for small-to-medium curated sets.

Tradeoffs:
- Pros: simplest ops, strong reproducibility, low attack surface.
- Cons: manual workflow, no runtime uploads, repo size growth over time.

Alternative:
- Object storage + signed upload flow + metadata API.
- Better for high-volume ingestion, but violates current constraints and increases complexity.

### Decision B: In-code data source (`const badges = [...]`)
Why chosen:
- Immediate readability and editability.
- No fetch latency or parsing failure from remote source.
- Works under strict CSP and static hosting constraints.

Tradeoffs:
- Pros: deterministic, simple, no runtime dependency.
- Cons: requires code change per content update, larger JS bundle as data grows.

Alternative:
- `badges.json` fetched at runtime.
- Reduces JS churn and can simplify content editing, but adds async loading states and fetch failure paths.

### Decision C: Client-side rendering with full rerender
Why chosen:
- Small dataset keeps rerender cost low.
- Keeps logic centralized and easy to reason about.

Tradeoffs:
- Pros: low cognitive overhead, easier testing.
- Cons: less efficient at large item counts.

Alternative:
- Incremental DOM patching or virtual list.
- Better for large datasets, but unnecessary complexity for current scope.

### Decision D: LocalStorage for preferences (language/theme/sort)
Why chosen:
- Persistent UX without backend identity/auth.
- Native browser storage, zero dependency.

Tradeoffs:
- Pros: simple persistence model.
- Cons: device-local only, cannot sync across browsers/devices.

Alternative:
- URL query params for shareable state.
- Useful for links and sharing, but state is less private and URLs become noisier.

### Decision E: Localization structure in nested objects
Current pattern:
- `title: { en, zh-TW, zh-CN }`
- `description: { ... }`
- `uiText[lang][key]`

Why chosen:
- Localized data travels with each record.
- No external i18n library needed.

Tradeoffs:
- Pros: explicit and static-analysis friendly.
- Cons: duplication and manual translation consistency checks.

Alternative:
- Key-based i18n dictionaries + translation keys in record data.
- More scalable for larger teams/languages, but extra indirection for a small codebase.

---

## 6) 主要設計決策與取捨（繁體中文）
### 決策 A：純靜態網站 + 圖片存於 repo
選擇原因：
- 完整符合無後端要求。
- Git 歷史可完整稽核與回滾。
- 小到中型人工維護內容，發佈流程最快。

取捨：
- 優點：維運最簡、可重現性高、攻擊面小。
- 缺點：全手動流程、無即時上傳、repo 會逐步膨脹。

替代方案：
- 物件儲存 + 簽名上傳 + metadata API。
- 適合大量上稿，但違反當前限制且複雜度顯著上升。

### 決策 B：資料直接寫在 `app.js` 陣列
選擇原因：
- 可讀性高、修改直接。
- 無遠端抓取延遲與失敗路徑。
- 完全符合靜態託管與 CSP 限制。

取捨：
- 優點：可預測、無執行期相依。
- 缺點：每次加資料都要改程式；資料量大時 JS 變大。

替代方案：
- 改用 `badges.json` 在前端 fetch。
- 可降低 JS churn，但會新增非同步載入與錯誤處理複雜度。

### 決策 C：前端整體重繪（rerender）
選擇原因：
- 現有資料量小，重繪成本可接受。
- 邏輯集中、除錯與測試簡單。

取捨：
- 優點：實作直觀、維護成本低。
- 缺點：資料量很大時效能不如增量更新。

替代方案：
- 增量 DOM patch 或虛擬清單。
- 大資料量更適合，但目前屬過度設計。

### 決策 D：偏好儲存在 LocalStorage
選擇原因：
- 無帳號系統下即可保留語系/主題/排序。
- 零額外依賴。

取捨：
- 優點：簡單可靠。
- 缺點：僅限單裝置/單瀏覽器，無同步。

替代方案：
- 用 URL query 保存狀態。
- 便於分享連結，但 URL 會變長、狀態可見性提高。

### 決策 E：多語資料結構採巢狀物件
目前形式：
- `title: { en, zh-TW, zh-CN }`
- `description: { ... }`
- `uiText[lang][key]`

選擇原因：
- 單筆資料自帶所有語言內容。
- 不需要外部 i18n 套件。

取捨：
- 優點：明確、靜態結構清楚。
- 缺點：文字重複、翻譯一致性需人工控管。

替代方案：
- 改為 key-based i18n 字典。
- 對大型團隊/多語更好，但小專案會增加間接層。

---

## 7) Why These Data Structures (English)
### Structure 1: `badges` as Array of Objects
Chosen because:
- Preserves display order naturally.
- Simple `.map/.filter/.sort` pipeline for rendering.
- Compatible with stable `id` derived from index at render time.

Alternatives and implications:
- `Map<string, Badge>`:
- Better key lookups, weaker natural ordering unless extra index list is added.
- Object dictionary `{[id]: Badge}`:
- Similar lookup benefits, but order handling and transform pipeline become less ergonomic.
- Normalized graph (`entities + ids`):
- Great for large relational models; overkill for flat gallery records.

### Structure 2: `imageDimensions` as Object map
Chosen because:
- O(1) lookup by image path.
- Keeps rendering stable with explicit width/height to reduce layout shifts.

Alternatives:
- Compute dimensions at runtime:
- Adds async image probing and complexity.
- Store dimensions inside each badge item:
- Reduces cross-reference map but duplicates structure and can increase merge conflicts.

### Structure 3: `uiText` as nested locale map
Chosen because:
- Central source for UI strings.
- Fallback behavior is simple (`uiText[currentLanguage] || uiText.en`).

Alternatives:
- Split language files (`en.json`, `zh-TW.json`, `zh-CN.json`):
- Better for content operations, adds loading orchestration and extra files.

### Structure 4: `elements` cache object
Chosen because:
- Caches DOM nodes once, avoids repeated queries.
- Supports explicit required-element validation.

Alternatives:
- Query DOM every render:
- Simpler initially, noisier and less efficient over time.

---

## 8) 為什麼選這些資料結構（繁體中文）
### 結構 1：`badges` 使用「物件陣列」
選擇原因：
- 天然保留展示順序。
- 能直接串接 `.map/.filter/.sort` 管線。
- 以 index 當暫時 `id`，對現況足夠。

替代方案與影響：
- `Map<string, Badge>`：
- 查找快，但排序/展示順序需另存索引。
- 物件字典 `{[id]: Badge}`：
- 查找方便，但順序與轉換流程較不直覺。
- 正規化資料模型（entities + ids）：
- 適合大型關聯資料；對平面圖庫過重。

### 結構 2：`imageDimensions` 使用路徑對應表
選擇原因：
- 以路徑 O(1) 取得尺寸。
- 明確設定 `width/height` 可降低 CLS。

替代方案：
- 執行期動態探測圖片尺寸：
- 需額外非同步流程與錯誤處理。
- 尺寸寫入每筆 badge：
- 可少一張表，但資料重複較高。

### 結構 3：`uiText` 巢狀語系字典
選擇原因：
- UI 文案集中管理。
- fallback 規則簡單可控。

替代方案：
- 分語系檔（`en.json` 等）：
- 對內容團隊友善，但要增加載入與組裝流程。

### 結構 4：`elements` DOM 快取物件
選擇原因：
- 元素查找一次即可重用。
- 可搭配必需節點檢查，初始化更安全。

替代方案：
- 每次渲染重新 query：
- 初期較直觀，但程式噪音與成本較高。

---

## 9) Deep-Dive Question Prep (English)
Q1: Why avoid backend now?
- Requirement-driven: static-only deployment target and low operations burden.
- Risk reduction: no auth, no upload endpoint, no server hardening surface.

Q2: What breaks first at scale?
- Bundle growth from inline data.
- Manual translation + content update workflow overhead.
- Client-side full rerender if records become very large.

Q3: Migration path without rewrite?
- Step 1: move records into `badges.json` and fetch at startup.
- Step 2: split i18n into language files.
- Step 3: introduce build-time validation for schema and image metadata.
- Step 4: optional search index (still static) for faster filtering.

Q4: Why not React/Vue?
- Current logic size is small and stable.
- Vanilla JS minimizes dependencies, tooling, and failure modes.

Q5: How is security handled in static mode?
- CSP constraints.
- Path allowlist validation.
- Escaped dynamic text injection.
- No remote script execution and no data-write endpoints.

Q6: How do we keep Lighthouse stable?
- Width/height dimensions for images.
- Controlled render sequencing to avoid CLS regressions.
- CI assertion gates with repeated runs.

---

## 10) 深入提問準備（繁體中文）
Q1：為何現在不做後端？
- 由需求直接決定：部署目標是純靜態。
- 風險更低：無登入、無上傳端點、無伺服器攻擊面。

Q2：規模變大時先壞在哪？
- 內嵌資料使 JS 體積成長。
- 多語與內容更新的人工作業成本增加。
- 大量資料下，前端全量重繪會先碰到效能瓶頸。

Q3：未來如何演進又不重寫？
- 第一步：資料移到 `badges.json`，前端啟動時讀取。
- 第二步：語系拆分成獨立檔案。
- 第三步：加入 build-time schema 與圖片 metadata 驗證。
- 第四步：需要時加入靜態搜尋索引。

Q4：為何不用 React/Vue？
- 現有邏輯規模小且穩定。
- Vanilla JS 依賴少、工具鏈簡單、失敗面更小。

Q5：靜態網站怎麼做安全？
- CSP 限制資源來源。
- 圖片路徑白名單。
- 動態文字跳脫。
- 無遠端腳本與資料寫入端點。

Q6：如何維持 Lighthouse 穩定？
- 圖片明確給 `width/height`。
- 初始化與渲染順序控管避免 CLS。
- 在 CI 設定多次執行與門檻斷言。

---

## 11) Recommended Next Evolutions (English + 繁中)
- Add JSON schema validation for badge objects in CI.
- 在 CI 新增 badge 資料結構（schema）驗證。
- Add a pre-commit content checklist for translation completeness.
- 增加上稿檢查清單（語系完整度、日期格式、tag 合法性）。
- Generate `imageDimensions` automatically via script to reduce manual drift.
- 用腳本自動產生 `imageDimensions`，降低人工維護誤差。
- Consider static `badges.json` if record count grows significantly.
- 若資料量成長明顯，可改為靜態 `badges.json` 以降低 JS 變更噪音。
