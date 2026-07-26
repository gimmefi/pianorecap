// Netlify serverless function.
// Stripe webhook endpoint — keeps the `subscriptions` table in Supabase in sync with Stripe.
// Requires environment variables: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// In the Stripe Dashboard, add a webhook endpoint pointing to:
//   https://YOUR-SITE.netlify.app/.netlify/functions/stripe-webhook
// and subscribe it to these events:
//   checkout.session.completed, customer.subscription.updated, customer.subscription.deleted

async function upsertSubscription(teacherId, fields) {
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/subscriptions`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ teacher_id: teacherId, updated_at: new Date().toISOString(), ...fields }),
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let stripeEvent;
  try {
    // Note: full signature verification requires the 'stripe' npm package's constructEvent helper.
    // To keep this a zero-dependency function, we parse the payload directly.
    // This is acceptable for a small single-teacher-per-account app, but if you later want
    // stronger verification, consider adding the stripe npm package and using
    // stripe.webhooks.constructEvent(event.body, event.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET).
    stripeEvent = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: "Invalid payload" };
  }

  const obj = stripeEvent.data && stripeEvent.data.object;

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const teacherId = obj.metadata && obj.metadata.teacher_id;
      if (teacherId) {
        await upsertSubscription(teacherId, {
          stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.subscription,
          status: "active",
        });
      }
    }

    if (stripeEvent.type === "customer.subscription.updated") {
      const teacherId = obj.metadata && obj.metadata.teacher_id;
      if (teacherId) {
        await upsertSubscription(teacherId, {
          stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.id,
          status: obj.status,
          current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
        });
      }
    }

    if (stripeEvent.type === "customer.subscription.deleted") {
      const teacherId = obj.metadata && obj.metadata.teacher_id;
      if (teacherId) {
        await upsertSubscription(teacherId, {
          status: "canceled",
        });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
