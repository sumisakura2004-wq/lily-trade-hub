import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/locales";

export const dynamic = "force-static";

export function GET() {
  redirect(`/${defaultLocale}`);
}
