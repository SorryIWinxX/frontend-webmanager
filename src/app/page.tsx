"use client"; // Tabs component requires client-side interactivity

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { SyncTab } from "@/components/SyncTab";
import { NoticesTab } from "@/components/NoticesTab";
import { UsersTab } from "@/components/UsersTab";
import { RefreshCw, ListChecks, Users as UsersIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-0 sm:px-4 py-6">
        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-12 mb-6 shadow-sm bg-card border">
            <TabsTrigger value="sync" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-t-md sm:rounded-l-md sm:rounded-tr-none">
              <RefreshCw className="mr-2 h-5 w-5" /> Synchronize Data
            </TabsTrigger>
            <TabsTrigger value="notices" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md">
              <ListChecks className="mr-2 h-5 w-5" /> List Notices
            </TabsTrigger>
            <TabsTrigger value="users" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-b-md sm:rounded-r-md sm:rounded-bl-none">
              <UsersIcon className="mr-2 h-5 w-5" /> User Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sync" className="rounded-lg shadow-lg">
            <SyncTab />
          </TabsContent>
          <TabsContent value="notices" className="rounded-lg shadow-lg">
            <NoticesTab />
          </TabsContent>
          <TabsContent value="users" className="rounded-lg shadow-lg">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t">
        © {new Date().getFullYear()} Desktop Maintenance Hub. All rights reserved.
      </footer>
    </div>
  );
}
