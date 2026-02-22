"use client";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support</h1>
          <p className="text-gray-600 mb-8">
            Need help with SecureLink? We&apos;re here to assist.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Report an Issue</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Found a bug or have a feature request? Open an issue on GitHub — we respond to all reports.
            </p>
            <a
              href="https://github.com/yskarpuz/secure-link/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Open a GitHub Issue
            </a>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Common Issues</h2>
            <div className="space-y-4">
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-1">Users cannot sign in</h3>
                <p className="text-gray-600 text-sm">
                  Verify that the SecureLink app registration in your Entra ID tenant has the correct
                  redirect URIs configured and that users have been granted consent.
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-1">File uploads are failing</h3>
                <p className="text-gray-600 text-sm">
                  Check that the Azure Blob Storage account in your resource group is accessible and
                  that the Container App has the correct connection string configured.
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-1">Application is not starting</h3>
                <p className="text-gray-600 text-sm">
                  Review the Container App logs in Azure Portal under your resource group. The
                  application logs startup errors and database migration status on boot.
                </p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-1">How do I update SecureLink?</h3>
                <p className="text-gray-600 text-sm">
                  Updates are delivered as new container image versions. Redeploy the Managed
                  Application from the Azure Portal to pick up the latest version.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Documentation</h2>
            <p className="text-gray-600 leading-relaxed">
              Full documentation, deployment guides, and configuration references are available in the{" "}
              <a
                href="https://github.com/yskarpuz/secure-link"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                SecureLink GitHub repository
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Response Time</h2>
            <p className="text-gray-600 leading-relaxed">
              We aim to respond to all support requests within 2 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
