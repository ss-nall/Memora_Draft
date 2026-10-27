import asyncio
from playwright.async_api import async_playwright

async def verify_tab_a9_plus():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)

        # -------------------------------------------------------------
        # 1. Samsung Galaxy Tab A9+ LANDSCAPE (1280 x 800, DPR 1.5)
        # -------------------------------------------------------------
        ctx_land = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=1.5,
            is_mobile=False,
            has_touch=True,
            user_agent="Mozilla/5.0 (Linux; Android 14; SM-X210 Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page_land = await ctx_land.new_page()
        
        # Test 1: Dashboard
        await page_land.goto("http://localhost:3000/dashboard", wait_until="networkidle")
        await page_land.screenshot(path="docs/screenshots/tab_a9_landscape_dashboard.png")
        print("Verified Tab A9+ Landscape Dashboard!")

        # Test 2: Event Gallery & Reel Studio
        await page_land.goto("http://localhost:3000/events?code=DEMO-2026", wait_until="networkidle")
        await page_land.click('button:has-text("Explore All Event Memories")')
        await page_land.wait_for_timeout(2000)
        await page_land.screenshot(path="docs/screenshots/tab_a9_landscape_gallery.png")
        print("Verified Tab A9+ Landscape Gallery!")

        # Test 3: Reel Studio Modal on Tablet
        await page_land.click('button:has-text("Reel Studio")')
        await page_land.wait_for_timeout(1000)
        await page_land.screenshot(path="docs/screenshots/tab_a9_landscape_reel_studio.png")
        print("Verified Tab A9+ Landscape Reel Studio Modal!")

        await ctx_land.close()

        # -------------------------------------------------------------
        # 2. Samsung Galaxy Tab A9+ PORTRAIT (800 x 1280, DPR 1.5)
        # -------------------------------------------------------------
        ctx_port = await browser.new_context(
            viewport={"width": 800, "height": 1280},
            device_scale_factor=1.5,
            is_mobile=False,
            has_touch=True,
            user_agent="Mozilla/5.0 (Linux; Android 14; SM-X210 Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page_port = await ctx_port.new_page()
        
        await page_port.goto("http://localhost:3000/events?code=DEMO-2026", wait_until="networkidle")
        await page_port.screenshot(path="docs/screenshots/tab_a9_portrait_events.png")
        print("Verified Tab A9+ Portrait Events & Scanner Guide!")

        await ctx_port.close()
        await browser.close()
    print("Samsung Galaxy Tab A9+ dimension validation complete!")

if __name__ == "__main__":
    asyncio.run(verify_tab_a9_plus())
