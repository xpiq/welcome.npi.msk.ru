"use client";

import config from "@config/config.json";
import { markdownify } from "@lib/utils/textConverter";
import { useCallback, useEffect, useRef, useState } from "react";

const Contact = ({ data }) => {
  const { frontmatter } = data;
  const { title, info, strapiContact } = frontmatter;
  const { contact_form_action } = config.params;
  const formAction = contact_form_action || "/contact-submit";
  const contactTitle = strapiContact?.title || title;
  const contactInfo = {
    title: strapiContact?.description || info.title,
    description: strapiContact ? "" : info.description,
    contacts: strapiContact?.contacts?.length
      ? strapiContact.contacts
      : info.contacts,
  };
  const submitLabel = strapiContact?.button_text || "Отправить";
  const captchaInputRef = useRef(null);
  const [captcha, setCaptcha] = useState({ question: "", token: "" });
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [formStatus, setFormStatus] = useState("idle");
  const [formMessage, setFormMessage] = useState("");

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaValue("");

    try {
      const res = await fetch("/api/contact-captcha", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.question || !data.token) {
        throw new Error(data.message || "Не удалось загрузить проверку");
      }

      setCaptcha({ question: data.question, token: data.token });
      setCaptchaError("");
      return true;
    } catch (error) {
      setCaptcha({ question: "", token: "" });
      setCaptchaError(error.message || "Не удалось загрузить проверку");
      return false;
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!captcha.token) {
      setFormStatus("idle");
      setFormMessage("Проверка ещё не готова");
      captchaInputRef.current?.focus();
      return;
    }

    setCaptchaError("");
    setFormStatus("sending");
    setFormMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(formAction, {
        method: "POST",
        body: formData,
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok || result.ok === false) {
        throw new Error(result.message || "Не удалось отправить сообщение");
      }

      form.reset();
      await loadCaptcha();
      setFormStatus("success");
      setFormMessage("Сообщение отправлено");
    } catch (error) {
      setFormStatus("error");
      setFormMessage(error.message || "Не удалось отправить сообщение");
      await loadCaptcha();
    }
  };

  return (
    <section className="section">
      <div className="container">
        {markdownify(contactTitle, "h1", "text-center font-normal")}
        <div className="section row pb-0">
          <div className="col-12 md:col-6 lg:col-7">
            <form
              className="contact-form"
              method="POST"
              action={formAction}
              onSubmit={handleSubmit}
            >
              <div className="mb-3">
                <input
                  className="form-input w-full rounded"
                  name="name"
                  type="text"
                  placeholder="Ваше имя"
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  className="form-input w-full rounded"
                  name="email"
                  type="email"
                  placeholder="Ваш email"
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  className="form-input w-full rounded"
                  name="subject"
                  type="text"
                  placeholder="Тема"
                  required
                />
              </div>
              <div className="mb-3">
                <textarea
                  className="form-textarea w-full rounded-md"
                  name="message"
                  rows="7"
                  placeholder="Сообщение"
                  required
                />
              </div>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-dark">
                  {captcha.question
                    ? `Проверка: сколько будет ${captcha.question}?`
                    : "Загружаем проверку..."}
                </label>
                <input
                  ref={captchaInputRef}
                  className="form-input w-full rounded"
                  name="captcha"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={captchaLoading || !captcha.token}
                  value={captchaValue}
                  onChange={(event) => {
                    setCaptchaValue(event.target.value);
                    setCaptchaError("");
                    setFormMessage("");
                    setFormStatus("idle");
                  }}
                />
                <input type="hidden" name="captcha_token" value={captcha.token} />
                {captchaError && (
                  <p className="mt-2 text-sm text-red-600">{captchaError}</p>
                )}
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formStatus === "sending" || captchaLoading || !captcha.token}
              >
                {formStatus === "sending" ? "Отправляем..." : submitLabel}
              </button>
              {formMessage && (
                <p
                  className={`mt-4 text-sm ${
                    formStatus === "success" ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {formMessage}
                </p>
              )}
            </form>
          </div>
          <div className="content col-12 md:col-6 lg:col-5">
            {markdownify(contactInfo.title, "h4")}
            {markdownify(contactInfo.description, "p", "mt-4")}
            <ul className="contact-list mt-5">
              {contactInfo.contacts.map((contact, index) => (
                <li key={index}>
                  {markdownify(contact, "strong", "text-dark")}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
