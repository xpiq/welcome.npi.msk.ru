import config from "@config/config.json";
import Cta from "@layouts/components/Cta";
import SeoMeta from "@layouts/SeoMeta";

import HomeBanner from "@layouts/partials/HomeBanner";
import HomeFeatures from "@layouts/partials/HomeFeatures";
import Services from "@layouts/partials/Services";
import Workflow from "@layouts/partials/Workflow";
import { getListPage } from "../lib/contentParser";

const STRAPI_API_URL = "http://127.0.0.1:1337";
const STRAPI_PUBLIC_URL = "https://strapi.npi.msk.ru";

const getStrapiData = (entry) => entry?.attributes || entry;
const trimValue = (value) => (typeof value === "string" ? value.trim() : "");

const getStrapiMediaUrl = (media) => {
  const mediaData = getStrapiData(media?.data || media);
  const url = mediaData?.url;

  if (!url) {
    return "";
  }

  return url.startsWith("http") ? url : STRAPI_PUBLIC_URL + url;
};

async function getHomepageFromStrapi() {
  try {
    const res = await fetch(STRAPI_API_URL + "/api/homepage", {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const data = json.data;

    if (!data) {
      return null;
    }

    return getStrapiData(data);
  } catch (error) {
    return null;
  }
}

async function getSiteSettingsFromStrapi() {
  try {
    const res = await fetch(STRAPI_API_URL + "/api/site-setting?populate=*", {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const data = json.data;

    if (!data) {
      return null;
    }

    return getStrapiData(data);
  } catch (error) {
    return null;
  }
}

async function getSyntkItemsFromStrapi() {
  try {
    const res = await fetch(
      STRAPI_API_URL + "/api/syntks?populate=image&filters[show][$ne]=false&sort=order:asc",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();

    return (json.data || [])
      .map((entry) => {
        const item = getStrapiData(entry);
        const title = trimValue(item.title);
        const content = trimValue(item.short_text);

        if (!title && !content) {
          return null;
        }

        return {
          name: title,
          content,
          icon: getStrapiMediaUrl(item.image),
          background_color: trimValue(item.background_color),
          order: item.order,
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

const Home = async () => {
  const homePage = await getListPage("content/_index.md");
  const { frontmatter } = homePage;
  const { banner, feature, services, workflow, call_to_action } = frontmatter;
  const { title } = config.site;

  const [homepage, siteSettings, syntkItems] = await Promise.all([
    getHomepageFromStrapi(),
    getSiteSettingsFromStrapi(),
    getSyntkItemsFromStrapi(),
  ]);

  const strapiBanner = homepage
    ? {
        ...banner,
        title: homepage.hero_title || banner.title,
        content: homepage.hero_description || homepage.hero_subtitle || banner.content,
        button: {
          ...banner.button,
          label: homepage.hero_button_text || banner.button.label,
          link: homepage.hero_button_url || banner.button.link,
        },
      }
    : banner;

  const syntkFeature = {
    ...feature,
    title: homepage?.features_title || feature.title,
    features: syntkItems.length ? syntkItems : feature.features,
  };
  const showSyntkBlock = siteSettings?.show_syntk_block !== false;

  return (
    <>
      <SeoMeta title={title} />

      {/* Banner */}
      <HomeBanner banner={strapiBanner} />

      {/* Features */}
      {showSyntkBlock && <HomeFeatures feature={syntkFeature} />}

      {/* services */}
      <Services services={services} />

      {/* workflow */}
      <Workflow workflow={workflow} />

      {/* Cta */}
      <Cta cta={call_to_action} />
    </>
  );
};

export default Home;
