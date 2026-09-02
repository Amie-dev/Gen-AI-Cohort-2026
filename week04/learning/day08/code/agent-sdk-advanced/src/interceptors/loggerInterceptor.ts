import { IMessage, Interceptor } from "../types.js";

export const consoleLoggerInterceptor: Interceptor = (message: IMessage, agentName?: string) => {
  const prefix = agentName ? `[Agent: ${agentName}]` : "[Agent SDK]";
  const time = new Date().toLocaleTimeString();

  switch (message.role) {
    case "user":
      console.log(`\x1b[36m${prefix} [${time}] 👤 USER: ${message.content}\x1b[0m`);
      break;
    case "assistant":
      console.log(`\x1b[32m${prefix} [${time}] 🤖 ASSISTANT: ${message.content}\x1b[0m`);
      break;
    case "developer":
      console.log(`\x1b[33m${prefix} [${time}] ⚙️ TOOL/DEV: ${message.content}\x1b[0m`);
      break;
    case "system":
      console.log(`\x1b[35m${prefix} [${time}] 📋 SYSTEM: ${message.content}\x1b[0m`);
      break;
  }
};
