"use server";

import { signOut } from "@/lib/auth";
import { actionSuccess, type ActionResult } from "@/lib/utils";

export async function logoutAction(): Promise<
  ActionResult<{ success: boolean }>
> {
  await signOut({ redirect: false });
  return actionSuccess({ success: true });
}
