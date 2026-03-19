"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader } from "lucide-react";

const DEFAULT_CLIENTS = [
  { name: "Fieldbase Technical Services", logo: "/images/fieldbase.jpg" },
  { name: "Huawei Technologies Limited", logo: "/images/huawei.png" },
  { name: "MTN", logo: "/images/mtn.jpg" },
  { name: "Airtel", logo: "/images/airtel.png" },
  { name: "CIF Telecommunications Limited", logo: "/images/cif.png" },
  { name: "Mainone", logo: "/images/mainone.jpg" },
  { name: "IPNX", logo: "/images/ipnx.png" },
  { name: "WIOCC", logo: "/images/wiocc.jpg" },
  { name: "ntel", logo: "/images/ntel.png" },
];

export default function ClientsLogoSlider() {
  const sliderRef = useRef(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();

        if (data.success && data.clients) {
          const sortedClients = [...data.clients].sort((a, b) => (a.order || 0) - (b.order || 0));
          setPartners(sortedClients);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
        setPartners(DEFAULT_CLIENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    if (loading || partners.length === 0) return;

    const slider = sliderRef.current;
    let scrollAmount = 0;

    const autoScroll = setInterval(() => {
      if (slider) {
        scrollAmount += 1;
        slider.scrollLeft = scrollAmount;

        if (scrollAmount >= slider.scrollWidth / 2) {
          scrollAmount = 0; // reset for infinite loop effect
        }
      }
    }, 20);

    return () => clearInterval(autoScroll);
  }, [partners, loading]);

  return (
    <section className="py-12 bg-gray-50">
      <h2 className="text-center text-2xl md:text-3xl font-bold mb-8 text-gray-900">
        Our Partners
      </h2>
      <p className="text-center text-gray-600 mb-8 w-full md:w-1/2 mx-auto">Fieldbase Technical Services Limited | Huawei Technogies Ltd Rich&Ray Communications Ltd. | Cyberspace | CIF Telecommunications Limited. And other numerous prospective partners.</p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-900" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No clients configured yet</p>
        </div>
      ) : (
        <div className="overflow-hidden relative">
          <div
            ref={sliderRef}
            className="flex gap-8 md:gap-10 whitespace-nowrap overflow-hidden"
          >
            {/* Duplicate list for infinite scrolling */}
            {[...partners, ...partners].map((partner, i) => (
              <div
                key={i}
                className="flex items-center justify-center min-w-[140px] md:min-w-40 h-20 md:h-24 px-4 bg-white shadow-sm rounded-md border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={120}
                    height={80}
                    className="object-contain max-w-[90%] max-h-[90%]"
                    unoptimized
                    sizes="20"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.target.style.display = "none";
                    }}
                  />
                  <span 
                    className="text-gray-600 font-medium text-xs md:text-sm text-center hidden"
                    id={`fallback-${i}`}
                  >
                    {partner.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
