/* Eagle Field background motion: slow "airflow" streamlines drifting through hero bands.
   Particles follow a smooth flow field and leave fading trails in steel blue with a few gold
   strands. Runs only while the band is on screen; off for prefers-reduced-motion. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var bands = document.querySelectorAll('[data-motion]');
  if (!bands.length) return;

  function field(x, y, t) {
    // Smooth pseudo-noise built from layered sines: gentle left-to-right flow with soft curls.
    var a = Math.sin(x * 0.0021 + t * 0.00011) + Math.cos(y * 0.0034 - t * 0.00009);
    var b = Math.sin((x + y) * 0.0013 + t * 0.00007);
    return 0.35 * a + 0.45 * b;
  }

  bands.forEach(function (band) {
    var cv = document.createElement('canvas');
    cv.className = 'motion-canvas';
    cv.setAttribute('aria-hidden', 'true');
    band.insertBefore(cv, band.firstChild);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, dpr = 1, parts = [], running = false, raf = 0, last = 0;

    function size() {
      var r = band.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(220, (W * H) / 5200));
      parts = [];
      for (var i = 0; i < n; i++) parts.push(spawn(true));
      ctx.clearRect(0, 0, W, H);
    }
    function spawn(anywhere) {
      return {
        x: anywhere ? Math.random() * W : -10,
        y: Math.random() * H,
        v: 0.35 + Math.random() * 0.55,
        life: 200 + Math.random() * 420,
        gold: Math.random() < 0.12
      };
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 28) return; // ~35 fps is plenty for a background
      last = t;
      // Fade previous frame toward transparent so strands leave soft trails.
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.1;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var ang = field(p.x, p.y, t);
        var nx = p.x + Math.cos(ang) * p.v * 2.2 + 0.55;
        var ny = p.y + Math.sin(ang) * p.v * 1.6;
        ctx.strokeStyle = p.gold ? 'rgba(217,174,82,0.30)' : 'rgba(132,176,214,0.16)';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life--;
        if (p.life < 0 || p.x > W + 10 || p.y < -10 || p.y > H + 10) parts[i] = spawn(false);
      }
    }
    function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 150); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(band);
    } else start();
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  });
})();
