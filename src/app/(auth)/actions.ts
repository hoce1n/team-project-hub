"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { applySetCookies } from "@/lib/cookies";

type ActionState = { error?: string } | undefined;

export async function signUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const headerStore = await headers();
  try {
    const { headers: cookieHeaders } = await auth.api.signUpEmail({
      headers: headerStore,
      body: { name, email, password },
      returnHeaders: true,
    });
    await applySetCookies(cookieHeaders);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign up failed." };
  }

  redirect("/dashboard");
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const headerStore = await headers();
  try {
    const { headers: cookieHeaders } = await auth.api.signInEmail({
      headers: headerStore,
      body: { email, password },
      returnHeaders: true,
    });
    await applySetCookies(cookieHeaders);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign in failed." };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const headerStore = await headers();
  const { headers: cookieHeaders } = await auth.api.signOut({
    headers: headerStore,
    returnHeaders: true,
  });
  await applySetCookies(cookieHeaders);
  redirect("/login");
}

async function signInWithProvider(provider: "github" | "google") {
  const headerStore = await headers();
  let url: string | undefined;
  try {
    const { headers: cookieHeaders, response } = await auth.api.signInSocial({
      headers: headerStore,
      body: { provider, callbackURL: "/dashboard" },
      returnHeaders: true,
    });
    await applySetCookies(cookieHeaders);
    url = response?.url;
  } catch {
    // fall through to dashboard; errors surface in the OAuth flow
  }
  redirect(url ?? "/dashboard");
}

export async function signInWithGithub() {
  await signInWithProvider("github");
}

export async function signInWithGoogle() {
  await signInWithProvider("google");
}
