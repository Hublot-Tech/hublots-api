// src/utils/otp-generator.ts

import { randomBytes } from "crypto";

/**
 * Generates a numeric OTP of the specified length.
 * @param length - The length of the OTP.
 * @returns A string representing the generated OTP.
 */
export function generateOtp(length: number): string {
  const otp = randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length)
    .split("")
    .map((char) => parseInt(char, 16))
    .join("")
    .slice(0, length);

  return otp;
}
