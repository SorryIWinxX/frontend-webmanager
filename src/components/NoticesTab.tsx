
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
import type { MaintenanceNoticeAPI, NoticeStatus } from '@/types';
import { Loader2, Send, ListChecks, AlertTriangle, CheckCircle, Eye, ImageOff, ChevronLeft, ChevronRight, Briefcase, Settings, UserCircle, CalendarDays, Clock, MapPin, Hash, HelpCircle, FileText, Tag, GripVertical, Anchor, Info, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ITEMS_PER_PAGE = 5;

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | number | null;
  isCode?: boolean;
  fullWidthValue?: boolean;
  placeholder?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value, isCode = false, fullWidthValue = false, placeholder = "---" }) => {
  const displayValue = (value === undefined || value === null || String(value).trim() === '') ? placeholder : String(value);
  
  if (fullWidthValue) {
    return (
      <div>
        <h3 className="font-semibold text-md mb-1 mt-3 border-b pb-1 text-primary flex items-center">
            <Icon className="mr-2 h-5 w-5" /> {label}
        </h3>
        <p className="text-muted-foreground whitespace-pre-wrap p-2 bg-secondary/30 rounded-md">{displayValue}</p>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-2 py-1">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold text-foreground">{label}:</span>{' '}
        {isCode ? <code className="text-sm bg-muted p-1 rounded">{displayValue}</code> : <span className="text-muted-foreground">{displayValue}</span>}
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

  const fetchNoticesData = () => {
    startLoadingNotices(async () => {
      try {
        const fetchedNotices = await getNotices();
        setNotices(fetchedNotices);
        setPendingCurrentPage(1); 
        setProcessedCurrentPage(1); 
      } catch (e) {
        toast({
          title: "Error al cargar avisos",
          description: e instanceof Error ? e.message : "Ocurrió un error desconocido.",
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

  const pendingNotices = notices.filter(n => n.status === "Pendiente");
  const sentNotices = notices.filter(n => n.status !== "Pendiente"); // includes "Enviado" and "Fallido"

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
  
  const handleSendToSAP = () => {
    const noticesToSend = selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id));
    if (noticesToSend.length === 0) {
      toast({
        title: "No hay avisos pendientes seleccionados",
        description: "Por favor, seleccione al menos un aviso pendiente para enviar.",
        variant: "destructive",
      });
      return;
    }

    startSending(async () => {
      try {
        const result = await sendNoticesToSAP(noticesToSend);
        toast({
          title: result.success ? "Avisos Enviados" : "Envío Fallido",
          description: result.message,
          variant: result.success ? "default" : "destructive",
        });
        if (result.success) {
          fetchNoticesData(); 
          setSelectedNotices([]); 
        }
      } catch (e) {
        toast({
          title: "Error al enviar avisos",
          description: e instanceof Error ? e.message : "Ocurrió un error desconocido.",
          variant: "destructive",
        });
      }
    });
  };

  const getStatusBadgeVariant = (status: NoticeStatus): "destructive" | "default" | "outline" | "secondary" => {
    switch (status) {
      case "Pendiente":
        return "destructive"; 
      case "Enviado":
        return "default"; 
      case "Fallido":
        return "outline"; 
      default:
        return "secondary";
    }
  };

  const openDetailDialog = (notice: MaintenanceNoticeAPI) => {
    setSelectedNoticeDetail(notice);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'dd/mm/aaaa';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const formatTime = (timeString?: string) => {
    if (!timeString) return '---';
    // Basic HH:MM check, can be improved
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(timeString)) {
        return timeString;
    }
    return '---';
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
          {isLoadingNotices && totalItems === 0 ? (
             <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : totalItems === 0 ? (
            <div className="text-center py-6">
              <p className="text-lg text-muted-foreground">No se encontraron avisos {isPendingTable ? 'pendientes' : 'procesados'}.</p>
            </div>
          ) : (
            <>
              <ScrollArea className="whitespace-nowrap">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isPendingTable && (
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={isAllCurrentPageSelected || (isIndeterminateCurrentPage ? "indeterminate" : false)}
                            onCheckedChange={handleSelectAllForCurrentPage}
                            aria-label="Seleccionar todos los avisos en la página actual"
                            disabled={paginatedData.length === 0}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[80px]">Imagen</TableHead>
                      <TableHead>Texto Corto</TableHead>
                      <TableHead className="hidden lg:table-cell">Nº Equipo</TableHead>
                      <TableHead className="hidden md:table-cell">Ubic. Técnica</TableHead>
                      <TableHead className="hidden sm:table-cell">Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Creado el</TableHead>
                      <TableHead className="text-right">Detalles</TableHead>
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
                              data-ai-hint={notice.data_ai_hint || "mantenimiento"}
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
                        <TableCell className="hidden md:table-cell">{format(new Date(notice.createdAt), "PP", { locale: es })}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDetailDialog(notice)}>
                            <Eye className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
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
              {renderNoticeTable("Avisos Pendientes", pendingNotices, true, pendingCurrentPage, setPendingCurrentPage, pendingNotices.length)}
              {renderNoticeTable("Avisos Procesados", sentNotices, false, processedCurrentPage, setProcessedCurrentPage, sentNotices.length)}
              {notices.length > 0 && pendingNotices.length === 0 && !isLoadingNotices && (
                <div className="mt-6 p-4 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-center">
                    <CheckCircle className="inline-block mr-2 h-5 w-5" />
                    No hay avisos pendientes de revisión.
                </div>
               )}
               {notices.length === 0 && !isLoadingNotices && (
                 <div className="text-center py-10 col-span-1 sm:col-span-2">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-xl text-muted-foreground">No se encontraron avisos.</p>
                    <p className="text-sm text-muted-foreground">Vuelva más tarde o intente sincronizar datos si se esperan avisos.</p>
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
                Estado: <Badge variant={getStatusBadgeVariant(selectedNoticeDetail.status)}>{selectedNoticeDetail.status}</Badge> | 
                Creado: {format(new Date(selectedNoticeDetail.createdAt), "PPp", { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-4">
              <div className="grid gap-y-1 py-4">

                <h3 className="font-semibold text-lg mb-2 border-b pb-1 text-primary">Información Básica</h3>
                
                {selectedNoticeDetail.imageUrl && (
                  <div className="relative w-full h-64 md:h-80 rounded-md overflow-hidden border my-2">
                    <Image 
                        src={selectedNoticeDetail.imageUrl} 
                        alt={selectedNoticeDetail.shortText} 
                        fill
                        style={{objectFit: "contain"}}
                        data-ai-hint={selectedNoticeDetail.data_ai_hint || "detalle mantenimiento"}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="font-semibold">Tipo de Aviso:</span> <span className="text-muted-foreground">{selectedNoticeDetail.noticeType || "M1"}</span></div>
                    <div><span className="font-semibold">Equipo:</span> <span className="text-muted-foreground">{selectedNoticeDetail.equipmentNumber || "(vacío)"}</span></div>
                    <div><span className="font-semibold">Ubicación Técnica:</span> <span className="text-muted-foreground">{selectedNoticeDetail.functionalLocation || "(vacío)"}</span></div>
                    <div><span className="font-semibold">Fecha Inicio:</span> <span className="text-muted-foreground">{formatDate(selectedNoticeDetail.requiredStartDate)}</span></div>
                    <div><span className="font-semibold">Hora Inicio:</span> <span className="text-muted-foreground">{formatTime(selectedNoticeDetail.requiredStartTime)}</span></div>
                    <div><span className="font-semibold">Fecha Fin:</span> <span className="text-muted-foreground">{formatDate(selectedNoticeDetail.requiredEndDate)}</span></div>
                    <div><span className="font-semibold">Hora Fin:</span> <span className="text-muted-foreground">{formatTime(selectedNoticeDetail.requiredEndTime)}</span></div>
                    <div><span className="font-semibold">Puesto de Trabajo:</span> <span className="text-muted-foreground">{selectedNoticeDetail.workCenterObjectId || "(vacío)"}</span></div>
                    <div><span className="font-semibold">Reportado por:</span> <span className="text-muted-foreground">{selectedNoticeDetail.reporterName || "---"}</span></div>
                    <div><span className="font-semibold">Punto de Inicio:</span> <span className="text-muted-foreground">{selectedNoticeDetail.startPoint || "(vacío)"}</span></div>
                    <div><span className="font-semibold">Punto de Fin:</span> <span className="text-muted-foreground">{selectedNoticeDetail.endPoint || "(vacío)"}</span></div>
                </div>
                
                <DetailItem icon={Hash} label="ID Aviso" value={selectedNoticeDetail.id} isCode placeholder="N/A"/>
                
                <h3 className="font-semibold text-lg mb-1 mt-4 border-b pb-1 text-primary">Información Adicional</h3>
                <DetailItem icon={Info} label="Prioridad" value={selectedNoticeDetail.priority} placeholder="N/A" />
                <DetailItem icon={Anchor} label="Conjunto" value={selectedNoticeDetail.assembly} isCode placeholder="N/A" />
                <DetailItem icon={CalendarDays} label="Fin Avería (Fecha)" value={selectedNoticeDetail.malfunctionEndDate ? formatDate(selectedNoticeDetail.malfunctionEndDate) : undefined} placeholder="dd/mm/aaaa"/>
                <DetailItem icon={Clock} label="Fin Avería (Hora)" value={selectedNoticeDetail.malfunctionEndTime ? formatTime(selectedNoticeDetail.malfunctionEndTime) : undefined} placeholder="---"/>
                
                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Datos Lineales</h3>
                <DetailItem icon={GripVertical} label="Longitud" value={selectedNoticeDetail.length} placeholder="---" />
                <DetailItem icon={Tag} label="Unidad Lineal" value={selectedNoticeDetail.linearUnit} placeholder="---" />
                
                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Detalles del Problema</h3>
                <DetailItem icon={HelpCircle} label="Grupo Cód. Problema" value={selectedNoticeDetail.problemCodeGroup} isCode placeholder="N/A" />
                <DetailItem icon={HelpCircle} label="Código Problema" value={selectedNoticeDetail.problemCode} isCode placeholder="N/A" />
                <DetailItem icon={Settings} label="Grupo Cód. Objeto" value={selectedNoticeDetail.objectPartCodeGroup} isCode placeholder="N/A" />
                <DetailItem icon={Edit} label="Código Parte Objeto" value={selectedNoticeDetail.objectPartCode} isCode placeholder="N/A" />
                
                <DetailItem icon={FileText} label="Texto de Causa" value={selectedNoticeDetail.causeText} fullWidthValue placeholder="Sin texto de causa." />
                
                <DetailItem icon={CalendarDays} label="Última Actualización" value={selectedNoticeDetail.updatedAt ? format(new Date(selectedNoticeDetail.updatedAt), 'PPpp', { locale: es }) : 'N/A'} />

              </div>
            </ScrollArea>
            <CardFooter className="pt-4">
                <Button onClick={() => setIsDetailDialogOpen(false)} variant="outline" className="w-full">Cerrar</Button>
            </CardFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

