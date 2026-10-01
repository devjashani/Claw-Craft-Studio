import { z } from "zod";

export const checkoutFormSchema = z.object({
  name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  email: z.string().email("Please provide a valid email address"),
  phone: z
    .string()
    .regex(
      /^(?:\+91|91)?[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number"
    ),
  addressLine1: z
    .string()
    .min(5, "Address must be at least 5 characters (Flat/House/Street)")
    .max(200, "Address is too long"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City name is required").max(60),
  state: z.string().min(2, "State name is required").max(60),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "PIN code must be a valid 6-digit Indian postal code"),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  couponCode: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
