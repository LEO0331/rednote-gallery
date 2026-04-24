import { describe, it, expect, beforeEach, vi } from "vitest";

function buildDom() {
  document.body.innerHTML = `
    <header class="hero">
      <div class="container hero-shell">
        <div>
          <p id="hero-kicker" class="hero-kicker"></p>
          <h1 id="page-title"></h1>
          <p id="page-subtitle"></p>
        </div>
        <div class="controls">
          <div id="language-toggle" class="lang-switch"></div>
          <button id="theme-toggle" class="theme-toggle" type="button"></button>
        </div>
      </div>
    </header>
    <main class="container">
      <section id="filter-controls" class="filters"></section>
      <section id="gallery" class="gallery-grid"></section>
    </main>
    <div id="lightbox" hidden>
      <div class="lightbox-backdrop" data-close="true"></div>
      <article>
        <button id="lightbox-close" type="button">x</button>
        <img id="lightbox-image" src="" alt="" />
        <div>
          <span id="lightbox-tag"></span>
          <h2 id="lightbox-title"></h2>
          <p id="lightbox-date"></p>
          <p id="lightbox-description"></p>
        </div>
      </article>
    </div>
  `;
}

async function loadAppWithLanguage(languages) {
  vi.resetModules();
  localStorage.clear();
  delete window.__rednoteGallery;
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages
  });
  await import('../../app.js');
  return window.__rednoteGallery;
}

async function loadAppWithoutDom(languages) {
  vi.resetModules();
  localStorage.clear();
  delete window.__rednoteGallery;
  document.body.innerHTML = '';
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    value: languages
  });
  await import('../../app.js');
  return window.__rednoteGallery;
}

beforeEach(() => {
  buildDom();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() });
});

describe('app.js unit coverage', () => {
  it('initializes and renders all cards', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    expect(app.initializeApp()).toBe(true);
    expect(document.querySelectorAll('.card').length).toBe(12);
    expect(document.querySelector('#page-title').textContent).toContain('RedNote');
  });

  it('detects browser language fallback variants', async () => {
    const appTw = await loadAppWithLanguage(['zh-Hant-TW']);
    expect(appTw.detectBrowserLanguage()).toBe('zh-TW');

    const appCn = await loadAppWithLanguage(['zh-CN']);
    expect(appCn.detectBrowserLanguage()).toBe('zh-CN');

    const appEn = await loadAppWithLanguage(['en-GB']);
    expect(appEn.detectBrowserLanguage()).toBe('en');

    const appDefault = await loadAppWithLanguage(['fr-FR']);
    expect(appDefault.detectBrowserLanguage()).toBe('en');
  });

  it('switches language and updates UI labels', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.setLanguage('zh-TW');
    expect(document.documentElement.lang).toBe('zh-Hant');
    expect(document.querySelector('#page-title').textContent).toBe('小紅書里程碑作品集');
    expect(document.querySelector('#filter-controls .filter-btn').textContent).toBe('全部');

    app.setLanguage('zh-CN');
    expect(document.documentElement.lang).toBe('zh-Hans');
    expect(document.querySelector('#page-title').textContent).toBe('小红书里程碑作品集');
  });

  it('handles language switch through button click event', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    const zhTwBtn = Array.from(document.querySelectorAll('.lang-btn')).find((el) => el.textContent === '繁中');
    zhTwBtn.click();
    expect(app.getState().currentLanguage).toBe('zh-TW');
    expect(localStorage.getItem('rednote_lang')).toBe('zh-TW');
  });

  it('filters badges and renders empty state when tag has no records', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.setActiveTag('Badge');
    expect(document.querySelectorAll('.card').length).toBe(3);

    app.setActiveTag('NonExistentTag');
    expect(document.querySelectorAll('.card').length).toBe(0);
    expect(document.querySelector('.empty-state').textContent).toContain('No records found');
  });

  it('opens and closes lightbox using direct method', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    const target = app.badges[0];

    app.openLightbox(target);
    expect(document.querySelector('#lightbox').hidden).toBe(false);
    expect(document.querySelector('#lightbox-title').textContent).toContain('Snapshot');

    app.closeLightbox();
    expect(document.querySelector('#lightbox').hidden).toBe(true);
  });

  it('opens lightbox via card image click handler', async () => {
    await loadAppWithLanguage(['en-US']);
    document.querySelector('.card-thumb').click();
    expect(document.querySelector('#lightbox').hidden).toBe(false);
  });

  it('keeps lightbox open when clicking non-backdrop area', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.openLightbox(app.badges[0]);
    document.querySelector('#lightbox article').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('#lightbox').hidden).toBe(false);
  });

  it('closes lightbox on escape key and overlay click', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.openLightbox(app.badges[1]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.querySelector('#lightbox').hidden).toBe(true);

    app.openLightbox(app.badges[2]);
    document.querySelector('.lightbox-backdrop').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('#lightbox').hidden).toBe(true);
  });

  it('toggles theme and persists to localStorage', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    const before = app.getState().activeTheme;
    app.toggleTheme();
    const after = app.getState().activeTheme;

    expect(after).not.toBe(before);
    expect(localStorage.getItem('rednote_theme')).toBe(after);
    expect(document.documentElement.dataset.theme).toBe(after);
  });

  it('handles helper fallbacks', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    expect(app.getTagLabel('Unknown')).toBe('Unknown');
    expect(app.getLocalizedValue({ title: 'Simple' }, 'title')).toBe('Simple');
    expect(app.getLocalizedValue({ title: { en: 'Base' } }, 'title')).toBe('Base');
  });

  it('allows filter click interaction from rendered controls', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    expect(app.getState().activeTag).toBe('All');

    const milestoneBtn = Array.from(document.querySelectorAll('.filter-btn')).find((el) => el.textContent === 'Milestone');
    milestoneBtn.click();

    expect(app.getState().activeTag).toBe('Milestone');
    expect(document.querySelectorAll('.card').length).toBe(3);
  });

  it('ignores unsupported language assignment', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    const before = app.getState().currentLanguage;
    app.setLanguage('de-DE');
    expect(app.getState().currentLanguage).toBe(before);
  });

  it('returns false when required DOM elements are missing', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    document.body.innerHTML = '';
    expect(app.initializeApp()).toBe(false);
  });

  it('supports state setters when app has not initialized', async () => {
    const app = await loadAppWithoutDom(['en-US']);
    app.setLanguage('zh-CN');
    app.setActiveTag('Badge');
    expect(app.getState().currentLanguage).toBe('zh-CN');
    expect(app.getState().activeTag).toBe('Badge');
  });

  it('uses fallback dimensions for unknown image records', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.badges.push({
      image: 'badges/IMG_9999.JPG',
      date: '2026-04-24',
      tag: 'Custom',
      title: { en: 'Custom Record' },
      description: { en: 'Custom description.' }
    });

    app.setActiveTag('Custom');
    const img = document.querySelector('.card-thumb');
    expect(img.getAttribute('width')).toBe('750');
    expect(img.getAttribute('height')).toBe('750');
  });

  it('supports navigator.language fallback path', async () => {
    vi.resetModules();
    localStorage.clear();
    delete window.__rednoteGallery;
    Object.defineProperty(window.navigator, 'languages', {
      configurable: true,
      value: undefined
    });
    Object.defineProperty(window.navigator, 'language', {
      configurable: true,
      value: 'zh-HK'
    });
    await import('../../app.js');
    expect(window.__rednoteGallery.detectBrowserLanguage()).toBe('zh-TW');
  });

  it('escapes html in rendered text fields', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.badges.push({
      image: 'badges/IMG_9364.JPG',
      date: '2026-04-24',
      tag: 'Badge',
      title: { en: '<script>alert(1)</script>' },
      description: { en: '<img src=x onerror=alert(1) />' }
    });

    app.setActiveTag('Badge');
    expect(document.querySelectorAll('#gallery script').length).toBe(0);
    const dangerousCardTitle = Array.from(document.querySelectorAll('#gallery h2'))
      .find((el) => el.textContent.includes('alert(1)'));
    expect(dangerousCardTitle.textContent).toBe('<script>alert(1)</script>');
  });

  it('rejects unsafe image paths in lightbox', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    const beforeHidden = document.querySelector('#lightbox').hidden;
    const beforeSrc = document.querySelector('#lightbox-image').getAttribute('src');
    app.openLightbox({
      image: 'javascript:alert(1)',
      title: { en: 'Unsafe' },
      description: { en: 'Unsafe path test' },
      tag: 'Badge',
      date: '2026-04-24'
    });

    expect(document.querySelector('#lightbox').hidden).toBe(beforeHidden);
    expect(document.querySelector('#lightbox-image').getAttribute('src')).toBe(beforeSrc);
  });

  it('skips records with invalid image path when rendering gallery', async () => {
    const app = await loadAppWithLanguage(['en-US']);
    app.badges.push({
      image: 'javascript:alert(1)',
      date: '2026-04-24',
      tag: 'Badge',
      title: { en: 'Unsafe Badge' },
      description: { en: 'Should not render in gallery.' }
    });

    app.setActiveTag('Badge');
    expect(document.querySelector('#gallery').innerHTML).not.toContain('Unsafe Badge');
  });

  it('ignores card click when dataset id is not a valid integer', async () => {
    await loadAppWithLanguage(['en-US']);
    const card = document.querySelector('.card-thumb');
    card.dataset.id = 'invalid';
    card.click();
    expect(document.querySelector('#lightbox').hidden).toBe(true);
  });

  it('ignores card click when dataset id has no matching badge', async () => {
    await loadAppWithLanguage(['en-US']);
    const card = document.querySelector('.card-thumb');
    card.dataset.id = '99999';
    card.click();
    expect(document.querySelector('#lightbox').hidden).toBe(true);
  });
});
