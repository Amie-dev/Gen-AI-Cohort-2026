export type MessageRole = "user" | "assistant" | "developer" | "system";

export interface IMessage {
  role: MessageRole;
  content: string;
  name?: string;
  timestamp?: number;
}

export interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string> | string;
}

export type Interceptor = (message: IMessage, agentName?: string) => void;

export type PipelineStep =
  | "INITIAL"
  | "THINK"
  | "TOOL_REQUEST"
  | "ANALYSE"
  | "HANDOFF"
  | "OUTPUT";

export interface LLMStepResponse {
  step: PipelineStep;
  text?: string;
  functionName?: string;
  input?: string;
  targetAgent?: string;
  reason?: string;
}

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  modifiedContent?: string;
}

export interface IInputGuardrail {
  name: string;
  validate: (input: string, agentName: string) => Promise<GuardrailResult> | GuardrailResult;
}

export interface IOutputGuardrail {
  name: string;
  validate: (output: string, agentName: string) => Promise<GuardrailResult> | GuardrailResult;
}

export interface HandoffPayload {
  targetAgent: string;
  reason: string;
  context?: string;
}

export interface AgentStepOutcome {
  type: "OUTPUT" | "HANDOFF";
  output?: string;
  handoffPayload?: HandoffPayload;
  history: IMessage[];
}

export interface SwarmRunResult {
  completedBy: string;
  finalOutput: string;
  messageHistory: IMessage[];
  handoffLogs: Array<{ from: string; to: string; reason: string }>;
}
