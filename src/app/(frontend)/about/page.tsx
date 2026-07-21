import { getPayloadClient } from "@/lib/getPayloadClient";
import ScrollReveal from "@/components/ScrollReveal";
import SectionHeader from "@/components/SectionHeader";

export const revalidate = 60;

export default async function AboutPage() {
  const payload = await getPayloadClient();
  const info: any = await payload.findGlobal({ slug: "about-page" });

  const title = info?.title || "About Primegen Trading Corporation";
  const description =
    info?.description ||
    "Add a company description in the admin panel under Globals -> About Page.";
  const address = info?.address || "Add your address in the admin panel.";
  const phone = info?.phone;
  const email = info?.email;
  const mapEmbedUrl = info?.mapEmbedUrl;

  return (
    <section className="py-16 mb-10 md:py-28 px-6 lg:px-8 max-w-[1200px] mx-auto bg-[#fdfffc] min-h-screen">
      {/* Page Header */}
      <SectionHeader
        size="page"
        eyebrow="Who We Are"
        title={title}
        description={description}
      />

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[380px_1fr]">
        {/* Contact Information Card */}
        <ScrollReveal
          direction="left"
          className="bg-white border border-[#01172f]/10 p-8 md:p-10 flex flex-col justify-center"
        >
          <h2 className="text-[20px] md:text-[24px] font-black uppercase tracking-tight text-[#01172f] mb-8">
            Visit / Contact Us
          </h2>

          <div className="flex flex-col gap-6">
            <div className="border-b border-[#01172f]/10 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-2">
                Address
              </p>
              <p className="m-0 whitespace-pre-line text-[15px] font-medium text-[#01172f]">
                {address}
              </p>
            </div>

            {phone && (
              <div className="border-b border-[#01172f]/10 pb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-2">
                  Phone
                </p>
                <p className="m-0">
                  <a
                    href={`tel:${phone}`}
                    className="text-[#3D5F3B] hover:text-[#149911] font-bold text-[15px] transition-colors"
                  >
                    {phone}
                  </a>
                </p>
              </div>
            )}

            {email && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#01172f]/40 mb-2">
                  Email
                </p>
                <p className="m-0">
                  <a
                    href={`mailto:${email}`}
                    className="text-[#3D5F3B] hover:text-[#149911] font-bold text-[15px] transition-colors"
                  >
                    {email}
                  </a>
                </p>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Map Card */}
        <ScrollReveal
          direction="left"
          style={{ transitionDelay: "120ms" }}
          className="bg-white border border-[#01172f]/10 overflow-hidden min-h-[400px] lg:min-h-[500px] flex items-center justify-center relative"
        >
          {mapEmbedUrl ? (
            <iframe
              src={mapEmbedUrl}
              className="absolute inset-0 w-full h-full border-0 grayscale-[10%] opacity-90 transition-opacity hover:opacity-100 hover:grayscale-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Location Map"
            />
          ) : (
            <p className="p-8 text-center text-[15px] font-medium text-[#01172f]/50 max-w-sm">
              Add a Google Maps embed URL in the admin panel under Globals
              &rarr; About Page to show the map here.
            </p>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}
