import Social from "@components/Social";
import config from "@config/config.json";
import menu from "@config/menu.json";
import social from "@config/social.json";
import { markdownify } from "@lib/utils/textConverter";
import Image from "next/image";
import Link from "next/link";

const STRAPI_INTERNAL_URL =
  process.env.STRAPI_INTERNAL_URL || "http://127.0.0.1:1337";

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

const Footer = async () => {
  const { copyright, footer_content } = config.params;
  const { footer } = menu;
  const hasFaqs = await getFaqsExist();
  const visibleFooter = footer
    .map((column) => ({
      ...column,
      menu: column.menu.filter((item) => hasFaqs || item.url !== "/faq"),
    }))
    .filter((column) => column.menu.length > 0);

  return (
    <footer className="section bg-theme-light pb-0">
      <div className="container">
        {/* footer menu */}
        <div className="row">
          {visibleFooter.map((col) => {
            return (
              <div className="mb-12 sm:col-6 lg:col-3" key={col.name}>
                {markdownify(col.name, "h2", "h4")}
                <ul className="mt-6">
                  {col?.menu.map((item) => (
                    <li className="mb-1" key={item.text}>
                      <Link href={item.url} rel="">
                        {item.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {/* social icons */}
          <div className="md-12 sm:col-6 lg:col-3">
            <Link href="/" aria-label="Bigspring">
              <Image
                src={config.site.logo}
                width={config.site.logo_width}
                height={config.site.logo_height}
                alt=""
              />
            </Link>
            {markdownify(footer_content, "p", "mt-3 mb-6")}
            <Social source={social} className="social-icons mb-8" />
          </div>
        </div>
        {/* copyright */}
        <div className="border-t border-border py-6">
          {markdownify(copyright, "p", "text-sm text-center")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
