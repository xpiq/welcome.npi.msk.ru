import { markdownify } from "@lib/utils/textConverter";
import Link from "next/link";

function Cta({ cta }) {
  return (
    <section className="section px-4">
      <div className="section container rounded-xl shadow">
        <div className="row mx-auto items-center justify-center">
          <div className="text-center md:col-8">
            <h2>{cta?.title}</h2>
            <p className="mt-6">{markdownify(cta?.content)}</p>
            {cta.button?.enable && (
              <Link
                className="btn btn-primary mt-4"
                href={cta.button.link}
                rel={cta.button.rel}
              >
                {cta.button.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Cta;
