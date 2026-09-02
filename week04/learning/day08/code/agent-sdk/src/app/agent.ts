import { HARNESS_PROMPT } from "./config.js";
import OpenAI from "openai";
type IMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "developer"; content: string };

export interface ITool {
  name: string;
  description: string;
  doc?: string;
  executor: (input: string) => Promise<string>;
}
export type Interceptor=(message:IMessage)=>void

export class AgentBuilder {
  public instructions: string | undefined;

  public toolList: ITool[];

  constructor() {
    this.toolList = [];
  }

  public setInstructions(instructions: string): this {
    this.instructions = instructions;
    return this;
  }

  public tool(t: ITool) {
    this.toolList.push(t);
    return this;
  }

  public build() {
    return new Agent(this);
  }
}

export class Agent {
  private instructions: string;
  private toolMap: Map<string, ITool>;
  private openai: OpenAI;
  private messageHistory: IMessage[];
  private MAX_LOOP = 30;


  private interceptors:Interceptor[]

  constructor(builder: AgentBuilder) {
    this.toolMap = new Map();

    this.openai = new OpenAI({ apiKey: "" });
    this.interceptors=[]

    for (const t of builder.toolList) {
      this.toolMap.set(t.name, t);
    }

    this.instructions = `
    ${HARNESS_PROMPT}\n\n
    System Prompt:
    ${builder.instructions}

    Available Tools:
    ${builder.toolList.map((t) => JSON.stringify({ functionName: t.name, functionDescriptions: t.description, functionDoc: t.doc })).join("\n")}

    `;
    this.messageHistory = [];
  }


  public attachInterceptor(interceptor:Interceptor){
    this.interceptors.push(interceptor)
  }

  private notifyInterceptors(message:IMessage){
    for(const interceptor of this.interceptors){
      interceptor(message)
    }
  }

  static builder() {
    return new AgentBuilder();
  }

  public printSystemPrompt() {
    console.log(this.instructions);
  }

  public async run(query: string) {
    //append quey in message histroy
    this.messageHistory.push({ role: "user", content: query });
    
    for (let i = 0; i < this.MAX_LOOP; i++) {
      // ... call llm
      const llmResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.instructions },
          ...this.messageHistory,
        ],
      });

      const rawLLMResponse:string=llmResponse.choices[0]?.message.content as string
      this.messageHistory.push({role:'assistant',content:rawLLMResponse})
      this.notifyInterceptors({ role: 'assistant', content: rawLLMResponse })
      //llmresponse=call llm (SYSTEM PROMPT + MESSAGE HISTROY)
      //append LLMResponse to message histroy
      //parse responose
      const parsedReult=JSON.parse(rawLLMResponse)
      //if llm respons.step==="output" brack (stop condition)
      if(parsedReult.step.toLowerCase()==='output')return this.messageHistory
      //if llmResponse.step==="Tool_Request"


            if(parsedReult.step.toLowerCase()==='tool_request'){
              const{functionName,input}=parsedReult

              const tool=this.toolMap.get(functionName)
              if (!tool) {
                this.messageHistory.push({role:'developer',content:`Error: Function with this name ${functionName}does not exist`})
                continue
              }
              const toolResult=await tool.executor(input)
              this.messageHistory.push({role:"developer",content:JSON.stringify({
                functionName,
                input,
                toolResult
              })})
              this.notifyInterceptors({role:"developer",content:JSON.stringify({
                functionName,
                input,
                toolResult
              })})
            }


      /*

tool = toolMap.find(llmResponse.functionName)
tool.executor(LLMResponse.input)
append toolResult to message HIstrory
continue

*/
    }
  }
}
