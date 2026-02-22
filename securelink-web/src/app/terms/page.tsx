"use client";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance</h2>
            <p className="text-gray-600 leading-relaxed">
              By installing or using SecureLink from the Azure Marketplace, you agree to these Terms of
              Service. If you do not agree, do not install or use the application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              SecureLink is a secure file-sharing application delivered as an Azure Managed Application.
              The software is deployed into your Azure subscription and runs under your control. You are
              responsible for the Azure resources created during installation and any costs incurred.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. License</h2>
            <p className="text-gray-600 leading-relaxed">
              The publisher grants you a non-exclusive, non-transferable license to use SecureLink for
              your internal business purposes. You may not redistribute, resell, or sublicense the
              software.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Your Responsibilities</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
              <li>You are responsible for all content uploaded by your users.</li>
              <li>You must not use SecureLink to share illegal, harmful, or infringing content.</li>
              <li>You are responsible for securing access to your Azure subscription and Entra ID tenant.</li>
              <li>You must keep the application reasonably up to date by redeploying when updates are available.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Billing</h2>
            <p className="text-gray-600 leading-relaxed">
              SecureLink is offered with a one-time installation fee charged at the time of deployment,
              plus usage-based billing for consumption beyond included limits. All charges are processed
              through your Azure Marketplace account. Azure infrastructure costs (storage, database,
              compute) are billed directly by Microsoft to your Azure subscription.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Disclaimer of Warranties</h2>
            <p className="text-gray-600 leading-relaxed">
              SecureLink is provided &ldquo;as is&rdquo; without warranty of any kind. The publisher does not
              warrant that the service will be error-free, uninterrupted, or meet your specific
              requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, the publisher&apos;s total liability for any claim
              arising from your use of SecureLink is limited to the amount you paid for the service in
              the 12 months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update these terms from time to time. Continued use of SecureLink after changes
              are posted constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href="https://github.com/yskarpuz/securelink-support/issues" className="text-blue-600 underline">
                our support channel
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
