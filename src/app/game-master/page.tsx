import {AppSidebar} from "@/components/sidebar/app-sidebar";
import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar";
import React from "react";

export default function GameMasterPage() {
    return (
        <div>
            <SidebarProvider>
                <AppSidebar />
                <main>
                    <SidebarTrigger />
                </main>
            </SidebarProvider>
        </div>
    );
}
