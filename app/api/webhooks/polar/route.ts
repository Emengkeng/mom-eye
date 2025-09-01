/* eslint-disable camelcase */
import { createTransaction } from "@/lib/actions/transaction.action";
import { verifyPolarWebhook, PolarWebhookEvent } from "@/lib/polar-webhook";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request?.text();
        const signature = request.headers
        const endpointSecret = process.env.POLAR_WEBHOOK_SECRET!;

        console.log("[Polar Webhook] Received body:", body);
        console.log("[Polar Webhook] Signature:", signature);

        // Verify the webhook signature
        if (process.env.NEXT_PUBLIC_POLAR_ENV === "production") {
            if (!verifyPolarWebhook(body, signature, endpointSecret)) {
            console.warn("[Polar Webhook] Invalid signature");
            return NextResponse.json(
                { message: "Invalid webhook signature" }, 
                { status: 401 }
            );
            }
        }

        const event: PolarWebhookEvent = JSON.parse(body);
        const eventType = event.type;

        console.log("[Polar Webhook] Event type:", eventType);

        // Handle ONLY paid orders (guaranteed payment)
        if (eventType === "order.paid") {
            const { id, amount, metadata, customer } = event.data;

            console.log("[Polar Webhook] Order paid:", { id, amount, metadata, customer });

            // Extract metadata that was set during checkout creation
            const transaction = {
                polarId: id,
                amount: amount ? amount / 100 : 0, // Use total_amount for final amount
                plan: metadata?.plan || "",
                credits: Number(metadata?.credits) || 0,
                buyerId: metadata?.buyerId || "",
                createdAt: new Date(),
            };

            console.log("[Polar Webhook] Creating transaction:", transaction);

            const newTransaction = await createTransaction(transaction);

            console.log("[Polar Webhook] Transaction created:", newTransaction);
            
            return NextResponse.json({ 
                message: "OK", 
                transaction: newTransaction 
            });
        }

        // Log other events but don't process them
        if (eventType === "checkout.created") {
            console.log("[Polar Webhook] Checkout created (not processing):", event.data.id);
            return NextResponse.json({ message: "Checkout logged, waiting for payment" });
        }

        if (eventType === "order.created") {
            console.log("[Polar Webhook] Order created (not processing):", event.data.id);
            return NextResponse.json({ message: "Order created, waiting for payment" });
        }

        // Handle subscription events (plan to add subscriptions later)
        if (eventType === "subscription.created") {
            console.log("[Polar Webhook] Subscription created:", event.data);
            return NextResponse.json({ message: "Subscription event received" });
        }

        if (eventType === "subscription.updated") {
            console.log("[Polar Webhook] Subscription updated:", event.data);
            return NextResponse.json({ message: "Subscription event received" });
        }

        console.log("[Polar Webhook] Event processed:", eventType);
        return NextResponse.json({ message: "Event received" }, { status: 200 });
        
    } catch (error) {
        console.error("[Polar Webhook] Webhook error:", error);
        return NextResponse.json(
            { message: "Webhook error", error: error }, 
            { status: 400 }
        );
    }
}