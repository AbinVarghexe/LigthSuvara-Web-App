import { useEffect, useRef } from 'react';

interface ColorBendsProps {
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
}

export function ColorBends({
  rotation = 45,
  speed = 0.2,
  colors = ["#5227FF", "#FF9FFC", "#80ffff"],
  transparent = false,
  autoRotate = 0,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.1
}: ColorBendsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      };
    };

    if (mouseInfluence > 0) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      timeRef.current += speed * 0.01;

      // Create gradient
      const gradient = ctx.createLinearGradient(
        width * (0.5 + parallax * (mouseRef.current.x - 0.5)),
        height * (0.5 + parallax * (mouseRef.current.y - 0.5)),
        width * (0.5 - parallax * (mouseRef.current.x - 0.5)),
        height * (0.5 - parallax * (mouseRef.current.y - 0.5))
      );

      // Add color stops with animation
      colors.forEach((color, index) => {
        const offset = (index / (colors.length - 1) + Math.sin(timeRef.current + index) * 0.1) % 1;
        gradient.addColorStop(Math.max(0, Math.min(1, offset)), color);
      });

      // Clear canvas
      if (transparent) {
        ctx.clearRect(0, 0, width, height);
      }

      // Draw gradient
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add animated blobs for more dynamic effect
      ctx.globalCompositeOperation = 'screen';
      colors.forEach((color, i) => {
        const x = width * (0.5 + 0.3 * Math.sin(timeRef.current * 0.5 + i * 2));
        const y = height * (0.5 + 0.3 * Math.cos(timeRef.current * 0.7 + i * 2));
        const radius = Math.min(width, height) * (0.3 + 0.1 * Math.sin(timeRef.current + i));

        const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        blobGradient.addColorStop(0, color + '40');
        blobGradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = blobGradient;
        ctx.fillRect(0, 0, width, height);
      });

      ctx.globalCompositeOperation = 'source-over';

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [rotation, speed, colors, transparent, autoRotate, scale, frequency, warpStrength, mouseInfluence, parallax, noise]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
      }}
    />
  );
}
