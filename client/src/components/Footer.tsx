import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Mail } from "lucide-react";

export default function Footer() {
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
                <Link href="/about">
                  <a className="hover:text-white transition-colors">About Us</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-white transition-colors">Contact</a>
                </Link>
              </li>
              <li>
                <Link href="/stores">
                  <a className="hover:text-white transition-colors">Store Locations</a>
                </Link>
              </li>
              <li>
                <Link href="/trade">
                  <a className="hover:text-white transition-colors">Trade Program</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products">
                  <a className="hover:text-white transition-colors">All Products</a>
                </Link>
              </li>
              <li>
                <Link href="/category/gate-motors">
                  <a className="hover:text-white transition-colors">Gate Motors</a>
                </Link>
              </li>
              <li>
                <Link href="/category/batteries">
                  <a className="hover:text-white transition-colors">Batteries</a>
                </Link>
              </li>
              <li>
                <Link href="/category/cctv">
                  <a className="hover:text-white transition-colors">CCTV Systems</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/faq">
                  <a className="hover:text-white transition-colors">FAQ</a>
                </Link>
              </li>
              <li>
                <Link href="/shipping">
                  <a className="hover:text-white transition-colors">Shipping Info</a>
                </Link>
              </li>
              <li>
                <Link href="/returns">
                  <a className="hover:text-white transition-colors">Returns</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-white transition-colors">Privacy Policy</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Updated</h3>
            <p className="text-sm mb-4">Subscribe for exclusive deals and product updates</p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                data-testid="input-newsletter-email"
              />
              <Button className="w-full" data-testid="button-newsletter-subscribe">
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
              <span className="text-sm">We accept:</span>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-white rounded text-slate-900 text-xs font-medium">VISA</div>
                <div className="px-3 py-1 bg-white rounded text-slate-900 text-xs font-medium">MC</div>
                <div className="px-3 py-1 bg-white rounded text-slate-900 text-xs font-medium">EFT</div>
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
