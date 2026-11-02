import { markdownify } from "@lib/utils/textConverter";

const Workflow = ({ workflow }) => {
  return (
    <section className="section pb-0">
      <div className="mb-8 text-center">
        {markdownify(
          workflow.title,
          "h2",
          "mx-auto max-w-[400px] font-bold leading-[44px]"
        )}
        {markdownify(workflow.description, "p", "mt-3")}
      </div>
    </section>
  );
};

export default Workflow;
