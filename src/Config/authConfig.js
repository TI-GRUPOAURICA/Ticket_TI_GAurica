export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_ENTRA_TENANT_ID}`,
    redirectUri: "https://ticket-ti-g-aurica.vercel.app",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

console.log("CLIENT ID:", import.meta.env.VITE_ENTRA_CLIENT_ID)
console.log("TENANT ID:", import.meta.env.VITE_ENTRA_TENANT_ID)

export const loginRequest = {
  scopes: ["User.Read"]
};