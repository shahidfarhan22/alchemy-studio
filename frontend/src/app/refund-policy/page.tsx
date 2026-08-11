import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { LegalSection } from "@/components/legal/LegalSection";
import { GrievanceContact } from "@/components/legal/GrievanceContact";

export const metadata = {
  title: "Refund & Shipping Policy | Alchemy Studio",
  description: "Shipping timelines, returns, and how refunds are processed at Alchemy Studio.",
};

export default function RefundPolicyPage() {
  return (
    <main className="flex-1 py-16">
      <Container size="md">
        <PageHeading eyebrow="Legal">Refund &amp; Shipping Policy</PageHeading>
        <p className="mt-4 font-sans text-sm text-muted">Last updated: 11 August 2026</p>
        <HairlineRule className="mt-8" />

        <LegalSection heading="Shipping">
          <p>
            We currently ship within India only, by standard courier. Orders typically arrive
            within 5–10 business days of being marked &ldquo;Shipped&rdquo; — you&rsquo;ll get an
            email the moment that happens, with tracking details when available. Shipping is
            included in the listed price; there&rsquo;s no separate shipping fee added at
            checkout.
          </p>
          <p>You can check an order&rsquo;s status any time from your account&rsquo;s order page.</p>
        </LegalSection>

        <LegalSection heading="Returns on catalog miniatures">
          <p>
            Because every piece is printed and finished to order, we don&rsquo;t accept returns
            for change-of-mind. If your piece arrives damaged or defective, contact us within 48
            hours of delivery with photos, and we&rsquo;ll replace it or refund you in full — your
            choice.
          </p>
        </LegalSection>

        <LegalSection heading="Custom (commissioned) orders">
          <p>
            A custom piece is made specifically for you once you accept a quote and pay, so it
            can&rsquo;t be resold — accepted custom orders are non-refundable except if we fail
            to deliver, or the piece arrives defective. A quote that hasn&rsquo;t been accepted
            within 14 days simply expires with no charge.
          </p>
        </LegalSection>

        <LegalSection heading="How refunds are processed">
          <p>
            Approved refunds are issued back to your original payment method through Razorpay.
            Once initiated, Razorpay typically settles refunds within 5–7 business days,
            depending on your bank.
          </p>
        </LegalSection>

        <LegalSection heading="How to request a refund or report a problem">
          <p>
            Email us with your order number and photos if relevant, and we&rsquo;ll get back to
            you quickly — see the contact details below.
          </p>
        </LegalSection>

        <GrievanceContact />
      </Container>
    </main>
  );
}
