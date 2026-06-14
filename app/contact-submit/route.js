import nodemailer from "nodemailer";

const STRAPI_API_URL = "http://127.0.0.1:1337";
const DEFAULT_TO_EMAIL = "hello@npi.msk.ru";

const trimValue = (value) => (typeof value === "string" ? value.trim() : "");

const stripHeaderValue = (value) => trimValue(value).replace(/[\r\n]+/g, " ");

async function getRecipientEmail() {
  try {
    const res = await fetch(STRAPI_API_URL + "/api/site-setting?populate=*", {
      cache: "no-store",
    });

    if (!res.ok) {
      return DEFAULT_TO_EMAIL;
    }

    const json = await res.json();
    const data = json.data?.attributes || json.data;
    const email = trimValue(data?.contact_email);

    return email || DEFAULT_TO_EMAIL;
  } catch (error) {
    return DEFAULT_TO_EMAIL;
  }
}

function getSmtpTransport() {
  const host = trimValue(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT || 465);
  const user = trimValue(process.env.SMTP_USER);
  const pass = trimValue(process.env.SMTP_PASS);

  if (!host || !user || !pass) {
    throw new Error("SMTP settings are incomplete");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function POST(request) {
  const formData = await request.formData();
  const name = stripHeaderValue(formData.get("name"));
  const email = stripHeaderValue(formData.get("email"));
  const subject = stripHeaderValue(formData.get("subject"));
  const message = trimValue(formData.get("message"));
  const captcha = trimValue(formData.get("captcha"));
  const captchaAnswer = trimValue(formData.get("captcha_answer"));

  if (!name || !email || !subject || !message) {
    return Response.json(
      { ok: false, message: "Заполните все поля формы" },
      { status: 400 }
    );
  }

  if (!captchaAnswer || captcha !== captchaAnswer) {
    return Response.json(
      { ok: false, message: "Проверьте ответ на пример" },
      { status: 400 }
    );
  }

  const toEmail = await getRecipientEmail();
  const fromEmail = trimValue(process.env.CONTACT_FROM_EMAIL) || trimValue(process.env.SMTP_USER);
  const mailSubject = "Сообщение с сайта: " + subject;
  const text = [
    "Новое сообщение с формы контактов",
    "",
    "Имя: " + name,
    "Email: " + email,
    "Тема: " + subject,
    "",
    "Сообщение:",
    message,
  ].join("\n");

  try {
    const transport = getSmtpTransport();

    await transport.sendMail({
      to: toEmail,
      from: fromEmail,
      replyTo: email,
      subject: mailSubject,
      text,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact form email failed", error);

    return Response.json(
      { ok: false, message: "Не удалось отправить сообщение" },
      { status: 500 }
    );
  }
}
