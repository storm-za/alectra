import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

import customer1 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.06_1764772507956.jpeg";
import customer2 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.05_1764772507956.jpeg";
import customer3 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.04_1764772507956.jpeg";
import customer4 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.03_1764772507956.jpeg";
import customer5 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.12_1764772507957.jpeg";
import customer6 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.11_1764772507957.jpeg";
import customer7 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.10_1764772507957.jpeg";
import customer8 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.09_1764772507957.jpeg";
import customer9 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.08_1764772507957.jpeg";
import customer10 from "@assets/WhatsApp_Image_2025-12-03_at_14.29.07_1764772507958.jpeg";

const customerImages = [
  { src: customer1, alt: "Happy customer at Alectra Solutions Pretoria store" },
  { src: customer2, alt: "Customer with Nice gate motor products" },
  { src: customer3, alt: "Customer receiving Gemini gate motor" },
  { src: customer4, alt: "Happy customers with Gemini sliding gate operator" },
  { src: customer5, alt: "Customer at Alectra Wonderboom branch" },
  { src: customer6, alt: "Satisfied customer with solar camera purchase" },
  { src: customer7, alt: "Customer with Gemini gate motor at store" },
  { src: customer8, alt: "Happy customer with Gemini product" },
  { src: customer9, alt: "Customer collecting Gemini gate motor" },
  { src: customer10, alt: "Customers at Alectra Solutions store" },
];

export function HappyCustomersGallery() {
  return (
    <section className="py-8 border-t" data-testid="section-happy-customers">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Our Happy Customers</h2>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          Recent pickups from our Pretoria branches
        </p>
      </div>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {customerImages.map((image, index) => (
            <CarouselItem
              key={index}
              className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              data-testid={`customer-image-${index}`}
            >
              <Card className="overflow-hidden border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-3 md:-left-5 bg-background/90 backdrop-blur-sm" />
        <CarouselNext className="-right-3 md:-right-5 bg-background/90 backdrop-blur-sm" />
      </Carousel>
    </section>
  );
}
