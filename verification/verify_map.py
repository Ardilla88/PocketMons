from playwright.sync_api import sync_playwright, Page, expect

def verify_map(page: Page):
    page.goto("http://localhost:8000")

    # Wait for canvas
    expect(page.locator("#gameCanvas")).to_be_visible()

    # Wait a moment for render
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="verification/map_check.png")
    print("Screenshot taken at verification/map_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        try:
            verify_map(page)
        finally:
            browser.close()
