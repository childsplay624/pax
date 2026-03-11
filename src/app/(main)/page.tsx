"use client";

import Hero from "@/components/Hero";
import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import StatsSection from "@/components/StatsSection";
import GlobeSection from "@/components/GlobeSection";
import { Package, Globe, Shield, BarChart3, CheckCircle2, ArrowRight, Zap, Truck, Layers } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { title: "Interstate Delivery", description: "Fast, door-to-door parcel delivery across all 36 states and the FCT — tracked every step of the way.", icon: Truck, href: "/services#interstate", imageUrl: "/images/van.png" },
  { title: "Same-Day City Delivery", description: "Collected and delivered within Lagos, Abuja, Kano, and Port Harcourt on the same day, every day.", icon: Zap, href: "/services#same-day", imageUrl: "/images/hero.png" },
  { title: "E-commerce Fulfilment", description: "Warehousing, pick-pack, and returns management from our Lagos and Abuja fulfilment centres.", icon: Layers, href: "/services#ecommerce", imageUrl: "/images/sorting.png" },
];

const trustBadges = [
  "SON Registered", "Lagos Chamber of Commerce Member",
  "Insured & Bonded", "NIPOST Licensed Courier", "98% On-Time Delivery",
];

const testimonials = [
  { name: "Amaka Obi", role: "Founder · ShopAmaka (Lagos)", quote: "PAN African Express completely transformed how I handle orders. Next-day Abuja delivery made customers out of followers overnight." },
  { name: "Emeka Williams", role: "Supply Chain Lead · Konga Group", quote: "Their reliability is unmatched in Nigeria. 98% on-time and visible tracking — we scaled fulfilment by 4x in six months." },
  { name: "Tunde Adeyemi", role: "CEO · FabricHouse Ibadan", quote: "Finally a courier that actually understands Nigerian roads and respects our timelines. Customer satisfaction is up 40%." },
];

const features = [
  { icon: Zap, title: "Same-Day City Delivery", desc: "Lagos, Abuja, Kano, and PH — collected and delivered the same day." },
  { icon: Globe, title: "Nationwide Interstate", desc: "All 36 states and the FCT covered. Door-to-door with full tracking." },
  { icon: Shield, title: "100% Insured Shipments", desc: "Every parcel is fully insured to declared value — zero hidden conditions." },
  { icon: BarChart3, title: "Business API & Dashboard", desc: "Real-time visibility and bulk management for teams shipping at scale." },
  { icon: Package, title: "E-commerce Fulfilment", desc: "Warehousing in Lagos & Abuja. Automated pick, pack, and returns for your online store." },
  { icon: Truck, title: "Doorstep Collection", desc: "Book a pickup online — our rider comes to you, anywhere in our coverage area." },
];

export default function Home() {
  return (
    <div className="flex flex-col w-full overflow-x-hidden">

      {/* ──────────────────────────────── HERO */}
      <Hero imageUrl="/images/hero.png" />

      {/* ──────────────────────────────── TRUST BADGES */}
      <section className="py-6 bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap items-center justify-center gap-10">
          <span className="text-ink-300 text-[10px] font-bold uppercase tracking-[0.3em]">Trusted by Industry</span>
          {trustBadges.map((b) => (
            <div key={b} className="flex items-center gap-2 text-ink-400 hover:text-ink-900 transition-colors cursor-default">
              <CheckCircle2 className="w-4 h-4 text-red-brand/60" />
              <span className="font-bold text-xs">{b}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────────────── SERVICES */}
      <section className="relative py-36 bg-surface-50 overflow-hidden">
        {/* Ghost text */}
        <div className="ghost-text absolute -bottom-8 left-0 pointer-events-none select-none" aria-hidden="true">SERVICES</div>
        <div className="radial-red-left absolute inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20">
            <div>
              <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-4">
                What We Move
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="text-5xl md:text-7xl font-bold text-ink-900 tracking-tight max-w-2xl"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Across Nigeria.<br /><span className="text-ink-300">At Your Speed.</span>
              </motion.h2>
            </div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 md:mt-0">
              <button className="btn-magnetic bg-red-brand text-white px-8 py-4 rounded-full font-bold text-sm flex items-center gap-2 shadow-md shadow-red-brand/20 hover:bg-red-dark transition-colors">
                View All Services <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => <ServiceCard key={s.title} {...s} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── STATS */}
      <StatsSection />

      {/* ──────────────────────────────── GLOBE */}
      <GlobeSection />

      {/* ──────────────────────────────── FEATURES SPLIT */}
      <section className="py-36 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-28 items-stretch">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="relative flex flex-col"
          >
            <div className="absolute -inset-6 bg-red-brand/5 rounded-[3rem] blur-3xl" />
            <div className="relative overflow-hidden rounded-[3rem] shadow-xl border border-surface-200 h-full min-h-[480px]">
              <img src="/images/sorting.png" alt="Sorting Center" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -right-8 bg-ink-900 text-white rounded-3xl px-7 py-6 flex items-center gap-4 shadow-2xl hidden md:flex border border-white/5">
              <div className="p-3 bg-red-brand/15 rounded-2xl"><BarChart3 className="text-red-400 w-6 h-6" /></div>
              <div>
                <span className="block text-2xl font-bold leading-none" style={{ fontFamily: "Space Grotesk, sans-serif" }}>40% Faster</span>
                <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">Processing Speed</span>
              </div>
            </div>
          </motion.div>

          {/* Copy */}
          <div>
            <span className="text-red-brand text-[11px] font-bold uppercase tracking-[0.35em] block mb-5">Innovation First</span>
            <h2 className="text-5xl md:text-6xl font-bold text-ink-900 tracking-tight mb-8 leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Nigeria-wide.<br /><span className="text-ink-300">Down to the LGA.</span>
            </h2>
            <p className="text-lg text-ink-400 leading-relaxed mb-12 max-w-lg">
              Smart routing optimised for Nigerian roads means your parcel moves through the most efficient path between any two points in the country.
            </p>
            <div className="space-y-7">
              {features.map((f, i) => (
                <motion.div
                  key={f.title} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                  <div className="p-3.5 bg-red-brand/8 rounded-2xl group-hover:bg-red-brand transition-colors">
                    <f.icon className="w-5 h-5 text-red-brand group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink-900 mb-1">{f.title}</h4>
                    <p className="text-ink-400 text-sm leading-relaxed max-w-sm">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── TESTIMONIALS */}
      <section className="relative py-36 bg-ink-900 overflow-hidden">
        <div className="radial-red-center absolute inset-0 pointer-events-none" />
        <div className="ghost-text absolute -bottom-4 right-0 pointer-events-none select-none" style={{ WebkitTextStroke: "1px rgba(255,255,255,0.04)" }} aria-hidden="true">TRUST</div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <span className="text-red-400 text-[11px] font-bold uppercase tracking-[0.35em] block mb-4">Client Success</span>
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>What Our Partners Say.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.7 }}
                className="card-dark rounded-3xl p-10 relative overflow-hidden"
                style={{ transition: "transform 0.35s cubic-bezier(.16,1,.3,1), box-shadow 0.35s" }}
              >
                {/* Top red accent bar */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-brand to-transparent" />
                <div className="absolute -top-2 -left-2 text-[100px] text-red-brand/10 font-serif leading-none select-none pointer-events-none">"</div>
                <p className="text-white/65 italic mb-10 leading-relaxed relative z-10">{t.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-brand flex items-center justify-center font-bold text-white text-lg shadow-md shadow-red-brand/40">
                    {t.name[0]}
                  </div>
                  <div>
                    <span className="block font-bold text-white text-sm">{t.name}</span>
                    <span className="text-white/40 text-xs">{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {["Lagos → Abuja", "Lagos → Kano", "Lagos → PH", "Abuja → Enugu", "Kano → Kaduna"].map(r => (
              <span key={r} className="glass rounded-full px-4 py-2 text-white/60 text-xs font-bold border border-white/[0.06]">{r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── FINAL CTA */}
      <section className="relative py-36 bg-red-brand overflow-hidden">
        {/* Diagonal white stripe */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-red-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red-dark/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
          <span className="text-white/50 text-[11px] font-bold uppercase tracking-[0.35em] block mb-6">Get Started</span>
          <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight mb-6" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Ship Anywhere in Nigeria.
          </h2>
          <p className="text-white/80 text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
            Join thousands of Nigerian businesses and individuals who trust PAN African Express for fast, reliable delivery across all 36 states.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link href="/register?type=business" className="btn-magnetic w-full sm:w-auto bg-white text-red-brand px-14 py-5 rounded-full font-bold text-lg shadow-xl hover:bg-surface-50 transition-colors flex items-center justify-center">
              Create Business Account
            </Link>
            <button className="btn-magnetic w-full sm:w-auto bg-white/15 backdrop-blur border border-white/25 text-white px-14 py-5 rounded-full font-bold text-lg hover:bg-white/25 transition-colors">
              Request a Quote
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
