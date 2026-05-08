import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Phase 1: shell handler. Phase 4 will exercise it for the magic-link bulk import flow.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}
