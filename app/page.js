"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import HeroSection from "@/components/hero";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
import { features } from "@/data/features";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import { howItWorks } from "@/data/howItWorks";
import CountUp from "@/components/CountUp";
import BlurText from "@/components/BlurText";
import TracingBeam from "@/components/ui/tracing-beam";
import Spline from "@splinetool/react-spline";
import SpotlightCard from "@/components/SpotlightCard";
import StarBorder from "@/components/StarBorder";
import SplitText from "@/components/SplitText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, Suspense } from "react";
import { suppressSplineWarnings } from "@/lib/suppress-spline-warnings";
import { useAuth } from "@/contexts/auth-context";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const headingRef = useRef(null);
  const testimonialHeadingRef = useRef(null);
  const faqRef = useRef(null);
  const howItWorksRef = useRef(null);
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Suppress Spline runtime warnings
  useEffect(() => {
    const restore = suppressSplineWarnings();
    return restore; // Cleanup on unmount
  }, []);

  useEffect(() => {
    // Don't run animations if user is logged in (will redirect)
    if (loading || user) return;

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (headingRef.current) {
        const words = headingRef.current.querySelectorAll(".word");
        if (words.length > 0) {
          gsap.fromTo(
            words,
            {
              opacity: 0,
              x: -50,
            },
            {
              opacity: 1,
              x: 0,
              duration: 2,
              stagger: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: headingRef.current,
                start: "top 80%",
                end: "top 30%",
                scrub: 2,
              },
            }
          );
        }
      }

      if (testimonialHeadingRef.current) {
        const words = testimonialHeadingRef.current.querySelectorAll(".word");
        if (words.length > 0) {
          gsap.fromTo(
            words,
            {
              opacity: 0,
              x: -50,
            },
            {
              opacity: 1,
              x: 0,
              duration: 2,
              stagger: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: testimonialHeadingRef.current,
                start: "top 80%",
                end: "top 30%",
                scrub: 2,
              },
            }
          );
        }
      }

      if (faqRef.current) {
        const words = faqRef.current.querySelectorAll(".word");
        if (words.length > 0) {
          gsap.fromTo(
            words,
            {
              opacity: 0,
              x: -50,
            },
            {
              opacity: 1,
              x: 0,
              duration: 2,
              stagger: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: faqRef.current,
                start: "top 80%",
                end: "top 30%",
                scrub: 2,
              },
            }
          );
        }
      }

      if (howItWorksRef.current) {
        const words = howItWorksRef.current.querySelectorAll(".word");
        if (words.length > 0) {
          gsap.fromTo(
            words,
            {
              opacity: 0,
              x: -50,
            },
            {
              opacity: 1,
              x: 0,
              duration: 2,
              stagger: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: howItWorksRef.current,
                start: "top 80%",
                end: "top 30%",
                scrub: 2,
              },
            }
          );
        }
      }

      // Refresh ScrollTrigger after all animations are set up
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up ScrollTrigger instances
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [loading, user]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <div className="grid-background"></div>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="w-full py-12 sm:py-16 md:py-20 lg:py-28 xl:py-36 bg-background scroll-mt-20">
        <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          {/* Heading - Full Screen */}
          <div className="min-w-full h-full flex items-center justify-center snap-center px-4 sm:px-6 md:px-8 flex-shrink-0">
            <h2
              ref={headingRef}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-8 sm:mb-12 md:mb-16"
            >
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                Powerful
              </span>
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                Features
              </span>
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                for
              </span>
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                Your
              </span>
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                Career
              </span>
              <span className="word inline-block">Growth</span>
            </h2>
          </div>

          {/* Feature Cards - Side by Side Horizontally */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-none xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="transition-colors duration-300 h-full"
              >
                <SpotlightCard className="h-full min-h-[350px] sm:min-h-[380px] md:min-h-[420px] lg:min-h-[450px] p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col items-start justify-center h-full space-y-3 sm:space-y-4 md:space-y-6">
                    <div
                      className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl flex-shrink-0"
                      style={{ color: "#B74BD2" }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-left">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed text-left">
                      {feature.description}
                    </p>
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/50">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mx-auto text-center">
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4">
              <CountUp
                from={0}
                to={50}
                separator=","
                direction="up"
                duration={2}
                className="count-up-text text-5xl font-bold"
              />
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl">
                Industries Covered
              </p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-baseline gap-1">
                <CountUp
                  from={0}
                  to={1000}
                  separator=","
                  direction="up"
                  duration={0.5}
                  className="count-up-text text-5xl font-bold"
                />
                <span className="text-5xl font-bold">+</span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl">
                Interview Questions
              </p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-baseline gap-1">
                <CountUp
                  from={0}
                  to={95}
                  separator=","
                  direction="up"
                  duration={1.5}
                  className="count-up-text text-5xl font-bold"
                />
                <span className="text-5xl font-bold">%</span>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl">
                Success Rate
              </p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-baseline gap-1">
                <CountUp
                  from={0}
                  to={24}
                  separator=","
                  direction="up"
                  duration={1.5}
                  className="count-up-text text-5xl font-bold"
                />
                <span className="text-5xl font-bold">/</span>
                <CountUp
                  from={0}
                  to={7}
                  separator=","
                  direction="up"
                  duration={1}
                  className="count-up-text text-5xl font-bold"
                />
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl">
                AI Support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-8 sm:py-8 md:py-12 lg:py-16 bg-background scroll-mt-20">
        <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center max-w-6xl mx-auto mb-8 sm:mb-10 md:mb-12">
            <h2
              ref={howItWorksRef}
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4"
            >
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                How
              </span>
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">It</span>
              <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                Works
              </span>
            </h2>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left side - Tracing Beam with content */}
            <TracingBeam className="px-3">
              <div className="space-y-8 sm:space-y-12 md:space-y-16">
                {howItWorks.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col space-y-4 sm:space-y-6 group"
                  >
                    <div className="flex items-start gap-4 sm:gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                          {item.icon}
                        </div>
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className="font-semibold text-xl sm:text-xl md:text-2xl mb-2 sm:mb-3">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-base sm:text-base md:text-lg leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Star Border Component */}
              <div className="mt-12 flex justify-center">
                <Link href="/dashboard" className="w-full max-w-md">
                  <StarBorder
                    as="button"
                    color="#B74BD2"
                    speed="4s"
                    thickness={4}
                    className="w-full cursor-pointer hover:scale-105 transition-transform duration-300"
                  >
                    <p className="text-sm sm:text-base md:text-lg font-semibold">
                      Join Us Now
                    </p>
                  </StarBorder>
                </Link>
              </div>
            </TracingBeam>

            {/* Right side - 3D Spline Model */}
            <div className="hidden lg:block lg:sticky lg:top-24 h-[400px] sm:h-[500px] lg:h-[600px] w-full rounded-lg overflow-hidden bg-muted/30">
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground">
                        Loading 3D model...
                      </p>
                    </div>
                  </div>
                }
              >
                <Spline
                  scene="https://prod.spline.design/Sl5BVKi6MUgfA6xZ/scene.splinecode"
                  onLoad={() => {
                    // Spline loaded successfully - suppress non-critical warnings
                  }}
                  onError={(error) => {
                    // Only log actual errors, suppress timeline warnings
                    if (error && !error.toString().includes('Missing property')) {
                      console.warn("Spline:", error);
                    }
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="w-full py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/50">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <h2
            ref={testimonialHeadingRef}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 md:mb-16"
          >
            <span className="word inline-block mr-2 sm:mr-3 md:mr-4">What</span>
            <span className="word inline-block mr-2 sm:mr-3 md:mr-4">our</span>
            <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
              users
            </span>
            <span className="word inline-block mr-2 sm:mr-3 md:mr-4">say</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mx-auto">
            {testimonial.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-background p-2 min-h-[280px] sm:min-h-[300px] md:min-h-[320px]"
              >
                <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8">
                  <div className="flex flex-col space-y-4 sm:space-y-6 h-full">
                    <div className="flex items-center space-x-4 sm:space-x-6 mb-3 sm:mb-4">
                      <div className="relative h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 flex-shrink-0">
                        <Image
                          width={64}
                          height={64}
                          src={testimonial.image}
                          alt={testimonial.author}
                          className="rounded-full object-cover border-2 border-primary/20"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-base sm:text-lg">
                          {testimonial.author}
                        </p>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          {testimonial.role}
                        </p>
                        <p className="text-sm sm:text-base text-primary font-medium">
                          {testimonial.company}
                        </p>
                      </div>
                    </div>
                    <blockquote className="flex-1">
                      <p className="text-muted-foreground italic relative text-sm sm:text-base md:text-lg leading-relaxed">
                        <span className="text-2xl sm:text-3xl md:text-4xl text-primary absolute -top-4 sm:-top-6 -left-2 sm:-left-3">
                          &quot;
                        </span>
                        {testimonial.quote}
                        <span className="text-2xl sm:text-3xl md:text-4xl text-primary absolute -bottom-4 sm:-bottom-6 right-0">
                          &quot;
                        </span>
                      </p>
                    </blockquote>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="w-full py-8 sm:py-12 md:py-16 lg:py-24 scroll-mt-20">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12">
            <div ref={faqRef}>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                  Frequently
                </span>
                <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                  Asked
                </span>
                <span className="word inline-block mr-2 sm:mr-3 md:mr-4">
                  Questions
                </span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                <span className="word inline-block mr-1">Find</span>
                <span className="word inline-block mr-1">answers</span>
                <span className="word inline-block mr-1">to</span>
                <span className="word inline-block mr-1">common</span>
                <span className="word inline-block mr-1">questions</span>
                <span className="word inline-block mr-1">about</span>
                <span className="word inline-block mr-1">our</span>
                <span className="word inline-block mr-1">platform</span>
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm sm:text-base md:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/50">
        <div className="mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center max-w-3xl mx-auto">
            <SplitText
              text="Ready to Accelerate Your Career ?"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center"
              delay={70}
              duration={1}
              ease="elastic.out(1, 0.3)"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
            <p className="mx-auto max-w-[600px] text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl">
              Join thousands of students who are advancing their careers
              with AI-powered guidance.
            </p>
            <Link href="/dashboard" passHref>
              <Button
                size="lg"
                variant="secondary"
                className="h-10 sm:h-11 mt-4 sm:mt-5 animate-bounce text-sm sm:text-base px-4 sm:px-6"
              >
                Start Your Journey Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
