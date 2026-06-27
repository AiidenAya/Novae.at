"use client";

import { useEffect, useState } from "react";

export const translations = {
  en: {
    // Auth - Login page
    loginPageTitle: "Welcome back",
    loginPageSubtitle: "Sign in to your Novae account",
    loginEmailLabel: "Email or username",
    loginPasswordLabel: "Password",
    loginSubmit: "Login",
    loginSubmitting: "Logging in…",
    loginNoAccount: "No account yet?",
    loginSignUp: "Sign up",
    loginUsernameNotFound: "No account found with this username.",
    loginServerError: "Could not verify username. Try again with your email.",
    loginServerTimeout: "Server not responding. Check your internet connection.",
    // Auth - Register page
    registerPageTitle: "Create an account",
    registerPageSubtitle: "Join the Novae community",
    registerInviteCodeLabel: "Invite code",
    registerUsernameLabel: "Username",
    registerEmailLabel: "Email",
    registerPasswordLabel: "Password",
    registerSubmit: "Sign up",
    registerSubmitting: "Signing up…",
    registerHasAccount: "Already have an account?",
    registerSignIn: "Login",
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
    navNotifications: "Notifications",
    // Home
    homeComingSoon: "Home — coming soon",
    // Notifications
    notifTitle: "Notifications",
    notifUnread: "{n} unread",
    notifMarkAllRead: "Mark all read",
    notifMarkRead: "Mark read",
    notifAll: "All",
    notifEmpty: "No notifications yet. Follow some creators to get started!",
    notifAccept: "Accept",
    notifDecline: "Decline",
    notifAccepted: "✓ Accepted",
    notifRequestUnavailable: "This request is no longer available.",
    // Notifications - categories
    notifCatFollows: "Followed by",
    notifCatFavorites: "Liked",
    notifCatRelationships: "Relationships",
    notifCatCharacters: "New Character",
    notifCatArtworks: "Images",
    // Notifications - relative time
    notifJustNow: "just now",
    notifMinAgo: "{n}m ago",
    notifHourAgo: "{n}h ago",
    notifDayAgo: "{n}d ago",
    // Notifications - message bodies
    notifSomeone: "Someone",
    notifCreatedCharacter: "created a new character",
    notifUploadedImage: "uploaded a new image",
    notifOn: "on",
    notifStartedFollowing: "started following you.",
    notifFavorited: "favorited",
    notifWantsToLink: "wants to link",
    notifTheirCharacter: "their character",
    notifAs: "as",
    notifWithYour: "with your",
    notifAcceptedRequest: "accepted your relationship request",
    notifWith: "with",
    notifDeclinedRel: "declined or removed a relationship.",
    notifGeneric: "sent you a notification.",
  },
  fr: {
    // Auth - Login page
    loginPageTitle: "Bon retour",
    loginPageSubtitle: "Connecte-toi à ton compte Novae",
    loginEmailLabel: "Email ou nom d'utilisateur",
    loginPasswordLabel: "Mot de passe",
    loginSubmit: "Connexion",
    loginSubmitting: "Connexion…",
    loginNoAccount: "Pas encore de compte ?",
    loginSignUp: "S'inscrire",
    loginUsernameNotFound: "Aucun compte trouvé avec ce nom d'utilisateur.",
    loginServerError: "Impossible de vérifier le nom d'utilisateur. Réessaie avec ton email.",
    loginServerTimeout: "Le serveur ne répond pas. Vérifie ta connexion internet.",
    // Auth - Register page
    registerPageTitle: "Créer un compte",
    registerPageSubtitle: "Rejoins la communauté Novae",
    registerInviteCodeLabel: "Code d'invitation",
    registerUsernameLabel: "Nom d'utilisateur",
    registerEmailLabel: "Email",
    registerPasswordLabel: "Mot de passe",
    registerSubmit: "S'inscrire",
    registerSubmitting: "Inscription…",
    registerHasAccount: "Déjà un compte ?",
    registerSignIn: "Connexion",
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
    navNotifications: "Notifications",
    // Home
    homeComingSoon: "Accueil — bientôt disponible",
    // Notifications
    notifTitle: "Notifications",
    notifUnread: "{n} non lues",
    notifMarkAllRead: "Tout marquer comme lu",
    notifMarkRead: "Marquer comme lu",
    notifAll: "Tout",
    notifEmpty: "Aucune notification pour le moment. Suis des créateurs pour commencer !",
    notifAccept: "Accepter",
    notifDecline: "Refuser",
    notifAccepted: "✓ Acceptée",
    notifRequestUnavailable: "Cette demande n'est plus disponible.",
    // Notifications - categories
    notifCatFollows: "Abonnements",
    notifCatFavorites: "Aimés",
    notifCatRelationships: "Relations",
    notifCatCharacters: "Nouveau personnage",
    notifCatArtworks: "Images",
    // Notifications - relative time
    notifJustNow: "à l'instant",
    notifMinAgo: "il y a {n} min",
    notifHourAgo: "il y a {n} h",
    notifDayAgo: "il y a {n} j",
    // Notifications - message bodies
    notifSomeone: "Quelqu'un",
    notifCreatedCharacter: "a créé un nouveau personnage",
    notifUploadedImage: "a publié une nouvelle image",
    notifOn: "sur",
    notifStartedFollowing: "a commencé à te suivre.",
    notifFavorited: "a aimé",
    notifWantsToLink: "veut lier",
    notifTheirCharacter: "leur personnage",
    notifAs: "en tant que",
    notifWithYour: "avec ton",
    notifAcceptedRequest: "a accepté ta demande de relation",
    notifWith: "avec",
    notifDeclinedRel: "a refusé ou supprimé une relation.",
    notifGeneric: "t'a envoyé une notification.",
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
