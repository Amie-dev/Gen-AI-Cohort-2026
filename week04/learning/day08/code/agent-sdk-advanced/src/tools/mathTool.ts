import { ITool } from "../types.js";

export const mathEvaluatorTool: ITool = {
  name: "evaluateMathExpression",
  description: "Evaluates mathematical expressions safely.",
  doc: "evaluateMathExpression(expression: string): MathResult",
  executor(expression: string): string {
    try {
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
      const fn = new Function(`return (${sanitized});`);
      const result = fn();
      return JSON.stringify({ expression, result });
    } catch (err: any) {
      return JSON.stringify({ expression, error: err.message });
    }
  },
};
