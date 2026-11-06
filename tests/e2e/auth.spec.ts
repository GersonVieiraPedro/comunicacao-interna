import { test, expect } from "@playwright/test";

test("login oferece Microsoft ou bypass local", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();
  const microsoft = page.getByRole("button", { name: /entrar com microsoft/i });
  const local = page.getByRole("button", { name: /colaborador \(local\)/i });
  await expect(microsoft.or(local)).toBeVisible();
});

test("área autenticada redireciona anônimo para login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
});

test("admin anônimo vai para login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/login/);
});

test("health público", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});

test("manifest PWA", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.display).toBe("standalone");
  expect(body.short_name).toBeTruthy();
});

test("service worker servido", async ({ request }) => {
  const response = await request.get("/sw.js");
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text).toContain("push");
});
