import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = os.path.abspath("docs/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def capture_details():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 820})
        page = await context.new_page()

        # Step 1: Go to /events?code=DEMO-2026
        print("Navigating to http://localhost:3000/events?code=DEMO-2026 ...", flush=True)
        await page.goto("http://localhost:3000/events?code=DEMO-2026", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)

        # Click "Explore All Event Memories (Preview Mode)"
        explore_btn = await page.query_selector('button:has-text("Explore All Event Memories")')
        if explore_btn:
            print("Clicking Explore All Event Memories...", flush=True)
            await explore_btn.click()
            await page.wait_for_timeout(2500)
            
            # Save Figure 6.5: Instant Personalized Photo Gallery Feed with Confidence Indicators
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_gallery.png"))
            print("Saved fig_demo_gallery.png (Guest Gallery View)", flush=True)

            # Look for "Reel Studio" button to capture Figure 6.7: Memory Reel Studio
            reel_btn = await page.query_selector('button:has-text("Reel Studio")')
            if reel_btn:
                print("Clicking Reel Studio button...", flush=True)
                await reel_btn.click()
                await page.wait_for_timeout(1500)
                await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_studio.png"))
                print("Saved fig_demo_studio.png (Reel Studio / Beat Grid Modal)", flush=True)
                
                # Switch tab inside TemplateEditor if tabs exist (e.g. 'music' or 'effects')
                music_tab = await page.query_selector('button:has-text("Music"), button:has-text("Soundtrack")')
                if music_tab:
                    await music_tab.click()
                    await page.wait_for_timeout(800)
                    await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_synth.png"))
                    print("Saved fig_demo_synth.png (Soundtrack & Synth Engine)", flush=True)

                # Close Reel Studio
                close_btn = await page.query_selector('button:has(svg.lucide-x)')
                if close_btn:
                    await close_btn.click()
                    await page.wait_for_timeout(500)

        # Also capture PhotoEditorModal if fig_demo_synth wasn't captured or if photo editor is preferred
        print("Navigating to gallery page for PhotoEditorModal check...", flush=True)
        await page.goto("http://localhost:3000/dashboard/94c3ce3a96724d38a1160c393b503ae3/gallery", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        
        # Click on first photo card
        photo_cards = await page.query_selector_all('div.group.relative.cursor-pointer, img.object-cover')
        if photo_cards:
            print("Clicking first photo card in gallery...", flush=True)
            await photo_cards[0].click()
            await page.wait_for_timeout(1000)

            # Look for "Open in Studio Editor"
            editor_btn = await page.query_selector('button:has-text("Open in Studio Editor")')
            if editor_btn:
                print("Clicking Open in Studio Editor...", flush=True)
                await editor_btn.click()
                await page.wait_for_timeout(1500)
                await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_synth.png"))
                print("Saved fig_demo_synth.png from PhotoEditorModal", flush=True)

        # Capture Kiosk modal view
        print("Navigating to events page for Kiosk scanner...", flush=True)
        await page.goto("http://localhost:3000/events?code=DEMO-2026", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        scan_btn = await page.query_selector('button:has-text("Scan Face with Device Camera")')
        if scan_btn:
            await scan_btn.click()
            await page.wait_for_timeout(1200)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_kiosk.png"))
            print("Saved fig_demo_kiosk.png", flush=True)

        await browser.close()
    print("Capture complete!", flush=True)

if __name__ == "__main__":
    asyncio.run(capture_details())
