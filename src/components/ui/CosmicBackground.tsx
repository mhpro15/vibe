"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export function CosmicBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      particles: {
        color: {
          value: ["#ffffff", "#a78bfa", "#818cf8", "#c4b5fd"],
        },
        links: {
          color: "#a78bfa",
          distance: 150,
          enable: true,
          opacity: 0.1,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: "none",
          random: true,
          straight: false,
          outModes: {
            default: "out",
          },
        },
        number: {
          density: {
            enable: true,
            width: 1920,
            height: 1080,
          },
          value: 140,
        },
        opacity: {
          value: { min: 0.3, max: 0.7 },
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 0.5, max: 2 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4,
          },
          push: {
            quantity: 4,
          },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) return null;

  return (
    <Particles
      id="cosmic-particles"
      className="fixed inset-0 z-1"
      options={options}
    />
  );
}
