/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STEPS = [
  {
    n: '1',
    title: 'Create your account',
    body: 'Tell us about your shop: what you buy and how you take in collections today. It takes about a minute.',
  },
  {
    n: '2',
    title: 'Set your rates and make it yours',
    body: 'Choose your cash and credit percentages and bulk rates, then add your logo, welcome message and contact details.',
  },
  {
    n: '3',
    title: 'Share your link',
    body: 'Put your buying page on your website, Instagram, Facebook or Discord. Submissions land in your dashboard ready to review.',
  },
];

export default function SetupSteps() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 lg:py-24 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 sm:mb-14">
          <span className="text-[12px] font-bold tracking-wider text-blue-700 uppercase">How it works</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Live in three steps.
          </h2>
        </div>

        <ol className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-slate-200 p-6">
              <span className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mb-4">{s.n}</span>
              <h3 className="font-bold text-slate-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
