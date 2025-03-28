import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe/stripe";
import {
  manageSubscriptionStatusChange,
  upsertPaymentIntentRecord,
} from "@/lib/stripe/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "node:stream";
import Stripe from "stripe";
import { createOrRetrieveCustomer } from "./checkout";

// Stripe requires the raw body to construct the event.
export var config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: Readable) {
  var chunks = [];
  for await (var chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

var relevantEvents = new Set([
  // "product.created",
  // "product.updated",
  // "price.created",
  // "price.updated",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

var webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    var buf = await buffer(req);
    var sig = req.headers["stripe-signature"];
    var webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      if (!sig || !webhookSecret) return;
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
      console.log(`❌ Error message: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          // case "product.created":
          // case "product.updated":
          //   await upsertProductRecord(event.data.object as Stripe.Product);
          //   break;
          // case "price.created":
          // case "price.updated":
          //   await upsertPriceRecord(event.data.object as Stripe.Price);
          //   break;
          case "customer.subscription.created":
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            var subscription = event.data.object as Stripe.Subscription;
            await manageSubscriptionStatusChange(
              subscription.id,
              subscription.customer as string,
              event.type === "customer.subscription.created"
            );
            break;
          case "checkout.session.completed":
            var checkoutSession = event.data
              .object as Stripe.Checkout.Session;

            if (checkoutSession.mode === "subscription") {
              var user = await prisma.user.update({
                where: {
                  id: checkoutSession.client_reference_id as string,
                },
                data: {
                  stripe_customer_id: checkoutSession.customer as string,
                },
              });
              var subscriptionId = checkoutSession.subscription;
              await manageSubscriptionStatusChange(
                subscriptionId as string,
                user?.stripe_customer_id as string,
                true
              );
            } else if (checkoutSession.mode === "payment") {
              var customerId = await createOrRetrieveCustomer({
                uuid: checkoutSession.client_reference_id as string,
                email: checkoutSession.customer_email as string,
              });
              var paymentIntentId = checkoutSession.payment_intent;
              console.log(checkoutSession);
              await upsertPaymentIntentRecord(
                paymentIntentId as string,
                customerId as string
              );
            }
            break;
          default:
            throw new Error("Unhandled relevant event!");
        }
      } catch (error) {
        console.log(error);
        return res
          .status(400)
          .send('Webhook error: "Webhook handler failed. View logs."');
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default webhookHandler;
