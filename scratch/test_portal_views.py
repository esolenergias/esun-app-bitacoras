import os
import time
from playwright.sync_api import sync_playwright

def main():
    print("Iniciando Playwright para verificar vistas del Portal...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Large viewport for desktop dashboards
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        url = "http://localhost:5173"
        print(f"Navegando a {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        
        # 1. Open Portal (Login view)
        print("Abriendo el Portal (Login/Register full page)...")
        portal_button = page.locator('button:has-text("Portal eSol")').first
        portal_button.click()
        page.wait_for_timeout(1500)
        
        # Capture unauthenticated Login page screenshot
        login_path = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_login_view.png"
        page.screenshot(path=login_path)
        print(f"Captured Login View: {login_path}")
        
        # ==========================================
        # 2. CLIENT DASHBOARD VERIFICATION
        # ==========================================
        print("Iniciando sesión como CLIENTE...")
        page.locator('button:has-text("Cliente")').click()
        page.wait_for_timeout(1500)
        
        # Tab 1: Monitoreo
        client_monitoreo = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_client_monitoreo.png"
        page.screenshot(path=client_monitoreo)
        print(f"Captured Client Monitoreo: {client_monitoreo}")
        
        # Tab 2: Mis Proyectos
        print("Navegando a Mis Proyectos...")
        page.locator('button:has-text("Mis Proyectos 3D")').click()
        page.wait_for_timeout(1000)
        client_projects = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_client_projects.png"
        page.screenshot(path=client_projects)
        
        # Tab 3: CFE
        print("Navegando a Recibos CFE...")
        page.locator('button:has-text("Recibos CFE")').click()
        page.wait_for_timeout(1000)
        client_cfe = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_client_cfe.png"
        page.screenshot(path=client_cfe)
        
        # Tab 4: Chat
        print("Navegando a Asistente IA...")
        page.locator('button:has-text("Asistente IA")').click()
        page.wait_for_timeout(1000)
        
        # Simulate typing a message to Apolo
        chat_input = page.locator('input[placeholder*="Escribe a Apolo"]')
        chat_input.fill("¿Cuánto cuesta instalar paneles LONGi?")
        page.locator('button:has-text("Enviar")').click()
        page.wait_for_timeout(1500) # wait for reply
        
        client_chat = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_client_chat.png"
        page.screenshot(path=client_chat)
        
        # Logout Client
        print("Cerrando sesión de Cliente...")
        page.get_by_role("button", name="Cerrar Sesión").click()
        page.wait_for_timeout(1000)
        
        # ==========================================
        # 3. ADMIN DASHBOARD VERIFICATION
        # ==========================================
        print("Iniciando sesión como ADMIN...")
        page.locator('button:has-text("Admin")').click()
        page.wait_for_timeout(1500)
        
        # Tab 1: Pipeline Leads
        admin_leads = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_admin_leads.png"
        page.screenshot(path=admin_leads)
        print(f"Captured Admin Pipeline: {admin_leads}")
        
        # Click inspect lead to verify modal
        page.locator('button:has-text("Inspect")').first.click()
        page.wait_for_timeout(1000)
        admin_inspect = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_admin_inspect_modal.png"
        page.screenshot(path=admin_inspect)
        
        # Close modal (exact match to avoid Cerrar Sesión conflict!)
        page.get_by_role("button", name="Cerrar", exact=True).click()
        page.wait_for_timeout(500)
        
        # Tab 2: Inventario
        print("Navegando a Inventario B2B...")
        page.locator('button:has-text("Inventario B2B")').click()
        page.wait_for_timeout(1000)
        admin_inventory = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_admin_inventory.png"
        page.screenshot(path=admin_inventory)
        
        # Tab 3: Logística
        print("Navegando a Logística...")
        page.locator('button:has-text("Logística envíos")').click()
        page.wait_for_timeout(1000)
        admin_logistics = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_admin_logistics.png"
        page.screenshot(path=admin_logistics)
        
        # Logout Admin
        print("Cerrando sesión de Admin...")
        page.get_by_role("button", name="Cerrar Sesión").click()
        page.wait_for_timeout(1000)
        
        # ==========================================
        # 4. MASTER DASHBOARD VERIFICATION
        # ==========================================
        print("Iniciando sesión como MASTER...")
        page.locator('button:has-text("Master")').click()
        page.wait_for_timeout(1500)
        
        # Tab 1: Dashboard General
        master_general = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_master_general.png"
        page.screenshot(path=master_general)
        print(f"Captured Master Dashboard: {master_general}")
        
        # Tab 2: Agentes IA Pro
        print("Navegando a Agentes IA Pro...")
        page.locator('button:has-text("Agentes IA Pro")').click()
        page.wait_for_timeout(1000)
        
        # Click quick template task
        page.locator('button:has-text("Simular irradiación en Guadalajara")').click()
        page.wait_for_timeout(500)
        page.locator('button:has-text("Lanzar Agente Autónomo")').click()
        page.wait_for_timeout(3500) # wait for simulation completion
        
        master_pro = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_master_pro_agents.png"
        page.screenshot(path=master_pro)
        
        # Tab 3: CMS Content
        print("Navegando a Contenido CMS...")
        page.locator('button:has-text("Contenido CMS")').click()
        page.wait_for_timeout(1000)
        master_cms = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_master_cms.png"
        page.screenshot(path=master_cms)
        
        # Tab 4: Motores Chat IA
        print("Navegando a Motores Chat IA...")
        page.locator('button:has-text("Motores Chat IA")').click()
        page.wait_for_timeout(1000)
        master_chat_engines = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_master_chat_engines.png"
        page.screenshot(path=master_chat_engines)
        
        # Tab 5: Lighthouse & SEO
        print("Navegando a Lighthouse & SEO...")
        page.locator('button:has-text("Lighthouse & SEO")').click()
        page.wait_for_timeout(1000)
        
        # Run audit
        page.locator('button:has-text("Iniciar Auditoría SEO")').click()
        page.wait_for_timeout(2500) # wait for audit
        
        master_seo = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_master_seo.png"
        page.screenshot(path=master_seo)
        
        # Tab 6: Roles y Permisos
        print("Navegando a Roles y Permisos...")
        page.locator('button:has-text("Roles y Permisos")').click()
        page.wait_for_timeout(1000)
        
        # Toggle user Carlos Delgado's role to Admin (usr-3)
        select = page.locator('select').nth(2) # u-3 Carlos Delgado select
        select.select_option("admin")
        page.wait_for_timeout(1000)
        
        master_roles = r"C:\Users\mafre\.gemini\antigravity-cli\brain\1fbc946d-47a5-4fa1-8b67-677abc6b2c39\portal_master_roles.png"
        page.screenshot(path=master_roles)
        
        # Logout Master
        print("Cerrando sesión de Master...")
        page.get_by_role("button", name="Cerrar Sesión").click()
        page.wait_for_timeout(1000)
        
        browser.close()
        print("Todas las vistas del portal han sido verificadas y capturadas exitosamente.")

if __name__ == "__main__":
    main()
