"use server";

import { redirect } from 'next/navigation'
import { Polar } from "@polar-sh/sdk";
import { handleError } from '../utils';
import { connectToDatabase } from '../database/mongoose';
import Transaction from '../database/models/transaction.model';
import { updateCredits } from '../actions/user.actions';

// Initialize Polar client
const polarEnv = process.env.NEXT_PUBLIC_POLAR_ENV === "production" ? "production" : "sandbox";
console.log(`[Polar] Using environment: ${polarEnv}`);

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: polarEnv,
});

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  try {
    // First, you'll need to create products in Polar dashboard and get their IDs
    // Map your plans to Polar product IDs
    const productIdMap: Record<string, string> = {
      "Pro Package": process.env.POLAR_PRO_PRODUCT_ID!,
      "Premium Package": process.env.POLAR_PREMIUM_PRODUCT_ID!,
    };

    const productId = productIdMap[transaction.plan];
    
    if (!productId) {
      throw new Error(`No product ID found for plan: ${transaction.plan}`);
    }

    // Create checkout session
    const checkoutSession = await polar.checkouts.create({
      //productPriceId: productId,
      products: [productId],
      successUrl: `${process.env.NEXT_PUBLIC_WEB_URL}/profile`,
      customerEmail: transaction.buyerEmail, // You'll need to pass this
      metadata: {
        plan: transaction.plan,
        credits: transaction.credits.toString(),
        buyerId: transaction.buyerId,
      },
      // Optional: Set customer ID for easier reconciliation
      //customerSessionId: transaction.buyerId,
    });

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL');
    }

    redirect(checkoutSession.url);
  } catch (error) {
    handleError(error);
  }
}

export async function createTransaction(transaction: CreateTransactionParams) {
  try {
    await connectToDatabase();

    // Check if transaction already exists for this polarId
    const existing = await Transaction.findOne({ polarId: transaction.polarId });
    if (existing) {
      console.log(`[Transaction] Duplicate ignored. polarId=${transaction.polarId}`);
      return existing; // just return the existing record
    }

    // Create a new transaction
    const newTransaction = await Transaction.create({
      ...transaction,
      buyer: transaction.buyerId,
    });

    // Update buyer's credits
    await updateCredits(transaction.buyerId, transaction.credits);

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    handleError(error);
  }
}
