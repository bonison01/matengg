"use client";

import React, { useEffect, useRef, useState } from "react";
import { LayoutGrid } from "@/components/ui/layout-grid";
import Image from "next/image";
import Footer from "@/components/footer/Footer";
import {
  useScroll,
  useTransform,
  motion,
} from "framer-motion";
import './timeline.css'
import { useTheme } from "next-themes";
import { CardDescription, CardTitle } from "@/components/ui/card";

export default function Page() {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme("dark");
  }, []);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="w-[100vw] h-[100svh] relative bg-neutral-950 overflow-y-auto no-scrollbar flex flex-col justify-between"
      >
        <div>
          <div className="w-full h-16"></div>
          <div className="w-full max-w-[1400px] mx-auto mt-6 p-4">
            <div className="w-full max-w-[1200px] mx-auto space-y-3">
              <CardTitle className='text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400'>What do We do?</CardTitle>
              <CardDescription className='text-base md:text-lg'>
                Mateng is your go-to platform for discovering the unknown and
                meeting your product/service needs. Our reliable and free discovery
                platform aims to quickly grow businesses from scratch. With our integrated
                Mateng Delivery Service, we provide SMEs with seamless shipping solutions.
                Experience a swift and efficient way to know everything and get what you
                need, all in one place.
              </CardDescription>
            </div>
            <div className="h-[40rem]">
              <LayoutGrid cards={cards} />
            </div>
          </div>

          {/* Timeline integrated directly */}
          <div className="w-full bg-white dark:bg-neutral-950 font-sans md:px-10">
            <div className="max-w-7xl mx-auto py-10 px-4 md:px-8 lg:px-10">

              <h2 className="text-2xl md:text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
                Partnerships and Achievements:
              </h2>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base leading-7 mt-4">
                Throughout its journey, Mateng partnered with over 200 businesses, including major corporations in Manipur like Shija Hospital.
                <br />
                The company discovered and promoted more than 150 small businesses, creating content that reached a large number of social media users.
                <br />
                Mateng also collaborated with the Manipur Traffic Police Department in March 2025 to raise awareness about the importance of wearing helmets.
              </p>
            </div>

            <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-start pt-10 md:gap-10"
                >
                  <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                    <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-white dark:bg-black flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2" />
                    </div>
                    <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500 dark:text-neutral-500">
                      {item.title}
                    </h3>
                  </div>

                  <div className="relative pl-20 pr-4 md:pl-4 w-full">
                    <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500">
                      {item.title}
                    </h3>
                    {item.content}
                  </div>
                </div>
              ))}
              <div
                style={{
                  height: height + "px",
                }}
                className="absolute md:left-8 left-8 top-0 w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-200 dark:via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
              >
                <motion.div
                  style={{
                    height: heightTransform,
                    opacity: opacityTransform,
                  }}
                  className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* <div className="w-full min-h-800"></div>
      <Footer  /> */}

        <div className="w-full min-h-60"></div>

        <Footer />
      </div>
    </div>
  );
}

const SkeletonOne = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        Delivery Team in Action.
      </p>
    </div>
  );
};

const SkeletonTwo = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        A photo with the executives of Shija and Research Institute.
      </p>
    </div>
  );
};

const SkeletonThree = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        Parcels Pickup and Delivery.
      </p>
    </div>
  );
};

const SkeletonFour = () => {
  return (
    <div>
      <p className="font-bold md:text-4xl text-xl text-white">
        A group photo of the team. -2024
      </p>
    </div>
  );
};

const cards = [
  {
    id: 1,
    content: <SkeletonOne />,
    className: "md:col-span-2",
    thumbnail:
      "/about1.jpg",
  },
  {
    id: 2,
    content: <SkeletonTwo />,
    className: "col-span-1",
    thumbnail:
      "/about2.jpg",
  },
  {
    id: 3,
    content: <SkeletonThree />,
    className: "col-span-1",
    thumbnail:
      "/about3.jpg",
  },
  {
    id: 4,
    content: <SkeletonFour />,
    className: "md:col-span-2",
    thumbnail:
      "/about4.jpg",
  }
];

const data = [
  {
    title: "Early 2025",
    content: (
      <div>
        <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
          Expansion of Services - Cargo and E-commerce (2024 - 2025) :
        </h2>
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mt-2 mb-6">
          Mateng expanded its services by launching a cargo service in 2024, enabling parcels to be sent both within and outside Manipur. On March 2, 2025, Mateng joined an e-commerce marketplace, offering logistics support to facilitate seamless transactions between buyers and sellers.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="/about5.jpg"
            alt="startup template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about6.jpg"
            alt="startup template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2024",
    content: (
      <div>
        <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
          Introduction of 'Mateng Discovery' (Jan 2024) :
        </h2>
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mt-2 mb-6">
          In January 2024, Mateng launched "Mateng Discovery," an initiative to support small businesses by rediscovering and promoting them through social media channels. The initiative aimed to highlight local businesses, places, events, and people, reaching a broad audience.
        </p>
        <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
          Setback Due to Internet Shutdown (2024):
        </h2>
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mt-2 mb-6">
          Following the Meitei-Kuki crisis, an internet shutdown lasting two months hindered Mateng's operations, causing financial setbacks and a temporary breakdown of the business. Despite this, Mateng managed to recover and regain its position in the market.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="/about7.jpg"
            alt="startup template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about8.jpg"
            alt="startup template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about9.jpg"
            alt="startup template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about10.jpg"
            alt="startup template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2023",
    content: (
      <div>
        <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
          Challenges During the Meitei-Kuki Crisis (May 2023) :
        </h2>
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mt-2 mb-6">
          In May 2023, the Meitei-Kuki crisis severely impacted the operations of Mateng, forcing the company to restart from scratch. Two of the co-founders left the company, and the logistics service almost came to a halt during the crisis.
        </p>
        <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
          Rebuilding and Growth (Sept 2023 - Jan 2024) :
        </h2>
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mt-2 mb-6">
          By September 2023, Mateng resumed operations by hiring two employees, marking the start of its recovery.
          <br />
          Growth during this period was rapid, with daily orders increasing from 10-15 to around 40 by January 2024.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <video
            src="/about11.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about12.jpg"
            alt="feature template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about14.jpg"
            alt="feature template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
          <Image
            src="/about15.jpg"
            alt="feature template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>
      </div>
    ),
  },
  {
    title: "2022",
    content: (
      <div>
        <h2 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
          Foundation and Early Goals (Dec 2022) :
        </h2>
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mt-2 mb-6">
          Mateng was founded in December 2022 as a logistics service company with the primary goal of providing essential services in Imphal, Manipur.
          <br />
          The company started with three founders and a small group of friends, aiming to expand services throughout the city.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Image
            src="/about13.jpg"
            alt="hero template"
            width={500}
            height={500}
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
          />
        </div>

        <div className="mt-10">
          <h2 className="text-2xl md:text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 to-neutral-400 max-w-4xl">
            Company Overview:
          </h2>
          <p className="text-neutral-800 dark:text-neutral-200 text-xl font-normal mt-2 mb-6">
            Mateng operates under the company name "JustMateng Service Pvt Ltd.
          </p>
        </div>
      </div>
    ),
  },
];