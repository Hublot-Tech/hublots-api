import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashSync(password: string, saltBase: number) {
  const salt = randomBytes(saltBase).toString("hex");
  const hashedPassword = scryptSync(password, salt, 64).toString("hex");
  return `${salt}.${hashedPassword}`;
}

export function compareSync(password: string, storedPassword: string) {
  const [salt, hashedPassword] = storedPassword.split(".");
  const hashedBuffer = Buffer.from(
    scryptSync(password, salt, 64).toString("hex"),
  );
  const storedBuffer = Buffer.from(hashedPassword);
  return timingSafeEqual(hashedBuffer, storedBuffer);
}
