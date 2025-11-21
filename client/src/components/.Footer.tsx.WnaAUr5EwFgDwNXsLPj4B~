import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-white transition-colors">
                  Store Locations
                </Link>
              </li>
              <li>
                <Link href="/trade-signup" className="hover:text-white transition-colors">
                  Trade Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/category/gate-motors" className="hover:text-white transition-colors">
                  Gate Motors
                </Link>
              </li>
              <li>
                <Link href="/category/batteries" className="hover:text-white transition-colors">
                  Batteries
                </Link>
              </li>
              <li>
                <Link href="/category/cctv" className="hover:text-white transition-colors">
                  CCTV Systems
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm mb-4">Subscribe for exclusive deals and product updates</p>
            <form className="space-y-2" onSubmit={handleNewsletterSubmit}>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-newsletter-email"
              />
              <Button type="submit" className="w-full" data-testid="button-newsletter-subscribe">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t border-slate-800 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-white font-semibold mb-2">Wonderboom Store</h4>
              <p>Mon-Sun: 08:00 - 16:45</p>
              <p>012 566 3123</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Hatfield Store</h4>
              <p>Mon-Sun: 08:00 - 16:45</p>
              <p>012 566 3123</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Menlyn Store</h4>
              <p>Mon-Sun: 08:00 - 16:45</p>
              <p>012 566 3123</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} Alectra Solutions. All rights reserved.
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-white rounded text-slate-900 text-xs font-medium">VISA</div>
                <div className="px-3 py-1 bg-white rounded text-slate-900 text-xs font-medium">MASTERCARD</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:info@alectra.co.za"
                className="hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
