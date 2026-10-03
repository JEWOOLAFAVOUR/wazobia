import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Wazobia",
};

export default function TermsPage() {
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
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: 3 October 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-base font-semibold text-slate-900">Using Wazobia</h2>
              <p className="mt-2">
                Wazobia is an early-access virtual world. By using it, you agree to these terms. You must be
                allowed to use online services where you live. If you are under 18, use Wazobia only with a
                parent or guardian&apos;s permission.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Your account and conduct</h2>
              <p className="mt-2">
                Keep your sign-in details private and choose a username that does not impersonate or target
                someone else. Do not harass people, post unlawful or abusive content, disrupt the service, or
                try to exploit or access systems without permission. We may restrict access to protect players
                or the service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Virtual items and early access</h2>
              <p className="mt-2">
                Unless we clearly say otherwise, in-game currency, items, and property are virtual, have no
                cash value, and cannot be transferred outside Wazobia. Features and progress may change,
                reset, or be unavailable while the service is in development. We do not promise uninterrupted
                availability.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Your content</h2>
              <p className="mt-2">
                You remain responsible for names, messages, and other content you submit. You give Wazobia
                permission to display and process that content as needed to operate the service and show it to
                other players.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">Changes and contact</h2>
              <p className="mt-2">
                These terms may be updated as Wazobia develops. Continued use after an update means you accept
                the revised terms. For questions, use the support channel where you accessed Wazobia.
              </p>
            </section>

            <p className="border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
              This plain-language early-access notice is not legal advice or a substitute for jurisdiction-specific
              terms.
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
