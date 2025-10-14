import { date, email, z } from 'zod';

export const signupValidation = z
  .strictObject({
    userName: z.string().min(2),
    email: z.email(),
    password: z
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
    confirmPassword: z
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/),
  })
  .refine(
    (date) => {
      return date.password == date.confirmPassword;
    },
    {
      error: 'Password mismatch with confirmPassword',
      path: ['confirmPassword'],
    },
  );
