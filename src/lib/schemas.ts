
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format

export const CreateMaintenanceNoticeSchema = z.object({
  equipmentNumber: z.string().optional(),
  functionalLocation: z.string().optional(),
  assembly: z.string().optional(),
  shortText: z.string().min(1, "Short text is required"),
  priority: z.string().optional(), // Consider enum if specific values
  requiredStartDate: z.string().regex(dateRegex, "Invalid required start date format (YYYY-MM-DD)").optional(),
  requiredStartTime: z.string().regex(timeRegex, "Invalid required start time format (HH:MM)").optional(),
  requiredEndDate: z.string().regex(dateRegex, "Invalid required end date format (YYYY-MM-DD)").optional(),
  requiredEndTime: z.string().regex(timeRegex, "Invalid required end time format (HH:MM)").optional(),
  workCenterObjectId: z.string().optional(),
  malfunctionEndDate: z.string().regex(dateRegex, "Invalid malfunction end date format (YYYY-MM-DD)").optional(),
  malfunctionEndTime: z.string().regex(timeRegex, "Invalid malfunction end time format (HH:MM)").optional(),
  reporterName: z.string().optional(),
  startPoint: z.string().optional(),
  endPoint: z.string().optional(),
  length: z.number().positive("Length must be a positive number").optional(),
  linearUnit: z.string().optional(),
  problemCodeGroup: z.string().optional(),
  problemCode: z.string().optional(),
  objectPartCodeGroup: z.string().optional(),
  objectPartCode: z.string().optional(),
  causeText: z.string().optional(),
});
export type CreateMaintenanceNoticeInput = z.infer<typeof CreateMaintenanceNoticeSchema>;

export const UpdateMaintenanceNoticeSchema = CreateMaintenanceNoticeSchema.partial().extend({
  // shortText could be required if updates always need it, but typically partial updates allow omitting fields.
  // If status can be updated by mobile, add:
  // status: z.enum(["Pending", "Sent", "Failed"]).optional(), 
});
export type UpdateMaintenanceNoticeInput = z.infer<typeof UpdateMaintenanceNoticeSchema>;
