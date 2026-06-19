"use client";

import { useEffect, useState } from "react";

export const translations = {
  en: {
    // Auth - Login
    loginEmailLabel: "Email or username",
    loginPasswordLabel: "Password",
    loginSubmit: "Sign in",
    loginSubmitting: "Signing in…",
    loginOr: "or",
    loginGoogle: "Continue with Google",
    loginNoAccount: "No account yet?",
    loginSignUp: "Sign up",
    loginUsernameNotFound: "No account found with this username.",
    loginServerError: "Could not verify username. Try again with your email.",
    loginServerTimeout: "Server not responding. Check your internet connection.",
    // Auth - Register
    registerUsernameLabel: "Username",
    registerEmailLabel: "Email",
    registerPasswordLabel: "Password",
    registerSubmit: "Create account",
    registerSubmitting: "Creating…",
    registerOr: "or",
    registerGoogle: "Continue with Google",
    registerHasAccount: "Already have an account?",
    registerSignIn: "Sign in",
    registerError: "An error occurred.",
    // Navbar
    navProfile: "Profile",
    navHome: "Home",
    navLibrary: "My Library",
    navBrowse: "Browse",
    navCommunity: "Community",
    navNew: "New",
    navLogin: "Login",
    navSignUp: "Sign up",
    navSettings: "Settings",
    navLogout: "Logout",
    // Home
    homeComingSoon: "Home — coming soon",
  },
  fr: {
    // Auth - Login
    loginEmailLabel: "Email ou nom d'utilisateur",
    loginPasswordLabel: "Mot de passe",
    loginSubmit: "Se connecter",
    loginSubmitting: "Connexion…",
    loginOr: "ou",
    loginGoogle: "Continuer avec Google",
    loginNoAccount: "Pas encore de compte ?",
    loginSignUp: "S'inscrire",
    loginUsernameNotFound: "Aucun compte trouvé avec ce nom d'utilisateur.",
    loginServerError: "Impossible de vérifier le nom d'utilisateur. Réessaie avec ton email.",
    loginServerTimeout: "Le serveur ne répond pas. Vérifie ta connexion internet.",
    // Auth - Register
    registerUsernameLabel: "Nom d'utilisateur",
    registerEmailLabel: "Email",
    registerPasswordLabel: "Mot de passe",
    registerSubmit: "Créer mon compte",
    registerSubmitting: "Création…",
    registerOr: "ou",
    registerGoogle: "Continuer avec Google",
    registerHasAccount: "Déjà un compte ?",
    registerSignIn: "Se connecter",
    registerError: "Une erreur est survenue.",
    // Navbar
    navProfile: "Profil",
    navHome: "Accueil",
    navLibrary: "Ma bibliothèque",
    navBrowse: "Explorer",
    navCommunity: "Communauté",
    navNew: "Nouveau",
    navLogin: "Connexion",
    navSignUp: "S'inscrire",
    navSettings: "Paramètres",
    navLogout: "Déconnexion",
    // Home
    homeComingSoon: "Accueil — bientôt disponible",
  },
} as const;

export type Locale = keyof typeof translations;
export type T = typeof translations["en"];

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("novae-locale") as Locale | null;
    if (saved === "fr" || saved === "en") setLocale(saved);
  }, []);

  function toggle() {
    const next: Locale = locale === "en" ? "fr" : "en";
    setLocale(next);
    localStorage.setItem("novae-locale", next);
  }

  return { locale, t: translations[locale], toggle };
}
