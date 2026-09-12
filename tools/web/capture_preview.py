from pathlib import Path
import sys
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parents[2] / '.tmp' / 'web'
out.mkdir(parents=True, exist_ok=True)
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
url = args[0] if args else 'http://127.0.0.1:5173/'
is_studio = url.split('?', 1)[0].rstrip('/').endswith('studio.html')
captures = [('desktop', '', 1440, 900)] if is_studio else [('desktop', '', 1440, 900), ('mobile', '', 390, 844), ('concept-size', '', 1122, 1402), ('small-mobile', '', 320, 740)]
if only:
    captures = [capture for capture in captures if capture[0] == only]
    if not captures:
        raise ValueError(f'Unknown capture: {only}')
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True, args=['--enable-webgl', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1, reduced_motion='reduce')
    errors = []
    overflows = []
    forbidden_homepage_resources = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    if not is_studio:
        page.on('request', lambda request: forbidden_homepage_resources.append(request.url) if ('three' in request.url.lower() or request.url.lower().endswith('.glb')) else None)
    for name, query, width, height in captures:
        page.set_viewport_size({'width':width, 'height':height})
        page.goto(url + query,wait_until='networkidle')
        if is_studio:
            page.locator('.studio-main.ready').wait_for(timeout=30000)
            page.locator('#studio-canvas').wait_for(timeout=30000)
            page.locator('.lil-gui').wait_for(timeout=30000)
        else:
            page.locator('.hero-image').wait_for(timeout=30000)
            page.wait_for_function("document.querySelector('.hero-image').complete && document.querySelector('.hero-image').naturalWidth > 0")
            if page.locator('canvas, [href*="studio"]').count():
                raise RuntimeError('Homepage still includes a canvas or Studio link')
        page.evaluate('document.fonts.ready')
        page.wait_for_timeout(500)
        page.screenshot(path=str(out / (prefix + name+'.png')),full_page=True)
        if page.evaluate('document.documentElement.scrollWidth > innerWidth'):
            overflows.append(name)
    print({'errors':errors, 'forbidden_homepage_resources': forbidden_homepage_resources})
    browser.close()

if errors or overflows or forbidden_homepage_resources:
    raise RuntimeError({'page_errors': errors, 'overflow': overflows, 'forbidden_homepage_resources': forbidden_homepage_resources})

