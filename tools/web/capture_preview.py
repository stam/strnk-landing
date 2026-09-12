from pathlib import Path
import sys
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parents[2] / '.tmp' / 'web'
out.mkdir(parents=True, exist_ok=True)
captures = [('desktop', '',1440,900), ('front','?camera=front',1440,900), ('side','?camera=side',1440,900), ('desktop-wireframe','?view=wireframe',1440,900), ('mobile-wireframe','?view=wireframe',390,844), ('mobile','',390,844), ('concept-size','',1122,1402), ('small-mobile','',320,740)]
args = sys.argv[1:]
only = None
prefix = ''
if '--prefix' in args:
    index = args.index('--prefix')
    prefix = args[index + 1]
    del args[index:index + 2]
if '--only' in args:
    index = args.index('--only')
    only = args[index + 1]
    del args[index:index + 2]
    captures = [capture for capture in captures if capture[0] == only]
    if not captures:
        raise ValueError(f'Unknown capture: {only}')
url = args[0] if args else 'http://127.0.0.1:5173/'
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True, args=['--enable-webgl', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1, reduced_motion='reduce')
    errors = []
    overflows = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for name, query, width, height in captures:
        page.set_viewport_size({'width':width, 'height':height})
        page.goto(url + query,wait_until='networkidle')
        page.locator('.scene.ready').wait_for(timeout=30000)
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(500)
        page.screenshot(path=str(out / (prefix + name+'.png')),full_page=True)
        if page.evaluate('document.documentElement.scrollWidth > innerWidth'):
            overflows.append(name)
    print({'errors':errors})
    browser.close()

if errors or overflows:
    raise RuntimeError({'page_errors': errors, 'overflow': overflows})

