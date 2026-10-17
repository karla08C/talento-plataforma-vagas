import { z } from "zod";

// Brazilian & international phone regex: allows formats like (11) 98888-7777, 11988887777, +55 11 98888-7777
export const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{2,3}\)?[-.\s]?)?\d{4,5}[-.\s]?\d{4}$/;

export const candidateApplicationSchema = z.object({
  name: z
    .string({ required_error: "O nome completo é obrigatório." })
    .trim()
    .min(3, "O nome deve conter pelo menos 3 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres.")
    .refine((val) => val.split(" ").filter(Boolean).length >= 2, {
      message: "Por favor, informe seu nome e sobrenome completo.",
    }),
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .trim()
    .email("Informe um endereço de e-mail válido (ex: seu.nome@email.com).")
    .max(255, "O e-mail deve ter no máximo 255 caracteres."),
  phone: z
    .string({ required_error: "O telefone de contato é obrigatório." })
    .trim()
    .min(8, "Telefone muito curto. Informe ao menos o DDD e número.")
    .max(30, "Telefone muito longo.")
    .regex(phoneRegex, "Informe um formato válido de telefone, por exemplo (11) 98765-4321."),
  professionalSummary: z
    .string({ required_error: "O resumo profissional é obrigatório." })
    .trim()
    .min(
      20,
      "O resumo profissional deve ter no mínimo 20 caracteres para descrever sua trajetória.",
    )
    .max(2000, "O resumo profissional deve ter no máximo 2000 caracteres."),
});

export type CandidateApplicationFormValues = z.infer<typeof candidateApplicationSchema>;
