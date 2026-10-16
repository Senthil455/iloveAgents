// ============================================================
// I LOVE AGENTS — Agent Registry (Lazy-loaded)
// ============================================================
//
// To contribute an agent: create a new file in ./definitions/
// with `export default { ...agentConfig }`, and it will be
// auto-collected here. See CONTRIBUTING.md for full guidelines.
//
// Agent definitions are lazy-loaded via Vite's import.meta.glob
// with `eager: false` to reduce the initial JS bundle size.
// Each definition file becomes a separate chunk loaded on demand.
// ============================================================

const modules = import.meta.glob('./definitions/*.js', { eager: false });

const VALID_PROVIDERS = new Set(['openai', 'anthropic', 'gemini', 'openrouter', 'any']);
const VALID_OUTPUT_TYPES = new Set(['markdown', 'text', 'json']);

const normalizeAgents = (agents) => {
  const seenIds = new Set();
  return agents.filter(Boolean).filter((agent) => {
    if (!agent?.id) {
      console.warn('Skipping agent without an id:', agent);
      return false;
    }
    if (seenIds.has(agent.id)) {
      console.warn(`Skipping duplicate agent id "${agent.id}".`);
      return false;
    }
    if (!agent.name || !agent.description) {
      console.warn(`Skipping agent "${agent.id}" with missing name or description.`);
      return false;
    }
    if (agent.provider && !VALID_PROVIDERS.has(agent.provider)) {
      console.warn(`Skipping agent "${agent.id}" with unsupported provider "${agent.provider}".`);
      return false;
    }
    if (agent.outputType && !VALID_OUTPUT_TYPES.has(agent.outputType)) {
      console.warn(`Skipping agent "${agent.id}" with unsupported outputType "${agent.outputType}".`);
      return false;
    }
    if (!Array.isArray(agent.inputs)) {
      console.warn(`Skipping agent "${agent.id}" without an inputs array.`);
      return false;
    }
    seenIds.add(agent.id);
    return true;
  });
};

let cachedAgentsPromise = null;

export function loadAllAgents() {
  if (cachedAgentsPromise) return cachedAgentsPromise;

  cachedAgentsPromise = Promise.all(
    Object.values(modules).map((loader) => loader())
  ).then((entries) => {
    return normalizeAgents(entries.map((mod) => mod.default));
  })
  .catch((error) => {
    // Allow future calls to retry initialization after a failed load.
    cachedAgentsPromise = null;
    throw error;
  });

  return cachedAgentsPromise;
}
