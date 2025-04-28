import { useEffect } from 'react';

const useCursorDispersion = () => {
  useEffect(() => {
    const canvas = document.getElementById('cursor-effect') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles: any[] = [];
    let animationFrame: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const addParticle = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        particles.push({
          x, y,
          alpha: 1,
          radius: Math.random() * 8 + 4,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          fade: 0.01 + Math.random() * 0.012 // индивидуальное плавное затухание
        });
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        // Используем ease-функцию для более плавного затухания
        p.alpha -= p.fade * (1 - Math.pow(p.alpha, 2));
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4f8cff';
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      particles = particles.filter(p => p.alpha > 0.01);
      animationFrame = requestAnimationFrame(animate);
    };

    // --- КОНТРОЛЬ КУРСОРА ---
    let lastCursorOnWhite = false;
    const setCursor = (show: boolean) => {
      document.body.style.cursor = show ? '' : 'none';
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
      if (onWhite !== lastCursorOnWhite) {
        setCursor(onWhite);
        lastCursorOnWhite = onWhite;
      }
      if (!onWhite) addParticle(e.clientX, e.clientY);
    };

    setCursor(false); // Скрыть при старте
    window.addEventListener('mousemove', onMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      setCursor(true); // Вернуть курсор при размонтировании
      cancelAnimationFrame(animationFrame);
    };
  }, []);
};

export default useCursorDispersion;
