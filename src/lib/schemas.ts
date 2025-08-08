
import { z } from "zod";

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
  city: z.string({ required_error: "La ciudad es obligatoria." }).min(1, "La ciudad es obligatoria."),
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
  termsAccepted: z.boolean().refine((data) => data === true, {
    message: "Debes aceptar los términos y condiciones para continuar.",
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

const GuarantorSchema = z.object({
  name: z.string().min(3, "El nombre del fiador es obligatorio."),
  idNumber: z.string().min(6, "La cédula del fiador es obligatoria."),
  address: z.string().min(5, "La dirección del fiador es obligatoria."),
  phone: z.string().min(10, "El teléfono del fiador debe tener 10 dígitos."),
});

const ReferencesSchema = z.object({
  familiar: z.object({
    name: z.string().min(3, "El nombre de la referencia familiar es obligatorio."),
    phone: z.string().min(10, "El teléfono de la referencia familiar debe tener 10 dígitos."),
    address: z.string().min(5, "La dirección de la referencia familiar es obligatoria."),
  }),
  personal: z.object({
    name: z.string().min(3, "El nombre de la referencia personal es obligatorio."),
    phone: z.string().min(10, "El teléfono de la referencia personal debe tener 10 dígitos."),
    address: z.string().min(5, "La dirección de la referencia personal es obligatoria."),
  })
});

export const ClientCreditSchema = z.object({
  idNumber: z.string().min(6, "La cédula debe tener al menos 6 caracteres."),
  firstName: z.string().min(3, "El primer nombre es obligatorio."),
  secondName: z.string().optional(),
  firstLastName: z.string().min(3, "El primer apellido es obligatorio."),
  secondLastName: z.string().optional(),
  address: z.string().min(5, "La dirección es obligatoria."),
  contactPhone: z.string().min(10, "El teléfono debe tener 10 dígitos."),
  
  creditAmount: z.string().min(1, "El valor del crédito es obligatorio."),
  installments: z.string().min(1, "El número de cuotas es obligatorio."),

  requiresGuarantor: z.boolean().default(false),
  guarantor: GuarantorSchema.optional(),

  requiresReferences: z.boolean().default(false),
  references: ReferencesSchema.optional(),

}).superRefine((data, ctx) => {
    if (data.requiresGuarantor && !data.guarantor) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Los datos del fiador son requeridos.", path: ['guarantor.name']});
    }
    if (data.requiresReferences && !data.references) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Los datos de las referencias son requeridos.", path: ['references.familiar.name']});
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

export const EditProviderSchema = z.object({
  originalIdNumber: z.string(),
  companyName: z.string().min(3, { message: "El nombre de la empresa debe tener al menos 3 caracteres." }),
  idNumber: z.string().min(6, { message: "El número de identificación debe tener al menos 6 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce una dirección de correo electrónico válida." }),
  whatsappNumber: z.string().min(10, { message: "El número de WhatsApp debe tener al menos 10 dígitos." }),
  password: z.string().min(6, { message: "La nueva contraseña debe tener al menos 6 caracteres." }).optional().or(z.literal('')),
});


export const EditClientSchema = z.object({
  originalIdNumber: z.string(),
  idNumber: z.string().min(6, { message: "La cédula debe tener al menos 6 caracteres." }),
  name: z.string().min(3, { message: "El nombre completo es obligatorio." }),
  address: z.string().min(5, { message: "La dirección es obligatoria." }),
  contactPhone: z.string().min(10, { message: "El teléfono debe tener 10 dígitos." }),
});

export const SavePaymentScheduleSchema = z.object({
  creditId: z.string().min(1, "El ID del crédito es obligatorio."),
  paymentDates: z.array(z.string()).min(1, "Se requiere al menos una fecha de pago."),
});

export const RenewCreditSchema = z.object({
  clienteId: z.string().min(1, "La identificación del cliente es obligatoria."),
  oldCreditId: z.string().min(1, "El ID del crédito anterior es obligatorio."),
  additionalAmount: z.string().min(1, "El valor adicional es obligatorio."),
  installments: z.string().min(1, "El número de cuotas es obligatorio."),
});

export const NewCreditSchema = z.object({
  clienteId: z.string().min(1, "La identificación del cliente es obligatoria."),
  creditAmount: z.string().min(1, "El valor del crédito es obligatorio."),
  installments: z.string().min(1, "El número de cuotas es obligatorio."),
});
