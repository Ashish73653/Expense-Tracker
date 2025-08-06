import { signOut } from "@aws-amplify/auth";

export const clearAuthSession = async () => {
  try {
    await signOut({ global: true });
  } catch (error) {
    // Ignore errors if user is not signed in
    console.log("No active session to clear");
  }

  // Clear all local storage and session storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear any IndexedDB data that Amplify might be using
  if ("indexedDB" in window) {
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (
          db.name &&
          (db.name.includes("amplify") || db.name.includes("aws"))
        ) {
          indexedDB.deleteDatabase(db.name);
        }
      }
    } catch (error) {
      console.log("Could not clear IndexedDB:", error);
    }
  }
};

export const forceLogout = async () => {
  await clearAuthSession();
  window.location.reload();
};
