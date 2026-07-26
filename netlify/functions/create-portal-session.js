// Netlify serverless function.
// Requires environment variables: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Creates a Stripe Billing Portal session so a teacher can manage or cancel their subscription.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { teacherId, returnUrl } = JSON.parse(event.body);
    if (!teacherId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing teacherId." }) };
    }

    // look up the Stripe customer id from our subscriptions table
    const subResp = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/subscriptions?teacher_id=eq.${teacherId}&select=stripe_customer_id`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const rows = await subResp.json();
    const customerId = rows && rows[0] && rows[0].stripe_customer_id;

    if (!customerId) {
      return { statusCode: 404, body: JSON.stringify({ error: "No Stripe customer found for this teacher." }) };
    }

    const params = new URLSearchParams({
      customer: customerId,
      return_url: returnUrl,
    });

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Stripe request failed", detail: errText }) };
    }

    const session = await response.json();
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
