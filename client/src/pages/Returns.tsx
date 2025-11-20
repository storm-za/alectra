import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, Package, CheckCircle, XCircle } from "lucide-react";

export default function Returns() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Returns Policy - Alectra Solutions"
        description="Our returns policy allows returns within 30 days for unused products in original packaging. Learn about our simple returns process."
      />
      
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <h1 className="text-4xl font-bold mb-2">Returns Policy</h1>
        <p className="text-muted-foreground mb-12">
          We want you to be completely satisfied with your purchase
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <RotateCcw className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">30 Days</h3>
              <p className="text-sm text-muted-foreground">Return window from purchase date</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Original Packaging</h3>
              <p className="text-sm text-muted-foreground">Must be unused and in original condition</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Full Refund</h3>
              <p className="text-sm text-muted-foreground">Processed within 7-10 business days</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Return an Item</h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Contact Us</h3>
                  <p className="text-sm text-muted-foreground">
                    Email info@alectra.co.za or call 012 566 3123 within 30 days of receiving your order. 
                    Provide your order number and reason for return.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Pack the Item</h3>
                  <p className="text-sm text-muted-foreground">
                    Ensure the product is unused, in original packaging with all accessories, manuals, and labels intact.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Ship the Return</h3>
                  <p className="text-sm text-muted-foreground">
                    Use a trackable shipping method. Customer is responsible for return shipping costs. 
                    We recommend insuring high-value items.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <div>
                  <h3 className="font-semibold mb-1">Receive Refund</h3>
                  <p className="text-sm text-muted-foreground">
                    Once we receive and inspect your return, we'll process your refund within 7-10 business days 
                    to your original payment method.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Eligible for Return</h2>
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Unused products in original packaging</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Products with all original accessories and manuals</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Returns requested within 30 days of purchase</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Defective products (manufacturer warranty applies)</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Not Eligible for Return</h2>
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Products that have been installed or used</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Products with damaged or missing packaging</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Products damaged due to misuse or improper installation</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Returns requested after 30 days</p>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Clearance or discontinued items (unless defective)</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Exchanges</h2>
            <p className="text-muted-foreground">
              We do not offer direct exchanges. If you need a different product, please return the original item 
              for a refund and place a new order for the item you want.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Warranty Claims</h2>
            <p className="text-muted-foreground mb-4">
              For defective products covered under manufacturer warranty, please contact us with:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Order number</li>
              <li>• Product details</li>
              <li>• Description of the defect</li>
              <li>• Photos or video of the issue</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Warranty periods and terms vary by manufacturer. Please check your product documentation for specific warranty information.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
