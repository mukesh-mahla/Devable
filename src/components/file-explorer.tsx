import {  CopyCheckIcon, CopyIcon } from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { CodeView } from "@/components/code-view";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from "./ui/breadcrumb";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";



type FileCollection = { [path: string]: string }

function getLanguageFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLocaleLowerCase();
    return extension || "text"
}

interface FileBreadCrumbProps {
    filePath: string
}

const FileBreadCrumb = ({ filePath }: FileBreadCrumbProps) => {
    const pathSegments = filePath.split("/")
    const maxsegment = 4

    const renderBreadcrumbItems = () => {
        if (pathSegments.length <= maxsegment) {
            // show all segments
            return pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1
                return <Fragment key={index}>
                    <BreadcrumbItem>
                        {isLast ? <BreadcrumbPage className="font-medium">{segment}</BreadcrumbPage> : <span className="text-muted-foreground">{segment}</span>}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                </Fragment>
            }

        )
        } else {
            const firstSegment = pathSegments[0]
            const lastSegments = pathSegments[pathSegments.length - 1]

            return (
                <>
                    <BreadcrumbItem>
                        <span className="text-muted-foreground">{firstSegment}</span>
                        <BreadcrumbSeparator />
                    
                    <BreadcrumbItem>
                        <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                       <BreadcrumbPage className="font-medium">{lastSegments}</BreadcrumbPage>
                    </BreadcrumbItem>
                    </BreadcrumbItem>
                </>
            )
        }
    }
    return <Breadcrumb>
     <BreadcrumbList>
      {renderBreadcrumbItems()}
     </BreadcrumbList>
    </Breadcrumb>
}

interface FileExplorerProps {
    files: FileCollection
}

export const FileExplorer = ({ files }: FileExplorerProps) => {
    const [copied,setCopied] = useState(false)
    const [selectedFile, setSelectedFile] = useState<string | null>(() => {
        const filekeys = Object.keys(files);
        return filekeys.length > 0 ? filekeys[0] : null
    })

    const treeData = useMemo(() => {
        return convertFilesToTreeItems(files)
    }, [files])

    const handelFileSelect = useCallback((filePath: string) => {
        if (files[filePath]) {
            setSelectedFile(filePath)
        }
    }, [])

    const handelCopy = useCallback(()=>{
        if(selectedFile){
    navigator.clipboard.writeText(files[selectedFile!])
    setCopied(true)
    setTimeout(() => {
        setCopied(false)
    }, 2000);
}
    },[selectedFile,files])

    return (
        <ResizablePanelGroup orientation="horizontal">
            <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
                <TreeView
                    data={treeData}
                    value={selectedFile}
                    onSelect={handelFileSelect}
                />
            </ResizablePanel>
            <ResizableHandle className="hover:bg-primary transition-colors" />
            <ResizablePanel defaultSize={70} minSize={50} >
                {selectedFile && files[selectedFile] ? (
                    <div className="h-full w-full flex flex-col">
                        <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
                            <FileBreadCrumb filePath={selectedFile} />
                            <Hint text="Copy to clipboard" side="bottom">
                                <Button variant={"outline"}
                                    size={"icon"}
                                    className="ml-auto"
                                    onClick={handelCopy}
                                    disabled={copied}>
                                    {copied ? <CopyCheckIcon /> : <CopyIcon />}
                                </Button>
                            </Hint>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <CodeView code={files[selectedFile]} lang={getLanguageFromExtension(selectedFile)} />
                        </div>
                    </div>
                ) : (<div className="flex h-full items-center justify-center text-muted-foreground">Select a file to view its contents</div>)}
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}