import NotFound from "@layouts/404";
import Contact from "@layouts/Contact";
import Default from "@layouts/Default";
import Faq from "@layouts/Faq";
import Pricing from "@layouts/Pricing";
import SeoMeta from "@layouts/SeoMeta";
import { getRegularPage, getSinglePage } from "@lib/contentParser";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const trimValue = (value) => (typeof value === "string" ? value.trim() : "");

async function getContactPageFromStrapi() {
  try {
    const res = await fetch("http://127.0.0.1:1337/api/contactpage?populate=*", {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const data = json.data?.attributes || json.data;

    if (!data) {
      return null;
    }

    const phone = trimValue(data.phone);
    const email = trimValue(data.email);
    const telegram = trimValue(data.telegram);
    const address = trimValue(data.address);
    const telegramUsername = telegram.replace(/^@/, "");

    return {
      title: trimValue(data.title),
      description: trimValue(data.description),
      button_text: trimValue(data.button_text),
      contacts: [
        address || null,
        phone ? `Телефон: [${phone}](tel:${phone.replace(/\s+/g, "")})` : null,
        email ? `Email: [${email}](mailto:${email})` : null,
        telegram
          ? `Telegram: [${telegram}](https://t.me/${telegramUsername})`
          : null,
      ].filter(Boolean),
    };
  } catch (error) {
    return null;
  }
}

async function getFaqsFromStrapi() {
  try {
    const res = await fetch(
      "http://127.0.0.1:1337/api/faqs?filters[is_active][$ne]=false&sort=order:asc",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return [];
    }

    const json = await res.json();

    return (json.data || [])
      .map((entry) => {
        const item = entry.attributes || entry;
        const question = trimValue(item.question);
        const answer = trimValue(item.answer);

        return question && answer ? { title: question, answer } : null;
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

// for all regular pages
const RegularPages = async ({ params }) => {
  const { regular } = params;
  const regularPageData = await getRegularPage(regular);
  const { meta_title, description, image, noindex, canonical, layout } =
    regularPageData.frontmatter;
  const { content } = regularPageData;
  const strapiContact =
    layout === "contact" ? await getContactPageFromStrapi() : null;
  const strapiFaqs = layout === "faq" ? await getFaqsFromStrapi() : [];

  if (layout === "faq" && !strapiFaqs.length) {
    notFound();
  }

  const pageData = strapiContact
    ? {
        ...regularPageData,
        frontmatter: {
          ...regularPageData.frontmatter,
          strapiContact,
        },
      }
    : layout === "faq"
      ? {
          ...regularPageData,
          frontmatter: {
            ...regularPageData.frontmatter,
            title: "Вопросы и ответы",
            faqs: strapiFaqs,
          },
        }
      : regularPageData;

  return (
    <>
      <SeoMeta
        title={strapiContact?.title || pageData.frontmatter.title}
        description={description ? description : content.slice(0, 120)}
        meta_title={meta_title}
        image={image}
        noindex={noindex}
        canonical={canonical}
      />
      {layout === "404" ? (
        <NotFound data={regularPageData} />
      ) : layout === "contact" ? (
        <Contact data={pageData} />
      ) : layout === "pricing" ? (
        <Pricing data={regularPageData} />
      ) : layout === "faq" ? (
        <Faq data={pageData} />
      ) : (
        <Default data={regularPageData} />
      )}
    </>
  );
};
export default RegularPages;

// for regular page routes
export const generateStaticParams = async () => {
  const allslugs = await getSinglePage("content");
  const slugs = allslugs.map((item) => item.slug).filter((slug) => slug !== "contact");
  const paths = slugs.map((slug) => ({
    regular: slug,
  }));

  return paths;
};
