from pathlib import Path
import sys
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parents[2] / '.tmp' / 'web'
out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True, args=['--enable-webgl', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1, reduced_motion='reduce')
    errors = []
    overflows = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for name, query, width, height in [('desktop', '',1440,900), ('front','?camera=front',1440,900), ('side','?camera=side',1440,900), ('desktop-wireframe','?view=wireframe',1440,900), ('mobile-wireframe','?view=wireframe',390,844), ('mobile','',390,844), ('concept-size','',1122,1402), ('small-mobile','',320,740)]:
        page.set_viewport_size({'width':width, 'height':height})
        page.goto((sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5173/') + query,wait_until='networkidle')
        page.locator('.scene.ready').wait_for(timeout=30000)
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(500)
        page.screenshot(path=str(out / (name+'.png')),full_page=True)
        if page.evaluate('document.documentElement.scrollWidth > innerWidth'):
            overflows.append(name)
    print({'errors':errors})
    browser.close()

if errors or overflows:
    raise RuntimeError({'page_errors': errors, 'overflow': overflows})

