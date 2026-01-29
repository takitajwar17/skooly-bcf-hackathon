import { NextResponse } from "next/server";
import { connect } from "@/lib/mongodb/mongoose";

export async function GET() {
  try {
    await connect();
    return NextResponse.json(
      { status: "ok", database: "connected", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", database: "disconnected", error: error.message },
      { status: 500 }
    );
  }
}
