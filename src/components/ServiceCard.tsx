"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ServiceCardProps {
    title: string; description: string; icon: any;
    href: string; imageUrl?: string; className?: string; delay?: number;
}

const ServiceCard = ({ title, description, icon: Icon, href, imageUrl, className, delay = 0 }: ServiceCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn("group relative overflow-hidden rounded-3xl card flex flex-col", className)}
    >
        {/* Subtle image on hover */}
        {imageUrl && (
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-8 transition-opacity duration-700">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
            </div>
        )}

        {/* Red top border glow on hover */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-red-brand to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10 flex flex-col h-full p-8">
            {/* Icon badge */}
            <div className="mb-8 p-4 bg-red-brand/8 rounded-2xl w-fit border border-red-brand/12 group-hover:bg-red-brand group-hover:border-red-brand transition-all duration-300">
                <Icon className="w-7 h-7 text-red-brand group-hover:text-white transition-colors duration-300" />
            </div>

            <h3
                className="text-2xl font-bold text-ink-900 mb-4 tracking-tight group-hover:text-red-brand transition-colors duration-300"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
                {title}
            </h3>

            <p className="text-ink-400 leading-relaxed mb-10 text-sm">{description}</p>

            <div className="mt-auto">
                <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-400 group-hover:text-red-brand transition-colors duration-300">
                    <span>Learn More</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
            </div>
        </div>
    </motion.div>
);

export default ServiceCard;
