export function getApiErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

export function isChildPath(pathname) {
  return typeof pathname === "string" && pathname.startsWith("/child/");
}
