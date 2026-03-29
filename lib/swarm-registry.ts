/**
 * Registry-driven subagent resolution for OMOC Swarm
 * Replaces title-derived routing with durable member registry
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

/**
 * Registry entry schema
 */
export type RegistryEntry = {
  schemaVersion: number;
  memberName: string;
  agentId: string;
  capabilities?: string[];
};

/**
 * Full registry format
 */
export type SwarmRegistry = {
  schemaVersion: number;
  swarmId: string;
  createdAt: number;
  members: Record<string, RegistryEntry>;
};

/**
 * Legacy role aliases (preserved for backward compatibility)
 */
export const LEGACY_ALIASES: Record<string, string> = {
  planner: "plan",
  researcher: "explore",
  coder: "build",
  reviewer: "general",
};

/**
 * Valid canonical agent names
 */
export const CANONICAL_AGENTS = ["plan", "explore", "build", "general"] as const;
export type CanonicalAgent = typeof CANONICAL_AGENTS[number];

/**
 * Resolve agent ID with legacy alias support
 */
export function resolveAgentId(memberName: string, explicitAgent?: string): string {
  if (explicitAgent && explicitAgent.trim()) {
    return explicitAgent.trim();
  }
  
  const normalized = memberName.trim().toLowerCase();
  return LEGACY_ALIASES[normalized] || "general";
}

/**
 * Get diagnostic message for unknown agent
 */
export function getUnknownAgentDiagnostic(
  agentId: string,
  memberName: string,
): string {
  const validAliases = Object.keys(LEGACY_ALIASES).join(", ");
  const canonicalNames = CANONICAL_AGENTS.join(", ");
  
  return [
    `Unknown agent ID '${agentId}' for member '${memberName}'.`,
    "",
    "Valid legacy aliases (auto-resolve):",
    `  ${validAliases}`,
    "",
    "Valid canonical agent names:",
    `  ${canonicalNames}`,
    "",
    "Specify explicit agent in registry or use a legacy alias.",
  ].join("\n");
}

/**
 * Get path to swarm registry file
 */
export function getRegistryPath(directory: string, swarmId: string): string {
  return join(directory, ".omoc-swarm", "registries", `${swarmId}.json`);
}

/**
 * Load swarm registry from disk
 */
export async function loadRegistry(
  directory: string,
  swarmId: string,
): Promise<SwarmRegistry | undefined> {
  const registryPath = getRegistryPath(directory, swarmId);
  try {
    const content = await readFile(registryPath, "utf-8");
    return JSON.parse(content) as SwarmRegistry;
  } catch (error) {
    // File doesn't exist or is invalid - that's OK
    return undefined;
  }
}

/**
 * Save swarm registry to disk
 */
export async function saveRegistry(
  directory: string,
  swarmId: string,
  registry: SwarmRegistry,
): Promise<void> {
  const registryPath = getRegistryPath(directory, swarmId);
  const registryDir = dirname(registryPath);
  await mkdir(registryDir, { recursive: true });
  await writeFile(registryPath, JSON.stringify(registry, null, 2), "utf-8");
}

/**
 * Create a new registry entry
 */
export function createRegistryEntry(
  memberName: string,
  agentId: string,
): RegistryEntry {
  return {
    schemaVersion: 1,
    memberName: memberName.trim().toLowerCase(),
    agentId: agentId.trim(),
    capabilities: [],
  };
}

/**
 * Create a new swarm registry
 */
export function createSwarmRegistry(
  swarmId: string,
  members: Array<{ name: string; agent: string }>,
): SwarmRegistry {
  const membersRecord: Record<string, RegistryEntry> = {};
  
  for (const member of members) {
    const entry = createRegistryEntry(member.name, member.agent);
    membersRecord[entry.memberName] = entry;
  }
  
  return {
    schemaVersion: 1,
    swarmId,
    createdAt: Date.now(),
    members: membersRecord,
  };
}

/**
 * Discover swarm members from registry (primary) or title parsing (fallback)
 */
export async function discoverSwarmMembers(
  directory: string,
  swarmId: string,
  sessionTitles: Array<{ title: string; sessionID: string }>,
): Promise<Record<string, { agent: string; sessionID: string }>> {
  // Try registry first (primary source of truth)
  const registry = await loadRegistry(directory, swarmId);
  if (registry) {
    const members: Record<string, { agent: string; sessionID: string }> = {};
    
    // Match registry entries with session titles
    for (const session of sessionTitles) {
      const parsed = parseSwarmTitle(session.title);
      if (parsed.swarmId === swarmId && parsed.memberName) {
        const normalized = parsed.memberName.toLowerCase();
        const registryEntry = registry.members[normalized];
        
        if (registryEntry) {
          // Use agent from registry
          members[normalized] = {
            agent: registryEntry.agentId,
            sessionID: session.sessionID,
          };
        } else {
          // Registry exists but doesn't have this member - use legacy resolution
          members[normalized] = {
            agent: resolveAgentId(parsed.memberName),
            sessionID: session.sessionID,
          };
        }
      }
    }
    
    return members;
  }
  
  // Fallback: legacy title-derived resolution
  const members: Record<string, { agent: string; sessionID: string }> = {};
  for (const session of sessionTitles) {
    const parsed = parseSwarmTitle(session.title);
    if (parsed.swarmId === swarmId && parsed.memberName) {
      const normalized = parsed.memberName.toLowerCase();
      members[normalized] = {
        agent: resolveAgentId(parsed.memberName),
        sessionID: session.sessionID,
      };
    }
  }
  
  return members;
}

/**
 * Parse swarm title format: '<swarmId>:<memberName>'
 */
export function parseSwarmTitle(title: string): {
  swarmId?: string;
  memberName?: string;
} {
  const raw = title.trim();
  const colonIndex = raw.indexOf(":");
  if (colonIndex === -1) return {};
  
  const swarmId = raw.slice(0, colonIndex).trim();
  const memberName = raw.slice(colonIndex + 1).trim();
  
  if (!swarmId || !memberName) return {};
  return { swarmId, memberName };
}

/**
 * Validate agent ID (check if it's a known canonical or explicit agent)
 */
export function isValidAgent(agentId: string): boolean {
  const normalized = agentId.toLowerCase();
  
  // Check canonical agents
  if (CANONICAL_AGENTS.includes(normalized as any)) {
    return true;
  }
  
  // Check legacy aliases
  if (LEGACY_ALIASES[normalized]) {
    return true;
  }
  
  // Allow any explicit agent (user-defined)
  return true;
}
