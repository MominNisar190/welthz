"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    console.log("=== Sending Email ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From: Welth Finance <mominnisar500@gmail.com>");
    
    const data = await resend.emails.send({
      from: "Welth Finance <mominnisar500@gmail.com>", // Using your verified email
      to,
      subject,
      react,
    });

    console.log("Email sent successfully!");
    console.log("Email ID:", data.id);
    console.log("Check delivery status at: https://resend.com/emails");

    return { success: true, data };
  } catch (error) {
    console.error("=== Email Send Failed ===");
    console.error("Error:", error.message);
    console.error("Full error:", error);
    return { success: false, error };
  }
}
