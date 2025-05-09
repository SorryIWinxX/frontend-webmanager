"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { getNotices, sendNoticesToSAP } from '@/app/actions';
import type { Notice, NoticeStatus } from '@/types';
import { Loader2, Send, ListChecks, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function NoticesTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotices, setSelectedNotices] = useState<string[]>([]);
  const [isLoadingNotices, startLoadingNotices] = useTransition();
  const [isSending, startSending] = useTransition();
  const { toast } = useToast();

  const fetchNotices = () => {
    startLoadingNotices(async () => {
      try {
        const fetchedNotices = await getNotices();
        setNotices(fetchedNotices);
      } catch (e) {
        toast({
          title: "Error fetching notices",
          description: e instanceof Error ? e.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSelectNotice = (noticeId: string) => {
    setSelectedNotices(prev =>
      prev.includes(noticeId) ? prev.filter(id => id !== noticeId) : [...prev, noticeId]
    );
  };

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedNotices(notices.filter(n => n.status === "Pending").map(n => n.id));
    } else {
      setSelectedNotices([]);
    }
  };
  
  const isAllSelected = notices.length > 0 && selectedNotices.length === notices.filter(n => n.status === "Pending").length && notices.filter(n => n.status === "Pending").length > 0;
  const isIndeterminate = selectedNotices.length > 0 && selectedNotices.length < notices.filter(n => n.status === "Pending").length;


  const handleSendToSAP = () => {
    if (selectedNotices.length === 0) {
      toast({
        title: "No notices selected",
        description: "Please select at least one pending notice to send.",
        variant: "destructive",
      });
      return;
    }

    startSending(async () => {
      try {
        const result = await sendNoticesToSAP(selectedNotices);
        toast({
          title: result.success ? "Notices Sent" : "Sending Failed",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });
        if (result.success) {
          fetchNotices(); // Refresh notices
          setSelectedNotices([]); // Clear selection
        }
      } catch (e) {
        toast({
          title: "Error sending notices",
          description: e instanceof Error ? e.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const getStatusBadgeVariant = (status: NoticeStatus): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "Pending":
        return "secondary";
      case "Sent":
        return "default"; // Using default for sent as it's a positive status
      case "Failed":
        return "destructive";
      default:
        return "secondary";
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><ListChecks className="mr-2 h-8 w-8" />Maintenance Notices</CardTitle>
              <CardDescription className="text-lg">
                View and manage maintenance notices. Select pending notices to send to SAP.
              </CardDescription>
            </div>
            <Button 
              onClick={handleSendToSAP} 
              disabled={isSending || selectedNotices.length === 0}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
              aria-live="polite"
            >
              {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Send Selected to SAP ({selectedNotices.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingNotices ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
             <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No maintenance notices found.</p>
                <p className="text-sm text-muted-foreground">Check back later or try synchronizing data if notices are expected.</p>
              </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                       <Checkbox 
                        checked={isAllSelected || (isIndeterminate ? "indeterminate" : false)}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all pending notices"
                        disabled={notices.filter(n => n.status === "Pending").length === 0}
                       />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice.id} data-state={selectedNotices.includes(notice.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNotices.includes(notice.id)}
                          onCheckedChange={() => handleSelectNotice(notice.id)}
                          aria-labelledby={`notice-title-${notice.id}`}
                          disabled={notice.status !== "Pending"}
                        />
                      </TableCell>
                      <TableCell id={`notice-title-${notice.id}`} className="font-medium">{notice.title}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-sm truncate">{notice.description}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(notice.date), "PPp")}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusBadgeVariant(notice.status)} className="shadow-sm">
                          {notice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
           {notices.length > 0 && notices.filter(n => n.status === 'Pending').length === 0 && !isLoadingNotices && (
            <div className="mt-6 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-center">
                <CheckCircle className="inline-block mr-2 h-5 w-5" />
                All notices have been processed. No pending items.
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
