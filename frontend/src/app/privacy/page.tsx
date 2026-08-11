import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { LegalSection } from "@/components/legal/LegalSection";
import { GrievanceContact } from "@/components/legal/GrievanceContact";

export const metadata = {
  title: "Privacy Policy | Alchemy Studio",
  description: "How Alchemy Studio collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 py-16">
      <Container size="md">
        <PageHeading eyebrow="Legal">Privacy Policy</PageHeading>
        <p className="mt-4 font-sans text-sm text-muted">Last updated: 11 August 2026</p>
        <HairlineRule className="mt-8" />

        <LegalSection heading="Overview">
          <p>
            Alchemy Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an individually-run business
            selling resin-cast and 3D-printed miniatures, operating at alchemystudios.co.in. This
            policy explains what personal data we collect when you use the site, why, and what we
            do with it.
          </p>
        </LegalSection>

        <LegalSection heading="Information we collect">
          <p>
            <strong className="text-text">Account information:</strong> name, email address, and
            phone number when you register.
          </p>
          <p>
            <strong className="text-text">Order information:</strong> shipping address and the
            items, quantities, and prices of anything you order.
          </p>
          <p>
            <strong className="text-text">Custom order requests:</strong> whatever you choose to
            include in a commission request — a description, a reference image URL, a budget
            range, a desired scale. Every field is optional.
          </p>
          <p>
            <strong className="text-text">Payment information:</strong> we never see or store
            your card, UPI, or bank details. Payments are processed entirely by Razorpay; we only
            receive confirmation that a payment succeeded or failed.
          </p>
        </LegalSection>

        <LegalSection heading="How we use your information">
          <p>
            To create and fulfil your orders, to communicate with you about order status,
            quotes, and shipping, and to respond to support requests. We do not use your data for
            advertising, and we do not sell it to anyone.
          </p>
        </LegalSection>

        <LegalSection heading="Who we share it with">
          <p>
            <strong className="text-text">Razorpay</strong> — processes payments and refunds. See{" "}
            <a
              href="https://razorpay.com/privacy/"
              className="text-gold hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Razorpay&rsquo;s privacy policy
            </a>
            .
          </p>
          <p>
            <strong className="text-text">Resend</strong> — sends transactional emails on our
            behalf (order confirmations, quotes, shipping updates). Only your email address and
            the content of that specific email pass through them.
          </p>
          <p>We do not share your data with any advertising or analytics network.</p>
        </LegalSection>

        <LegalSection heading="Cookies">
          <p>
            We use a single essential cookie to keep you signed in between visits. It cannot be
            read by JavaScript and carries no tracking or advertising purpose. We do not use
            analytics or advertising cookies.
          </p>
        </LegalSection>

        <LegalSection heading="Data retention">
          <p>
            We keep account and order data for as long as your account is active, and as needed
            to meet tax and accounting obligations after that. You can request deletion at any
            time — see below.
          </p>
        </LegalSection>

        <LegalSection heading="Your rights">
          <p>
            You can request a copy of the personal data we hold about you, ask us to correct it,
            or ask us to delete your account and associated data (subject to what we&rsquo;re
            legally required to retain, such as records of completed transactions). Contact us
            using the details below.
          </p>
        </LegalSection>

        <LegalSection heading="Children">
          <p>This site is not directed at children, and we do not knowingly collect data from anyone under 18.</p>
        </LegalSection>

        <LegalSection heading="Changes to this policy">
          <p>
            If we make material changes to this policy, we&rsquo;ll update the date at the top of
            this page.
          </p>
        </LegalSection>

        <GrievanceContact />
      </Container>
    </main>
  );
}
