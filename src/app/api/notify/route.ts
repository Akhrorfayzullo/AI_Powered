import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: implement notification delivery (email / in-app)
  return NextResponse.json({ message: "notify endpoint placeholder" }, { status: 200 });
}
