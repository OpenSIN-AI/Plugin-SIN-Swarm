import { loadMemoryEntries, rememberSwarmLearning } from "../plugins/state.js";

const [command = "list", swarmId = "", key = "", ...rest] = process.argv.slice(2);
const directory = process.cwd();

switch (command) {
  case "list": {
    const entries = await loadMemoryEntries(directory);
    console.log(JSON.stringify(entries, null, 2));
    break;
  }
  case "remember": {
    if (!swarmId || !key || rest.length === 0) {
      console.error("Usage: swarm-memory remember <swarmId> <key> <value...>");
      process.exit(1);
    }
    const value = rest.join(" ");
    const entry = await rememberSwarmLearning(directory, {
      swarmId,
      key,
      value,
      tags: [key],
    });
    console.log(JSON.stringify(entry, null, 2));
    break;
  }
  case "recall": {
    const entries = await loadMemoryEntries(directory);
    const query = [swarmId, key, ...rest].filter(Boolean).join(" ").toLowerCase();
    const matches = entries.filter((entry: { swarmId: string; key: string; value: string; tags: string[] }) =>
      [entry.swarmId, entry.key, entry.value, ...entry.tags].some((part: string) => part.toLowerCase().includes(query)),
    );
    console.log(JSON.stringify(matches, null, 2));
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
