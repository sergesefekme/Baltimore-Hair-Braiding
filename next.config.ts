import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 raised this default from 60 seconds to 4 hours, which means
    // replacing a photograph at the same filename leaves the old one on screen
    // for up to four hours. Filenames are the whole cache key here — the whole
    // point of the drop-in workflow — so photos get swapped often.
    //
    // Query-string versioning is not an option: Next 16 requires every local
    // image search string to be declared verbatim in images.localPatterns, and
    // a per-file mtime cannot be. So shorten the TTL instead.
    minimumCacheTTL: 60,
  },
  async redirects() {
    return [
      {
        // /services and /menu were separate pages listing the same 44 services.
        // They are now one image-led page. 308 so the old URL stops being
        // indexed and any existing links keep working.
        source: "/services",
        destination: "/menu",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
