import { cookies } from "next/headers";

type CookieOptions = {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
};

export async function applySetCookies(headers: Headers) {
  const cookieStore = await cookies();
  const setCookies = headers.getSetCookie();
  for (const header of setCookies) {
    const [pair, ...parts] = header.split(";");
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();

    const options: CookieOptions = {};
    for (const part of parts) {
      const [k, ...v] = part.trim().split("=");
      const key = k.trim().toLowerCase();
      const val = v.join("=").trim();
      if (key === "max-age") options.maxAge = parseInt(val, 10);
      else if (key === "expires") options.expires = new Date(val);
      else if (key === "httponly") options.httpOnly = true;
      else if (key === "secure") options.secure = true;
      else if (key === "samesite") options.sameSite = val as CookieOptions["sameSite"];
      else if (key === "path") options.path = val;
    }

    cookieStore.set(name, value, options);
  }
}
