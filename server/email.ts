import nodemailer from "nodemailer";

export interface TradeApplicationEmailData {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  businessAddress?: string;
  idNumber: string;
  vatNumber?: string;
  storeUrl?: string;
  businessRegistrationNumber?: string;
  preferences?: string[];
  message?: string;
}

export interface QuoteRequestEmailData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  category: string;
  message: string;
}

export interface OrderEmailData {
  orderId: string;
  reference: string;
  deliveryMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryProvince: string;
  deliveryPostalCode: string;
  isGift?: boolean;
  giftMessage?: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: string;
    imageUrl?: string;
  }>;
  subtotal: string;
  vat: string;
  shippingCost: string;
  total: string;
  tradeDiscount?: string;
}

// Base URL for production - used for absolute image URLs in emails
// Use the custom domain if available, otherwise fall back to Replit app URL
const PRODUCTION_BASE_URL = "https://alectra.co.za";

// Helper to convert relative image URLs to absolute URLs for emails
function getAbsoluteImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;
  
  // Already an absolute URL (Shopify CDN, etc.)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Relative URL - prepend production base URL
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${PRODUCTION_BASE_URL}${cleanPath}`;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Validate Gmail credentials upfront
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials (GMAIL_USER and GMAIL_APP_PASSWORD) must be configured in environment variables");
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendOrderConfirmation(data: OrderEmailData): Promise<void> {
    const customerEmailHtml = this.generateOrderConfirmationHtml(data);
    const internalEmailHtml = this.generateInternalNotificationHtml(data);

    // Send email to customer - independent error handling
    try {
      await this.transporter.sendMail({
        from: `"Alectra Solutions" <${process.env.GMAIL_USER}>`,
        to: data.customerEmail,
        subject: `Order Confirmation - #${data.reference}`,
        html: customerEmailHtml,
      });
      console.log(`Customer confirmation email sent to ${data.customerEmail}`);
    } catch (error) {
      console.error("Failed to send customer confirmation email:", error);
      throw error; // Re-throw to notify caller
    }

    // Send internal notification to business - independent error handling
    try {
      await this.transporter.sendMail({
        from: `"Alectra Solutions" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `New Order Received - #${data.reference}`,
        html: internalEmailHtml,
      });
      console.log(`Internal notification email sent to ${process.env.GMAIL_USER}`);
    } catch (error) {
      console.error("Failed to send internal notification email:", error);
      // Don't re-throw - customer email is more critical
    }
  }

  async sendInternalNotificationOnly(data: OrderEmailData): Promise<void> {
    const internalEmailHtml = this.generateInternalNotificationHtml(data);

    try {
      await this.transporter.sendMail({
        from: `"Alectra Solutions" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `[TEST] Order Notification - #${data.reference}`,
        html: internalEmailHtml,
      });
      console.log(`Internal test notification email sent to ${process.env.GMAIL_USER}`);
    } catch (error) {
      console.error("Failed to send internal test email:", error);
      throw error;
    }
  }

  async sendTradeApplication(data: TradeApplicationEmailData): Promise<void> {
    const emailHtml = this.generateTradeApplicationHtml(data);

    try {
      await this.transporter.sendMail({
        from: `"Alectra Solutions" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `New Trade Application - ${data.fullName}`,
        html: emailHtml,
        replyTo: data.email,
      });
      console.log(`Trade application email sent for ${data.fullName}`);
    } catch (error) {
      console.error("Failed to send trade application email:", error);
      throw error;
    }
  }

  async sendQuoteRequest(data: QuoteRequestEmailData): Promise<void> {
    const emailHtml = this.generateQuoteRequestHtml(data);

    try {
      await this.transporter.sendMail({
        from: `"Alectra Solutions" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `Quote Request - ${data.name} (${data.category})`,
        html: emailHtml,
        replyTo: data.email,
      });
      console.log(`Quote request email sent for ${data.name}`);
    } catch (error) {
      console.error("Failed to send quote request email:", error);
      throw error;
    }
  }

  private generateQuoteRequestHtml(data: QuoteRequestEmailData): string {
    const categoryLabels: Record<string, string> = {
      'gate-motors': 'Gate Motors',
      'batteries': 'Batteries',
      'cctv': 'CCTV Systems',
      'remotes': 'Remotes',
      'intercoms': 'Intercoms',
      'electric-fencing': 'Electric Fencing',
      'lp-gas': 'LP Gas',
      'other': 'Other / Multiple Items',
    };
    
    const categoryLabel = categoryLabels[data.category] || data.category;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Quote Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #FF9800 0%, #FFEB3B 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">New Quote Request</h1>
                    <p style="margin: 8px 0 0 0; color: #1f2937; font-size: 14px;">Alectra Solutions</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <div style="background-color: #10b981; color: white; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-bottom: 20px;">
                      ${categoryLabel}
                    </div>

                    <!-- Contact Information -->
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">Contact Information</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; color: #374151; width: 120px;"><strong>Name:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Email:</strong></td>
                          <td style="padding: 6px 0; color: #111827;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Phone:</strong></td>
                          <td style="padding: 6px 0; color: #111827;"><a href="tel:${data.phone}" style="color: #2563eb;">${data.phone}</a></td>
                        </tr>
                        ${data.company ? `
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Company:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.company}</td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>

                    <!-- Project Details -->
                    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">Project Details</h3>
                      <p style="margin: 0; color: #111827; white-space: pre-wrap; line-height: 1.6;">${data.message}</p>
                    </div>

                    <!-- Action reminder -->
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>Action Required:</strong> Respond to this quote request within 24 hours.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Alectra Solutions Quote System | Received: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private generateTradeApplicationHtml(data: TradeApplicationEmailData): string {
    const preferencesHtml = data.preferences?.length 
      ? data.preferences.map(p => `<span style="display: inline-block; background-color: #FF9800; color: white; padding: 4px 12px; border-radius: 20px; margin: 3px; font-size: 13px;">${p}</span>`).join('')
      : '<span style="color: #6b7280;">None selected</span>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Trade Application</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #FF9800 0%, #FFEB3B 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">New Trade Application</h1>
                    <p style="margin: 8px 0 0 0; color: #1f2937; font-size: 14px;">Alectra Solutions Trade Program</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 30px;">
                    <div style="background-color: #3b82f6; color: white; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-bottom: 20px;">
                      New Application Received
                    </div>

                    <!-- Personal Information -->
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">Personal Information</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; color: #374151; width: 160px;"><strong>Full Name:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.fullName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Email:</strong></td>
                          <td style="padding: 6px 0; color: #111827;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Phone:</strong></td>
                          <td style="padding: 6px 0; color: #111827;"><a href="tel:+27${data.phone}" style="color: #2563eb;">+27 ${data.phone}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>ID Number:</strong></td>
                          <td style="padding: 6px 0; color: #111827; font-family: monospace;">${data.idNumber}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Business Information -->
                    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">Business Information</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; color: #374151; width: 160px;"><strong>Company Name:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.companyName || '<span style="color: #9ca3af;">Not provided</span>'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Business Address:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.businessAddress || '<span style="color: #9ca3af;">Not provided</span>'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>VAT Number:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.vatNumber || '<span style="color: #9ca3af;">Not VAT registered</span>'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Registration No:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.businessRegistrationNumber || '<span style="color: #9ca3af;">Not provided</span>'}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Store URL:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.storeUrl ? `<a href="${data.storeUrl}" style="color: #2563eb;">${data.storeUrl}</a>` : '<span style="color: #9ca3af;">Not provided</span>'}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Preferences -->
                    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">Product Preferences</h3>
                      <div style="line-height: 2;">
                        ${preferencesHtml}
                      </div>
                    </div>

                    ${data.message ? `
                    <!-- Message -->
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Message</h3>
                      <p style="margin: 0; color: #111827; white-space: pre-wrap;">${data.message}</p>
                    </div>
                    ` : ''}

                    <!-- Action -->
                    <div style="text-align: center; margin-top: 25px;">
                      <a href="mailto:${data.email}?subject=Re: Trade Application - Alectra Solutions" style="display: inline-block; background-color: #FF9800; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Reply to ${data.fullName}
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Alectra Solutions Trade Application System | Received: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private generateOrderConfirmationHtml(data: OrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => {
          const absoluteImageUrl = getAbsoluteImageUrl(item.imageUrl);
          return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <table role="presentation" style="border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; padding-right: 12px;">
                  ${absoluteImageUrl 
                    ? `<img src="${absoluteImageUrl}" alt="${item.productName}" width="60" height="60" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; display: block;" />` 
                    : '<div style="width: 60px; height: 60px; background-color: #f3f4f6; border-radius: 6px; display: table-cell; vertical-align: middle; text-align: center; color: #9ca3af; font-size: 10px;">No image</div>'}
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-weight: 500; font-size: 14px; color: #111827;">${item.productName}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: middle;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle;">R${item.price}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; font-weight: 600;">R${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
        </tr>
      `;
        }
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header with logo and brand colors -->
                <tr>
                  <td style="background: linear-gradient(135deg, #FF9800 0%, #FFEB3B 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">Alectra Solutions</h1>
                    <p style="margin: 8px 0 0 0; color: #1f2937; font-size: 14px;">Security & Automation Specialists</p>
                  </td>
                </tr>

                <!-- Success message -->
                <tr>
                  <td style="padding: 30px 30px 20px 30px; text-align: center;">
                    <div style="background-color: #10b981; color: white; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-bottom: 20px;">
                      ✓ Order Confirmed & Paid
                    </div>
                    <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 24px;">Thank you for your order!</h2>
                    <p style="margin: 0; color: #6b7280; font-size: 16px;">Order Reference: <strong style="color: #FF9800;">#${data.reference}</strong></p>
                  </td>
                </tr>

                <!-- Order details -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Customer:</strong> ${data.customerName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Email:</strong> ${data.customerEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Phone:</strong> ${data.customerPhone}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Delivery Address:</strong><br>
                          ${data.deliveryAddress}<br>
                          ${data.deliveryCity}, ${data.deliveryProvince}<br>
                          ${data.deliveryPostalCode}
                        </td>
                      </tr>
                    </table>

                    <!-- Order items table -->
                    <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Order Items</h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr style="background-color: #f3f4f6;">
                          <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
                          <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Qty</th>
                          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Price</th>
                          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Order totals -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #6b7280;">Subtotal:</td>
                        <td style="padding: 8px 0; text-align: right; width: 120px; font-weight: 600;">R${data.subtotal}</td>
                      </tr>
                      ${data.tradeDiscount ? `
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #10b981;">Trade Discount (15%):</td>
                        <td style="padding: 8px 0; text-align: right; width: 120px; font-weight: 600; color: #10b981;">-R${data.tradeDiscount}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #6b7280;">VAT (15%):</td>
                        <td style="padding: 8px 0; text-align: right; width: 120px; font-weight: 600;">R${data.vat}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; text-align: right; color: #6b7280;">Shipping:</td>
                        <td style="padding: 8px 0; text-align: right; width: 120px; font-weight: 600; ${parseFloat(data.shippingCost) === 0 ? 'color: #10b981;' : ''}">${parseFloat(data.shippingCost) === 0 ? 'FREE' : `R${data.shippingCost}`}</td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #111827;">Total Paid:</td>
                        <td style="padding: 12px 0; text-align: right; width: 120px; font-size: 18px; font-weight: bold; color: #FF9800;">R${data.total}</td>
                      </tr>
                    </table>

                    ${data.isGift ? `
                    <!-- Christmas Gift Notice -->
                    <div style="margin-top: 25px; background: linear-gradient(135deg, #dc2626 0%, #16a34a 100%); border-radius: 8px; padding: 3px;">
                      <div style="background-color: #fef2f2; border-radius: 6px; padding: 20px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                          <span style="font-size: 24px; margin-right: 10px;">🎄</span>
                          <h3 style="margin: 0; color: #dc2626; font-size: 18px; font-weight: bold;">Christmas Gift Order</h3>
                          <span style="font-size: 24px; margin-left: 10px;">🎁</span>
                        </div>
                        <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                          Your order will be prepared in a beautiful Christmas gift bag!
                        </p>
                        ${data.giftMessage ? `
                        <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 6px; border-left: 4px solid #dc2626;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Gift Message:</p>
                          <p style="margin: 0; color: #111827; font-size: 14px; font-style: italic;">"${data.giftMessage}"</p>
                        </div>
                        ` : ''}
                      </div>
                    </div>
                    ` : ''}
                  </td>
                </tr>

                <!-- Next steps -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6;">
                      <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">What happens next?</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                        <li style="margin-bottom: 8px;">Your order will be processed within 1 business day</li>
                        <li style="margin-bottom: 8px;">We'll prepare your items for delivery via The Courier Guy</li>
                        <li style="margin-bottom: 8px;">You'll receive tracking information once dispatched</li>
                        <li>Expected delivery: 2-5 business days</li>
                      </ul>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Questions about your order?</p>
                    <p style="margin: 0 0 5px 0; color: #111827; font-weight: 600;">
                      📞 012 566 3123 &nbsp;&nbsp;|&nbsp;&nbsp; 📧 solutionsalectra@gmail.com
                    </p>
                    <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                      Alectra Solutions (PTY) LTD<br>
                      Security & Automation Specialists<br>
                      Thank you for choosing Alectra!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private generateInternalNotificationHtml(data: OrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => {
          const absoluteImageUrl = getAbsoluteImageUrl(item.imageUrl);
          return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <table role="presentation" style="border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; padding-right: 16px;">
                  ${absoluteImageUrl 
                    ? `<img src="${absoluteImageUrl}" alt="${item.productName}" width="100" height="100" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; display: block;" />` 
                    : '<div style="width: 100px; height: 100px; background-color: #f3f4f6; border-radius: 8px; display: table-cell; vertical-align: middle; text-align: center; color: #9ca3af; font-size: 11px;">No image</div>'}
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-weight: 600; font-size: 15px; color: #111827;">${item.productName}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: middle; font-size: 16px; font-weight: 500;">${item.quantity}</td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; font-size: 15px;">R${item.price}</td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle; font-weight: 700; font-size: 15px; color: #111827;">R${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
        </tr>
      `;
        }
      )
      .join("");

    const deliveryMethodLabel = data.deliveryMethod === "pickup" ? "Store Pickup (Pretoria)" : "Delivery via The Courier Guy";
    const hasDeliveryAddress = data.deliveryMethod !== "pickup" && data.deliveryAddress;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #FF9800 0%, #FFEB3B 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">New Order Received!</h1>
                    <p style="margin: 8px 0 0 0; color: #1f2937; font-size: 14px;">Alectra Solutions - Order Notification</p>
                  </td>
                </tr>

                <!-- Order summary -->
                <tr>
                  <td style="padding: 30px;">
                    <div style="background-color: #10b981; color: white; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-bottom: 20px;">
                      Payment Confirmed - R${data.total}
                    </div>
                    
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Order #${data.reference}</h2>
                    
                    <!-- Customer Information -->
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">Customer Information</h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; color: #374151; width: 140px;"><strong>Name:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.customerName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Email:</strong></td>
                          <td style="padding: 6px 0; color: #111827;"><a href="mailto:${data.customerEmail}" style="color: #2563eb;">${data.customerEmail}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Phone:</strong></td>
                          <td style="padding: 6px 0; color: #111827;"><a href="tel:${data.customerPhone}" style="color: #2563eb;">${data.customerPhone}</a></td>
                        </tr>
                      </table>
                    </div>

                    <!-- Delivery Information -->
                    <div style="background-color: ${data.deliveryMethod === 'pickup' ? '#fef3c7' : '#f0fdf4'}; border: 1px solid ${data.deliveryMethod === 'pickup' ? '#fcd34d' : '#86efac'}; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: ${data.deliveryMethod === 'pickup' ? '#92400e' : '#166534'}; font-size: 16px;">
                        ${data.deliveryMethod === 'pickup' ? 'Store Pickup' : 'Delivery Address'}
                      </h3>
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 6px 0; color: #374151; width: 140px;"><strong>Method:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${deliveryMethodLabel}</td>
                        </tr>
                        ${hasDeliveryAddress ? `
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Address:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.deliveryAddress}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>City:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.deliveryCity}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Province:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.deliveryProvince}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #374151;"><strong>Postal Code:</strong></td>
                          <td style="padding: 6px 0; color: #111827;">${data.deliveryPostalCode}</td>
                        </tr>
                        ` : `
                        <tr>
                          <td colspan="2" style="padding: 6px 0; color: #92400e;">
                            Customer will collect from: <strong>Alectra Solutions, Pretoria</strong>
                          </td>
                        </tr>
                        `}
                      </table>
                    </div>

                    <!-- Order items table -->
                    <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Order Items (${data.items.length} ${data.items.length === 1 ? 'item' : 'items'})</h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                      <thead>
                        <tr style="background-color: #f3f4f6;">
                          <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Product</th>
                          <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 60px;">Qty</th>
                          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Price</th>
                          <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; width: 100px;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Order totals -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                      <tr>
                        <td style="padding: 8px 15px; text-align: right; color: #6b7280;">Subtotal:</td>
                        <td style="padding: 8px 15px; text-align: right; width: 120px; font-weight: 600;">R${data.subtotal}</td>
                      </tr>
                      ${data.tradeDiscount ? `
                      <tr>
                        <td style="padding: 8px 15px; text-align: right; color: #10b981;">Trade Discount (15%):</td>
                        <td style="padding: 8px 15px; text-align: right; width: 120px; font-weight: 600; color: #10b981;">-R${data.tradeDiscount}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 15px; text-align: right; color: #6b7280;">VAT (15%):</td>
                        <td style="padding: 8px 15px; text-align: right; width: 120px; font-weight: 600;">R${data.vat}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 15px; text-align: right; color: #6b7280;">Shipping:</td>
                        <td style="padding: 8px 15px; text-align: right; width: 120px; font-weight: 600; ${parseFloat(data.shippingCost) === 0 ? 'color: #10b981;' : ''}">${parseFloat(data.shippingCost) === 0 ? 'FREE (Pickup)' : `R${data.shippingCost}`}</td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 15px; text-align: right; font-size: 20px; font-weight: bold; color: #111827;">TOTAL:</td>
                        <td style="padding: 15px; text-align: right; width: 120px; font-size: 20px; font-weight: bold; color: #FF9800;">R${data.total}</td>
                      </tr>
                    </table>

                    <!-- Christmas Gift Bag Status - ALWAYS SHOWN -->
                    ${data.isGift ? `
                    <div style="margin-bottom: 20px; background: linear-gradient(135deg, #dc2626 0%, #16a34a 100%); border-radius: 8px; padding: 4px;">
                      <div style="background-color: #fef2f2; border-radius: 6px; padding: 20px;">
                        <div style="margin-bottom: 15px; text-align: center;">
                          <span style="font-size: 32px;">🎄</span>
                          <span style="font-size: 32px;">🎁</span>
                          <span style="font-size: 32px;">🎅</span>
                        </div>
                        <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 20px; font-weight: bold; text-align: center; text-transform: uppercase;">
                          ⚠️ CHRISTMAS GIFT BAG - YES ⚠️
                        </h3>
                        <p style="margin: 0 0 15px 0; color: #374151; font-size: 16px; text-align: center; font-weight: 600;">
                          📦 Please prepare this order in a GIFT BAG!
                        </p>
                        ${data.giftMessage ? `
                        <div style="margin-top: 15px; padding: 15px; background-color: white; border-radius: 6px; border: 2px solid #dc2626;">
                          <p style="margin: 0 0 8px 0; color: #dc2626; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">Include This Gift Message Card:</p>
                          <p style="margin: 0; color: #111827; font-size: 16px; font-style: italic; padding: 10px; background-color: #fef2f2; border-radius: 4px;">"${data.giftMessage}"</p>
                        </div>
                        ` : `
                        <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; font-style: italic;">
                          No gift message provided - include a generic "Merry Christmas" card
                        </p>
                        `}
                      </div>
                    </div>
                    ` : `
                    <div style="margin-bottom: 20px; background-color: #f3f4f6; border-radius: 8px; padding: 15px; border: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                        <strong style="color: #374151;">Christmas Gift Bag:</strong> <span style="color: #6b7280;">No</span> - Standard packaging
                      </p>
                    </div>
                    `}

                    <!-- Action reminder -->
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>Action Required:</strong> ${data.deliveryMethod === 'pickup' ? 'Prepare order for customer collection.' : 'Arrange delivery via The Courier Guy.'}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1f2937; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      Alectra Solutions Order System | Order placed: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
