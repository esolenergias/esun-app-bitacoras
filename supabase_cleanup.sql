-- ====================================================
-- ESOL ENERGÍAS DATABASE CLEANUP & SCRUBBING SCRIPT
-- ====================================================
-- This script cleans up the Supabase database by:
-- 1. Dropping the unused "Pro Agents" tables (pro_agent_tasks, pro_agents)
-- 2. Ensuring the ai_agents table only retains Carlos Delgado (agent-1)
-- 3. Cleaning up any CMS key values associated with Pro Agents.
--
-- Run this in your Supabase SQL Editor to clean up the schema.

-- 1. Drop the unused Pro Agent tables and cascade dependencies
DROP TABLE IF EXISTS public.pro_agent_tasks CASCADE;
DROP TABLE IF EXISTS public.pro_agents CASCADE;

-- 2. Delete the pro_agents key from cms_content key-value store
DELETE FROM public.cms_content WHERE key = 'pro_agents';

-- 3. Unify Chatbot Engines: Delete agent-2 (Helios) and agent-3 (Soporte B2B)
DELETE FROM public.ai_agents WHERE id IN ('agent-2', 'agent-3');

-- 4. Update agent-1 to be officially named Carlos Delgado / Carlos as "Asesor Solar"
UPDATE public.ai_agents
SET 
  name = 'Carlos',
  role = 'Asesor Solar',
  last_active = 'Activo'
WHERE id = 'agent-1';
