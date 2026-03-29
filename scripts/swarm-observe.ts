import { loadSwarmEvents, projectSwarmEventCounts, recentEvents } from "../plugins/state.js";

const [command = "stats", target = "", format = "table"] = process.argv.slice(2);
const directory = process.cwd();
const events = await loadSwarmEvents(directory);
const selected = target ? events.filter((event: { swarmId: string }) => event.swarmId === target) : events;

switch (command) {
  case "export": {
    if (format === "csv") {
      console.log("id,type,swarmId,sessionID,timestamp");
      for (const event of selected) {
        console.log([
          event.id,
          event.type,
          event.swarmId,
          event.sessionID ?? "",
          event.timestamp,
        ].join(","));
      }
    } else {
      console.log(JSON.stringify(selected, null, 2));
    }
    break;
  }
  case "stats": {
    const counts = projectSwarmEventCounts(selected);
    console.log(JSON.stringify({ total: selected.length, counts }, null, 2));
    break;
  }
  case "history": {
    for (const event of recentEvents(selected, 20)) {
      console.log(`${new Date(event.timestamp).toISOString()}\t${event.swarmId}\t${event.type}\t${event.sessionID ?? "-"}`);
    }
    break;
  }
  case "replay": {
    for (const event of selected.sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp)) {
      console.log(JSON.stringify(event));
    }
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
