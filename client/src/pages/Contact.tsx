import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Us - Alectra Solutions"
        description="Get in touch with Alectra Solutions. Visit our stores in Wonderboom, Hatfield, or Menlyn. Call us at 012 566 3123 or email info@alectra.co.za"
      />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-12">
          We're here to help. Reach out to us through any of the channels below.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <Phone className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Phone</h3>
                    <p className="text-muted-foreground">012 566 3123</p>
                    <p className="text-sm text-muted-foreground mt-1">Mon-Sun: 08:00 - 16:45</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <Mail className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:info@alectra.co.za" className="text-primary hover:underline">
                      info@alectra.co.za
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Business Hours</h3>
                    <p className="text-muted-foreground">Monday - Sunday</p>
                    <p className="text-muted-foreground">08:00 - 16:45</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Our Stores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">Wonderboom Store</h4>
                  <p className="text-sm text-muted-foreground">012 566 3123</p>
                </div>
                <div>
                  <h4 className="font-semibold">Hatfield Store</h4>
                  <p className="text-sm text-muted-foreground">012 566 3123</p>
                </div>
                <div>
                  <h4 className="font-semibold">Menlyn Store</h4>
                  <p className="text-sm text-muted-foreground">012 566 3123</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Request a Quote */}
          <Card>
            <CardHeader>
              <CardTitle>Request a Quote</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-6">
                Need a custom quote for your project? Fill out our quote request form and we'll get back to you within 24 hours.
              </p>
              <Link href="/quote">
                <Button className="w-full">
                  Go to Quote Request Form
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
