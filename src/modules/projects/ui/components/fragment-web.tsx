import { Fragment } from "@/generated/prisma/client";
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
interface Props {
    data: Fragment
}


export function FragmentWeb({ data }: Props) {
const [fragmentkey,setFragmentKey] = useState(0)
const [copied,setCopied] = useState(false)

const onRefresh=()=>{
    setFragmentKey((prev)=>prev+1)
}

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
                <Button size="sm" variant={"outline"} onClick={onRefresh}>
                    <RefreshCcwIcon />
                </Button>
                <Button size="sm"
                    variant={"outline"}
                    onClick={handelCopy}
                    disabled={!data.sandboxurl || copied} 
                    className="flex-1 justify-start text-start font-normal"
                >
                    <span className="truncate">{data.sandboxurl}</span>
                </Button>
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
            </div>
            <iframe
                key={fragmentkey} 
                className="h-full w-full"
                sandbox="allow-forms allow-scripts allow-same-origin"
                loading="lazy"
                src={data.sandboxurl}
            />
        </div>
    )
}