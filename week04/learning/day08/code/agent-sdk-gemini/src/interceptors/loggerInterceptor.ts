import { IMessage, Interceptor } from "../types.js";

export const consoleLoggerInterceptor: Interceptor = (message: IMessage) => {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
  let badge = "[UNKNOWN]";

  if (message.role === "user") badge = "👤 [USER]";
  if (message.role === "assistant") badge = "✨ [GEMINI AGENT]";
  if (message.role === "developer") badge = "⚙️ [DEVELOPER/TOOL]";

  console.log(`[${timestamp}] ${badge}: ${message.content}`);
};
