
"use client";

import { useState, useEffect, useTransition, Fragment } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getNotices, sendNoticesToSAP } from '@/app/actions';
import type { Notice, NoticeStatus } from '@/types';
import { Loader2, Send, ListChecks, AlertTriangle, CheckCircle, Eye, ImageOff } from 'lucide-react';
import { format } from 'date-fns';

export function NoticesTab() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotices, setSelectedNotices] = useState<string[]>([]);
  const [isLoadingNotices, startLoadingNotices] = useTransition();
  const [isSending, startSending] = useTransition();
  const [selectedNoticeDetail, setSelectedNoticeDetail] = useState<Notice | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
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

  const pendingNotices = notices.filter(n => n.status === "Pending");
  const sentNotices = notices.filter(n => n.status === "Sent" || n.status === "Failed");

  const handleSelectAllPending = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedNotices(pendingNotices.map(n => n.id));
    } else {
      setSelectedNotices([]);
    }
  };
  
  const isAllPendingSelected = pendingNotices.length > 0 && selectedNotices.length === pendingNotices.length;
  const isIndeterminatePending = selectedNotices.length > 0 && selectedNotices.length < pendingNotices.length;

  const handleSendToSAP = () => {
    const noticesToSend = selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id));
    if (noticesToSend.length === 0) {
      toast({
        title: "No pending notices selected",
        description: "Please select at least one pending notice to send.",
        variant: "destructive",
      });
      return;
    }

    startSending(async () => {
      try {
        const result = await sendNoticesToSAP(noticesToSend);
        toast({
          title: result.success ? "Notices Sent" : "Sending Failed",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });
        if (result.success) {
          fetchNotices(); 
          setSelectedNotices([]); 
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
      case "Pending": return "secondary";
      case "Sent": return "default";
      case "Failed": return "destructive";
      default: return "secondary";
    }
  };

  const openDetailDialog = (notice: Notice) => {
    setSelectedNoticeDetail(notice);
    setIsDetailDialogOpen(true);
  };

  const renderNoticeTable = (title: string, data: Notice[], isPendingTable: boolean) => (
    <Card className="shadow-md mt-6">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary flex items-center">
          {isPendingTable ? <AlertTriangle className="mr-2 h-7 w-7 text-amber-500" /> : <CheckCircle className="mr-2 h-7 w-7 text-green-500" />}
          {title} ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-lg text-muted-foreground">No {isPendingTable ? 'pending' : 'processed'} notices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isPendingTable && (
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={isAllPendingSelected || (isIndeterminatePending ? "indeterminate" : false)}
                        onCheckedChange={handleSelectAllPending}
                        aria-label="Select all pending notices"
                        disabled={pendingNotices.length === 0}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell max-w-xs">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((notice) => (
                  <TableRow key={notice.id} data-state={isPendingTable && selectedNotices.includes(notice.id) && "selected"}>
                    {isPendingTable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedNotices.includes(notice.id)}
                          onCheckedChange={() => handleSelectNotice(notice.id)}
                          aria-labelledby={`notice-title-${notice.id}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {notice.imageUrl ? (
                        <Image 
                          src={notice.imageUrl} 
                          alt={notice.title} 
                          width={60} 
                          height={40} 
                          className="rounded object-cover" 
                          data-ai-hint="industrial equipment"
                        />
                      ) : (
                        <div className="w-[60px] h-[40px] bg-muted rounded flex items-center justify-center">
                          <ImageOff className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell id={`notice-title-${notice.id}`} className="font-medium">{notice.title}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">{notice.description}</TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(notice.date), "PPp")}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(notice.status)} className="shadow-sm">
                        {notice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDetailDialog(notice)}>
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-0 md:p-2 lg:p-4">
      <Card className="shadow-xl border-none sm:border sm:rounded-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><ListChecks className="mr-2 h-8 w-8" />Maintenance Notices</CardTitle>
              <CardDescription className="text-lg">
                View, manage, and send maintenance notices to SAP.
              </CardDescription>
            </div>
            <Button 
              onClick={handleSendToSAP} 
              disabled={isSending || selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id)).length === 0}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
              aria-live="polite"
            >
              {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Send Selected to SAP ({selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id)).length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoadingNotices ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">Loading notices...</p>
            </div>
          ) : (
            <Fragment>
              {renderNoticeTable("Pending Notices", pendingNotices, true)}
              {renderNoticeTable("Processed Notices", sentNotices, false)}
              {notices.length > 0 && pendingNotices.length === 0 && !isLoadingNotices && (
                <div className="mt-6 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-center">
                    <CheckCircle className="inline-block mr-2 h-5 w-5" />
                    All notices have been processed. No pending items.
                </div>
               )}
               {notices.length === 0 && !isLoadingNotices && (
                 <div className="text-center py-10 col-span-1 sm:col-span-2">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground">No maintenance notices found.</p>
                    <p className="text-sm text-muted-foreground">Check back later or try synchronizing data if notices are expected.</p>
                  </div>
               )}
            </Fragment>
          )}
        </CardContent>
      </Card>

      {selectedNoticeDetail && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedNoticeDetail.title}</DialogTitle>
              <DialogDescription>
                Status: <Badge variant={getStatusBadgeVariant(selectedNoticeDetail.status)}>{selectedNoticeDetail.status}</Badge> | Date: {format(new Date(selectedNoticeDetail.date), "PPP p")}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1">
              <div className="grid gap-4 py-4">
                {selectedNoticeDetail.imageUrl && (
                  <div className="relative w-full h-64 md:h-80 rounded-md overflow-hidden border">
                    <Image 
                        src={selectedNoticeDetail.imageUrl.replace('/300/200', '/600/400')} // Request larger image
                        alt={selectedNoticeDetail.title} 
                        layout="fill" 
                        objectFit="contain"
                        data-ai-hint="industrial machinery"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg mb-1">Description:</h3>
                  <p className="text-muted-foreground">{selectedNoticeDetail.description}</p>
                </div>
                {selectedNoticeDetail.detailedInfo && (
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Detailed Information:</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedNoticeDetail.detailedInfo}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <CardFooter className="pt-4">
                <Button onClick={() => setIsDetailDialogOpen(false)} variant="outline" className="w-full">Close</Button>
            </CardFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
