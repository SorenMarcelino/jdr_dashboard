import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const SUPPORTED_LOCALES = ["fr", "en"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "fr";

function isSupportedLocale(value: string | undefined): value is Locale {
    return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function resolveLocale(cookieLocale: string | undefined, acceptLanguage: string | null): Locale {
    if (isSupportedLocale(cookieLocale)) return cookieLocale;
    if (acceptLanguage) {
        const preferred = acceptLanguage.split(",")[0]?.split("-")[0];
        if (isSupportedLocale(preferred)) return preferred;
    }
    return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const headerStore = await headers();
    const locale = resolveLocale(
        cookieStore.get("NEXT_LOCALE")?.value,
        headerStore.get("accept-language")
    );

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
