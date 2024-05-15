import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  // TODO: remove this test code
  const user = await kv.hgetall("user:me");
  return NextResponse.json(user);
}

export async function POST(req: Request) {
  // TODO: remove this test code
  const user = await req.json();
  console.log(user);
  await kv.hset("user:me", user);
  return NextResponse.json({ success: true });
}
