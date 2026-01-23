import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy - Alectra Solutions"
        description="Learn how Alectra Solutions collects, uses, and protects your personal information. We are committed to protecting your privacy."
      />
      
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Privacy Policy", href: "/privacy" },
          ]}
        />
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">
          Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground">
              Alectra Solutions ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you visit our website and 
              use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
            <p className="text-muted-foreground mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Name and contact information (email, phone number, address)</li>
              <li>Account credentials (username, password)</li>
              <li>Payment information (processed securely via Paystack)</li>
              <li>Order history and preferences</li>
              <li>Trade account documentation (for business customers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Provide customer support</li>
              <li>Process trade account applications</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Service Providers:</strong> The Courier Guy for shipping, Paystack for payment processing</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal information. 
              However, no method of transmission over the Internet is 100% secure. We use secure HTTPS connections, 
              encrypted password storage, and secure payment processing via Paystack.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">POPIA Compliance</h2>
            <p className="text-muted-foreground mb-4">
              Alectra Solutions is committed to complying with the Protection of Personal Information Act, 2013 (POPIA) 
              of South Africa. POPIA regulates how we collect, store, use, and share your personal information.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">
                <strong>Responsible Party:</strong> Alectra Solutions (Pty) Ltd<br />
                <strong>Address:</strong> 107A Dassiebos Ave, Wonderboom, Pretoria, South Africa<br />
                <strong>Information Officer Email:</strong> solutionsalectra@gmail.com
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Your Rights Under POPIA</h2>
            <p className="text-muted-foreground mb-4">
              Under POPIA, you have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Right to Correction:</strong> Request correction of any inaccurate or incomplete information</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your personal information (Right to be Forgotten)</li>
              <li><strong>Right to Object:</strong> Object to the processing of your personal information</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
              <li><strong>Right to Data Portability:</strong> Request your data in a structured, commonly used format</li>
              <li><strong>Right to Lodge a Complaint:</strong> Lodge a complaint with the Information Regulator</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How to Delete Your Account</h2>
            <p className="text-muted-foreground mb-4">
              In accordance with your POPIA rights, you can permanently delete your account and all associated personal data 
              at any time. To do this:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
              <li>Log in to your account</li>
              <li>Go to "My Account" → "Profile" tab</li>
              <li>Scroll to the "Delete Account" section</li>
              <li>Click "Delete My Account" and confirm</li>
            </ol>
            <p className="text-muted-foreground mb-4">
              When you delete your account, the following will be permanently removed:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Your profile and login credentials</li>
              <li>All saved addresses</li>
              <li>Your wishlist items</li>
              <li>Trade application (if applicable)</li>
            </ul>
            <p className="text-muted-foreground mt-4 text-sm">
              <strong>Note:</strong> Order history will be anonymized for business record-keeping purposes as required by 
              tax and consumer protection laws, but all personal identifying information will be removed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to improve your browsing experience, analyze site traffic, 
              and remember your preferences. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
            </p>
            <div className="bg-muted p-6 rounded-lg text-sm">
              <p><strong>Email:</strong> solutionsalectra@gmail.com</p>
              <p><strong>Phone:</strong> 012 566 3123</p>
              <p><strong>Address:</strong> Alectra Solutions, Pretoria, South Africa</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
