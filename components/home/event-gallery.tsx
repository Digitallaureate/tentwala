"use client";

import { useEffect, useRef } from "react";
import { SectionHeading } from "@/components/home/section-heading";

// Put the five photos in /public with these names (or change the paths here).
const galleryImages = [
  { src: "/hero_1.png", alt: "Corporate event setup" },
  { src: "/hero_2.png", alt: "Wedding ceremony ritual" },
  { src: "/hero_3.png", alt: "Friends and family gathering" },
  { src: "/hero_4.png", alt: "Floral decoration" },
  { src: "/hero_1.png", alt: "Corporate event setup" },
  { src: "/hero_2.png", alt: "Wedding ceremony ritual" },
  { src: "/hero_3.png", alt: "Friends and family gathering" },
  { src: "/hero_4.png", alt: "Floral decoration" },
];

// The strip repeats the photos so it can scroll forever.
const COPIES = 3;
const SCROLL_PX_PER_SECOND_PER_1000PX = 45;
// Tilt (degrees) for an item at the very edge of the strip; 0 at the center.
const MAX_TILT_DEG = 17;
// Perspective distance as a multiple of the item width (smaller = stronger curve).
const PERSPECTIVE_PER_ITEM_WIDTH = 1.66;

export function EventGallery() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return;
    }

    const items = Array.from(track.children) as HTMLElement[];
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let lefts: number[] = [];
    let widths: number[] = [];
    let viewportWidth = 0;
    let setWidth = 1;
    let perspective = 1;
    let offset = 0;
    let lastTime = 0;
    let frameId = 0;
    let isVisible = true;

    const measure = () => {
      viewportWidth = viewport.clientWidth;
      lefts = items.map((item) => item.offsetLeft);
      widths = items.map((item) => item.offsetWidth);
      setWidth = lefts[galleryImages.length] - lefts[0];
      perspective = widths[0] * PERSPECTIVE_PER_ITEM_WIDTH;
    };

    const render = () => {
      const half = viewportWidth / 2;

      items.forEach((item, index) => {
        const centerX = lefts[index] - offset + widths[index] / 2;
        const distance = (centerX - half) / half;
        const tilt = -distance * MAX_TILT_DEG;

        item.style.transform = `translateX(${-offset}px) perspective(${perspective}px) rotateY(${tilt}deg)`;
      });
    };

    const tick = (time: number) => {
      const elapsed = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;

      offset =
        (offset +
          (viewportWidth / 1000) * SCROLL_PX_PER_SECOND_PER_1000PX * elapsed) %
        setWidth;
      render();
      frameId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduceMotion || !isVisible || frameId) {
        return;
      }

      lastTime = 0;
      frameId = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };

    measure();
    // Start with the first photo mostly scrolled off the left, as in the design.
    offset = ((lefts[1] - lefts[0]) * 0.62) % setWidth;
    render();
    start();

    const resizeObserver = new ResizeObserver(() => {
      measure();
      render();
    });
    resizeObserver.observe(viewport);

    // Don't animate while the gallery is off screen.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;

      if (isVisible) {
        start();
      } else {
        stop();
      }
    });
    visibilityObserver.observe(viewport);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  return (
    <section className="bg-[var(--color-bg)] py-12 sm:py-16 lg:pb-10 lg:pt-[100px]">
      <SectionHeading eyebrow="Inspiration" title="Event Gallery" />

      {/* Sizes are Figma values (1920px frame): 394px photos with 40px gaps. */}
      <div
        ref={viewportRef}
        className="mt-6 overflow-hidden py-8 [container-type:inline-size] lg:mt-[60px]"
      >
        <div
          ref={trackRef}
          className="relative flex w-max gap-4 lg:gap-[2.08cqw]"
        >
          {Array.from({ length: COPIES }).flatMap((_, copy) =>
            galleryImages.map((image, position) => (
              <div
                key={`${copy}-${position}`}
                aria-hidden={copy > 0}
                className="w-[62cqw] shrink-0 will-change-transform sm:w-[40cqw] lg:w-[20.52cqw]"
              >
                <img
                  alt={copy === 0 ? image.alt : ""}
                  className="aspect-[394/326] w-full object-cover"
                  draggable={false}
                  src={image.src}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
