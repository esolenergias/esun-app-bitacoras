from playwright.sync_api import sync_playwright
import os
import time

def safe_print(text):
    print(str(text).encode('ascii', 'replace').decode('ascii'))

scratch_dir = os.path.dirname(__file__)
screenshot_path = os.path.join(scratch_dir, 'live_chat_result.png')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    try:
        safe_print("1. Loading website...")
        page.goto('http://127.0.0.1:5173/')
        
        # Inject API key and model into local storage
        safe_print("2. Injecting API Key and model...")
        page.evaluate("localStorage.setItem('cfe_gemini_api_key', 'AIzaSyDLzUs8E7iDF1nkcMR1Z6SQHo6wOezZGQ0')")
        page.evaluate("localStorage.setItem('cfe_gemini_model', 'gemini-2.5-flash')")
        
        # Reload to apply changes
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1000)
        
        # Scroll to contact section
        page.evaluate("document.getElementById('contacto').scrollIntoView()")
        page.wait_for_timeout(1000)
        
        # Helper to send message and wait for response
        def send_message(text):
            safe_print(f"\nUser: {text}")
            input_box = page.locator("input[placeholder='Escribe un mensaje...']")
            input_box.fill(text)
            page.wait_for_timeout(100)
            page.locator("form:has(input[placeholder='Escribe un mensaje...'])").dispatch_event("submit")
            
            # Wait for bot typing indicator to finish
            # The chatbot has a 1-second delay plus API roundtrip
            page.wait_for_timeout(4000)
            
            # Print last bot message
            messages = page.locator("div.bg-dark-2.text-cream p").all_inner_texts()
            if messages:
                safe_print(f"Bot: {messages[-1]}")
            else:
                safe_print("Bot: (No message found)")
 
        # Print initial bot message
        init_messages = page.locator("div.bg-dark-2.text-cream p").all_inner_texts()
        if init_messages:
            safe_print(f"Initial Bot Welcome: {init_messages[0]}")
            
        send_message("Hola, ¿qué tal?")
        send_message("¿Qué paneles solares tienen?")
        send_message("me interesa cotizar 12 paneles JA Solar de 550W")
        
        # Take final screenshot
        page.screenshot(path=screenshot_path)
        safe_print(f"\nSaved final screenshot to: {screenshot_path}")
        
    except Exception as e:
        safe_print(f"ERROR: {e}")
    finally:
        browser.close()
