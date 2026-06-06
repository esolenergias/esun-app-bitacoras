# Spec: AI Assistant for SEO & Content (Block 4)

**Status:** Draft  
**Date:** 2026-05-17  
**Goal:** Integrate Gemini AI into the WordPress backend to assist with product SEO optimization and content creation for eSol Energías.

## 1. Product SEO Optimizer (Assistant Mode)
- **Engine:** Gemini 1.5 Flash API.
- **Workflow:**
    1. Hook into `save_post_product`.
    2. Extract Product Name, Description, and Categories.
    3. Send to Gemini with a specialized prompt: *"You are an expert solar energy SEO. Write an optimized title and description in Spanish for a Mexican audience."*
    4. Store JSON response in two custom post meta fields: `_esol_ai_seo_title` and `_esol_ai_seo_desc`.
- **UI:** A custom Meta Box in the product editor showing the "AI Suggestions" with a button to: *"Apply these suggestions to Yoast/RankMath fields."*

## 2. Blog Idea Generator (Dashboard Widget)
- **Functionality:** A new widget on the WP Dashboard.
- **Input:** A simple text field for a "Main Topic" (e.g., "Mantenimiento preventivo").
- **Output:** A list of 5 SEO-optimized headlines and a 3-point content outline for each, generated via Gemini.

## 3. Configuration & Security
- **API Key:** Managed via the WordPress Customizer (**💳 E-Commerce & B2B > 🤖 Configuración IA**).
- **Rate Limiting:** Guard logic to prevent excessive API calls (checks if content has changed significantly before re-generating).
- **Status Logging:** A small log in the meta box showing the last generation date/status.

## 4. Technical Stack
- **PHP:** `wp_remote_post` for API communication, WordPress Hooks.
- **JS:** Simple AJAX/Fetch for the "Apply" button in the admin UI.
- **API:** Google Generative AI (Gemini) REST API.

## 5. Success Criteria
- [ ] Product editor shows relevant SEO suggestions after saving.
- [ ] Suggestions are specific to the solar industry in Mexico.
- [ ] Dashboard widget successfully returns blog outlines.
- [ ] API Key can be easily updated or disabled.
