import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUTPUT_DIR = "marketing/itchio-screenshots";
const TARGET_URL = process.env.SCREENSHOT_URL ?? "http://127.0.0.1:5173";
const VIEWPORT = { width: 1920, height: 1080 };

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function captureCanvas(page, filename) {
  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 30000 });
  const outPath = path.join(OUTPUT_DIR, filename);
  await canvas.screenshot({ path: outPath });
  return outPath;
}

async function main() {
  await ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await page.goto(TARGET_URL, { waitUntil: "networkidle" });
  await page.waitForLoadState("domcontentloaded");
  await wait(1400);

  const outputs = [];

  outputs.push(await captureCanvas(page, "01-main-menu.png"));

  await page.keyboard.press("h");
  await wait(500);
  outputs.push(await captureCanvas(page, "02-how-to-play.png"));

  await page.keyboard.press("Escape");
  await wait(350);
  await page.keyboard.press("s");
  await wait(500);
  outputs.push(await captureCanvas(page, "03-settings.png"));

  await page.keyboard.press("Escape");
  await wait(350);
  await page.keyboard.press("Enter");
  await wait(2200);
  outputs.push(await captureCanvas(page, "04-gameplay-hud.png"));

  await page.keyboard.press("p");
  await wait(400);
  outputs.push(await captureCanvas(page, "05-pause-menu.png"));

  await page.keyboard.press("p");
  await wait(250);
  await page.keyboard.down("ArrowRight");
  await wait(350);
  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowDown");
  await wait(300);
  await page.keyboard.up("ArrowDown");
  await wait(350);
  outputs.push(await captureCanvas(page, "06-gameplay-action.png"));

  await browser.close();

  for (const file of outputs) {
    console.log(`Created ${file}`);
  }
}

main().catch((error) => {
  console.error("Screenshot capture failed:", error.message);
  process.exitCode = 1;
});
