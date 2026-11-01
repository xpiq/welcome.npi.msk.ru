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

async function getFaqsExist() {
  try {
    const res = await fetch(
      STRAPI_INTERNAL_URL +
        "/api/faqs?filters[is_active][$ne]=false&pagination[pageSize]=1",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return false;
    }

    const json = await res.json();
    return (json.data || []).length > 0;
  } catch {
    return false;
  }
}

const Header = async () => {
  const [siteSettings, hasFaqs] = await Promise.all([
    getSiteSettings(),
    getFaqsExist(),
  ]);

  return <HeaderClient siteSettings={siteSettings} hasFaqs={hasFaqs} />;
};

export default Header;
