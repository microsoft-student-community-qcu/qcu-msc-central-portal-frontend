import { useEffect, useRef } from "react";
import logoUrl from "@/assets/qcu-msc-logo.webp"; // Adjust path to assets relative to src/components/ui/

export function CenteredRocket() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load rocket image directly for canvas drawing
    const img = new Image();
    img.src = logoUrl;

    const updateSize = () => {
      if (!canvas) return;
      // Size the canvas bitmap to match the actual scrollable document layout dimensions
      canvas.width = canvas.parentElement?.offsetWidth || canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight || canvas.offsetHeight || 3000;
    };
    updateSize();

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      life: number;
      decay: number;
      color: string;
    }

    const particles: Particle[] = [];
    let animationFrameId: number;
    let isRunning = true;
    const startTime = performance.now();
    const duration = 8500; // Slower speed (8.5s loop)

    // Track random X position per loop cycle (bounds: 15% to 85% of viewport width)
    let currentXFraction = Math.random() * 0.7 + 0.15;
    let lastCycle = 0;

    const animate = (now: number) => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const docHeight = canvas.height;
      const docWidth = canvas.width;

      // Loop animation progress: 0 to 1
      const elapsed = now - startTime;
      const progress = (elapsed % duration) / duration;
      const currentCycle = Math.floor(elapsed / duration);
      
      // Update random horizontal position when a new cycle starts
      if (currentCycle !== lastCycle) {
        currentXFraction = Math.random() * 0.7 + 0.15;
        lastCycle = currentCycle;
      }

      // Path: starts below the document bottom (footer area), goes straight up to header top
      const startY = docHeight + 200;
      const endY = -200;
      const currentY = startY + (endY - startY) * progress;
      const currentX = docWidth * currentXFraction;

      // Calculate rocket drawing dimensions (scaling responsive size)
      let rocketWidth = Math.min(260, docWidth * 0.18);
      let rocketHeight = rocketWidth;
      
      if (img.naturalWidth && img.naturalHeight) {
        if (img.naturalWidth > img.naturalHeight) {
          rocketHeight = rocketWidth * (img.naturalHeight / img.naturalWidth);
        } else {
          rocketWidth = rocketHeight * (img.naturalWidth / img.naturalHeight);
        }
      }

      const drawX = currentX - rocketWidth / 2;
      const drawY = currentY - rocketHeight / 2;

      // Exhaust nozzle is at the bottom center of the drawn rocket image
      const exhaustX = currentX + rocketWidth * 0.02;
      const exhaustY = drawY + rocketHeight * 1.01;

      // Determine visibility/fade states based on document bounds (no fade-out at the top)
      let rocketOpacity = 0.85;
      if (currentY > docHeight) {
        rocketOpacity = 0;
      } else if (currentY > docHeight - 120) {
        const distanceIntoPage = docHeight - currentY;
        rocketOpacity = (distanceIntoPage / 120) * 0.85;
      } else if (currentY < -rocketHeight) {
        rocketOpacity = 0;
      }

      // 1. Spawn particles directly behind the rocket nozzle
      if (rocketOpacity > 0.08) {
        const colors = ["#ffffff", "#fef08a", "#facc15", "#fb923c", "#f97316", "#ea580c"];

        for (let i = 0; i < 3; i++) {
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const dx = (Math.random() - 0.5) * (rocketWidth * 0.05);
          const dy = Math.abs(dx) * 1.8;

          const velocity = 2.5 + Math.random() * 3.5;
          const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.12; 
          const vx = Math.cos(angle) * velocity;
          const vy = Math.sin(angle) * velocity + 1.2;

          particles.push({
            x: exhaustX + dx,
            y: exhaustY - dy,
            vx,
            vy,
            radius: rocketWidth * 0.015 + Math.random() * (rocketWidth * 0.015),
            alpha: rocketOpacity * 0.8,
            life: 1.0,
            decay: 0.015 + Math.random() * 0.015,
            color: randomColor,
          });
        }
      }

      // 2. Update and draw particles first
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life * rocketOpacity);
        p.x += p.vx;
        p.y += p.vy;
        p.radius = Math.max(0.1, p.radius * 0.95);

        if (p.life <= 0 || p.radius <= 0.5) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        const size = p.radius * 2;
        ctx.fillRect(p.x - p.radius, p.y - p.radius, size, size);
        ctx.restore();
      }

      // 3. Draw the rocket image on top of the particles
      if (img.complete && rocketOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = rocketOpacity;
        
        // Add subtle engine shake coordinates directly to the canvas draw offset
        const shakeX = (Math.random() - 0.5) * 2;
        const shakeY = (Math.random() - 0.5) * 2;

        ctx.drawImage(img, drawX + shakeX, drawY + shakeY, rocketWidth, rocketHeight);
        ctx.restore();
      }

      if (isRunning) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    img.onload = () => {
      if (isRunning) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    if (img.complete) {
      animationFrameId = requestAnimationFrame(animate);
    }

    window.addEventListener("resize", updateSize);

    // Watch for parent resize changes
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
      {/* Absolute canvas: spans total scrollable document height (top of site to footer bottom) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}
