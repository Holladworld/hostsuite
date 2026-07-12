"use client"
import SectionTitle from "@/components/SectionTitle";
import { companiesLogo } from "@/data/companiesLogo";
import { featuresData } from "@/data/featuresData";
import { FaqSection } from "@/sections/FaqSection";
import Pricing from "@/sections/Pricing";
import { VideoIcon } from "lucide-react";
import Image from "next/image";
import Marquee from "react-fast-marquee";

export default function Page() {
    // Replace with your actual phone number format: e.g., "2348060000000"
    const WHATSAPP_NUMBER = "2348060000000"; 

    const openWhatsApp = (message) => {
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center text-center px-4 bg-white dark:bg-black bg-[url('/assets/light-hero-gradient.svg')] dark:bg-[url('/assets/dark-hero-gradient.svg')] bg-no-repeat bg-cover">
                <div className="flex flex-wrap items-center justify-center gap-3 p-1.5 pr-4 mt-46 rounded-full border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/20">
                    <div className="flex items-center -space-x-3">
                        <Image className="size-7 rounded-full object-cover" height={50} width={50}
                            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=50"
                            alt="userImage1" />
                        <Image className="size-7 rounded-full object-cover" height={50} width={50}
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=50"
                            alt="userImage2" />
                        <Image className="size-7 rounded-full object-cover" height={50} width={50}
                            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=50&h=50&auto=format&fit=crop"
                            alt="userImage3" />
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Trusted by over 1,000+ growing platforms</p>
                </div>
                
                <h1 className="mt-4 text-5xl/15 md:text-[64px]/19 font-semibold max-w-4xl tracking-tight text-slate-900 dark:text-white">
                    We launch, secure, and fully manage your tech stack—so you can focus on{" "}
                    <span className="bg-gradient-to-r from-[#923FEF] dark:from-[#C99DFF] to-[#C35DE8] dark:to-[#E1C9FF] bg-clip-text text-transparent">revenue</span>
                </h1>
                
                <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mt-4 leading-relaxed">
                    Stop wrestling with server setups, broken configurations, and missing business emails. HostSuite builds your custom web architecture, guarantees inbox delivery, and runs your operations completely hands-off.
                </p>
                
                <div className="flex items-center gap-4 mt-8">
                    <button 
                        onClick={() => openWhatsApp("Hello HostSuite, I want to get started with optimizing my business infrastructure setup.")}
                        className="bg-purple-600 hover:bg-purple-700 transition text-white font-medium rounded-md px-6 h-11 shadow-sm shadow-purple-500/10 cursor-pointer">
                        Get Started Instantly
                    </button>
                    <button 
                        onClick={() => openWhatsApp("Hello HostSuite, I would like to see the architecture walkthrough and system details.")}
                        className="flex items-center gap-2 border border-purple-900/30 dark:border-purple-500/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition text-slate-700 dark:text-white rounded-md px-6 h-11 cursor-pointer">
                        <VideoIcon strokeWidth={1.5} className="size-5 text-purple-500" />
                        <span>See How We Work</span>
                    </button>
                </div>
                
                <h3 className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-28 pb-14 font-semibold">
                    Powering high-conversion digital assets
                </h3>
                
                <Marquee className="max-w-5xl mx-auto" gradient={true} speed={25} gradientColor="#ffffff">
                    <div className="flex items-center justify-center">
                        {companiesLogo && [...companiesLogo, ...companiesLogo].map((company, index) => (
                            <Image key={index} className="mx-11 opacity-70" src={company.logo} alt={company.name} width={100} height={100} />
                        ))}
                    </div>
                </Marquee>
            </div>

            <SectionTitle text1="WHAT WE DO" text2="Your entire backend department, on autopilot" text3="From single landing pages to heavy application architectures, we deploy and protect your business setups." />

            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-4 mt-10 px-6 md:px-16 lg:px-24 xl:px-32">
                {featuresData && featuresData.map((feature, index) => (
                    <div key={index} className="p-6 rounded-xl space-y-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 max-w-80 md:max-w-66 transition-all duration-200 hover:border-purple-500/40 dark:hover:border-purple-400/40">
                        <feature.icon className="text-purple-500 size-8 mt-4" strokeWidth={1.5} />
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">{feature.description}</p>
                    </div>
                ))}
            </div>

            <Pricing />

            <FaqSection />

            <div className="flex flex-col items-center text-center justify-center mt-20 mb-32 px-4">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-16 mb-4">Ready to clear your technical overhead?</h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
                    Hand over your site, your email records, or your unfinished code repositories, and let our engineering team deploy them perfectly today.
                </p>
                <div className="flex items-center gap-4 mt-8">
                    <button 
                        onClick={() => openWhatsApp("Hello HostSuite, my developer is inactive/MIA. I want your engineering team to take over my technical stack setup.")}
                        className="bg-purple-600 hover:bg-purple-700 transition text-white font-medium rounded-md px-6 h-11 shadow-sm cursor-pointer">
                        Take Over My Tech Setup
                    </button>
                </div>
            </div>
        </>
    );
}