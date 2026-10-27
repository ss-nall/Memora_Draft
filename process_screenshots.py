import os
from PIL import Image, ImageOps, ImageDraw

SCREENSHOT_DIR = os.path.abspath("docs/screenshots")
PROCESSED_DIR = os.path.abspath("docs/screenshots/processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

def add_border(im, border_color="#CBD5E1", border_width=1):
    return ImageOps.expand(im, border=border_width, fill=border_color)

def process_all():
    print("Processing screenshots for ReportLab embedding...")

    # 1. Dashboard (Fig 6.1)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_web.png"))
    # Crop to dashboard header + metrics + cards
    w, h = im.size
    crop_1 = im.crop((0, 160, w, 760)) # focus on metrics and events
    crop_1 = add_border(crop_1)
    crop_1.save(os.path.join(PROCESSED_DIR, "fig_demo_web.png"))
    print("Processed fig_demo_web.png:", crop_1.size)

    # 2. QR Modal (Fig 6.2)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_qr.png"))
    # Find modal bounding box: modal is roughly center 400 to 880, 110 to 710
    w, h = im.size
    crop_2 = im.crop((390, 110, 890, 715))
    crop_2 = add_border(crop_2)
    crop_2.save(os.path.join(PROCESSED_DIR, "fig_demo_qr.png"))
    print("Processed fig_demo_qr.png:", crop_2.size)

    # 3. Biometric Scanner (Fig 6.3)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_scanner.png"))
    w, h = im.size
    crop_3 = im.crop((370, 180, 910, 660))
    crop_3 = add_border(crop_3)
    crop_3.save(os.path.join(PROCESSED_DIR, "fig_demo_scanner.png"))
    print("Processed fig_demo_scanner.png:", crop_3.size)

    # 4. Kiosk Mode (Fig 6.4)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_kiosk.png"))
    w, h = im.size
    crop_4 = im.crop((370, 180, 910, 660))
    crop_4 = add_border(crop_4)
    crop_4.save(os.path.join(PROCESSED_DIR, "fig_demo_kiosk.png"))
    print("Processed fig_demo_kiosk.png:", crop_4.size)

    # 5. Personalized Gallery (Fig 6.5)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_gallery.png"))
    w, h = im.size
    crop_5 = im.crop((80, 100, 1200, 680))
    crop_5 = add_border(crop_5)
    crop_5.save(os.path.join(PROCESSED_DIR, "fig_demo_gallery.png"))
    print("Processed fig_demo_gallery.png:", crop_5.size)

    # 6. Batch Upload / Management Console (Fig 6.6)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_zip.png"))
    w, h = im.size
    crop_6 = im.crop((80, 180, 1200, 680))
    crop_6 = add_border(crop_6)
    crop_6.save(os.path.join(PROCESSED_DIR, "fig_demo_zip.png"))
    print("Processed fig_demo_zip.png:", crop_6.size)

    # 7. Reel Studio (Fig 6.7)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_studio.png"))
    w, h = im.size
    crop_7 = im.crop((400, 50, 880, 760))
    crop_7 = add_border(crop_7)
    crop_7.save(os.path.join(PROCESSED_DIR, "fig_demo_studio.png"))
    print("Processed fig_demo_studio.png:", crop_7.size)

    # 8. Photo Studio / Audio & Filters (Fig 6.8)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_synth.png"))
    w, h = im.size
    crop_8 = im.crop((120, 40, 1160, 760))
    crop_8 = add_border(crop_8)
    crop_8.save(os.path.join(PROCESSED_DIR, "fig_demo_synth.png"))
    print("Processed fig_demo_synth.png:", crop_8.size)

    # 9. Mobile Viewport (Fig 6.9)
    im = Image.open(os.path.join(SCREENSHOT_DIR, "fig_demo_mobile.png"))
    crop_9 = add_border(im)
    crop_9.save(os.path.join(PROCESSED_DIR, "fig_demo_mobile.png"))
    print("Processed fig_demo_mobile.png:", crop_9.size)

if __name__ == "__main__":
    process_all()
