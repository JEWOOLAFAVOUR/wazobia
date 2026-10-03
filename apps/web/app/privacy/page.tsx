import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Wazobia",
};

export default function PrivacyPage() {
  return (
    <main className="h-screen overflow-y-auto bg-gradient-to-b from-[#dde5ed] via-[#eceff2] to-[#f5f3ee] px-4 py-6 font-sans text-slate-800 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/create"
          className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ‹ <span className="ml-2">Back to Wazobia</span>
        </Link>

        <article className="mt-5 rounded-[28px] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Wazobia · Early access</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: 3 October 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-base font-semibold text-slate-900">What this prototype collects</h2>
              <p className="mt-2">
                The account form on this page is a frontend prototype. At present, it does not send or save
                the username, password, or optional email you enter there. Do not use a password that you use
                for another service. Your character choices are kept in browser session storage so they can be
                used during your current visit.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">When connected services are used</h2>
              <p className="mt-2">
                Wazobia features connected to the game server may process account details, gameplay activity,
                messages, and presence information to provide the service. Account passwords are stored as
                password hashes by the server, not as plain text. Some in-world details, such as your display
                name, messages, and presence, may be visible to other players.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">How information is used</h2>
              <p className="mt-2">
                Information handled by connected features is used to operate and maintain Wazobia, provide
                multiplayer features, protect the service, and respond to support requests. We do not sell
                personal information.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Your choices and this policy</h2>
              <p className="mt-2">
                You can close this page without submitting the account form. Character data saved in session
                storage is limited to the current browser session. As Wazobia develops, the way information is
                handled may change; this policy will be updated to explain those changes.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Questions</h2>
              <p className="mt-2">
                For privacy questions, use the support channel where you accessed Wazobia.
              </p>
            </section>

            <p className="border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
              This plain-language early-access notice is not legal advice or a substitute for a
              jurisdiction-specific privacy notice.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
