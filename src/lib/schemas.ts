

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
  name: z.string().min(1, "El nombre del fiador es obligatorio.").or(z.literal('')),
  idNumber: z.string().min(1, "La cédula del fiador es obligatoria.").or(z.literal('')),
  address: z.string().min(1, "La dirección del fiador es obligatoria.").or(z.literal('')),
  phone: z.string().min(1, "El teléfono del fiador es obligatorio.").or(z.literal('')),
});

const ReferencesSchema = z.object({
  familiar: z.object({
    name: z.string().min(1, "El nombre de la referencia familiar es obligatorio.").or(z.literal('')),
    phone: z.string().min(1, "El teléfono es obligatorio.").or(z.literal('')),
    address: z.string().min(1, "La dirección es obligatoria.").or(z.literal('')),
  }),
  personal: z.object({
    name: z.string().min(1, "El nombre de la referencia personal es obligatorio.").or(z.literal('')),
    phone: z.string().min(1, "El teléfono es obligatorio.").or(z.literal('')),
    address: z.string().min(1, "La dirección es obligatoria.").or(z.literal('')),
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
})
.refine(data => {
    if (data.requiresGuarantor) {
        return (
            data.guarantor && 
            data.guarantor.name && data.guarantor.name.length > 0 &&
            data.guarantor.idNumber && data.guarantor.idNumber.length > 0 &&
            data.guarantor.address && data.guarantor.address.length > 0 &&
            data.guarantor.phone && data.guarantor.phone.length > 0
        );
    }
    return true;
}, {
    message: "Todos los campos del fiador son requeridos cuando la opción está activada.",
    path: ['guarantor.name'] // Path to a specific field to show the error
})
.refine(data => {
    if (data.requiresReferences) {
        return (
            data.references &&
            data.references.familiar.name && data.references.familiar.name.length > 0 &&
            data.references.familiar.phone && data.references.familiar.phone.length > 0 &&
            data.references.familiar.address && data.references.familiar.address.length > 0 &&
            data.references.personal.name && data.references.personal.name.length > 0 &&
            data.references.personal.phone && data.references.personal.phone.length > 0 &&
            data.references.personal.address && data.references.personal.address.length > 0
        );
    }
    return true;
}, {
    message: "Todos los campos de ambas referencias son requeridos cuando la opción está activada.",
    path: ['references.familiar.name'] // Path to a specific field to show the error
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
