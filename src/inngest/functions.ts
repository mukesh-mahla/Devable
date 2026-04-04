import { Sandbox } from "@e2b/code-interpreter";
import {
  gemini,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  Message,
  createState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompts";
import { prisma } from "@/lib/db";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent", triggers: [{ event: "code-agent/run" }] },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("nextjs-test-3");
      return sandbox.sandboxId;
    });

    const previousMessage = await step.run("get-previos-message", async () => {
      const formattedMessages: Message[] = [];
      const messages = await prisma.message.findMany({
        where: { projectId: event.data.projectId },
        orderBy: {
          createdAt: "desc",
        },
      });
      for (const message of messages) {
        formattedMessages.push({
          type: "text",
          role: message.role === "ASSISTENT" ? "assistant" : "user",
          content: message.content,
        });
      }
      return formattedMessages;
    });

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessage,
      },
    );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent", // Kept static
      description: "an expert coding agent",
      system: PROMPT,
      model: gemini({
        model: "gemini-2.5-pro", // Upgrade to "gemini-2.5-pro" for better reasoning!
        defaultParameters: {
          generationConfig: {
            temperature: 0.1,
          },
          toolConfig: {
            functionCallingConfig: {
              mode: "ANY",
            },
          },
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description:
            "Execute a shell command in the sandbox and return the output.",
          parameters: z.object({
            command: z.string().describe("Shell command"),
          }),
          // DELETED step.run WRAPPER
          handler: async ({ command }) => {
            const buffers = { stdout: "", stderr: "" };
            try {
              const sandbox = await getSandbox(sandboxId);

              const result = await sandbox.commands.run(command, {
                onStdout: (data: string) => {
                  buffers.stdout += data;
                },
                onStderr: (data: string) => {
                  buffers.stderr += data;
                },
              });

              return result.stdout || "Command executed successfully.";
            } catch (e) {
              console.error(
                `command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
              );
              return `command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
            }
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description:
            "Write or update files in the sandbox. Pass the file path and content.",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          // DELETED step.run WRAPPER
          handler: async ({ files }, { network }: Tool.Options<AgentState>) => {
            try {
              const updatedFiles = network?.state?.data?.files || {};
              const sandbox = await getSandbox(sandboxId);
              for (const file of files) {
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path] = file.content;
              }
              if (network) {
                network.state.data.files = updatedFiles;
              }
              return `Successfully updated ${files.length} file(s).`;
            } catch (e) {
              return "Error: " + e;
            }
          },
        }),
        createTool({
          name: "readfiles",
          description:
            "Read and return the contents of files in the sandbox by their file paths.",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          // DELETED step.run WRAPPER
          handler: async ({ files }) => {
            try {
              const sandbox = await getSandbox(sandboxId);
              const contents = [];
              for (const file of files) {
                const content = await sandbox.files.read(file);
                contents.push({ path: file, content });
              }
              return JSON.stringify(contents);
            } catch (e) {
              return "Error: " + e;
            }
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessgeText =
            lastAssistantTextMessageContent(result);

          if (lastAssistantMessgeText && network) {
            if (lastAssistantMessgeText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessgeText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    const res = await network.run(event.data.value, { state });

    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator", // Kept static
      description: "a fragment title generator",
      system: FRAGMENT_TITLE_PROMPT,
      model: gemini({
        model: "gemini-2.5-flash", 
        defaultParameters: {
          generationConfig: {
            temperature: 0.1,
          },
        },
      }),
    });

    const responseGenerator = createAgent({
      name: "response=generator", // Kept static
      description: "a response generator",
      system: RESPONSE_PROMPT,
      model: gemini({
        model:"gemini-2.5-flash", 
        defaultParameters: {
          generationConfig: {
            temperature: 0.1,
          },
        },
      }),
    });

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      res.state.data.summary,
    );
    const { output: responseOutput } = await responseGenerator.run(
      res.state.data.summary,
    );

    const generateFragmentTitle = () => {
      if (fragmentTitleOutput[0].type !== "text") {
        return "Fragment";
      }
      if (Array.isArray(fragmentTitleOutput[0].content)) {
        return fragmentTitleOutput[0].content.map((txt) => txt).join("");
      } else {
        return fragmentTitleOutput[0].content;
      }
    };

    const generateResponse = () => {
      if (responseOutput[0].type !== "text") {
        return "here you go";
      }
      if (Array.isArray(responseOutput[0].content)) {
        return responseOutput[0].content.map((txt) => txt).join("");
      } else {
        return responseOutput[0].content;
      }
    };

    // Extract values immediately so Prisma doesn't trip on complex objects
    const finalSummary =
      res.state.data.summary || "Task finished without summary.";
    const finalFiles = res.state.data.files || {};

    const isError =
      !res.state.data.summary ||
      Object.keys(res.state.data.files || {}).length === 0;

    const sandboxUrl = await step.run("sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong,Please try again",
            role: "ASSISTENT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: generateResponse(),
          role: "ASSISTENT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxurl: sandboxUrl,
              title: generateFragmentTitle(),
              files: finalFiles,
            },
          },
        },
      });
    });

    return {
      url: sandboxUrl,
      title: "Fragment",
      files: finalFiles,
      summary: finalSummary,
    };
  },
);
