"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import TextareaAutosize from "react-textarea-autosize"
import { Field } from "@/components/ui/field"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { ArrowUpIcon, Loader2Icon } from "lucide-react"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PROJECT_TEMPLATES } from "../../constant"


const formschema = z.object({
    value: z.string().min(1, "message is required").max(10000, "message is too big")
})



export const ProjectForm = () => {
    const [isFocused, setIsFocused] = useState(false)
    const showUsage = false
    const router = useRouter()
    const trpc = useTRPC()
    const queryClient = useQueryClient()
    const form = useForm<z.infer<typeof formschema>>({
        resolver: zodResolver(formschema),
        defaultValues: {
            value: ""
        },
        mode: "onChange"
    })

    const createProject = useMutation(trpc.projects.create.mutationOptions({
        onSuccess: (data) => {

            queryClient.invalidateQueries(trpc.projects.getMany.queryOptions())
            // invalidate usage status
            router.push(`/projects/${data.id}`)
        },
        onError: (error) => {
            // redirect to pricing page if specific error
            toast.error(error.message)
        }
    }))

    const onSubmit = async (values: z.infer<typeof formschema>) => {
        await createProject.mutateAsync({
            value: values.value,

        })

    }

    const onSelect = (content:string)=>{
        form.setValue("value",content,{
            shouldDirty:true,
            shouldTouch:true,
            shouldValidate:true
        })
    }

    const isPending = createProject.isPending
    const isDisabled = isPending || !form.formState.isValid

    return <>
    <section className="space-y-6">
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
        isFocused && "shadow-xs",
        showUsage && "rounded-t-none"
    )}>
        <Field>
            <TextareaAutosize {...form.register("value")} onFocus={() => setIsFocused(true)}
                disabled={isPending}
                onBlur={() => setIsFocused(false)}
                minRows={2}
                maxRows={8}
                className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                placeholder="What would you like to build"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        form.handleSubmit(onSubmit)(e)
                    }
                }}
            />
        </Field>
        <div className="flex gap-x-2 items-end justify-between pt-2">
            <div className="text-[10px] text-muted-foreground font-mono">
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span>&#8984; </span>Enter
                </kbd>
                &nbsp;to submit
            </div>
            <Button
                disabled={isDisabled}
                className={cn("size-8 rounded-full",
                    isDisabled && "bg-muted-foreground border"

                )}
            >{isPending ? (<Loader2Icon className="size-4 animate-spin" />) : (<ArrowUpIcon />)}

            </Button>
        </div>
    </form>
        <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
            {PROJECT_TEMPLATES.map((template) => (
                <Button 
                   key={template.title}
                    variant={"outline"}
                    size={"sm"}
                    className="bg-white dark:bg-sidebar"
                    onClick={() => { onSelect(template.prompt)}}
                >
                    {template.emoji} {template.title}
                    </Button>)
                )}
        </div>
        </section>
    </>
}