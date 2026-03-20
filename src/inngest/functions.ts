import {Sandbox} from "@e2b/code-interpreter"
import { gemini, createAgent } from "@inngest/agent-kit";

import { inngest } from "./client";
import { getSandbox } from "./utils";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {

    const snadboxId = await step.run("get-sandbox-id",async()=>{
      const sandbox = await Sandbox.create("nextjs-test-3")
      return sandbox.sandboxId
    })

    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert summarizer.  You write readable, you summarize in two words",
      model: gemini({ model: "gemini-2.5-flash" }),
    });
    
       const { output } = await codeAgent.run(`summarize the following text:${event.data.value}`);
console.log(output)

const sandboxUrl = await step.run("sandbox-url",async()=>{
  const sandbox =  await getSandbox(snadboxId)
 const host = sandbox.getHost(3000)
  return `https:..${host}`
   
})
    return { output,sandboxUrl };
  },
);