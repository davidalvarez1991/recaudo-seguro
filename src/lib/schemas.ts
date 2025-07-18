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
  address: z.string().min(5, "La dirección es obligatoria."),
  contactPhone: z.string().min(10, "El teléfono debe tener 10 dígitos."),
  guarantorPhone: z.string().min(10, "El teléfono del fiador debe tener 10 dígitos."),
  idCardPhoto: z.any().refine(files => files?.length > 0, "La foto de la cédula es obligatoria.").optional(), // Made optional for now
  creditAmount: z.coerce.number().min(1, "El valor del crédito es obligatorio."),
  installments: z.coerce.number().min(1, "El número de cuotas es obligatorio."),
});

    