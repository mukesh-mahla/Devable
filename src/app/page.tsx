"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

const Page = ()=>{
  const [value,setvalue] = useState("")

const trpc = useTRPC()
const invokes = useMutation(trpc.invoke.mutationOptions())
 
  return <div>
    <Input value={value} onChange={(e)=>setvalue(e.target.value)} placeholder="prompt"/>
    <Button onClick={()=>invokes.mutate({value:value})}>
      background job
    </Button>
  </div>
}

export default Page