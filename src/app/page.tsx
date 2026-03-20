"use client"

import { Button } from "@/components/ui/button"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQuery } from "@tanstack/react-query"

const Page = ()=>{

const trpc = useTRPC()
const invokes = useMutation(trpc.invoke.mutationOptions())
 
  return <div>
    <Button onClick={()=>invokes.mutate({text:"hello@gmail.com"})}>
      background job
    </Button>
  </div>
}

export default Page