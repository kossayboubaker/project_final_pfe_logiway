(function() {
  const DarkPalette = [[59,130,246], [99,102,241], [14,165,233], [51,65,85]];
  const LightPalette = [[37,99,235], [30,58,138], [79,70,229]];

  let canvas, ctx;
  let particles = [];
  let w, h;
  let raf = null;
  let isDark = true;
  let observer = null;

  function initTheme() {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme === 'light') {
      isDark = false;
    } else if (savedTheme === 'dark') {
      isDark = true;
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? false : true;
    }
    applyTheme(isDark);
  }

  function applyTheme(dark) {
    isDark = dark;
    document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme-preference', dark ? 'dark' : 'light');
    updateToggleButtonText();
    if (particles.length > 0) {
      initParticles(); 
      if (ctx) draw(); // instantly redraw
    }
  }

  window.toggleTheme = function() {
    applyTheme(!isDark);
  };

  function updateToggleButtonText(btnElement) {
    const btn = btnElement || document.querySelector('.theme-toggle');
    if (!btn) return;
    if (isDark) {
      btn.innerHTML = '☀️ Light mode';
    } else {
      btn.innerHTML = '🌙 Dark mode';
    }
  }

  let btn = null;

  function setFloatingStyles(b) {
      b.style.position = 'fixed';
      b.style.top = '16px';
      b.style.right = '16px';
      b.style.zIndex = '9999';
      b.style.marginRight = '0';
  }

  function setNavbarStyles(b) {
      b.style.position = 'relative';
      b.style.top = 'auto';
      b.style.right = 'auto';
      b.style.zIndex = 'auto';
      b.style.marginRight = '8px';
  }

  function findNotifIcon() {
      const icons = document.querySelectorAll('mat-toolbar .nav-actions button mat-icon, mat-toolbar button mat-icon');
      for (let i = 0; i < icons.length; i++) {
          if (icons[i].textContent.includes('notifications')) {
              return icons[i].closest('button');
          }
      }
      return null;
  }

  function maintainButton() {
      if (!btn) return;
      
      const notifIcon = findNotifIcon();
      
      if (notifIcon) {
          // Case 2: Navbar is present
          if (btn.parentNode !== notifIcon.parentNode || btn.nextSibling !== notifIcon) {
              setNavbarStyles(btn);
              notifIcon.parentNode.insertBefore(btn, notifIcon);
          }
      } else {
          // Case 1: Navbar is absent (Auth pages, etc)
          if (btn.parentNode !== document.body) {
              setFloatingStyles(btn);
              document.body.appendChild(btn);
          }
      }
  }

  function initToggleButton() {
    btn = document.querySelector('.theme-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.onclick = window.toggleTheme;
    }
    updateToggleButtonText(btn);

    // Initial explicit run
    maintainButton();

    // Persistent global observer to ensure visibility and react to Angular route changes 
    // or component recreation without memory leaks
    if (!observer) {
        observer = new MutationObserver(() => {
            maintainButton();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function initCanvasAndLoop() {
    canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    
    // Add position relative and zIndex 1 to angular app-root so content is above background
    const appRoot = document.querySelector('app-root');
    if(appRoot) {
        appRoot.style.position = 'relative';
        appRoot.style.zIndex = '1';
    }

    ctx = canvas.getContext('2d');
    
    // Validation constraint
    if (!ctx) {
        setTimeout(() => {
            ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn('Canvas 2D context initialization failed. Animation loop aborted silently.');
                return;
            }
            startAnimation();
        }, 100);
    } else {
        startAnimation();
    }
  }

  function startAnimation() {
    resizeCanvasAndInit();
    window.addEventListener('resize', onResize);
    loop(); // Never deferred 
  }

  function onResize() {
    if (raf !== null) {
        cancelAnimationFrame(raf);
    }
    resizeCanvasAndInit();
    loop(); // Restart within the same event handler
  }

  function resizeCanvasAndInit() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    initParticles();
  }

  function initParticles() {
    particles = [];
    // max(40, min(120, (W × H) / 8500))
    const count = Math.floor(Math.max(40, Math.min(120, (w * h) / 8500)));
    const palette = isDark ? DarkPalette : LightPalette;
    
    for (let i = 0; i < count; i++) {
        const colorArr = palette[Math.floor(Math.random() * palette.length)];
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: 1.2 + Math.random() * 2.6, 
            colorArr: colorArr,
            phase: Math.random() * Math.PI * 2,
            speed: 0.015 + Math.random() * 0.02
        });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    
    // Connectors
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 130) {
                let lineAlpha = 1 - (dist / 130);
                if (!isDark) {
                    lineAlpha *= 0.09; 
                } else {
                    lineAlpha *= 0.3; 
                }
                
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${particles[i].colorArr.join(',')}, ${lineAlpha})`;
                ctx.lineWidth = 0.8;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    // Particles
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.speed;
        
        const pulse = Math.sin(p.phase) * 0.5 + 0.5; 
        
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const colorStr = p.colorArr.join(',');
        
        let minAlpha = isDark ? 0.3 : 0.18;
        let maxAlpha = isDark ? 0.9 : 0.50;
        let currentAlpha = minAlpha + (maxAlpha - minAlpha) * pulse;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.5);
        gradient.addColorStop(0, `rgba(${colorStr}, ${currentAlpha * 0.8})`);
        gradient.addColorStop(1, `rgba(${colorStr}, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorStr}, ${currentAlpha})`;
        ctx.fill();
    }
  }

  function loop() {
    draw();
    raf = requestAnimationFrame(loop);
  }

  // Defer exclusively the DOM injection, start animation universally upon load
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
          initTheme();
          initToggleButton();
          initCanvasAndLoop();
      });
  } else {
      initTheme();
      initToggleButton();
      initCanvasAndLoop();
  }

})();
