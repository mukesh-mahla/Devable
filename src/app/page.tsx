"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

const Page = ()=>{
  const [value,setvalue] = useState("")
  const trpc = useTRPC()

  const router = useRouter()

const createProject = useMutation(trpc.projects.create.mutationOptions({
  onSuccess:(data)=>{
    toast.success("message created"),
    router.push(`/projects/${data.id}`)
  },
  onError:(error)=>{
    toast.error(error.message)
  }
}))
 
  return <div className="h-screen w-screen flex items-center justify-center">
    <div className="max-w-7xl mx-auto flex items-center flex-col gap-y-4 justify-center ">
    <Input value={value} onChange={(e)=>setvalue(e.target.value)} placeholder="prompt"/>
    <Button disabled={createProject.isPending} onClick={()=>createProject.mutate({value:value})}>
      background job
    </Button>
    </div>
  </div>
}

export default Page