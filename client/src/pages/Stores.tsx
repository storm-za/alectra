import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock } from "lucide-react";

export default function Stores() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Store Locations - Alectra Solutions"
        description="Visit Alectra Solutions at our three locations in Pretoria: Wonderboom, Hatfield, and Menlyn. Open 7 days a week."
      />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <h1 className="text-4xl font-bold mb-2">Our Store Locations</h1>
        <p className="text-muted-foreground mb-12">
          Visit us at any of our three convenient locations in Pretoria. All stores open 7 days a week.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Wonderboom</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Opening Hours</p>
                    <p className="text-muted-foreground">Monday - Sunday</p>
                    <p className="text-muted-foreground">08:00 - 16:45</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <a href="tel:0125663123" className="text-primary hover:underline">
                      012 566 3123
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Hatfield</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Opening Hours</p>
                    <p className="text-muted-foreground">Monday - Sunday</p>
                    <p className="text-muted-foreground">08:00 - 16:45</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <a href="tel:0125663123" className="text-primary hover:underline">
                      012 566 3123
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Menlyn</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Opening Hours</p>
                    <p className="text-muted-foreground">Monday - Sunday</p>
                    <p className="text-muted-foreground">08:00 - 16:45</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Contact</p>
                    <a href="tel:0125663123" className="text-primary hover:underline">
                      012 566 3123
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 bg-muted p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Why Visit Our Stores?</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ Expert advice from knowledgeable staff</li>
            <li>✓ See and test products before you buy</li>
            <li>✓ Immediate availability of popular items</li>
            <li>✓ Professional installation services available</li>
            <li>✓ Trade customer support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
