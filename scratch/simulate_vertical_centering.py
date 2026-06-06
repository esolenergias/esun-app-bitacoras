from playwright.sync_api import sync_playwright

def main():
    filepath = r"C:\Users\mafre\Esolenergias\src\components\Hero.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Temporarily apply vertical centering modifications
    # 1. Main container div
    new_content = content.replace(
        'className="relative w-full bg-dark-1 topo-bg pt-[250px]"',
        'className="relative w-full min-h-screen bg-dark-1 topo-bg flex flex-col justify-center pt-24 lg:pt-0"'
    )
    
    # 2. Absolute canvas container (desktop and mobile)
    new_content = new_content.replace(
        'className="absolute top-[250px] lg:top-0 right-0 w-full lg:w-[50vw] h-[calc(100vh-250px)] lg:h-full select-none pointer-events-none z-10 bg-dark-1"',
        'className="absolute top-0 right-0 w-full lg:w-[50vw] h-full select-none pointer-events-none z-10 bg-dark-1"'
    )
    
    # 3. Sticky canvas container (with vertical centering top calc)
    new_content = new_content.replace(
        'className="relative lg:sticky lg:top-24 w-full h-full lg:h-[28.125vw]"',
        'className="relative lg:sticky lg:top-[calc(50vh-14.06vw)] w-full h-full lg:h-[28.125vw]"'
    )
    
    # 4. Hero text block container
    new_content = new_content.replace(
        'className="h-screen lg:h-[28.125vw] min-h-[500px] flex items-center mb-16 lg:mb-0"',
        'className="min-h-[calc(100vh-8rem)] lg:h-[28.125vw] lg:min-h-0 flex items-center mb-16 lg:mb-0"'
    )
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print("Modificado Hero.tsx temporalmente para probar centrado vertical del viewport.")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_viewport_size({"width": 1440, "height": 900})
            
            url = "http://localhost:5173"
            page.goto(url)
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(4000) # wait for autoplay
            
            info = page.evaluate('''() => {
                const textBlock = document.querySelector("#hero .lg\\\\:col-span-6 flex.flex-col > div"); // hero text container
                const canvas = document.querySelector("canvas");
                
                const tRect = textBlock ? textBlock.getBoundingClientRect() : null;
                const cRect = canvas ? canvas.getBoundingClientRect() : null;
                
                return {
                    viewportHeight: window.innerHeight,
                    textTop: tRect ? tRect.top : null,
                    textBottom: tRect ? tRect.bottom : null,
                    canvasTop: cRect ? cRect.top : null,
                    canvasBottom: cRect ? cRect.bottom : null,
                };
            }''')
            
            print("Measurements on Load:")
            print(f"Viewport Height: {info['viewportHeight']}px (Center = {info['viewportHeight']/2}px)")
            
            if info['textTop'] is not None:
                text_center = (info['textTop'] + info['textBottom']) / 2
                print(f"Hero Text: Top = {info['textTop']}px, Bottom = {info['textBottom']}px, Center = {text_center:.1f}px")
            else:
                print("Could not locate Hero Text block.")
                
            if info['canvasTop'] is not None:
                canvas_center = (info['canvasTop'] + info['canvasBottom']) / 2
                print(f"Canvas: Top = {info['canvasTop']}px, Bottom = {info['canvasBottom']}px, Center = {canvas_center:.1f}px")
            else:
                print("Could not locate Canvas element.")
                
            # Take screenshot
            screenshot_path = r"C:\Users\mafre\.gemini\antigravity-cli\brain\d864f29e-0d39-4927-a703-b8498a29e3a2\esol-centered-vertical.png"
            page.screenshot(path=screenshot_path)
            print(f"Captured: {screenshot_path}")
            
            # Restore
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print("Restaurado Hero.tsx a su estado original.")
            
    except Exception as e:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Restaurado Hero.tsx debido a un error.")
        raise e

if __name__ == "__main__":
    main()
