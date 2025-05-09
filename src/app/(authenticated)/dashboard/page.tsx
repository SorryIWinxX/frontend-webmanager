
"use client"; 

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncTab } from "@/components/SyncTab";
import { NoticesTab } from "@/components/NoticesTab";
import { UsersTab } from "@/components/UsersTab";
import { RefreshCw, ListChecks, Users as UsersIcon } from "lucide-react";

export default function DashboardPage() {
  return (
    <Tabs defaultValue="sync" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-12 mb-6 shadow-sm bg-card border">
        <TabsTrigger value="sync" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-t-md sm:rounded-l-md sm:rounded-tr-none">
          <RefreshCw className="mr-2 h-5 w-5" /> Synchronize Data
        </TabsTrigger>
        <TabsTrigger value="notices" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md">
          <ListChecks className="mr-2 h-5 w-5" /> Maintenance Notices
        </TabsTrigger>
        <TabsTrigger value="users" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-b-md sm:rounded-r-md sm:rounded-bl-none">
          <UsersIcon className="mr-2 h-5 w-5" /> User Management
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="sync" className="rounded-lg shadow-md bg-card">
        <SyncTab />
      </TabsContent>
      <TabsContent value="notices" className="rounded-lg shadow-md bg-card">
        <NoticesTab />
      </TabsContent>
      <TabsContent value="users" className="rounded-lg shadow-md bg-card">
        <UsersTab />
      </TabsContent>
    </Tabs>
  );
}
