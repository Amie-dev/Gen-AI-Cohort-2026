import { exec } from "child_process";
import { ITool } from "../types.js";

export const cliAccessTool: ITool = {
  name: "execCli",
  description: "Executes shell commands on local machine and returns output.",
  doc: "execCli(command: string): CLIResponse",
  executor(cmd: string): Promise<string> {
    return new Promise((resolve) => {
      exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) {
          resolve(JSON.stringify({ status: "error", error: err.message, stderr }));
        } else {
          resolve(JSON.stringify({ status: "success", output: stdout.trim() }));
        }
      });
    });
  },
};
