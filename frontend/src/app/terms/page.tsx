import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { LegalSection } from "@/components/legal/LegalSection";
import { GrievanceContact } from "@/components/legal/GrievanceContact";

export const metadata = {
  title: "Terms of Service | Alchemy Studio",
  description: "The terms that govern buying from Alchemy Studio.",
};

export default function TermsPage() {
  return (
    <main className="flex-1 py-16">
      <Container size="md">
        <PageHeading eyebrow="Legal">Terms of Service</PageHeading>
        <p className="mt-4 font-sans text-sm text-muted">Last updated: 11 August 2026</p>
        <HairlineRule className="mt-8" />

        <LegalSection heading="About us">
          <p>
            Alchemy Studio is an individually-run business (sole proprietorship) operated by
            Shahid Farhan, registered at 3/27, Rajiv Gandhi Nagar, Pammal, Tambaram, Chennai,
            Tamil Nadu 600044, India. By using this site or placing an order, you agree to these
            terms.
          </p>
        </LegalSection>

        <LegalSection heading="Eligibility">
          <p>
            You must be at least 18 years old, or ordering with the involvement of a
            parent/guardian, to place an order. We currently ship within India only.
          </p>
        </LegalSection>

        <LegalSection heading="Products">
          <p>
            Every piece is resin-cast or 3D-printed and hand-finished, released in limited,
            individually-numbered runs. Because each piece is made to order, small variations in
            color, finish, or size from the photos shown are normal and not a defect.
          </p>
        </LegalSection>

        <LegalSection heading="Custom orders">
          <p>
            You can submit a commission request with as much or as little detail as you like. If
            we can take it on, we&rsquo;ll send you a price quote with a note. Quotes are valid
            for 14 days — after that, they expire and you&rsquo;re welcome to submit a new
            request. Accepting a quote and paying creates a binding order, same as a catalog
            purchase.
          </p>
        </LegalSection>

        <LegalSection heading="Pricing and payment">
          <p>
            All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes
            unless stated otherwise. Payment is processed securely by Razorpay at checkout — we
            never see or store your card, UPI, or bank details.
          </p>
        </LegalSection>

        <LegalSection heading="Shipping, cancellations, and refunds">
          <p>
            See our{" "}
            <Link href="/refund-policy" className="text-gold hover:underline">
              Refund &amp; Shipping Policy
            </Link>{" "}
            for full details on delivery timelines, returns, and refunds.
          </p>
        </LegalSection>

        <LegalSection heading="Intellectual property">
          <p>
            All designs, product photography, and site content belong to Alchemy Studio and may
            not be reproduced or resold without written permission.
          </p>
        </LegalSection>

        <LegalSection heading="Limitation of liability">
          <p>
            We aim to describe every piece accurately, but we don&rsquo;t guarantee the site will
            be error-free or uninterrupted. To the extent permitted by law, our liability for any
            claim relating to an order is limited to the amount you paid for that order.
          </p>
        </LegalSection>

        <LegalSection heading="Governing law">
          <p>These terms are governed by the laws of India, with courts in Chennai, Tamil Nadu having jurisdiction.</p>
        </LegalSection>

        <LegalSection heading="Changes to these terms">
          <p>If we make material changes, we&rsquo;ll update the date at the top of this page.</p>
        </LegalSection>

        <GrievanceContact />
      </Container>
    </main>
  );
}
