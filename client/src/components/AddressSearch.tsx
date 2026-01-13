import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, X } from "lucide-react";

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export interface ParsedAddress {
  fullAddress: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface AddressSearchProps {
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressSearch({ 
  onAddressSelect, 
  placeholder = "Search for your address...",
  className = ""
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const searchAddress = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: searchQuery,
          format: "json",
          addressdetails: "1",
          countrycodes: "za",
          limit: "5"
        }),
        {
          headers: {
            "Accept-Language": "en",
          }
        }
      );
      
      if (response.ok) {
        const data: NominatimResult[] = await response.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      }
    } catch (error) {
      console.error("Address search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchAddress(query);
      }, 400);
    } else {
      setResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchAddress]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseAddress = (result: NominatimResult): ParsedAddress => {
    const addr = result.address;
    
    const houseNumber = addr.house_number || "";
    const road = addr.road || "";
    const suburb = addr.suburb || "";
    
    const streetParts = [houseNumber, road].filter(Boolean);
    const streetAddress = streetParts.length > 0 
      ? streetParts.join(" ") + (suburb ? `, ${suburb}` : "")
      : suburb || result.display_name.split(",")[0];

    const city = addr.city || addr.town || addr.village || addr.municipality || "";
    
    const provinceMap: Record<string, string> = {
      "Gauteng": "Gauteng",
      "Western Cape": "Western Cape",
      "KwaZulu-Natal": "KwaZulu-Natal",
      "Eastern Cape": "Eastern Cape",
      "Free State": "Free State",
      "Limpopo": "Limpopo",
      "Mpumalanga": "Mpumalanga",
      "Northern Cape": "Northern Cape",
      "North West": "North West",
      "North-West": "North West",
    };
    
    const rawProvince = addr.state || "";
    const province = provinceMap[rawProvince] || rawProvince;
    
    const postalCode = addr.postcode || "";

    return {
      fullAddress: result.display_name,
      streetAddress,
      city,
      province,
      postalCode,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  };

  const handleSelect = (result: NominatimResult) => {
    const parsed = parseAddress(result);
    onAddressSelect(parsed);
    setQuery(result.display_name);
    setShowDropdown(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11"
          data-testid="input-address-search"
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={clearSearch}
            data-testid="button-clear-search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          <ul className="py-1 max-h-64 overflow-y-auto">
            {results.map((result) => (
              <li key={result.place_id}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left hover-elevate flex items-start gap-3 transition-colors"
                  onClick={() => handleSelect(result)}
                  data-testid={`button-address-result-${result.place_id}`}
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm leading-tight line-clamp-2">{result.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
