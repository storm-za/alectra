import { SiWhatsapp } from "react-icons/si";

export default function WhatsAppButton() {
  const phoneNumber = "27745124065";
  const message = "Hi Alectra Solutions! I'm interested in your security products.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Chat with us on WhatsApp"
      data-testid="button-whatsapp-chat"
    >
      <SiWhatsapp className="w-7 h-7" />
    </a>
  );
}
