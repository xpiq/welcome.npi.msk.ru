import { readFile } from "fs/promises";
import nodemailer from "nodemailer";

const STRAPI_API_URL = "http://127.0.0.1:1337";
const DEFAULT_TO_EMAIL = "hello@npi.msk.ru";
const DEFAULT_SUBJECT_PREFIX = "Сообщение с сайта";

const trimValue = (value) => (typeof value === "string" ? value.trim() : "");

const stripHeaderValue = (value) => trimValue(value).replace(/[\r\n]+/g, " ");

const getStrapiData = (entry) => entry?.attributes || entry;

async function fetchStrapiSingleType(path) {
  try {
    const res = await fetch(STRAPI_API_URL + path, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return getStrapiData(json.data);
  } catch (error) {
    return null;
  }
}

async function getLegacyRecipientEmail() {
  const data = await fetchStrapiSingleType("/api/site-setting?populate=*");
  const email = trimValue(data?.contact_email);

  return email || DEFAULT_TO_EMAIL;
}

async function readPasswordFile(filePath) {
  const passwordFile = trimValue(filePath);

  if (!passwordFile) {
    return "";
  }

  try {
    return trimValue(await readFile(passwordFile, "utf8"));
  } catch (error) {
    console.error("SMTP password file could not be read", error);
    return "";
  }
}

async function getMailSettings() {
  const mailSettings = await fetchStrapiSingleType("/api/mail-setting/internal");
  const legacyToEmail = await getLegacyRecipientEmail();
  const smtpHost = trimValue(mailSettings?.smtp_host) || trimValue(process.env.SMTP_HOST);
  const smtpPort = Number(mailSettings?.smtp_port || process.env.SMTP_PORT || 465);
  const smtpUser = trimValue(mailSettings?.smtp_user) || trimValue(process.env.SMTP_USER);
  const fromEmail = trimValue(mailSettings?.from_email) || trimValue(process.env.CONTACT_FROM_EMAIL) || smtpUser;
  const toEmail = trimValue(mailSettings?.to_email) || legacyToEmail;
  const subjectPrefix = trimValue(mailSettings?.subject_prefix) || DEFAULT_SUBJECT_PREFIX;
  const smtpPass = await readPasswordFile(mailSettings?.smtp_password_file) || trimValue(process.env.SMTP_PASS);

  return {
    enabled: mailSettings?.enabled !== false,
    smtpHost,
    smtpPort,
    smtpSecure: typeof mailSettings?.smtp_secure === "boolean" ? mailSettings.smtp_secure : smtpPort === 465,
    smtpUser,
    smtpPass,
    fromEmail,
    toEmail,
    subjectPrefix,
  };
}

function getSmtpTransport(settings) {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    throw new Error("SMTP settings are incomplete");
  }

  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
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
    const settings = await getMailSettings();

    if (!settings.enabled) {
      return Response.json(
        { ok: false, message: "Отправка формы временно отключена" },
        { status: 503 }
      );
    }

    const transport = getSmtpTransport(settings);

    await transport.sendMail({
      to: settings.toEmail,
      from: settings.fromEmail,
      replyTo: email,
      subject: settings.subjectPrefix + ": " + subject,
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
