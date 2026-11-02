import Cta from "@layouts/components/Cta";
import SeoMeta from "@layouts/SeoMeta";
import HomeBanner from "@layouts/partials/HomeBanner";
import HomeFeatures from "@layouts/partials/HomeFeatures";
import Services from "@layouts/partials/Services";
import Workflow from "@layouts/partials/Workflow";

const STRAPI_API_URL =
  process.env.STRAPI_INTERNAL_URL || "http://127.0.0.1:1337";
const STRAPI_PUBLIC_URL =
  process.env.STRAPI_PUBLIC_URL || "https://strapi.npi.msk.ru";

const getStrapiData = (entry) => entry?.attributes || entry;
const trimValue = (value) => (typeof value === "string" ? value.trim() : "");

const getStrapiMediaUrl = (media) => {
  const mediaData = getStrapiData(media?.data || media);
  const url = mediaData?.url;

  return url ? (url.startsWith("http") ? url : STRAPI_PUBLIC_URL + url) : "";
};

async function fetchStrapi(path) {
  try {
    const res = await fetch(STRAPI_API_URL + path, { cache: "no-store" });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

async function getHomepageFromStrapi() {
  const data = await fetchStrapi("/api/homepage");
  return getStrapiData(data);
}

async function getAdvantagesFromStrapi() {
  const data = await fetchStrapi("/api/advantages?populate=icon&sort=order:asc");

  return (data || [])
    .map((entry) => {
      const item = getStrapiData(entry);
      const title = trimValue(item.title);
      const content = trimValue(item.description);

      return title && content
        ? { title, content, icon: getStrapiMediaUrl(item.icon) }
        : null;
    })
    .filter(Boolean);
}

async function getServicesFromStrapi() {
  const data = await fetchStrapi("/api/services?populate=image&sort=order:asc");

  return (data || [])
    .map((entry) => {
      const item = getStrapiData(entry);
      const title = trimValue(item.title);
      const content = trimValue(item.description) || trimValue(item.short_description);

      if (!title || !content) {
        return null;
      }

      const image = getStrapiMediaUrl(item.image);
      const buttonLabel = trimValue(item.button_text);
      const buttonLink = trimValue(item.button_url);

      return {
        title,
        content,
        images: image ? [image] : [],
        button: {
          enable: Boolean(buttonLabel && buttonLink),
          label: buttonLabel,
          link: buttonLink,
        },
      };
    })
    .filter(Boolean);
}

const Home = async () => {
  const [homepage, advantages, services] = await Promise.all([
    getHomepageFromStrapi(),
    getAdvantagesFromStrapi(),
    getServicesFromStrapi(),
  ]);
  const heroTitle = trimValue(homepage?.hero_title);
  const heroContent =
    trimValue(homepage?.hero_description) || trimValue(homepage?.hero_subtitle);
  const heroButtonLabel = trimValue(homepage?.hero_button_text);
  const heroButtonLink = trimValue(homepage?.hero_button_url);
  const workflowTitle = trimValue(homepage?.workflow_title);
  const workflowDescription = trimValue(homepage?.workflow_description);
  const ctaTitle = trimValue(homepage?.cta_title);
  const ctaContent = trimValue(homepage?.cta_content);
  const ctaButtonLabel = trimValue(homepage?.cta_button_text);
  const ctaButtonLink = trimValue(homepage?.cta_button_url);

  const banner = heroTitle
    ? {
        title: heroTitle,
        content: heroContent,
        button: {
          enable: Boolean(heroButtonLabel && heroButtonLink),
          label: heroButtonLabel,
          link: heroButtonLink,
        },
      }
    : null;
  const workflow = workflowTitle || workflowDescription
    ? { title: workflowTitle, description: workflowDescription }
    : null;
  const cta = ctaTitle || ctaContent || (ctaButtonLabel && ctaButtonLink)
    ? {
        title: ctaTitle,
        content: ctaContent,
        button: {
          enable: Boolean(ctaButtonLabel && ctaButtonLink),
          label: ctaButtonLabel,
          link: ctaButtonLink,
        },
      }
    : null;

  return (
    <>
      <SeoMeta title={heroTitle || "NPI"} description={heroContent} />
      {banner && <HomeBanner banner={banner} />}
      {advantages.length > 0 && (
        <HomeFeatures feature={{ title: trimValue(homepage?.features_title), features: advantages }} />
      )}
      {services.length > 0 && <Services services={services} />}
      {workflow && <Workflow workflow={workflow} />}
      {cta && <Cta cta={cta} />}
    </>
  );
};

export default Home;
