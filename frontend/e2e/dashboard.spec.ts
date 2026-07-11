import { test, expect } from "@playwright/test";

test.describe("CrowdMind AI E2E Integration Suite", () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the target environment host
    await page.goto("/");
  });

  test("should load the application and show operations dashboard", async ({ page }) => {
    // Check main title
    await expect(page.locator("h1")).toContainText("CROWDMIND AI");
    
    // Check map display
    await expect(page.locator("text=Stadium Digital Twin")).toBeVisible();
    
    // Check ops indicators
    await expect(page.locator("text=Active Attendee Count")).toBeVisible();
  });

  test("should switch roles and load fan routing companion", async ({ page }) => {
    // Switch to Fan Portal
    const fanTab = page.locator("button[aria-label='Switch to Fan Companion Portal']");
    await fanTab.click();

    // Check fan companion title
    await expect(page.locator("text=World Cup 2026 Companion")).toBeVisible();
    
    // Fill in section details
    await page.fill("#fan-section", "120");
    await page.fill("#fan-row", "F");
    await page.fill("#fan-seat", "18");
    
    // Select vendor preference
    await page.selectOption("#fan-pref", "food");

    // Click step-free routing toggle
    await page.check("#fan-accessibility");

    // Click route generation
    const generateBtn = page.locator("button[aria-label='Generate AI Navigation Path']");
    await generateBtn.click();
    
    // Wait for route calculated feedback
    await expect(page.locator("text=Assigned Entrance")).toBeVisible();
  });

  test("should toggle accessibility settings", async ({ page }) => {
    // Modify contrast settings via the Accessibility Settings Panel
    await page.selectOption("#theme-select", "high");
    
    // Verify high-contrast class applies to root body elements
    const bodyClass = await page.evaluate(() => document.body.className);
    expect(bodyClass).toContain("high-contrast");
    
    // Modify text scaling
    await page.selectOption("#font-size-select", "xlarge");
    const updatedClass = await page.evaluate(() => document.body.className);
    expect(updatedClass).toContain("font-xl");
  });

  test("should trigger emergency evacuation scenario", async ({ page }) => {
    // Switch to Security role
    const securityTab = page.locator("button[aria-label='Switch to Security Alarm Control']");
    await securityTab.click();

    // Trigger evac alarm
    const alarmBtn = page.locator("button:has-text('TRIGGER ALARM')");
    await alarmBtn.click();

    // Verify critical alert banner displays flashing text
    await expect(page.locator("role=alert")).toBeVisible();
    await expect(page.locator("text=EMERGENCY EVACUATION ACTIVE")).toBeVisible();
  });
});
