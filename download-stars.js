(function initStarfieldNav() {
    const canvas = document.getElementById('starfield-canvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const STAR_COUNT = 170;
    const SPEED_X = -.15;
    const SPEED_Y = .35;
    const WHITE_STAR = 'rgba(238,244,255,';
    const BLUE_STAR = 'rgba(153,243,255,';
    const CONNECTION_DISTANCE = 150;
    const MAX_CONNECTIONS = 64;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
    let stars = [];
    let width = 0;
    let height = 0;
    let frame = null;
    let lastTime = null;

    function createStars() {
      stars = Array.from({length:STAR_COUNT}, () => {
        const radius = Math.random()*1.75+.75;
        return {
          x:Math.random()*width, y:Math.random()*height,
          radius, depthFactor:radius*.8,
          colorPrefix:Math.random()<.8?WHITE_STAR:BLUE_STAR,
          opacity:.15+Math.random()*.85,
          twinkleSpeed:(Math.random()*.012+.004)*(Math.random()<.5?1:-1)
        };
      });
    }

    function draw(delta = 0) {
      ctx.clearRect(0,0,width,height);
      for (const star of stars) {
        star.x += SPEED_X*star.depthFactor*delta;
        star.y += SPEED_Y*star.depthFactor*delta;
        if (star.y > height) {star.y=0;star.x=Math.random()*width;}
        else if (star.y < 0) {star.y=height;star.x=Math.random()*width;}
        if (star.x > width) {star.x=0;star.y=Math.random()*height;}
        else if (star.x < 0) {star.x=width;star.y=Math.random()*height;}
        star.opacity += star.twinkleSpeed*delta;
        if (star.opacity >= 1) {star.opacity=1;star.twinkleSpeed=-Math.abs(star.twinkleSpeed);}
        if (star.opacity <= .15) {star.opacity=.15;star.twinkleSpeed=Math.abs(star.twinkleSpeed);}
      }
      // Apenas pares próximos, uma conexão por estrela e sem brilho nas linhas.
      ctx.shadowBlur=0;
      ctx.lineWidth=.6;
      const connected = new Set();
      let connectionCount=0;
      for (let i=0;i<stars.length && connectionCount<MAX_CONNECTIONS;i++) {
        if (connected.has(i)) continue;
        let nearest=-1;
        let distance=CONNECTION_DISTANCE;
        for (let j=i+1;j<stars.length;j++) {
          if (connected.has(j)) continue;
          const candidateDistance=Math.hypot(stars[i].x-stars[j].x,stars[i].y-stars[j].y);
          if (candidateDistance<distance) {nearest=j;distance=candidateDistance;}
        }
        if (nearest<0) continue;
        const start=stars[i];
        const end=stars[nearest];
        const opacity=.18*(1-distance/CONNECTION_DISTANCE)*Math.min(start.opacity,end.opacity);
        ctx.beginPath();
        ctx.moveTo(start.x,start.y);
        ctx.lineTo(end.x,end.y);
        ctx.strokeStyle=`rgba(153,243,255,${opacity})`;
        ctx.stroke();
        connected.add(i);
        connected.add(nearest);
        connectionCount++;
      }
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x,star.y,star.radius,0,Math.PI*2);
        ctx.fillStyle=star.colorPrefix+star.opacity+')';
        ctx.shadowBlur=star.radius>1.2?4:0;
        ctx.shadowColor=star.colorPrefix+'.4)';
        ctx.fill();
      }
    }

    function animate(time) {
      frame=null;
      if (document.hidden || reducedMotion.matches) return;
      const delta=lastTime===null?0:Math.min((time-lastTime)/(1000/60),3);
      lastTime=time;
      draw(delta);
      frame=requestAnimationFrame(animate);
    }

    function resume() {
      if (frame!==null) cancelAnimationFrame(frame);
      frame=null;
      lastTime=null;
      draw();
      if (!document.hidden && !reducedMotion.matches) frame=requestAnimationFrame(animate);
    }

    function resizeCanvas() {
      width=window.innerWidth;
      height=window.innerHeight;
      const scale=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*scale);
      canvas.height=Math.round(height*scale);
      ctx.setTransform(scale,0,0,scale,0,0);
      createStars();
      resume();
    }

    window.addEventListener('resize',resizeCanvas);
    document.addEventListener('visibilitychange',resume);
    reducedMotion.addEventListener('change',resume);
    resizeCanvas();
  })();
