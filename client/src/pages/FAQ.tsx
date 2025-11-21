import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "wouter";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Frequently Asked Questions - Alectra Solutions"
        description="Find answers to common questions about ordering, shipping, returns, trade pricing, and product information at Alectra Solutions."
      />
      
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-12">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "FAQ", href: "/faq" },
          ]}
        />
        <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-12">
          Find answers to common questions about our products and services.
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="shipping">
            <AccordionTrigger className="text-left">
              How much does shipping cost and how long does it take?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                We charge R110 for delivery via The Courier Guy. Orders over R2,500 qualify for FREE delivery. 
                Most orders are delivered within 3-5 business days, depending on your location in South Africa.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="trade">
            <AccordionTrigger className="text-left">
              How does the trade pricing program work?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground mb-2">
                Professional installers and trade customers receive a 15% discount on all products. To apply:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                <li>Register for a trade account</li>
                <li>Provide your business registration documents</li>
                <li>Wait for approval (usually within 24 hours)</li>
                <li>Enjoy 15% off all orders</li>
              </ol>
              <Link href="/trade-signup" className="text-primary hover:underline block mt-2">
                Apply for trade pricing →
              </Link>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payment">
            <AccordionTrigger className="text-left">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                We accept Visa, Mastercard, and EFT payments through our secure Paystack payment gateway. 
                All transactions are encrypted and secure.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns">
            <AccordionTrigger className="text-left">
              What is your returns policy?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                We accept returns within 30 days of purchase for unused products in original packaging. 
                The customer is responsible for return shipping costs. Refunds are processed within 7-10 business days.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="installation">
            <AccordionTrigger className="text-left">
              Do you provide installation services?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                We sell products only and do not provide installation services. However, we can recommend 
                qualified installers in your area. Visit any of our stores for installer recommendations.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="warranty">
            <AccordionTrigger className="text-left">
              What warranty do products come with?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                All products come with manufacturer warranties. Warranty periods vary by product and brand. 
                Typical warranties range from 1 to 3 years. Please check individual product pages for specific warranty information.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="stock">
            <AccordionTrigger className="text-left">
              How do I know if a product is in stock?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Product availability is shown on each product page. Items marked as "Low Stock" have 5 or fewer units available. 
                Out of stock items cannot be added to cart. Stock levels are updated in real-time.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="bulk">
            <AccordionTrigger className="text-left">
              Do you offer discounts for bulk orders?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Yes! Trade customers automatically receive 15% off all orders. For large bulk orders, please contact us 
                at 012 566 3123 or email solutionsalectra@gmail.com for a custom quote.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="compatibility">
            <AccordionTrigger className="text-left">
              How do I know which products are compatible?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Product descriptions include compatibility information where applicable. If you're unsure, 
                please contact our team at 012 566 3123 or visit one of our stores for expert advice.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="order-tracking">
            <AccordionTrigger className="text-left">
              Can I track my order?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Yes, you will receive tracking information via email once your order has been dispatched. 
                The Courier Guy provides real-time tracking for all deliveries.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 bg-muted p-8 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            Can't find the answer you're looking for? Please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/contact">
              <span className="text-primary hover:underline">Contact Us →</span>
            </Link>
            <span className="text-muted-foreground hidden sm:inline">or call</span>
            <a href="tel:0125663123" className="text-primary hover:underline">
              012 566 3123
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
