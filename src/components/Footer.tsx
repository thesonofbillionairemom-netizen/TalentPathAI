import { Compass, Github, Mail } from 'lucide-react';
import type { AppRoute } from '../types';

interface FooterProps {
  onNavigate?: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0FB5AE]/15 text-[#5ED6CF]">
                <Compass className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold text-white tracking-tight">TalentPath AI</span>
            </div>
            <p className="text-sm font-medium text-[#5ED6CF]">
              Your skills crossed borders. Your recognition should too.
            </p>
            <p className="text-xs leading-relaxed text-slate-400 max-w-md">
              Built for the Unlocking Displaced Talent hackathon mission to help skilled refugees and displaced professionals in Kenya organize evidence, prepare for Recognition of Prior Learning (RPL), and connect with opportunities.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-display text-sm font-semibold text-white">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('landing')}
                  className="hover:text-[#5ED6CF] transition-colors text-left"
                >
                  Overview & Mission
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('signup')}
                  className="hover:text-[#5ED6CF] transition-colors text-left"
                >
                  Create Candidate Account
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('login')}
                  className="hover:text-[#5ED6CF] transition-colors text-left"
                >
                  Sign In / Demo Journey
                </button>
              </li>
              <li>
                <a
                  href="https://knqa.go.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#5ED6CF] transition-colors"
                >
                  KNQA Official Portal
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <h4 className="font-display text-sm font-semibold text-white">Governance & Disclaimers</h4>
            <p className="text-xs leading-relaxed text-slate-400">
              <strong className="text-slate-200">Responsible AI Notice:</strong> AI outputs highlight transferable skills and preparation checklists based on user input. They are not official credential verifications or legal advice.
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              <strong className="text-slate-200">Qualification Disclaimer:</strong> TalentPath AI is not an accredited awarding authority. Formal recognition and licensing rest solely with statutory Kenyan bodies such as KNQA, TVETA, NITA, EBK, and DRS.
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              <strong className="text-slate-200">Privacy & Terms:</strong> Uploaded documents remain private to your account unless you explicitly enable sharing consent in Settings.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-400">
            <p>© 2026 TalentPath AI. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="text-slate-400">
              Designed &amp; Developed by <strong className="font-semibold text-white">Abdiwali Abdi</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <a
              href="https://github.com/thesonofbillionairemom-netizen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#5ED6CF] hover:text-white transition-colors"
              aria-label="Abdiwali Abdi GitHub profile: thesonofbillionairemom-netizen"
            >
              <Github className="h-3.5 w-3.5" />
              <span>thesonofbillionairemom-netizen</span>
            </a>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <a
              href="mailto:thesonofbilionairemom@gmail.com"
              className="inline-flex items-center gap-1.5 text-[#5ED6CF] hover:text-white transition-colors"
              aria-label="Email Abdiwali Abdi at thesonofbilionairemom@gmail.com"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>thesonofbilionairemom@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
