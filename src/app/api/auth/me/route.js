import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const userType = cookieStore.get("user_role")?.value; // 'admin' أو 'client'
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    role: userType,
    id: userId
  });
}