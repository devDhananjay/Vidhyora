import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/actions/orders/verify-payment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await verifyPayment(body);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Payment verification API error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 },
    );
  }
}
