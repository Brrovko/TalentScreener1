import { useEffect, useRef } from 'react';

const useCursorDispersion = (enabled: boolean = true) => {
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number>();
  const lastCursorOnWhiteRef = useRef(false);

  useEffect(() => {
    const canvas = document.getElementById('cursor-effect') as HTMLCanvasElement;
    const ctx = canvas ? canvas.getContext('2d') : null;

    const setCursor = (show: boolean) => {
      document.body.style.cursor = show ? '' : 'none';
    };

    const resize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    const addParticle = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x, y,
          alpha: 1,
          radius: Math.random() * 8 + 4,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          fade: 0.01 + Math.random() * 0.012
        });
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= p.fade * (1 - Math.pow(p.alpha, 2));
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4f8cff';
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.01);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const isOnWhitePanel = (el: HTMLElement | null): boolean => {
      while (el) {
        if (el.classList && el.classList.contains('bg-white')) return true;
        el = el.parentElement as HTMLElement;
      }
      return false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      const onWhite = isOnWhitePanel(el);
      if (onWhite !== lastCursorOnWhiteRef.current) {
        setCursor(onWhite);
        lastCursorOnWhiteRef.current = onWhite;
      }
      if (!onWhite) addParticle(e.clientX, e.clientY);
    };

    // resize всегда нужен
    if (canvas) {
      window.addEventListener('resize', resize);
      resize();
    }

    // animate всегда работает
    if (ctx && canvas) animate();

    // обработчики мыши и скрытие курсора — только если enabled === true
    if (enabled && canvas && ctx) {
      window.addEventListener('mousemove', onMouseMove);
      setCursor(false);
    } else {
      setCursor(true);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      setCursor(true);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled]);
};

export default useCursorDispersion;
