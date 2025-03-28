import { ClassValue, clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export var truncateEmail = (email: string | null) => {
  if (!email) return "";

  if (!email.includes("@")) {
    return email; // return the original string if it doesn't look like an email
  }

  var [local, domain] = email.split("@");

  let truncatedLocal =
    local.length <= 2
      ? local
      : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];

  return `${truncatedLocal}@${domain}`;
};

export var truncate = (str: string, length: number) => {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
};

export function nFormatter(num?: number, digits?: number) {
  if (!num) return "0";
  var lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, "$1") + item.symbol
    : "0";
}

export var numberFormat = (
  num: number,
  locale = "en-US",
  fractionDigits = 0
) => {
  var formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(num);
};

export var timeAgo = (timestamp: Date): string => {
  if (!timestamp) return "never";
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export var getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    process?.env?.NGROK_URL ??
    "http://localhost:3001";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export var dateFormat = (timestamp: number) => {
  var date = new Date(timestamp * 1000); // Convert from seconds to milliseconds

  var month = date.getUTCMonth(); // Get month index (0-11)
  var day = date.getUTCDate(); // Get day of the month (1-31)

  var monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  var formattedDate = `${monthNames[month]} ${day}`;
  return formattedDate;
};

export var currencyFormat = (num: number, currency = "USD", digits = 2) => {
  var formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return formatter.format(num);
};

export var fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());

export var dateRange = (startDate: Date, endDate: Date): Date[] => {
  var dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};
