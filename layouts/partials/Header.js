import HeaderClient from "./HeaderClient";

const STRAPI_INTERNAL_URL =
  process.env.STRAPI_INTERNAL_URL || "http://127.0.0.1:1337";

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

const Header = async () => {
  const siteSettings = await getSiteSettings();

  return <HeaderClient siteSettings={siteSettings} />;
};

export default Header;
