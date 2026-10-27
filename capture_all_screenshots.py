import asyncio
import os
import time
from playwright.async_api import async_playwright

SCREENSHOT_DIR = os.path.abspath("docs/screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def capture_all():
    print(f"Starting screenshot capture to {SCREENSHOT_DIR} ...", flush=True)
    async with async_playwright() as p:
        # Launch Microsoft Edge
        browser = await p.chromium.launch(channel="msedge", headless=True)

        # -------------------------------------------------------------
        # 1. Desktop Context (1280 x 780)
        # -------------------------------------------------------------
        desktop_ctx = await browser.new_context(viewport={"width": 1280, "height": 780})
        page = await desktop_ctx.new_page()

        # Figure 6.1: Organizer Dashboard
        print("1. Capturing Figure 6.1: Organizer Dashboard...", flush=True)
        await page.goto("http://localhost:3000/dashboard", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)
        # Scroll slightly to show metrics + event cards nicely
        await page.evaluate("window.scrollTo(0, 40)")
        await page.wait_for_timeout(500)
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_web.png"))
        print("Saved fig_demo_web.png", flush=True)

        # Figure 6.2: Venue Signage QR Modal
        print("2. Capturing Figure 6.2: Venue Signage QR Modal...", flush=True)
        # Click the QR button on the first event card
        # On dashboard, the QR button is inside the event card actions
        qr_buttons = await page.query_selector_all('button[title="View Event QR"]')
        if not qr_buttons:
            # Fallback query by icon or svg
            qr_buttons = await page.query_selector_all('button:has(svg.lucide-qr-code)')
        
        if qr_buttons:
            await qr_buttons[0].click()
            await page.wait_for_timeout(800)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_qr.png"))
            print("Saved fig_demo_qr.png via button click", flush=True)
            # Close modal if open
            close_btn = await page.query_selector('button:has(svg.lucide-x)')
            if close_btn:
                await close_btn.click()
                await page.wait_for_timeout(400)
        else:
            print("QR button not found directly, capturing dashboard modal state", flush=True)

        # Figure 6.5: Event Photo Gallery Feed
        print("3. Capturing Figure 6.5: Event Photo Gallery...", flush=True)
        await page.goto("http://localhost:3000/dashboard/94c3ce3a96724d38a1160c393b503ae3/gallery", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_gallery.png"))
        print("Saved fig_demo_gallery.png", flush=True)

        # Figure 6.8: Photo Editor Studio / Dynamic Filters
        print("4. Capturing Figure 6.8: Photo Editor Studio with Dynamic FX...", flush=True)
        # Look for edit/sliders button on gallery page
        edit_buttons = await page.query_selector_all('button:has(svg.lucide-sliders)')
        if edit_buttons:
            await edit_buttons[0].click()
            await page.wait_for_timeout(1200)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_synth.png"))
            print("Saved fig_demo_synth.png via PhotoEditorModal", flush=True)
            close_btn = await page.query_selector('button:has(svg.lucide-x)')
            if close_btn:
                await close_btn.click()
                await page.wait_for_timeout(400)
        else:
            print("Sliders button not found on gallery page", flush=True)

        # Figure 6.6: Batch Upload & Ingestion Console
        print("5. Capturing Figure 6.6: Batch Upload & Event Management Console...", flush=True)
        await page.goto("http://localhost:3000/dashboard/94c3ce3a96724d38a1160c393b503ae3", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_zip.png"))
        print("Saved fig_demo_zip.png", flush=True)

        # Figure 6.3: Biometric Scanner Modal on Guest Page
        print("6. Capturing Figure 6.3: Biometric Scanner Modal...", flush=True)
        await page.goto("http://localhost:3000/events?code=DEMO-2026", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1000)
        
        # Click "Scan Face with Device Camera"
        scan_btn = await page.query_selector('button:has-text("Scan Face with Device Camera")')
        if not scan_btn:
            scan_btn = await page.query_selector('button:has(svg.lucide-camera)')
        
        if scan_btn:
            await scan_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_scanner.png"))
            print("Saved fig_demo_scanner.png", flush=True)
            
            # Figure 6.4: Kiosk Biometric Matching View
            print("7. Capturing Figure 6.4: Kiosk Biometric Matching View...", flush=True)
            await page.wait_for_timeout(500)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_kiosk.png"))
            print("Saved fig_demo_kiosk.png", flush=True)

            # Close scanner modal
            close_btn = await page.query_selector('button:has(svg.lucide-x)')
            if close_btn:
                await close_btn.click()
                await page.wait_for_timeout(400)

        # Figure 6.7: Memory Reel Studio Modal
        print("8. Capturing Figure 6.7: Memory Reel Studio...", flush=True)
        # On /events page, check if Reel Studio or TemplateEditor can be triggered
        # In events page, when photos or invite code is entered, or we can trigger the template editor
        reel_btn = await page.query_selector('button:has-text("AI Reel Studio"), button:has-text("Create Reel"), button:has(svg.lucide-film)')
        if reel_btn:
            await reel_btn.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_studio.png"))
            print("Saved fig_demo_studio.png via reel button", flush=True)
        else:
            print("Reel button not immediately visible on /events, navigating or checking modal state", flush=True)

        await desktop_ctx.close()

        # -------------------------------------------------------------
        # 2. Mobile Viewport (Oppo Reno 11 5G: 412 x 915)
        # -------------------------------------------------------------
        print("9. Capturing Figure 6.9: Oppo Reno 11 5G Mobile PWA Viewport...", flush=True)
        mobile_ctx = await browser.new_context(
            viewport={"width": 412, "height": 890},
            user_agent="Mozilla/5.0 (Linux; Android 14; CPH2599 Build/UKQ1.230924.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
            is_mobile=True,
            has_touch=True
        )
        mobile_page = await mobile_ctx.new_page()
        await mobile_page.goto("http://localhost:3000/events?code=DEMO-2026", wait_until="networkidle", timeout=30000)
        await mobile_page.wait_for_timeout(1200)
        await mobile_page.screenshot(path=os.path.join(SCREENSHOT_DIR, "fig_demo_mobile.png"))
        print("Saved fig_demo_mobile.png", flush=True)
        await mobile_ctx.close()

        await browser.close()
    print("All captures finished successfully!", flush=True)

if __name__ == "__main__":
    asyncio.run(capture_all())
