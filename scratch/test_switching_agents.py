from playwright.sync_api import sync_playwright
import os
import time

def safe_print(text):
    print(str(text).encode('ascii', 'replace').decode('ascii'))

scratch_dir = os.path.dirname(__file__)
screenshot_path = os.path.join(scratch_dir, 'switching_agents_console_result.png')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Listen to console logs
    page.on("console", lambda msg: safe_print(f"BROWSER CONSOLE: {msg.text}"))
    
    try:
        safe_print("1. Loading website...")
        page.goto('http://127.0.0.1:5173/')
        
        # Clear old storage and set test API Key
        safe_print("2. Injecting API Key...")
        page.evaluate("localStorage.clear()")
        page.evaluate("localStorage.setItem('cfe_gemini_api_key', 'AIzaSyDLzUs8E7iDF1nkcMR1Z6SQHo6wOezZGQ0')")
        page.evaluate("localStorage.setItem('cfe_gemini_model', 'gemini-2.5-flash')")
        
        # Reload to apply changes
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Scroll to contact section
        page.evaluate("document.getElementById('contacto').scrollIntoView()")
        page.wait_for_timeout(1000)
        
        # Helper to get current messages
        def get_last_bot_message():
            messages = page.locator("div.bg-dark-2.text-cream p").all_inner_texts()
            return messages[-1] if messages else "(No message)"

        # 1. Violet greeting
        safe_print("\nChecking initial active agent (Violet)...")
        active_header_name = page.locator("span.font-display.font-bold.text-cream").inner_text()
        safe_print(f"Header Agent Name: {active_header_name}")
        page.wait_for_timeout(12000)  # Wait 12s for API greeting under rate limit
        safe_print(f"Violet Welcome: {get_last_bot_message()}")

        # 2. Switch to Piper
        safe_print("\nClicking on 'Piper' button to switch agent...")
        page.locator("button:has-text('Piper')").click()
        page.wait_for_timeout(12000)  # Wait 12s for clear + API greeting
        
        active_header_name = page.locator("span.font-display.font-bold.text-cream").inner_text()
        safe_print(f"Header Agent Name (Switched): {active_header_name}")
        safe_print(f"Piper Welcome: {get_last_bot_message()}")

        # 3. Switch back to Violet
        safe_print("\nClicking on 'Violet' button to switch back...")
        page.locator("button:has-text('Violet')").click()
        page.wait_for_timeout(12000)
        
        active_header_name = page.locator("span.font-display.font-bold.text-cream").inner_text()
        safe_print(f"Header Agent Name (Back): {active_header_name}")
        safe_print(f"Violet Welcome (Back): {get_last_bot_message()}")

        # Take final screenshot
        page.screenshot(path=screenshot_path)
        safe_print(f"\nSaved screenshot to: {screenshot_path}")
        
    except Exception as e:
        safe_print(f"ERROR: {e}")
    finally:
        browser.close()
