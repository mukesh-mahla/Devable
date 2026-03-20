import { gemini, createAgent } from "@inngest/agent-kit";

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {

    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert summarizer.  You write readable, you summarize in two words",
      model: gemini({ model: "gemini-2.5-flash" }),
    });
    
       const { output } = await codeAgent.run(`summarize the following text:${event.data.value}`);
console.log(output)
    return { output };
  },
);