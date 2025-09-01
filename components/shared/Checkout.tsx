"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { checkoutCredits } from "@/lib/actions/transaction.action";
import { Button } from "../ui/button";

const Checkout = ({
  plan,
  amount,
  credits,
  buyerId,
  buyerEmail, // You'll need to pass the buyer's email
}: {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
  buyerEmail: string;
}) => {
  const { toast } = useToast();

  useEffect(() => {
    // Check for success/cancel parameters from Polar redirect
    const query = new URLSearchParams(window.location.search);
    
    if (query.get("success") === "true" || query.get("checkout_success") === "true") {
      toast({
        title: "Order placed!",
        description: "You will receive an email confirmation",
        duration: 5000,
        className: "success-toast",
      });
    }

    if (query.get("canceled") === "true" || query.get("checkout_canceled") === "true") {
      toast({
        title: "Order canceled!",
        description: "Continue to shop around and checkout when you're ready",
        duration: 5000,
        className: "error-toast",
      });
    }
  }, [toast]);

  const onCheckout = async () => {
    const transaction = {
      plan,
      amount,
      credits,
      buyerId,
      buyerEmail,
    };

    await checkoutCredits(transaction);
  };

  return (
    <form action={onCheckout}>
      <section>
        <Button
          type="submit"
          role="link"
          className="w-full rounded-full bg-purple-gradient bg-cover"
        >
          Buy Credit
        </Button>
      </section>
    </form>
  );
};

export default Checkout;