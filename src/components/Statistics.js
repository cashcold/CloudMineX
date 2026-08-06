import React, { useEffect, useState } from 'react';
import { Calendar, ShieldCheck, Lock } from 'lucide-react';

const Statistics = () => {
  const [runningDays, setRunningDays] = useState(() => {
    const LAUNCH_DATE = new Date('2026-08-02T00:00:00Z').getTime();
    const now = Date.now();
    return Math.max(2, Math.floor((now - LAUNCH_DATE) / (1000 * 60 * 60 * 24)));
  });

  useEffect(() => {
    const LAUNCH_DATE = new Date('2026-08-02T00:00:00Z').getTime();
    const nextDay = LAUNCH_DATE + Math.ceil((Date.now() - LAUNCH_DATE) / (1000 * 60 * 60 * 24)) * (1000 * 60 * 60 * 24);

    const timeout = setTimeout(() => {
      const now = Date.now();
      setRunningDays(Math.max(2, Math.floor((now - LAUNCH_DATE) / (1000 * 60 * 60 * 24))));
    }, nextDay - Date.now());

    return () => clearTimeout(timeout);
  }, [runningDays]);

  return (
    <section className="px-4 sm:px-8 pt-4 pb-2">
      <div className="rounded-[24px] border border-cyan-500/30 bg-[#0D1B2A]/90 p-4 sm:p-5 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-cyan-400">
            <Calendar className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#10253A] px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#FFD700]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Industry Proven
            </div>

            <h3 className="mt-3 text-lg font-black text-white">Platform Launch Date</h3>
            <p className="mt-1 text-xl font-bold text-[#00D4A8]">Aug 2, 2026</p>
            <p className="mt-1 text-sm text-slate-300">(Running Days {runningDays})</p>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <Lock className="h-4 w-4 text-cyan-400" />
              <span>Enterprise Security</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-cyan-300">24/7 Monitored</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Statistics;
