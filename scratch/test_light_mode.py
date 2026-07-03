import os
from playwright.sync_api import sync_playwright

def main():
    print("Iniciando Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        url = "http://localhost:5173"
        print(f"Navegando a {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        # Ensure we are in Light Mode first
        classes = page.evaluate("document.documentElement.className")
        print("Initial classes:", classes)
        if "dark-mode" in classes or "light-mode" not in classes:
            # Toggle to light mode
            print("Switching to light mode...")
            page.locator('button[aria-label="Alternar tema"]').first.click()
            page.wait_for_timeout(2000)
        
        print("Capturing Light Mode screenshots...")
        # 1. Hero Light Mode
        page.screenshot(path=r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\esol_light_hero.png")
        
        # 2. Section 2 Light Mode
        page.locator("#anteproyecto").scroll_into_view_if_needed()
        page.wait_for_timeout(2000)
        page.screenshot(path=r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\esol_light_section2.png")
        
        # 3. Footer Light Mode
        page.locator("footer").scroll_into_view_if_needed()
        page.wait_for_timeout(2000)
        page.screenshot(path=r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\esol_light_footer.png")
        
        # Now switch to Dark Mode
        print("Switching to dark mode...")
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(1000)
        page.locator('button[aria-label="Alternar tema"]').first.click()
        page.wait_for_timeout(2000)
        
        print("Capturing Dark Mode screenshots...")
        # 4. Hero Dark Mode
        page.screenshot(path=r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\esol_dark_hero.png")
        
        # 5. Footer Dark Mode
        page.locator("footer").scroll_into_view_if_needed()
        page.wait_for_timeout(2000)
        page.screenshot(path=r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\esol_dark_footer.png")
        
        browser.close()
        print("Verification screenshot capture complete.")

if __name__ == "__main__":
    main()
