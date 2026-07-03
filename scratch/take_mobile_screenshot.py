from playwright.sync_api import sync_playwright

def main():
    print("Iniciando Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use iPhone 12/13 mobile device emulation settings
        device = p.devices["iPhone 12"]
        context = browser.new_context(**device)
        page = context.new_page()
        
        url = "http://localhost:5173"
        print(f"Navegando a {url} en versión móvil...")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000) # wait for autoplay/renders
        
        path_above = r"C:\Users\mafre\.gemini\antigravity-cli\brain\d864f29e-0d39-4927-a703-b8498a29e3a2\esol-mobile-above.png"
        page.screenshot(path=path_above, full_page=False)
        print(f"Captured above-the-fold mobile: {path_above}")
        
        # Scroll down a bit and take another screenshot
        page.evaluate("window.scrollTo(0, 300)")
        page.wait_for_timeout(500)
        path_scroll_300 = r"C:\Users\mafre\.gemini\antigravity-cli\brain\d864f29e-0d39-4927-a703-b8498a29e3a2\esol-mobile-scroll300.png"
        page.screenshot(path=path_scroll_300)
        print(f"Captured scrollY = 300 mobile: {path_scroll_300}")
        
        # Scroll down further to the services cards and take another screenshot
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(500)
        path_scroll_600 = r"C:\Users\mafre\.gemini\antigravity-cli\brain\d864f29e-0d39-4927-a703-b8498a29e3a2\esol-mobile-scroll600.png"
        page.screenshot(path=path_scroll_600)
        print(f"Captured scrollY = 600 mobile: {path_scroll_600}")
        
        # Full page mobile screenshot
        path_full = r"C:\Users\mafre\.gemini\antigravity-cli\brain\d864f29e-0d39-4927-a703-b8498a29e3a2\esol-mobile-full.png"
        page.screenshot(path=path_full, full_page=True)
        print(f"Captured full page mobile: {path_full}")
        
        browser.close()

if __name__ == "__main__":
    main()
