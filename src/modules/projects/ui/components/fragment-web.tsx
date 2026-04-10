import { Fragment } from "@/generated/prisma/client";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Hint } from "@/components/hint";
interface Props {
    data: Fragment
}


export function FragmentWeb({ data }: Props) {
const [fragmentkey,setFragmentKey] = useState(0)
const [copied,setCopied] = useState(false)

const onRefresh=()=>{
    setFragmentKey((prev)=>prev+1)
}
useEffect(() => {
  setFragmentKey(prev => prev + 1)
}, [data.sandboxurl])

const handelCopy = ()=>{
    navigator.clipboard.writeText(data.sandboxurl)
    setCopied(true)
    setTimeout(() => {
        setCopied(false)
    }, 2000);
}

    return (
        <div className="flex flex-col w-full h-full">
            <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
                <Hint text="Refresh" side="bottom" align="start">
                    <Button size="sm" variant={"outline"} onClick={onRefresh}>
                    <RefreshCcwIcon />
                </Button>
                </Hint>
                
                <Hint text="click to copy" side="bottom">
                    <Button size="sm"
                    variant={"outline"}
                    onClick={handelCopy}
                    disabled={!data.sandboxurl || copied} 
                    className="flex-1 justify-start text-start font-normal"
                >
                    <span className="truncate">{data.sandboxurl}</span>
                </Button>
                </Hint>
                

                <Hint text="Open in a new Tab" side="bottom" align="start">
                    <Button size="sm"
                 disabled={!data.sandboxurl} 
                 variant={"outline"}
                  onClick={() => {
                          if (!data.sandboxurl) {
                             return
                          }
                         window.open(data.sandboxurl, "_blank")
                    }}>
                    <ExternalLinkIcon />
                </Button>
                </Hint>
                
            </div>
           <iframe
    key={fragmentkey}
    className="h-full w-full"
    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-pointer-lock allow-top-navigation-by-user-activation"
    loading="lazy"
    src={data.sandboxurl}
/>
        </div>
    )
}