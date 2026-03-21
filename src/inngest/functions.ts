import { Sandbox } from "@e2b/code-interpreter";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork,
} from "@inngest/agent-kit";

import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { PROMPT } from "@/prompts";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    const snadboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("nextjs-test-3");
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
      name: "code-agent",
      description: "an expert coding agent",
      system: PROMPT,
      model: gemini({
        model: "gemini-2.5-flash",
        defaultParameters: {
          generationConfig: {
            temperature: 0.1,
          },
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(snadboxId);

                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });

                return result.stdout;
              } catch (e) {
                console.error(
                  `command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
                );
                return `command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newfiles = await step?.run(
              "createOrUpdatefiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(snadboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (e) {
                  return "Error: " + e;
                }
              },
            );
            if (typeof newfiles === "object") {
              network.state.data.files = newfiles;
            }
            return typeof newfiles === "string"
              ? newfiles
              : `Successfully updated ${files.length} file(s).`;
          },
        }),
        createTool({
          name: "readfiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readfiles", async () => {
              try {
                const sandbox = await getSandbox(snadboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessgeText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessgeText && network) {
            if (lastAssistantMessgeText.includes("<task_summary")) {
              network.state.data.summary = lastAssistantMessgeText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork({
      name: "coding-agent-newtwork",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      },
    });

    const result = await network.run(event.data.value);

    const sandboxUrl = await step.run("sandbox-url", async () => {
      const sandbox = await getSandbox(snadboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return {
      url: sandboxUrl,
      title: "Fragemt",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);
