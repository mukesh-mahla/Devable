import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";

export const projectsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, "id is required"),
      }),
    )
    .query(async ({ input, ctx }) => {
      const Existingprojects = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (!Existingprojects) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "project not found",
        });
      }
      return Existingprojects;
    }),
  getMany: protectedProcedure.query(async ({ ctx }) => {
     if (!ctx.auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

    const projects = await prisma.project.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return projects;
  }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string().min(1, "message is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
              await consumeCredits();
            } catch (err) {
              if (err instanceof Error) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "something went wrong",
                });
              } else {
                throw new TRPCError({
                  code: "TOO_MANY_REQUESTS",
                  message: "you have run out of creadits",
                });
              }
            }
      const createdProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId,
          name: generateSlug(3, { format: "kebab" }),
          messages: {
            create: {
              content: input.value,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value,
          projectId: createdProject.id,
        },
      });

      return createdProject;
    }),
});
