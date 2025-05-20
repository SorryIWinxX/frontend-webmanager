
"use client";

import { useState, useEffect, useTransition, Fragment } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getNotices, sendNoticesToSAP } from '@/app/actions';
import type { MaintenanceNoticeAPI, NoticeStatus } from '@/types'; // Use MaintenanceNoticeAPI
import { Loader2, Send, ListChecks, AlertTriangle, CheckCircle, Eye, ImageOff, ChevronLeft, ChevronRight, Briefcase, Settings, UserCircle, CalendarDays, Clock, MapPin, Hash, HelpCircle, FileText, Tag, GripVertical, Anchor } from 'lucide-react';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 5;

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  isCode?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value, isCode = false }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start space-x-2">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold text-foreground">{label}:</span>{' '}
        {isCode ? <code className="text-sm bg-muted p-1 rounded">{String(value)}</code> : <span className="text-muted-foreground">{String(value)}</span>}
      </div>
    </div>
  );
};


export function NoticesTab() {
  const [notices, setNotices] = useState<MaintenanceNoticeAPI[]>([]);
  const [selectedNotices, setSelectedNotices] = useState<string[]>([]);
  const [isLoadingNotices, startLoadingNotices] = useTransition();
  const [isSending, startSending] = useTransition();
  const [selectedNoticeDetail, setSelectedNoticeDetail] = useState<MaintenanceNoticeAPI | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [processedCurrentPage, setProcessedCurrentPage] = useState(1);

  const fetchNoticesData = () => { // Renamed to avoid conflict with getNotices import
    startLoadingNotices(async () => {
      try {
        const fetchedNotices = await getNotices();
        setNotices(fetchedNotices);
        setPendingCurrentPage(1); 
        setProcessedCurrentPage(1); 
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
    fetchNoticesData();
  }, []);

  const handleSelectNotice = (noticeId: string) => {
    setSelectedNotices(prev =>
      prev.includes(noticeId) ? prev.filter(id => id !== noticeId) : [...prev, noticeId]
    );
  };

  const pendingNotices = notices.filter(n => n.status === "Pending");
  const sentNotices = notices.filter(n => n.status !== "Pending"); // includes "Sent" and "Failed"

  const handleSelectAllPending = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedNotices(pendingNotices.map(n => n.id));
    } else {
      setSelectedNotices(prev => prev.filter(id => !pendingNotices.some(pn => pn.id === id)));
    }
  };
  
  const currentVisiblePendingNotices = pendingNotices.slice(
    (pendingCurrentPage - 1) * ITEMS_PER_PAGE,
    pendingCurrentPage * ITEMS_PER_PAGE
  );
  
  const areAllVisiblePendingSelected = currentVisiblePendingNotices.length > 0 && currentVisiblePendingNotices.every(n => selectedNotices.includes(n.id));
  const isAnyVisiblePendingSelected = currentVisiblePendingNotices.some(n => selectedNotices.includes(n.id));


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
          fetchNoticesData(); 
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

  const getStatusBadgeVariant = (status: NoticeStatus) => {
    switch (status) {
      case "Pending":
        return "destructive"; 
      case "Sent":
        return "default"; 
      case "Failed":
        return "outline"; // or another variant for failed
      default:
        return "secondary";
    }
  };

  const openDetailDialog = (notice: MaintenanceNoticeAPI) => {
    setSelectedNoticeDetail(notice);
    setIsDetailDialogOpen(true);
  };

  const renderNoticeTable = (
    title: string, 
    data: MaintenanceNoticeAPI[], 
    isPendingTable: boolean,
    currentPage: number,
    setCurrentPage: (page: number) => void,
    totalItems: number
  ) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = data.slice(startIndex, endIndex);

    const handleSelectAllForCurrentPage = (checked: boolean | "indeterminate") => {
        if (checked === true) {
            setSelectedNotices(prev => [...new Set([...prev, ...paginatedData.map(n => n.id)])]);
        } else {
            setSelectedNotices(prev => prev.filter(id => !paginatedData.some(n => n.id === id)));
        }
    };

    const isAllCurrentPageSelected = isPendingTable && paginatedData.length > 0 && paginatedData.every(n => selectedNotices.includes(n.id));
    const isIndeterminateCurrentPage = isPendingTable && paginatedData.some(n => selectedNotices.includes(n.id)) && !isAllCurrentPageSelected;


    return (
      <Card className="border mt-4">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary flex items-center">
            {isPendingTable ? <AlertTriangle className="mr-2 h-7 w-7 text-amber-500" /> : <CheckCircle className="mr-2 h-7 w-7 text-green-500" />}
            {title} ({totalItems})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingNotices && totalItems === 0 ? ( // Show loader only if table is empty during load
             <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : totalItems === 0 ? (
            <div className="text-center py-6">
              <p className="text-lg text-muted-foreground">No {isPendingTable ? 'pending' : 'processed'} notices found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isPendingTable && (
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={isAllCurrentPageSelected || (isIndeterminateCurrentPage ? "indeterminate" : false)}
                            onCheckedChange={handleSelectAllForCurrentPage}
                            aria-label="Select all notices on current page"
                            disabled={paginatedData.length === 0}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Short Text</TableHead>
                      <TableHead className="hidden lg:table-cell">Equipment No.</TableHead>
                      <TableHead className="hidden md:table-cell">Func. Location</TableHead>
                      <TableHead className="hidden sm:table-cell">Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Created At</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((notice) => (
                      <TableRow key={notice.id} data-state={isPendingTable && selectedNotices.includes(notice.id) ? "selected" : undefined}>
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
                              alt={notice.shortText} 
                              width={60} 
                              height={40} 
                              className="rounded object-cover" 
                              data-ai-hint={notice.data_ai_hint || "maintenance"}
                            />
                          ) : (
                            <div className="w-[60px] h-[40px] bg-muted rounded flex items-center justify-center">
                              <ImageOff className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell id={`notice-title-${notice.id}`} className="font-medium max-w-xs truncate">{notice.shortText}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[150px] truncate">{notice.equipmentNumber || 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[150px] truncate">{notice.functionalLocation || 'N/A'}</TableCell>
                        <TableCell className="hidden sm:table-cell">{notice.priority || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(notice.status)} className="shadow-sm">
                            {notice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{format(new Date(notice.createdAt), "PP")}</TableCell>
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
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-0 md:p-2 lg:p-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center"><ListChecks className="mr-2 h-8 w-8" />Avisos de mantenimiento</CardTitle>
              <CardDescription className="text-lg">
              Ver, administrar y enviar avisos de mantenimiento a SAP.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {pendingNotices.length > 0 && (
                <div className="flex items-center space-x-2 bg-muted p-2 rounded-md border">
                    <Checkbox
                        id="select-all-pending-header"
                        checked={ selectedNotices.length > 0 && pendingNotices.every(pn => selectedNotices.includes(pn.id)) ? true : (selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id)).length > 0 ? "indeterminate" : false) }
                        onCheckedChange={handleSelectAllPending}
                        disabled={pendingNotices.length === 0}
                    />
                    <label htmlFor="select-all-pending-header" className="text-sm font-medium text-muted-foreground cursor-pointer">
                        Seleccionar todos los pendientes ({pendingNotices.length})
                    </label>
                </div>
              )}
              <Button 
                onClick={handleSendToSAP} 
                disabled={isSending || selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id)).length === 0}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
                aria-live="polite"
              >
                {isSending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Enviar a SAP ({selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id)).length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoadingNotices && notices.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">Cargando avisos...</p>
            </div>
          ) : (
            <Fragment>
              {renderNoticeTable("Pending Notices", pendingNotices, true, pendingCurrentPage, setPendingCurrentPage, pendingNotices.length)}
              {renderNoticeTable("Processed Notices", sentNotices, false, processedCurrentPage, setProcessedCurrentPage, sentNotices.length)}
              {notices.length > 0 && pendingNotices.length === 0 && !isLoadingNotices && (
                <div className="mt-6 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-center">
                    <CheckCircle className="inline-block mr-2 h-5 w-5" />
                    No hay avisos pendientes de revision.
                </div>
               )}
               {notices.length === 0 && !isLoadingNotices && (
                 <div className="text-center py-10 col-span-1 sm:col-span-2">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground">Ningun aviso encontrado.</p>
                    <p className="text-sm text-muted-foreground">Check back later or try synchronizing data if notices are expected.</p>
                  </div>
               )}
            </Fragment>
          )}
        </CardContent>

      {selectedNoticeDetail && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedNoticeDetail.shortText}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                Status: <Badge variant={getStatusBadgeVariant(selectedNoticeDetail.status)}>{selectedNoticeDetail.status}</Badge> | 
                Created: {format(new Date(selectedNoticeDetail.createdAt), "PPp")}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-4">
              <div className="grid gap-y-3 py-4">
                {selectedNoticeDetail.imageUrl && (
                  <div className="relative w-full h-64 md:h-80 rounded-md overflow-hidden border my-2">
                    <Image 
                        src={selectedNoticeDetail.imageUrl} 
                        alt={selectedNoticeDetail.shortText} 
                        fill
                        style={{objectFit: "contain"}}
                        data-ai-hint={selectedNoticeDetail.data_ai_hint || "maintenance detail"}
                    />
                  </div>
                )}
                
                <h3 className="font-semibold text-lg mb-1 border-b pb-1 text-primary">General Information</h3>
                <DetailItem icon={Hash} label="Notice ID" value={selectedNoticeDetail.id} isCode />
                <DetailItem icon={Settings} label="Equipment Number" value={selectedNoticeDetail.equipmentNumber} isCode />
                <DetailItem icon={MapPin} label="Functional Location" value={selectedNoticeDetail.functionalLocation} isCode />
                <DetailItem icon={Anchor} label="Assembly" value={selectedNoticeDetail.assembly} isCode />
                <DetailItem icon={AlertTriangle} label="Priority" value={selectedNoticeDetail.priority} />
                <DetailItem icon={UserCircle} label="Reporter Name" value={selectedNoticeDetail.reporterName} />
                
                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Date & Time</h3>
                <DetailItem icon={CalendarDays} label="Required Start Date" value={selectedNoticeDetail.requiredStartDate ? format(new Date(selectedNoticeDetail.requiredStartDate), 'PPP') : 'N/A'} />
                <DetailItem icon={Clock} label="Required Start Time" value={selectedNoticeDetail.requiredStartTime} />
                <DetailItem icon={CalendarDays} label="Required End Date" value={selectedNoticeDetail.requiredEndDate ? format(new Date(selectedNoticeDetail.requiredEndDate), 'PPP') : 'N/A'} />
                <DetailItem icon={Clock} label="Required End Time" value={selectedNoticeDetail.requiredEndTime} />
                <DetailItem icon={CalendarDays} label="Malfunction End Date" value={selectedNoticeDetail.malfunctionEndDate ? format(new Date(selectedNoticeDetail.malfunctionEndDate), 'PPP') : 'N/A'} />
                <DetailItem icon={Clock} label="Malfunction End Time" value={selectedNoticeDetail.malfunctionEndTime} />
                <DetailItem icon={Briefcase} label="Work Center Object ID" value={selectedNoticeDetail.workCenterObjectId} isCode />

                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Linear Data</h3>
                <DetailItem icon={MapPin} label="Start Point" value={selectedNoticeDetail.startPoint} />
                <DetailItem icon={MapPin} label="End Point" value={selectedNoticeDetail.endPoint} />
                <DetailItem icon={GripVertical} label="Length" value={selectedNoticeDetail.length} />
                <DetailItem icon={Tag} label="Linear Unit" value={selectedNoticeDetail.linearUnit} />
                
                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Problem Details</h3>
                <DetailItem icon={HelpCircle} label="Problem Code Group" value={selectedNoticeDetail.problemCodeGroup} isCode />
                <DetailItem icon={HelpCircle} label="Problem Code" value={selectedNoticeDetail.problemCode} isCode />
                <DetailItem icon={Settings} label="Object Part Code Group" value={selectedNoticeDetail.objectPartCodeGroup} isCode />
                <DetailItem icon={Settings} label="Object Part Code" value={selectedNoticeDetail.objectPartCode} isCode />
                
                {selectedNoticeDetail.causeText && (
                  <div>
                    <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary flex items-center">
                        <FileText className="mr-2 h-5 w-5" /> Cause Text
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-wrap p-2 bg-secondary/30 rounded-md">{selectedNoticeDetail.causeText}</p>
                  </div>
                )}
                
                <DetailItem icon={CalendarDays} label="Last Updated" value={selectedNoticeDetail.updatedAt ? format(new Date(selectedNoticeDetail.updatedAt), 'PPpp') : 'N/A'} />

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
