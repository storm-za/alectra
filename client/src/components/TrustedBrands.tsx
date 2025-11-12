export default function TrustedBrands() {
  const brands = [
    "CENTURION",
    "ET NICE",
    "DIGIDOOR",
    "GEMINI",
    "DTS",
    "HANSA",
    "Nemtek",
    "IDS",
    "Sentry",
    "Hilook",
    "Hikvision",
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Trusted Brands
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Alectra Solutions partners with the largest and most trusted brands in South Africa
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brands.map((brand) => (
            <div
              key={brand}
              className="flex items-center justify-center p-6 bg-white rounded-lg border hover-elevate"
            >
              <span className="text-sm font-semibold text-center text-muted-foreground">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
