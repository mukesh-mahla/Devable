"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

const Page = ()=>{
  const [value,setvalue] = useState("")
  const trpc = useTRPC()
const {data:messages} = useQuery(trpc.messages.getMany.queryOptions())

const createMessage = useMutation(trpc.messages.create.mutationOptions({
  onSuccess:()=>{
    toast.success("message created")
  }
}))
 
  return <div>
    <Input value={value} onChange={(e)=>setvalue(e.target.value)} placeholder="prompt"/>
    <Button disabled={createMessage.isPending} onClick={()=>createMessage.mutate({value:value})}>
      background job
    </Button>
    <div>{JSON.stringify(messages,null,2)}</div>
  </div>
}

export default Page