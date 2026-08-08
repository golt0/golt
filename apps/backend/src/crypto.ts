import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(process.env.CONNECTION_ENCRYPTION_KEY!, "hex");

export function encrypt(text: string) : string{
    //iv = initialization vector
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv(ALGO, KEY , iv);
const enc = Buffer.concat([cipher.update(text, "utf-8") , cipher.final()]);
const tag = cipher.getAuthTag();
return Buffer.concat([iv , tag , enc]).toString("base64");
}

export function decrypt(payload : string) : string {
    const buf = Buffer.from(payload , "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv(ALGO ,KEY , iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf-8")
}

