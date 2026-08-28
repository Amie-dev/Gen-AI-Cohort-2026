export type MessageRole = "user" | "assistant" | "developer";

export interface IMessage {
  role: MessageRole;
  content: string;
}

export interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string> | string;
}

export type Interceptor = (message: IMessage) => void;

export type PipelineStep = "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYSE" | "OUTPUT";

export interface LLMStepResponse {
  step: PipelineStep;
  text: string;
  functionName?: string;
  input?: string;
}
