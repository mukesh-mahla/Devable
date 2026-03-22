import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import z from "zod";

export const messageRouter = createTRPCRouter({
    getMany:baseProcedure .input(z.object({
        projectId:z.string().min(1,"project id is required")
    })).query(async({input})=>{
    const messages = await prisma.message.findMany({
        where:{
            projectId:input.projectId
        },
        include:{
            fragment:true
        },
        orderBy:{
            updatedAt:"asc"
        },
       
    })
    return messages
    }),
    create: baseProcedure
    .input(z.object({
        value:z.string().min(1,"message is required").max(10000,"message is too big"),
        projectId:z.string().min(1,"project id is required")
    })).mutation(async({input})=>{
        const newMessage = await prisma.message.create({
            data:{
                projectId:input.projectId,
                content:input.value,
                role:"USER",
                type:"RESULT"
            }
        })

        await inngest.send({
            name:"code-agent/run",
            data:{
                value:input.value,
               projectId:input.projectId
            }
        })

        return newMessage
    })
})