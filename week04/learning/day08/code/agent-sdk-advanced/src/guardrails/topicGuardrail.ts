import { GuardrailResult, IInputGuardrail } from "../types.js";

export function createTopicGuardrail(
  topicName: string,
  allowedKeywords: string[]
): IInputGuardrail {
  return {
    name: `TopicGuardrail_${topicName}`,
    validate(input: string, agentName: string): GuardrailResult {
      const lowerInput = input.toLowerCase();
      const matches = allowedKeywords.some((kw) => lowerInput.includes(kw.toLowerCase()));

      if (!matches) {
        return {
          passed: false,
          reason: `Topic Guardrail triggered for agent '${agentName}': Input does not align with domain scope '${topicName}'. Allowed topics include: [${allowedKeywords.join(", ")}].`,
        };
      }
      return { passed: true };
    },
  };
}
