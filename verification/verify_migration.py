from playwright.sync_api import sync_playwright, Page, expect
import json

def verify_migration(page: Page):
    page.goto("http://localhost:8000")

    # Inject old save data (no XP)
    old_data = {
        "x": 12,
        "y": 12,
        "team": [
            {
                "name": "OldMon",
                "color": "#ff0000",
                "maxHp": 22,
                "currentHp": 22,
                "attack": 6,
                "level": 1,
                "id": "test1234"
            }
        ],
        "inventory": { "pokeballs": 5, "potions": 2 }
    }

    page.evaluate(f"localStorage.setItem('webmon_save_data_v1', '{json.dumps(old_data)}');")

    # Reload to trigger load
    page.reload()

    # Open Menu -> Team
    page.locator("#menu-btn").click()
    page.locator("#btn-menu-team").click()

    # Check if XP is displayed correctly (not undefined)
    # It should default to 0/50 for level 1
    xp_text = page.locator(".list-item").first.inner_text()
    print(f"Found team text: {xp_text}")

    if "XP: 0/50" in xp_text:
        print("SUCCESS: XP migrated correctly.")
    else:
        print("FAILURE: XP text not found or incorrect.")
        raise Exception("XP migration failed")

    # Take screenshot
    page.screenshot(path="verification/migration_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()
        try:
            verify_migration(page)
        finally:
            browser.close()
