"use client";

export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('novae-theme');var dark=t!=='light';var h=document.documentElement;h.setAttribute('data-theme',dark?'dark':'light');if(dark)h.classList.add('dark');else h.classList.remove('dark');}catch(e){}})()`,
      }}
    />
  );
}
