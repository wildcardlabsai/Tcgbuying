/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UploadCloud, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function StepsWorkflowSection() {
  const steps = [
    {
      num: '01',
      icon: UploadCloud,
      title: 'Collect',
      description: 'Give collectors a dedicated place to submit their cards or collections.',
    },
    {
      num: '02',
      icon: FileText,
      title: 'Review',
      description: 'Assess incoming submissions and review the information needed to make an offer.',
    },
    {
      num: '03',
      icon: CheckCircle2,
      title: 'Complete',
      description: 'Manage the next steps and track progress through your buying workflow.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-wider text-blue-600 uppercase mb-3 block">
            A CLEARER WAY TO BUY CARDS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            From first submission to final offer.
          </h2>
        </div>

        {/* 3 Step Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-center">
          {steps.map((step, idx) => (
            <div key={step.num} className="relative flex items-center">
              <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-6 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <step.icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>

                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Arrow Connector between steps */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-slate-50 border border-slate-200 items-center justify-center text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
