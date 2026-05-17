const venezuelaTimeZone = "America/Caracas";

function normalizeDateText(value: string) {
  return value.replace(/[\u00A0\u202F]/g, " ");
}

function formatDate(value: string | number | Date, formatter: Intl.DateTimeFormat) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  return normalizeDateText(formatter.format(date));
}

const mediumDateFormatter = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeZone: venezuelaTimeZone,
});

const mediumDateTimeFormatter = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: venezuelaTimeZone,
});

const compactDateFormatter = new Intl.DateTimeFormat("es-VE", {
  day: "2-digit",
  month: "short",
  timeZone: venezuelaTimeZone,
});

export function formatEsVeDate(value: string | number | Date) {
  return formatDate(value, mediumDateFormatter);
}

export function formatEsVeDateTime(value: string | number | Date) {
  return formatDate(value, mediumDateTimeFormatter);
}

export function formatEsVeCompactDate(value: string | number | Date) {
  return formatDate(value, compactDateFormatter);
}