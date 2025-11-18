import nodemailer from "nodemailer";

export interface OrderEmailData {
  orderId: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryProvince: string;
  deliveryPostalCode: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  vat: string;
  total: string;
  tradeDiscount?: string;
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

  private generateOrderConfirmationHtml(data: OrderEmailData): string {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">R${item.price}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">R${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
        </tr>
      `
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
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #111827;">Total Paid:</td>
                        <td style="padding: 12px 0; text-align: right; width: 120px; font-size: 18px; font-weight: bold; color: #FF9800;">R${data.total}</td>
                      </tr>
                    </table>
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
                      📞 012 566 3123 &nbsp;&nbsp;|&nbsp;&nbsp; 📧 info@alectra.co.za
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
    const itemsSummary = data.items
      .map((item) => `${item.quantity}x ${item.productName}`)
      .join(", ");

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
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #FF9800 0%, #FFEB3B 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">New Order Received</h1>
                    <p style="margin: 8px 0 0 0; color: #1f2937; font-size: 14px;">Alectra Solutions Internal Notification</p>
                  </td>
                </tr>

                <!-- Order summary -->
                <tr>
                  <td style="padding: 30px;">
                    <div style="background-color: #10b981; color: white; display: inline-block; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin-bottom: 20px;">
                      ✓ Payment Confirmed
                    </div>
                    
                    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Order #${data.reference}</h2>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Order ID:</strong> ${data.orderId}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Total Amount:</strong> <span style="color: #FF9800; font-weight: bold; font-size: 18px;">R${data.total}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Number of Items:</strong> ${data.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Customer Name:</strong> ${data.customerName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Customer Email:</strong> ${data.customerEmail}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">Delivery City:</strong> ${data.deliveryCity}, ${data.deliveryProvince}
                        </td>
                      </tr>
                    </table>

                    <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        <strong>Items Ordered:</strong><br>
                        ${itemsSummary}
                      </p>
                    </div>

                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⚠️ Security Note:</strong> Full customer contact details and delivery address are NOT included in this email for privacy protection. Access the order management system to view complete customer information.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px;">
                      This is an automated internal notification from the Alectra Solutions order system.
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
