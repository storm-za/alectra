import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Truck, Award, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Us - Leading Security Solutions Provider"
        description="Alectra Solutions is South Africa's trusted provider of security and automation products. Serving both retail customers and professional installers since establishment."
      />
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <h1 className="text-4xl font-bold mb-6">About Alectra Solutions</h1>
        
        <div className="prose prose-slate max-w-none mb-12">
          <p className="text-lg text-muted-foreground">
            Alectra Solutions is a leading B2B/B2C supplier of security and automation products in South Africa. 
            We specialize in providing high-quality gate motors, electric fencing, CCTV systems, and related security equipment 
            to both retail customers and professional installers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 flex gap-4">
              <Shield className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Quality Products</h3>
                <p className="text-sm text-muted-foreground">
                  We partner with trusted brands like Centurion, Nemtek, Hikvision, and more to ensure reliability.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Truck className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Nationwide Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Fast, reliable delivery via The Courier Guy to anywhere in South Africa. FREE on orders over R2,500.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Award className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Expert Knowledge</h3>
                <p className="text-sm text-muted-foreground">
                  Our team has extensive experience in security and automation systems to help you choose the right products.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex gap-4">
              <Users className="h-10 w-10 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Trade Program</h3>
                <p className="text-sm text-muted-foreground">
                  Professional installers enjoy 15% trade discount on all products. Apply today to access wholesale pricing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Our Stores</h2>
          <p className="text-muted-foreground mb-6">
            Visit us at any of our three convenient locations in Pretoria. Our knowledgeable staff are ready to assist you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">Wonderboom</h3>
              <p className="text-muted-foreground">Mon-Sun: 08:00 - 16:45</p>
              <p className="text-muted-foreground">012 566 3123</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Hatfield</h3>
              <p className="text-muted-foreground">Mon-Sat: 08:00 - 16:45</p>
              <p className="text-muted-foreground">012 566 3123</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Menlyn</h3>
              <p className="text-muted-foreground">Mon-Sun: 08:00 - 16:45</p>
              <p className="text-muted-foreground">012 566 3123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
