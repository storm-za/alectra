import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Package, MapPin, Clock } from "lucide-react";

export default function Shipping() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Shipping Information - Alectra Solutions"
        description="Learn about our shipping rates, delivery times, and nationwide coverage via The Courier Guy. Free delivery on orders over R2,500."
      />
      
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shipping Information", href: "/shipping" },
          ]}
        />
        <h1 className="text-4xl font-bold mb-2">Shipping Information</h1>
        <p className="text-muted-foreground mb-12">
          Fast, reliable nationwide delivery via The Courier Guy
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Truck className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Standard Delivery</h3>
                <p className="text-2xl font-bold mb-1">R110</p>
                <p className="text-sm text-muted-foreground">
                  3-5 business days to most areas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Package className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Free Delivery</h3>
                <p className="text-2xl font-bold mb-1">R0</p>
                <p className="text-sm text-muted-foreground">
                  On orders over R2,500
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Coverage Area
            </h2>
            <p className="text-muted-foreground mb-4">
              We deliver to all major cities and towns across South Africa via The Courier Guy, including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>✓ Gauteng (Johannesburg, Pretoria)</div>
              <div>✓ Western Cape (Cape Town)</div>
              <div>✓ KwaZulu-Natal (Durban)</div>
              <div>✓ Eastern Cape (Port Elizabeth)</div>
              <div>✓ Free State (Bloemfontein)</div>
              <div>✓ All other provinces</div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Delivery Times
            </h2>
            <div className="bg-muted p-6 rounded-lg space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Order Processing</span>
                <span className="text-muted-foreground">1-2 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Major Cities</span>
                <span className="text-muted-foreground">3-5 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rural Areas</span>
                <span className="text-muted-foreground">5-7 business days</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              * Delivery times are estimates and may vary based on courier availability and location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Order Tracking</h2>
            <p className="text-muted-foreground mb-4">
              Once your order is dispatched, you'll receive:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Shipment confirmation email</li>
              <li>✓ Tracking number from The Courier Guy</li>
              <li>✓ Real-time tracking updates</li>
              <li>✓ Estimated delivery date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Important Notes</h2>
            <div className="bg-muted p-6 rounded-lg space-y-3 text-sm">
              <p>
                <strong>Collection:</strong> Items can be collected from any of our three stores in Pretoria 
                (Wonderboom, Hatfield, Menlyn) at no charge. Please wait for collection confirmation email.
              </p>
              <p>
                <strong>Large Items:</strong> Bulky items like gate motors may require special handling. 
                Delivery time may be extended for these items.
              </p>
              <p>
                <strong>Delivery Address:</strong> Please ensure your delivery address is accurate and complete. 
                We cannot be held responsible for delays due to incorrect addresses.
              </p>
              <p>
                <strong>Signature Required:</strong> A signature is required upon delivery. Please ensure someone 
                is available to receive your order.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
