"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Overview</h2>
            <p className="text-gray-600 leading-relaxed">
              SecureLink is an Azure Managed Application. When you install SecureLink from the Azure
              Marketplace, all resources — including the application, database, and file storage — are
              deployed directly into <strong>your own Azure subscription</strong>. We (the publisher)
              do not have access to your data, your files, or your users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Data We Do Not Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Because SecureLink runs entirely within your Azure environment, the publisher does not collect:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li>Files uploaded by your users</li>
              <li>User identities or email addresses</li>
              <li>Activity logs or audit trails</li>
              <li>Database contents</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Stored in Your Subscription</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              The following data is stored in Azure resources within your own subscription:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
              <li><strong>Azure Blob Storage</strong> — uploaded files</li>
              <li><strong>Azure Database for PostgreSQL</strong> — file metadata, folder structure, share tokens</li>
              <li><strong>Azure Monitor / Application Insights</strong> — application logs and performance telemetry</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              You are the data controller for all of this data. You can delete it, export it, or restrict
              access at any time through the Azure Portal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Authentication</h2>
            <p className="text-gray-600 leading-relaxed">
              SecureLink uses Microsoft Entra ID (Azure Active Directory) for user authentication. Sign-in
              tokens are issued by Microsoft and validated by SecureLink. No passwords are stored by
              SecureLink. Authentication events may appear in your Entra ID sign-in logs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Azure Marketplace Telemetry</h2>
            <p className="text-gray-600 leading-relaxed">
              When you install SecureLink from Azure Marketplace, Microsoft shares basic subscription
              metadata (subscription ID, tenant ID, region) with the publisher for billing and support
              purposes. This is governed by the{" "}
              <a
                href="https://azure.microsoft.com/en-us/support/legal/marketplace/certified-apps/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Microsoft Azure Marketplace Terms
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For privacy questions, contact us at{" "}
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
