"use client"

import { useCurrentTheme } from "@/hooks/use-current-theme"
import { UserButton } from "@clerk/nextjs"
import { dark } from "@clerk/themes"


interface Props {
    showName?: boolean
}

export const UserControl = ({ showName }: Props) => {
    const currentTheme = useCurrentTheme()
    return (
        <UserButton
            showName={showName}
            appearance={{
               baseTheme: currentTheme === "dark" ? dark : undefined,
                elements: {
                    avatarBox: "w-9 h-9 rounded-full ring-2 ring-primary",
                    userButtonPopoverCard: "shadow-xl border border-border",
                    userButtonPopoverActionButton: "hover:bg-muted",
                    userPreviewMainIdentifier: "font-semibold text-sm",
                }
            }}
        />
    )
}