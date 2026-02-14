"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import LiquidEther from "@/components/ui/liquid-ether-new";
import RotatingText from "./RotatingText";
import SplitText from "./SplitText";

const HeroSection = () => {
  return (
    <section className="w-full pt-36 md:pt-48 pb-16 md:pb-20 relative min-h-[110vh] md:min-h-[120vh] overflow-hidden">
      {/* ReactBits LiquidEther Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <LiquidEther
          mouseForce={30}
          cursorSize={120}
          colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
          autoDemo={true}
          autoSpeed={0.8}
          autoIntensity={1.5}
          takeoverDuration={0.05}
          autoResumeDelay={500}
          autoRampDuration={0.2}
          dt={0.018}
          className="w-full h-full"
        />
      </div>

      <div className="flex flex-col justify-center items-center h-full space-y-6 sm:space-y-8 md:space-y-12 text-center relative z-20 pointer-events-none px-4 sm:px-6">
        <div className="space-y-4 sm:space-y-6 md:space-y-8 mx-auto w-full max-w-7xl">
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl xl:text-7xl gradient-title animate-gradient drop-shadow-lg">
              Your AI Career Coach for
              <br />
              <span className="text-white drop-shadow-xl">
                Professional Success
              </span>
            </h1>
          </div>

          <div className="mx-auto max-w-[95%] sm:max-w-[90%] md:max-w-[800px] text-white/90 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl leading-relaxed drop-shadow-md font-medium">
            <div className="flex flex-wrap justify-center items-center gap-x-1 sm:gap-x-2">
              <span className="whitespace-nowrap sm:text-base md:text-xl lg:text-2xl xl:text-3xl">
                Advance your career with
              </span>
              <span className="inline-block">
                <RotatingText
                  texts={[
                    "personalized guidance",
                    "interview prep",
                    "AI-powered tools",
                  ]}
                  mainClassName="px-2 sm:px-2 md:px-3 text-[#B74BD2] overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center sm:text-base md:text-xl lg:text-2xl xl:text-3xl"
                  staggerFrom={"last"}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2000}
                />
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base md:text-lg bg-white text-[#9000B5] hover:bg-gray-100 shadow-2xl backdrop-blur-sm font-semibold h-10 sm:h-12 md:h-14 rounded-xl pointer-events-auto">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
