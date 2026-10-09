import { chromium } from 'playwright';
import {
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';

const root = process.cwd();

const outputDir = path.join(
  root,
  'full-screenshots'
);

const baseUrl =
  process.env.WIDGET_QA_URL ||
  'http://127.0.0.1:5173';

const executablePath =
  process.env.PLAYWRIGHT_CHROME_PATH;

if (!executablePath) {
  throw new Error(
    'PLAYWRIGHT_CHROME_PATH is not set'
  );
}

const themes = [
  'material',
  'flat',
  'minimal',
  'gaming',
  'ios',
  'glass',
  'studio',
];

const categories = [
  'metrics',
  'controls',
  'charts',
  'location',
  'tables',
  'display',
];

const locale =
  process.env.WIDGET_QA_LOCALE === 'fa'
    ? 'fa'
    : 'en';

const selectedTheme =
  process.env.WIDGET_QA_THEME;

const selectedCategory =
  process.env.WIDGET_QA_CATEGORY;

const themesToCapture =
  selectedTheme
    ? themes.filter(x => x === selectedTheme)
    : themes;

const categoriesToCapture =
  selectedCategory
    ? categories.filter(
        x => x === selectedCategory
      )
    : categories;

if (!themesToCapture.length) {
  throw new Error(
    `Unknown theme: ${selectedTheme}`
  );
}

if (!categoriesToCapture.length) {
  throw new Error(
    `Unknown category: ${selectedCategory}`
  );
}

await rm(
  outputDir,
  {
    recursive: true,
    force: true,
  }
);

await mkdir(
  outputDir,
  {
    recursive: true,
  }
);

const browser =
  await chromium.launch({
    headless:
      process.env.WIDGET_QA_HEADFUL !== '1',

    executablePath,

    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

const context =
  await browser.newContext({
    viewport: {
      width: 1920,
      height: 1080,
    },

    deviceScaleFactor: 1,

    reducedMotion: 'reduce',
  });

const page =
  await context.newPage();

page.on(
  'console',
  message => {
    if (
      message.type() === 'error'
    ) {
      console.log(
        '[browser]',
        message.text()
      );
    }
  }
);

page.on(
  'pageerror',
  error => {
    console.log(
      '[page error]',
      error.message
    );
  }
);

for (
  const theme of themesToCapture
) {

  const themeDir =
    path.join(
      outputDir,
      theme
    );

  await mkdir(
    themeDir,
    {
      recursive: true,
    }
  );

  for (
    const category
    of categoriesToCapture
  ) {

    const url =
      `${baseUrl}/` +
      `?qa=1` +
      `&theme=${theme}` +
      `&category=${category}` +
      `&locale=${locale}` +
      `&_=${Date.now()}`;

    console.log(
      `Capturing ${theme} / ${category}`
    );

    try {

      await page.goto(
        url,
        {
          waitUntil:
            'domcontentloaded',

          timeout:
            30000,
        }
      );

      await page.waitForSelector(
        '[data-qa-page="true"]',
        {
          timeout:
            20000,
        }
      );

      await page.evaluate(
        async () => {

          if (
            document.fonts?.ready
          ) {
            await document.fonts.ready;
          }

          window.scrollTo(
            0,
            0
          );

        }
      );

      /*
       * Let animations/layout
       * completely settle.
       */
      await page.waitForTimeout(
        500
      );

      /*
       * Hide scrollbars from
       * screenshots.
       */
      await page.addStyleTag({
        content: `
          html {
            scrollbar-width: none;
          }

          body::-webkit-scrollbar {
            display: none;
          }
        `,
      });

      const screenshotFile =
        path.join(
          themeDir,
          `${category}-FULL.png`
        );

      /*
       * THIS IS THE IMPORTANT PART:
       *
       * fullPage: true
       *
       * Playwright captures the
       * complete page from top
       * to bottom.
       */
      await page.screenshot({
        path:
          screenshotFile,

        fullPage:
          true,

        animations:
          'disabled',

        caret:
          'hide',
      });

      console.log(
        `  ✓ ${screenshotFile}`
      );

    }
    catch (error) {

      console.error(
        `  ✗ Failed:`,
        error.message
      );

      const errorImage =
        path.join(
          themeDir,
          `${category}-ERROR.png`
        );

      await page
        .screenshot({
          path:
            errorImage,

          fullPage:
            true,
        })
        .catch(() => {});

      const html =
        await page
          .content()
          .catch(
            () => ''
          );

      await writeFile(
        path.join(
          themeDir,
          `${category}-ERROR.html`
        ),
        html,
        'utf8'
      );

    }
  }
}

await browser.close();

console.log(
  '\nFinished.'
);

console.log(
  `Screenshots: ${outputDir}`
);
