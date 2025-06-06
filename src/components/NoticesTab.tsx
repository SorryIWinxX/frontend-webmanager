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
import type { MaintenanceNoticeAPI, NoticeStatus } from '@/types';
import { getMaintenanceNotices, sendMaintenanceNoticesToSAP } from '@/app/actions';
import { Loader2, Send, ListChecks, AlertTriangle, CheckCircle, Eye, ImageOff, ChevronLeft, ChevronRight, Info, UserCircle, CalendarDays, Clock, Tag, Hash, Edit, Settings, HelpCircle, Briefcase, MapPin, Wrench, AlertCircle, User, FileText, Calendar, Activity, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Textarea } from './ui/textarea';

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
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [lastNoticeCount, setLastNoticeCount] = useState(0);
  const { toast } = useToast();

  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [processedCurrentPage, setProcessedCurrentPage] = useState(1);

  const fetchNoticesData = (showToastOnNewNotices = false) => {
    startLoadingNotices(async () => {
      try {
        const result = await getMaintenanceNotices();
        
        if (!result.success) {
          throw new Error(result.message);
        }
        
        const data = result.notices || [];
        
        // Mapear los datos del backend al formato esperado por el componente
        const mappedNotices: MaintenanceNoticeAPI[] = data.map((notice: any) => ({
          id: notice.id.toString(),
          numeroExt: notice.numeroExt,
          tipoAviso: notice.tipoAviso || { id: 0, nombre: '', descripcion: '' },
          equipo: notice.equipo || { 
            id: 0, 
            numeroEquipo: '', 
            ubicacionTecnica: '', 
            puestoTrabajo: '', 
            perfilCatalogo: '', 
            objetoTecnico: '' 
          },
          parteObjeto: notice.parteObjeto || { 
            id: 0, 
            nombre: '', 
            sensor: {
              id: 0,
              nombre: ''
              }
          },
          textoBreve: notice.textoBreve || '',
          fechaInicio: notice.fechaInicio,
          fechaFin: notice.fechaFin,
          horaInicio: notice.horaInicio,
          horaFin: notice.horaFin,
          status: notice.estado === 'pendiente' ? 'Pendiente' : 'Enviado',
          imageUrl: "https://motos.espirituracer.com/archivos/2018/10/Yamaha-YZF-R1-6.png", // Imagen de ejemplo
          data_ai_hint: notice.parteObjeto?.sensor?.nombre || 'mantenimiento',
          reporterName: notice.reporterUser?.cedula || '',
          createdById: notice.masterUser?.username || notice.reporterUser?.cedula || '',
          noticeType: notice.tipoAviso ? {
            id: notice.tipoAviso.id,
            nombre: notice.tipoAviso.nombre,
            descripcion: notice.tipoAviso.descripcion
          } : undefined,
          inspeccion: notice.inspeccion ? {
            id: notice.inspeccion.id,
            catalogo: notice.inspeccion.catalogo,
            codigo: notice.inspeccion.codigo,
            descripcion: notice.inspeccion.descripcion,
            catalago2: notice.inspeccion.catalago2
          } : undefined,
          material: notice.material ? {
            id: notice.material.id,
            conjunto: notice.material.conjunto,
            description: notice.material.description
          } : undefined,
          items: notice.items || []
        }));

        // Verificar si hay nuevos avisos pendientes
        const newPendingCount = mappedNotices.filter(n => n.status === "Pendiente").length;
        
        if (showToastOnNewNotices && lastNoticeCount > 0 && newPendingCount > lastNoticeCount) {
          const newNoticesCount = newPendingCount - lastNoticeCount;
          toast({
            title: "Nuevos avisos de mantenimiento",
            description: `Se han recibido ${newNoticesCount} nuevo${newNoticesCount > 1 ? 's' : ''} aviso${newNoticesCount > 1 ? 's' : ''} pendiente${newNoticesCount > 1 ? 's' : ''}.`,
            variant: "default",
          });
        }
        
        setNotices(mappedNotices);
        setLastNoticeCount(newPendingCount);
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
    // Cargar datos inicialmente
    fetchNoticesData();

    // Configurar polling cada 30 segundos
    const interval = setInterval(() => {
      fetchNoticesData(true); // Mostrar toast si hay nuevos avisos
    }, 30000);

    // Limpiar el interval al desmontar el componente
    return () => clearInterval(interval);
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
        // Validate that noticesToSend is an array before mapping
        if (!Array.isArray(noticesToSend)) {
          throw new Error("Error interno: noticesToSend no es un array válido");
        }

        const avisoIds = noticesToSend.map(id => {
          const numericId = parseInt(id);
          if (isNaN(numericId)) {
            throw new Error(`ID de aviso inválido: ${id}`);
          }
          return numericId;
        });
        
        const result = await sendMaintenanceNoticesToSAP(avisoIds);
        
        if (!result.success) {
          throw new Error(result.message);
        }
        
        toast({
          title: "Avisos Enviados",
          description: result.message,
          variant: "default",
        });
        
        fetchNoticesData();
        setSelectedNotices([]);
      } catch (e) {
        console.error('Error in handleSendToSAP:', e);
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
      default:
        return "secondary";
    }
  };

  const openDetailDialog = (notice: MaintenanceNoticeAPI) => {
    setSelectedNoticeDetail(notice);
    setCurrentPositionIndex(0);
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

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'hh:mm:ss';
    // If it's already in HH:mm:ss format, return as is
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    // If it's a full datetime, extract the time part
    try {
      return format(new Date(timeString), 'HH:mm:ss', { locale: es });
    } catch {
      return 'Hora inválida';
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
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={isAllCurrentPageSelected || (isIndeterminateCurrentPage ? "indeterminate" : false)}
                            onCheckedChange={handleSelectAllForCurrentPage}
                            aria-label="Seleccionar todos los avisos en la página actual"
                            disabled={paginatedData.length === 0}
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[60px]">Imagen</TableHead>
                      <TableHead className="min-w-[200px]">Texto Breve</TableHead>
                      <TableHead className="hidden md:table-cell">Equipo</TableHead>
                      <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                      <TableHead className="w-[100px]">Estado</TableHead>
                      <TableHead className="hidden sm:table-cell w-[120px]">Fecha Inicio</TableHead>
                      <TableHead className="w-[50px] text-right">Detalles</TableHead>
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
                              width={50}
                              height={35}
                              className="rounded object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-[50px] h-[35px] bg-muted rounded flex items-center justify-center">
                              <ImageOff className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p id={`notice-title-${notice.id}`} className="font-medium truncate max-w-[200px]">{notice.textoBreve}</p>
                            <div className="flex items-center text-xs text-muted-foreground md:hidden">
                  
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center space-x-1">
                            <span className="truncate max-w-[150px]">{notice.equipo.numeroEquipo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center space-x-1">
                            <span className="truncate max-w-[150px]">{notice.equipo.ubicacionTecnica}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(notice.status)} className="shadow-sm whitespace-nowrap">
                            {notice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center space-x-1 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(notice.fechaInicio, 'dd/MM/yy')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDetailDialog(notice)}>
                            <Eye className="h-4 w-4" />
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
              <Button
                onClick={() => fetchNoticesData()}
                disabled={isLoadingNotices}
                variant="default"
                className="hover:bg-blue-500"
                aria-label="Actualizar avisos"
              >
                {isLoadingNotices ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Actualizar
              </Button>
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
          <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh]">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-xl font-bold text-primary">
                Aviso de Mantenimiento
                <Badge variant="secondary" className="ml-2 font-mono text-xs">
                  {selectedNoticeDetail.numeroExt || selectedNoticeDetail.id}
                </Badge>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 text-sm mt-2">
                <span className="bg-muted/50 px-2 py-1 rounded text-xs">
                  ID: <code className="font-mono">{selectedNoticeDetail.id}</code>
                </span>
                <span>
                  Estado: <Badge variant={getStatusBadgeVariant(selectedNoticeDetail.status)} className="text-xs">{selectedNoticeDetail.status}</Badge>
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">

                 {/* Imagen si está disponible */}
                 {selectedNoticeDetail.imageUrl && (
                  <div className="p-4 border">
                    <h3 className="font-bold text-lg mb-3 border-b pb-2">
                      Imagen adjunta
                    </h3>
                    <div className="relative w-full h-48 md:h-64 border">
                      <Image
                          src={selectedNoticeDetail.imageUrl}
                          alt={selectedNoticeDetail.textoBreve}
                          fill
                          style={{objectFit: "contain"}}
                          className="bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Objeto de referencia */}
                <div className="p-4 border">
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b-2 border-yellow-500">
                    Objeto de referencia
                  </h3>
                  <div className="border border-gray-300">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="w-32 p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Ubic. Técnica
                          </td>
                          <td colSpan={3} className="p-2 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.equipo.ubicacionTecnica || "Sin información"}
                          </td>
                          <td colSpan={3} className="p-2 border-l border-gray-300 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.equipo.numeroEquipo || "Sin información"}
                          </td> 
                        </tr>
                        <tr>
                          <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Equipo
                          </td>
                          <td colSpan={3} className="p-2 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.equipo.numeroEquipo || "Sin información"}
                          </td>
                          <td colSpan={3} className="p-2 border-l border-t border-gray-300 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.equipo.numeroEquipo || "Sin información"}
                          </td> 
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Circunstancias */}
                <div className="p-4 border">
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b-2 border-yellow-500">
                    Circunstancias
                  </h3>
                  <div className="border border-gray-300">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="w-32 p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Descripción
                          </td>
                          <td colSpan={3} className="p-2 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.tipoAviso.nombre || "Sin información"}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Texto Breve
                          </td>
                          <td colSpan={3} className="p-2 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.textoBreve || "Sin información"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Responsabilidades */}
                <div className="p-4 border">
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b-2 border-yellow-500">
                    Responsabilidades
                  </h3>
                  <div className="border border-gray-300">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="w-32 p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Grupo Planificador
                          </td>
                          <td colSpan={3} className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.equipo.perfilCatalogo || "Sin información"}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Pto. Trabajo
                          </td>
                          <td colSpan={3} className="p-2 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.equipo.puestoTrabajo || "Sin información"}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Autor del Aviso
                          </td>
                          <td colSpan={3} className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                            {selectedNoticeDetail.createdById || selectedNoticeDetail.reporterName || "Sin información"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Material */}
                {selectedNoticeDetail.material && (
                  <div className="p-4 border">
                    <h3 className="font-bold text-lg mb-3 pb-2 border-b-2 border-yellow-500">
                      Material
                    </h3>
                    <div className="border border-gray-300">
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="w-32 p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              Conjunto
                            </td>
                            <td className="p-2 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.material.conjunto || "Sin información"}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              Descripción
                            </td>
                            <td className="p-2 text-sm bg-white">
                              {selectedNoticeDetail.material.description || "Sin información"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Fechas extremas */}
                <div className="p-4 border">
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b-2 border-yellow-500">
                    Fechas extremas
                  </h3>
                  <div className="border border-gray-300">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="w-32 p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Inicio Deseado
                          </td>
                          <td className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                            {formatDate(selectedNoticeDetail.fechaInicio, 'dd.MM.yyyy')}
                          </td>
                          <td className="p-2 font-mono text-sm bg-white text-center">
                            {formatTime(selectedNoticeDetail.horaInicio)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                            Fin Deseado
                          </td>
                          <td className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                            {formatDate(selectedNoticeDetail.fechaFin, 'dd.MM.yyyy')}
                          </td>
                          <td className="p-2 font-mono text-sm bg-white text-center">
                            {formatTime(selectedNoticeDetail.horaFin)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Posición */}
                <div className="p-4 border">
                  <h3 className="font-bold text-lg mb-3 pb-2 border-b-2 border-yellow-500 flex items-center justify-between">
                    Posición
                    {selectedNoticeDetail.items && selectedNoticeDetail.items.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPositionIndex(Math.max(0, currentPositionIndex - 1))}
                          disabled={currentPositionIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm bg-muted px-2 py-1 rounded">
                          {currentPositionIndex + 1} de {selectedNoticeDetail.items.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPositionIndex(Math.min((selectedNoticeDetail.items?.length || 1) - 1, currentPositionIndex + 1))}
                          disabled={currentPositionIndex === (selectedNoticeDetail.items?.length || 1) - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </h3>
                  
                  {selectedNoticeDetail.items && selectedNoticeDetail.items.length > 0 ? (
                    (() => {
                      const currentItem = selectedNoticeDetail.items[currentPositionIndex];
                      return (
                        <div className="space-y-4">
                          {/* Texto Largo de la Posición */}
                          {currentItem.longTexts && currentItem.longTexts.length > 0 && (
                            <div className="border border-gray-300 rounded">
                              <div className="bg-gray-100 p-2 border-b border-gray-300">
                                <span className="font-medium text-sm">Texto Largo</span>
                              </div>
                              {currentItem.longTexts.map((longText, index) => (
                                <div key={longText.id} className="p-3 border-b border-gray-200 last:border-b-0">
                                  <div className="flex items-center space-x-2 mb-2">
                                   
                                  </div>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {longText.textLine}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inspecciones */}
                          {currentItem.inspecciones && currentItem.inspecciones.length > 0 && (
                            <div className="border border-gray-300 rounded">
                              <div className="bg-gray-100 p-2 border-b border-gray-300">
                                <span className="font-medium text-sm">Inspecciones</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-300 bg-gray-50">
                                      <th className="p-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300">
                                        Código Grupo
                                      </th>
                                      <th className="p-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300">
                                        Catálogo
                                      </th>
                                      <th className="p-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300">
                                        Código
                                      </th>
                                      <th className="p-2 text-left text-xs font-medium text-gray-600">
                                        Descripción
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentItem.inspecciones.map((inspeccion, index) => (
                                      <tr key={inspeccion.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                        <td className="p-2 font-mono text-sm border-r border-gray-200">
                                          {inspeccion.codigoGrupo}
                                        </td>
                                        <td className="p-2 font-mono text-sm border-r border-gray-200 text-center">
                                          {inspeccion.catalogo}
                                        </td>
                                        <td className="p-2 font-mono text-sm border-r border-gray-200 text-center">
                                          {inspeccion.codigo}
                                        </td>
                                        <td className="p-2 text-sm">
                                          {inspeccion.descripcion}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Información adicional del item */}
                          {currentItem.SUBCO && (
                            <div className="border border-gray-300 rounded">
                              <div className="bg-gray-100 p-2 border-b border-gray-300">
                                <span className="font-medium text-sm">SUBCO</span>
                              </div>
                              <div className="p-3">
                                <span className="font-mono text-sm">{currentItem.SUBCO}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="border border-gray-300">
                      <table className="w-full">
                        <tbody>
                          {/* Parte objeto */}
                          <tr className="border-b border-gray-300">
                            <td className="w-32 p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              Parte objeto
                            </td>
                            <td className="w-24 p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.equipo.objetoTecnico || "Sin información"}
                            </td>
                            <td className="w-24 p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.parteObjeto.sensor?.nombre || "Sin información"}
                            </td>
                           
                          </tr>

                          {/* Sínt.avería */}
                          <tr className="border-b border-gray-300">
                            <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              Sínt.avería
                            </td>
                            <td className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.parteObjeto.sensor?.nombre || "Sin información"}
                            </td>
                            <td className="w-24 p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.parteObjeto.sensor?.nombre || "Sin información"}
                            </td>
                          </tr>

                          {/* Texto */}
                          <tr className="border-b border-gray-300">
                            <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              texto
                            </td>
                            <td colSpan={3} className="w-24 p-2 font-mono text-sm bg-gray-50 text-center">
                              {selectedNoticeDetail.parteObjeto.nombre || "Sin información"}
                            </td>
                          </tr>

                          {/* Causa */}
                          <tr className="border-b border-gray-300">
                            <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              Causa
                            </td>
                            <td className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.parteObjeto.sensor?.nombre || "Sin información"}
                            </td>
                            <td className="p-2 border-r border-gray-300 font-mono text-sm bg-white text-center">
                              {selectedNoticeDetail.parteObjeto.sensor?.nombre || "Sin información"}
                            </td>
                            
                          </tr>

                          {/* Texto causa */}
                          <tr>
                            <td className="p-2 bg-gray-100 border-r border-gray-300 font-medium text-sm">
                              Texto causa
                            </td>
                            <td colSpan={3} className="p-2 font-mono text-sm bg-gray-50 border-gray-400 text-center">
                              {selectedNoticeDetail.parteObjeto.sensor?.nombre || "Sin información"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

               

              </div>
            </ScrollArea>
            
           
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

