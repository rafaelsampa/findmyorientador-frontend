import { z } from "zod";

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Informe seu nome completo").max(120),
    email: z.string().trim().email("E-mail inválido").max(255),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").max(72),
    confirmPassword: z.string(),
    role: z.enum(["aluno", "orientador"], {
      errorMap: () => ({ message: "Selecione um perfil" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe sua senha").max(72),
});

export type SignInInput = z.infer<typeof signInSchema>;
