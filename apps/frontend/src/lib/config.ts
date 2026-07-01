const fallbackBackendUrl = "http://localhost:3001";

export const BACKEND_URL =
    (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_BACKEND_URL) ||
    fallbackBackendUrl;
