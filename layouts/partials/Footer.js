import Link from "next/link";

const STRAPI_INTERNAL_URL =
  process.env.STRAPI_INTERNAL_URL || "http://127.0.0.1:1337";

const trimValue = (value) => (typeof value === "string" ? value.trim() : "");

async function getSiteSettings() {
  try {
    const res = await fetch(
      STRAPI_INTERNAL_URL + "/api/site-setting?populate=*",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data?.attributes || json.data || null;
  } catch {
    return null;
  }
}

const Footer = async () => {
  const settings = await getSiteSettings();
  const siteName = trimValue(settings?.site_name) || "NPI";
  const footerText = trimValue(settings?.footer_text);
  const phone = trimValue(settings?.contact_phone);
  const email = trimValue(settings?.contact_email);
  const telegram = trimValue(settings?.telegram);
  const telegramUsername = telegram.replace(/^@/, "");

  return (
    <footer className="section bg-theme-light pb-0">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xl font-bold text-dark">{siteName}</p>
          {footerText && <p className="mt-3">{footerText}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {phone && <Link href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</Link>}
            {email && <Link href={`mailto:${email}`}>{email}</Link>}
            {telegram && (
              <Link href={`https://t.me/${telegramUsername}`}>
                {telegram}
              </Link>
            )}
          </div>
        </div>
        <div className="mt-10 border-t border-border py-6 text-center text-sm">
          © {new Date().getFullYear()} {siteName}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
