import { LegalSection } from "./LegalSection";

// Required under the Consumer Protection (E-Commerce) Rules, 2020 -- a named
// grievance officer with contact details and an acknowledgment timeframe.
export function GrievanceContact() {
  return (
    <LegalSection heading="Grievance officer">
      <p>
        If you have a complaint or concern about your order, your data, or anything on this
        site, contact our grievance officer directly:
      </p>
      <p>
        Shahid Farhan
        <br />
        Alchemy Studio
        <br />
        3/27, Rajiv Gandhi Nagar, Pammal, Tambaram, Chennai, Tamil Nadu 600044, India
        <br />
        Email:{" "}
        <a href="mailto:contact@alchemystudios.co.in" className="text-gold hover:underline">
          contact@alchemystudios.co.in
        </a>
      </p>
      <p>We acknowledge complaints within 48 hours and aim to resolve them within 30 days.</p>
    </LegalSection>
  );
}
