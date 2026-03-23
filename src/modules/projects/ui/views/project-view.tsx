"use client"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { MessagesContainer } from "../components/messages-container"
import { Suspense, useState } from "react"
import { Fragment } from "@/generated/prisma/client"
import { ProjectHeader } from "../components/project-header"

interface Props {
    projectId: string,
}

export const ProjectView = ({ projectId }: Props) => {

    const [activeFragment,setActiveFragment] = useState<Fragment|null>(null)

    return <div className="h-screen">
        <ResizablePanelGroup >
            <ResizablePanel defaultSize={35} minSize={20} className="flex flex-col min-h-0">
                <Suspense>
                    <ProjectHeader projectId={projectId}/>
                </Suspense>
                <Suspense fallback={<p>loading.....</p>}>
                    <MessagesContainer
                     projectId={projectId} 
                     activeFragment={activeFragment!}
                     setActiveFragment={setActiveFragment}
                     />
                </Suspense>
                
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={65} minSize={50}>
                TODO:PREview
            </ResizablePanel>

        </ResizablePanelGroup>

    </div>

}