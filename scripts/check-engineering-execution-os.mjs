import { readFileSync, existsSync } from "node:fs";
const failures = [];
if (!existsSync("ENGINEERING_EXECUTION_OS.md")) failures.push("Missing repository-root ENGINEERING_EXECUTION_OS.md");
else {
 const os = readFileSync("ENGINEERING_EXECUTION_OS.md", "utf8");
 for (const phrase of ["Engineering Execution OS","Verification Ledger","TOOL DECLARATION","COMPLIANCE HEADER","OUTCOME","INSPECT","SPECIFY","EXECUTE","VERIFY","CLOSE","BLOCKED"]) if (!os.includes(phrase)) failures.push(`OS is missing required marker: ${phrase}`);
}
if (!existsSync("AGENTS.md")) failures.push("Missing repository-root AGENTS.md");
else {
 const agents = readFileSync("AGENTS.md", "utf8");
 if (!agents.includes("ENGINEERING_EXECUTION_OS.md")) failures.push("AGENTS.md does not reference the policy");
 if (!agents.includes("BLOCKED")) failures.push("AGENTS.md does not define stop/block behavior");
}
if (failures.length) { console.error("ENGINEERING EXECUTION OS COMPLIANCE: FAIL"); for (const failure of failures) console.error(`- ${failure}`); process.exitCode = 1; }
else { console.log("ENGINEERING EXECUTION OS COMPLIANCE: PASS"); console.log("- Policy markers and agent instructions are present."); }
