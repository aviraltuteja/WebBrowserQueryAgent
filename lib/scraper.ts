import { chromium } from "playwright";

export async function searchDuckDuckGo(query: string): Promise<string[]> {
  const browser = await chromium.launch({ headless: false });

  try {
    const page = await browser.newPage();
    await page.goto("https://duckduckgo.com/");

    await page.fill('input[name="q"]', query);
    await Promise.all([
      page.keyboard.press("Enter"),
      page.waitForNavigation({ waitUntil: "load" }),
    ]);

    // Better wait strategy for result links to be visible
    await page.waitForSelector('a[data-testid="result-title-a"]', {
      timeout: 10000,
    });

    const links = await page.$$eval(
      'a[data-testid="result-title-a"]',
      (anchors) => anchors.slice(0, 5).map((a) => (a as HTMLAnchorElement).href)
    );

    return links;
  } finally {
    await browser.close();
  }
}
