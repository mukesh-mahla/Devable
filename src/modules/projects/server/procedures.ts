import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
    getOne: baseProcedure.input(z.object({
        id:z.string().min(1,"id is required")
    })).query(async ({input}) => {
    const Existingprojects = await prisma.project.findUnique({
      where:{
        id:input.id
      }
    });
    
    if(!Existingprojects){
        throw new TRPCError({code:"NOT_FOUND",message:"project not found"})
    }
    return Existingprojects;
  }),
  getMany: baseProcedure.query(async () => {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });
    return projects;
  }),
  create: baseProcedure
    .input(
      z.object({
        value: z.string().min(1, "message is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const createdProject = await prisma.project.create({
        data: {
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
          projectId:createdProject.id
        },
      });

      return createdProject;
    }),
});
