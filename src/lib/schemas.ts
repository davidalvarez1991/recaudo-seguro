
import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "video/mp4", "video/quicktime"];

export const LoginSchema = z.object({
  idNumber: z.string().min(1, {
    message: "El número de cédula es obligatorio.",
  }),
  password: z.string().min(1, {
    message: "La contraseña es obligatoria.",
  }),
});

export const RegisterSchema = z.object({
  companyName: z.string().min(3, { message: "El nombre de la empresa debe tener al menos 3 caracteres."}).optional(),
  idNumber: z.string().min(6, {
    message: "El número de identificación debe tener al menos 6 caracteres.",
  }),
  whatsappNumber: z.string().min(10, {
    message: "El número de WhatsApp debe tener al menos 10 dígitos.",
  }),
  email: z.string().email({
    message: "Por favor, introduce una dirección de correo electrónico válida.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
  confirmPassword: z.string().min(6, {
    message: "La confirmación de contraseña debe tener al menos 6 caracteres.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden.",
  path: ["confirmPassword"],
});


export const CobradorRegisterSchema = z.object({
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres."
  }),
  idNumber: z.string().min(6, {
    message: "El número de identificación debe tener al menos 6 caracteres.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
});


export const ClientCreditSchema = z.object({
  idNumber: z.string().min(6, "La cédula debe tener al menos 6 caracteres."),
  name: z.string().min(3, "El nombre completo es obligatorio."),
  address: z.string().min(5, "La dirección es obligatoria."),
  contactPhone: z.string().min(10, "El teléfono debe tener 10 dígitos."),
  requiresGuarantor: z.boolean().default(true),
  guarantorName: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorAddress: z.string().optional(),
  creditAmount: z.string().min(1, "El valor del crédito es obligatorio."),
  installments: z.string().min(1, "El número de cuotas es obligatorio."),
  documents: z
    .array(z.instanceof(File))
    .max(3, 'No se pueden subir más de 3 archivos.')
    .optional()
    .refine((files) => !files || files.every((file) => file.size <= MAX_FILE_SIZE), 'El tamaño máximo por archivo es 50MB.')
    .refine((files) => !files || files.every((file) => ALLOWED_FILE_TYPES.includes(file.type)), 'Tipo de archivo no permitido.'),
  signature: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.requiresGuarantor) {
        if (!data.guarantorName || data.guarantorName.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El nombre del fiador es obligatorio.", path: ['guarantorName']});
        }
        if (!data.guarantorPhone || data.guarantorPhone.length < 10) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El teléfono del fiador debe tener 10 dígitos.", path: ['guarantorPhone']});
        }
        if (!data.guarantorAddress || data.guarantorAddress.length < 5) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La dirección del fiador es obligatoria.", path: ['guarantorAddress']});
        }
    }
});

export const EditCobradorSchema = z.object({
  originalIdNumber: z.string(),
  idNumber: z.string().min(6, {
    message: "El número de identificación debe tener al menos 6 caracteres.",
  }),
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
  }),
  password: z.string().min(6, {
    message: "La nueva contraseña debe tener al menos 6 caracteres.",
  }).optional().or(z.literal('')),
});
