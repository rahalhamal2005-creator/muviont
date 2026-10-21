import { Metadata } from "next";
import Link from "next/link";
import { Shield, Mail, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "DMCA Copyright Policy | MUVIONT",
  description: "Digital Millennium Copyright Act (DMCA) compliance notice, content takedown procedures, and designated copyright agent information for Muviont.",
};

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {/* Title Card */}
        <div className="space-y-3 border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Legal Notice & Copyright Compliance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Digital Millennium Copyright Act (DMCA) Policy
          </h1>
          <p className="text-xs text-neutral-400">
            Last Updated: October 2026 • Official Takedown Procedure
          </p>
        </div>

        {/* Section 1: Non-Hosting Statement */}
        <section className="space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> 1. Service Provider Status & Non-Hosting Disclaimer
          </h2>
          <p className="text-xs leading-relaxed text-neutral-400">
            MUVIONT (<span className="text-white">muviont.com</span>) operates strictly as an automated catalog, metadata indexer, and search guide for cinematic media. MUVIONT does not host, upload, archive, decode, or store any video files, media streams, or copyrighted recordings on any server under its control.
          </p>
          <p className="text-xs leading-relaxed text-neutral-400">
            All interactive stream previews and players provided on third-party links are supplied by unaffiliated third-party services. MUVIONT has no operational affiliation with, nor direct control over, the content hosted by these external services.
          </p>
        </section>

        {/* Section 2: DMCA Compliance */}
        <section className="space-y-3 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-base font-bold text-white">
            2. Compliance with 17 U.S.C. § 512
          </h2>
          <p className="text-xs leading-relaxed text-neutral-400">
            It is the policy of MUVIONT to respond promptly to clear, formal notices of alleged copyright infringement consistent with the United States Digital Millennium Copyright Act (Title 17, United States Code, Section 512(c)). Upon receipt of a valid notice fulfilling all statutory criteria, MUVIONT will immediately disable or blacklist access to the disputed URL.
          </p>
        </section>

        {/* Section 3: How to Submit a Notice */}
        <section className="space-y-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-base font-bold text-white">
            3. Filing a Valid Infringement Notification
          </h2>
          <p className="text-xs text-neutral-400">
            To submit an actionable takedown request, the copyright owner or authorized representative must provide a written communication containing all of the following elements:
          </p>
          <ul className="text-xs space-y-2 list-disc list-inside text-neutral-300">
            <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
            <li>Identification of the copyrighted work claimed to have been infringed (or a representative list of such works).</li>
            <li>Identification of the material on <span className="text-white">muviont.com</span> that is claimed to be infringing, specifically including the direct URL (e.g., <code className="text-neutral-400 bg-white/5 px-1 py-0.5 rounded">https://muviont.com/movie/...</code>).</li>
            <li>Information reasonably sufficient to permit MUVIONT to contact you, such as your full name, title, address, telephone number, and official corporate email address.</li>
            <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner.</li>
          </ul>
        </section>

        {/* Section 4: Designated Agent Contact */}
        <section className="space-y-3 bg-red-950/20 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Mail className="w-4 h-4" /> Designated Copyright & Takedown Agent
          </div>
          <p className="text-xs text-neutral-300">
            Please direct all official DMCA notifications to our designated compliance department:
          </p>
          <div className="bg-black/50 p-4 rounded-xl border border-white/10 text-xs space-y-1 font-mono text-neutral-300">
            <div><span className="text-neutral-500">Contact:</span> Legal & DMCA Compliance Officer</div>
            <div><span className="text-neutral-500">Service:</span> MUVIONT Platform</div>
            <div><span className="text-neutral-500">Email:</span> <a href="mailto:legal@muviont.com" className="text-red-400 hover:underline">legal@muviont.com</a></div>
            <div><span className="text-neutral-500">Response SLA:</span> Within 24–48 Business Hours</div>
          </div>
          <p className="text-[11px] text-neutral-400 italic">
            Valid notices result in permanent URL blacklisting across the entire MUVIONT network.
          </p>
        </section>
      </div>
    </div>
  );
}
