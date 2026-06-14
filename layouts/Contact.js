"use client";

import config from "@config/config.json";
import { markdownify } from "@lib/utils/textConverter";
import { useEffect, useRef, useState } from "react";

const Contact = ({ data }) => {
  const { frontmatter } = data;
  const { title, info, strapiContact } = frontmatter;
  const { contact_form_action } = config.params;
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
  const [captcha, setCaptcha] = useState({ question: "3 + 4", answer: "7" });
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  useEffect(() => {
    const firstNumber = Math.floor(Math.random() * 8) + 2;
    const secondNumber = Math.floor(Math.random() * 8) + 2;

    setCaptcha({
      question: firstNumber + " + " + secondNumber,
      answer: String(firstNumber + secondNumber),
    });
  }, []);

  const handleSubmit = (event) => {
    if (captchaValue.trim() === captcha.answer) {
      return;
    }

    event.preventDefault();
    setCaptchaError("Проверьте ответ на пример");
    captchaInputRef.current?.focus();
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
              action={contact_form_action}
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
                  rows="7"
                  placeholder="Сообщение"
                />
              </div>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-dark">
                  Проверка: сколько будет {captcha.question}?
                </label>
                <input
                  ref={captchaInputRef}
                  className="form-input w-full rounded"
                  name="captcha"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={captchaValue}
                  onChange={(event) => {
                    setCaptchaValue(event.target.value);
                    setCaptchaError("");
                  }}
                  required
                />
                {captchaError && (
                  <p className="mt-2 text-sm text-red-600">{captchaError}</p>
                )}
              </div>
              <button type="submit" className="btn btn-primary">
                {submitLabel}
              </button>
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
