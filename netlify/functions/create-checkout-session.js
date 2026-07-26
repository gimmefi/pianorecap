// Netlify serverless function.
// Requires environment variables: STRIPE_SECRET_KEY, STRIPE_PRICE_ID
// Creates a Stripe Checkout session for the MusicLessonRecap monthly subscription.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { teacherId, teacherEmail, successUrl, cancelUrl } = JSON.parse(event.body);

    if (!teacherId || !teacherEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing teacherId or teacherEmail." }) };
    }

    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": process.env.STRIPE_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: teacherEmail,
      "metadata[teacher_id]": teacherId,
      "subscription_data[metadata][teacher_id]": teacherId,
    });

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
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
