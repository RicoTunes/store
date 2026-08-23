import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  email: z.string().trim().email('Enter a valid email address'),
  message: z.string().trim().min(12, 'Tell us a bit more (at least 12 characters)'),
});

export type ContactValues = z.infer<typeof contactSchema>;
