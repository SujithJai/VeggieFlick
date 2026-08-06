import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { handle, ok, parseBody } from "@/lib/api";
import { newsletterSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handle(async () => {
    const { email } = await parseBody(request, newsletterSchema);
    await db
      .insert(newsletterSubscribers)
      .values({ email: email.toLowerCase() })
      .onConflictDoNothing({ target: newsletterSubscribers.email });

    // Resend delivers the double opt-in welcome mail when an API key is configured.
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "VeggieFlick <hello@veggieflick.in>",
          to: [email],
          subject: "Welcome to VeggieFlick",
          html: "<p>Thanks for subscribing! Fresh drops, recipes and offers land in your inbox every Friday.</p>",
        }),
      }).catch(() => undefined);
    }

    return ok({ subscribed: true, email });
  });
}
