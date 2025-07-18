import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Por favor, introduce una dirección de correo electrónico válida.",
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
  path: ["confirmPassword"], // Sets the error on the confirmPassword field
});
