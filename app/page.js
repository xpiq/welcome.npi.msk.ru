import config from "@config/config.json";
import Cta from "@layouts/components/Cta";
import SeoMeta from "@layouts/SeoMeta";

import HomeBanner from "@layouts/partials/HomeBanner";
import HomeFeatures from "@layouts/partials/HomeFeatures";
import Services from "@layouts/partials/Services";
import Workflow from "@layouts/partials/Workflow";
import { getListPage } from "../lib/contentParser";

async function getHomepageFromStrapi() {
  try {
    const res = await fetch("http://127.0.0.1:1337/api/homepage", {
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

    return data.attributes ? data.attributes : data;
  } catch (error) {
    return null;
  }
}

const Home = async () => {
  const homePage = await getListPage("content/_index.md");
  const { frontmatter } = homePage;
  const { banner, feature, services, workflow, call_to_action } = frontmatter;
  const { title } = config.site;

  const homepage = await getHomepageFromStrapi();

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

  return (
    <>
      <SeoMeta title={title} />

      {/* Banner */}
      <HomeBanner banner={strapiBanner} />

      {/* Features */}
      <HomeFeatures feature={feature} />

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
