
import { z } from 'zod';

// ISO 8601 date string regex (simplified: basic structure)
const isoDateTimeString = z.string().datetime({ offset: true, message: "Debe ser una fecha y hora ISO 8601 válida (ej: 2024-01-15T08:00:00.000Z)" });

export const CreateMaintenanceNoticeSchema = z.object({
  tipoAvisoId: z.number({ required_error: "tipoAvisoId es requerido." }),
  equipoId: z.number({ required_error: "equipoId es requerido." }),
  ubicacionTecnicaId: z.number({ required_error: "ubicacionTecnicaId es requerido." }),
  textoBreve: z.string().min(1, "textoBreve es requerido."),
  fechaInicio: isoDateTimeString,
  fechaFin: isoDateTimeString,
  horaInicio: isoDateTimeString, // Following user spec, even if redundant with fechaInicio if it's full datetime
  horaFin: isoDateTimeString,    // Following user spec
  puestoTrabajoId: z.number().optional(),
  parteObjetoId: z.number().optional(),
  createdById: z.number().optional(),
  imageUrl: z.string().url("Debe ser una URL válida para la imagen.").optional(), // Added for potential direct image URL input
  data_ai_hint: z.string().optional(), // Added for potential direct image URL input
});

export type CreateMaintenanceNoticeInput = z.infer<typeof CreateMaintenanceNoticeSchema>;

export const UpdateMaintenanceNoticeSchema = CreateMaintenanceNoticeSchema.partial().extend({
  // Fields that might not be updatable or have specific update logic can be refined here.
  // For now, allowing partial updates of all fields from create schema.
});

export type UpdateMaintenanceNoticeInput = z.infer<typeof UpdateMaintenanceNoticeSchema>;
