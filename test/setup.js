// happy-dom provides window. Force a localhost page URL before boot/axios.js
// reads it, so the server hive account stays devser.v4vapp (not the user
// account "v4vapp" used in the multi-account tests).
if (typeof window !== "undefined" && window.location) {
  try {
    window.location.href = "http://localhost:9200/"
  } catch {
    // happy-dom may treat href as read-only; hostname localhost is the default.
  }
}
