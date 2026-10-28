/* Apresentação progressiva: conteúdo visível mesmo sem animações. */
(function initUnitizeReveal(){
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  if(reduced.matches||!('IntersectionObserver' in window)||typeof Element.prototype.animate!=='function')return;
  const selectors=[
    '.hero-copy > .eyebrow','.hero-copy > h1','.hero-copy > .lead',
    '.hero-copy > .hero-actions','.hero-copy > .caption','.mission-window',
    '.section-heading','.architecture-flow > article',
    '.steps > li','.solution-list > article','.waitlist-copy','.waitlist-form'
  ];
  const targets=[...new Set(document.querySelectorAll(selectors.join(',')))];
  const active=new Map();
  let previousScroll=window.scrollY,scrollingUp=false;
  window.addEventListener('scroll',()=>{
    const current=window.scrollY;
    if(current===previousScroll)return;
    scrollingUp=current<previousScroll;previousScroll=current;
    if(scrollingUp)[...active.values()].forEach(animation=>animation.cancel());
  },{passive:true});
  const groupIndex=new Map();
  const delays=new WeakMap();
  targets.forEach(element=>{
    const group=element.parentElement,index=groupIndex.get(group)||0;
    delays.set(element,Math.min(index*220,660));groupIndex.set(group,index+1);
  });
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const element=entry.target;observer.unobserve(element);
      if(scrollingUp||reduced.matches||document.hidden||element.contains(document.activeElement))return;
      // Preservar transformações existentes, como a perspectiva do quadro inicial.
      const original=getComputedStyle(element).transform;
      const baseline=original==='none'?'':original;
      const distance=Math.max(80,element.getBoundingClientRect().right+24);
      try{
        const animation=element.animate([
          {opacity:1,transform:`translateX(-${distance}px) ${baseline}`.trim()},
          {opacity:1,transform:original}
        ],{duration:2000,delay:delays.get(element)||0,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
        element.classList.add('unitize-reveal-running');active.set(element,animation);
        const clear=()=>{element.classList.remove('unitize-reveal-running');active.delete(element);};
        animation.onfinish=clear;animation.oncancel=clear;
      }catch{element.classList.remove('unitize-reveal-running');}
    });
  },{threshold:.08,rootMargin:'0px 0px -20px 0px'});
  targets.forEach(element=>observer.observe(element));
  reduced.addEventListener?.('change',event=>{
    if(!event.matches)return;
    observer.disconnect();[...active.values()].forEach(animation=>animation.cancel());
  });
  document.addEventListener('focusin',event=>{
    for(const [element,animation] of active){if(element.contains(event.target))animation.cancel();}
  });
})();
