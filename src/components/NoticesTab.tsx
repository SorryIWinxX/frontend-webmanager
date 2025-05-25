
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
import { Loader2, Send, ListChecks, AlertTriangle, CheckCircle, Eye, ImageOff, ChevronLeft, ChevronRight, Info, UserCircle, CalendarDays, Clock, Tag, Hash, Edit, Settings, HelpCircle, Briefcase } from 'lucide-react';
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
  const sentNotices = notices.filter(n => n.status !== "Pendiente");

  const handleSelectAllPending = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedNotices(pendingNotices.map(n => n.id));
    } else {
      setSelectedNotices(prev => prev.filter(id => !pendingNotices.some(pn => pn.id === id)));
    }
  };

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

  const formatDate = (dateString?: string, dateFormat = 'dd/MM/yyyy HH:mm') => {
    if (!dateString) return 'dd/mm/aaaa hh:mm';
    try {
      return format(new Date(dateString), dateFormat, { locale: es });
    } catch {
      return 'Fecha inválida';
    }
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
                      <TableHead>Texto Breve</TableHead>
                      <TableHead className="hidden lg:table-cell">Equipo ID</TableHead>
                      <TableHead className="hidden md:table-cell">Ubic. Técnica ID</TableHead>
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
                              alt={notice.textoBreve}
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
                        <TableCell id={`notice-title-${notice.id}`} className="font-medium max-w-xs truncate">{notice.textoBreve}</TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[150px] truncate">{notice.equipoId}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[150px] truncate">{notice.ubicacionTecnicaId}</TableCell>
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
              Ver, administrar y enviar avisos de mantenimiento.
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
                Enviar ({selectedNotices.filter(id => pendingNotices.some(pn => pn.id === id)).length})
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
              {renderNoticeTable("Avisos Procesados (Enviados/Fallidos)", sentNotices, false, processedCurrentPage, setProcessedCurrentPage, sentNotices.length)}
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
              <DialogTitle className="text-2xl">{selectedNoticeDetail.textoBreve}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                ID Interno: <Badge variant="outline">{selectedNoticeDetail.id}</Badge> |
                Estado: <Badge variant={getStatusBadgeVariant(selectedNoticeDetail.status)}>{selectedNoticeDetail.status}</Badge>
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1 pr-4">
              <div className="grid gap-y-3 py-4">

                {selectedNoticeDetail.imageUrl && (
                  <div className="relative w-full h-64 md:h-80 rounded-md overflow-hidden border my-2">
                    <Image
                        src={selectedNoticeDetail.imageUrl}
                        alt={selectedNoticeDetail.textoBreve}
                        fill
                        style={{objectFit: "contain"}}
                        data-ai-hint={selectedNoticeDetail.data_ai_hint || "detalle mantenimiento"}
                    />
                  </div>
                )}

                <h3 className="font-semibold text-lg mb-1 border-b pb-1 text-primary">Información Principal (API)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <DetailItem icon={Tag} label="Tipo Aviso ID" value={selectedNoticeDetail.tipoAvisoId} placeholder="N/A" />
                  <DetailItem icon={Settings} label="Equipo ID" value={selectedNoticeDetail.equipoId} placeholder="N/A" />
                  <DetailItem icon={Briefcase} label="Ubicación Técnica ID" value={selectedNoticeDetail.ubicacionTecnicaId} placeholder="N/A" />
                  <DetailItem icon={Info} label="Puesto Trabajo ID" value={selectedNoticeDetail.puestoTrabajoId} placeholder="N/A" />
                  <DetailItem icon={Edit} label="Parte Objeto ID" value={selectedNoticeDetail.parteObjetoId} placeholder="N/A" />
                  <DetailItem icon={UserCircle} label="Creado Por ID (API)" value={selectedNoticeDetail.createdById} placeholder="N/A" />
                </div>
                <DetailItem icon={HelpCircle} label="Texto Breve" value={selectedNoticeDetail.textoBreve} fullWidthValue placeholder="Sin texto breve."/>


                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Fechas y Horas (API)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <DetailItem icon={CalendarDays} label="Fecha Inicio" value={formatDate(selectedNoticeDetail.fechaInicio)} />
                    <DetailItem icon={CalendarDays} label="Fecha Fin" value={formatDate(selectedNoticeDetail.fechaFin)} />
                    <DetailItem icon={Clock} label="Hora Inicio (API)" value={formatDate(selectedNoticeDetail.horaInicio)} />
                    <DetailItem icon={Clock} label="Hora Fin (API)" value={formatDate(selectedNoticeDetail.horaFin)} />
                 </div>


                <h3 className="font-semibold text-lg mb-1 mt-3 border-b pb-1 text-primary">Estado y Registro (Interno)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <DetailItem icon={Hash} label="ID Aviso (Interno)" value={selectedNoticeDetail.id} isCode />
                    <DetailItem icon={CalendarDays} label="Creado el" value={formatDate(selectedNoticeDetail.createdAt, 'PPpp')} />
                    <DetailItem icon={CalendarDays} label="Última Actualización" value={formatDate(selectedNoticeDetail.updatedAt, 'PPpp')} />
                 </div>

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
