"use client"; 

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncTab } from "@/components/SyncTab";
import { NoticesTab } from "@/components/NoticesTab";
import { UsersTab } from "@/components/UsersTab";
import { RefreshCw, ListChecks, Users as UsersIcon } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("sync");

  // Cargar el tab activo desde localStorage al montar el componente
  useEffect(() => {
    const savedTab = localStorage.getItem('dashboard-active-tab');
    if (savedTab && ['sync', 'notices', 'users'].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Guardar el tab activo en localStorage cuando cambie
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('dashboard-active-tab', value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full sm:h-12 bg-card border">
        <TabsTrigger value="sync" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
          <RefreshCw className="mr-2 h-5 w-5" /> Sincronizacion con SAP
        </TabsTrigger>
        <TabsTrigger value="notices" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md">
          <ListChecks className="mr-2 h-5 w-5" /> Avisos de mantenimiento
        </TabsTrigger>
        <TabsTrigger value="users" className="py-3 text-base data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md rounded-b-md sm:rounded-r-md sm:rounded-bl-none">
          <UsersIcon className="mr-2 h-5 w-5" /> Control de usuarios
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="sync" className="border bg-card">
        <SyncTab />
      </TabsContent>
      <TabsContent value="notices" className="border bg-card">
        <NoticesTab />
      </TabsContent>
      <TabsContent value="users" className="border bg-card">
        <UsersTab />
      </TabsContent>
    </Tabs>
  );
}
