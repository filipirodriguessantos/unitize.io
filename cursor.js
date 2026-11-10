(() => {
    const cursor1=document.querySelector('.cursor1'),cursor2=document.querySelector('.cursor2');
    if(!cursor1||!cursor2)return;
    const cursorMode=window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
    let frame=0,restoreFrame=0,x=0,y=0;
    function hideCursor(){
      if(frame)cancelAnimationFrame(frame);if(restoreFrame)cancelAnimationFrame(restoreFrame);
      frame=restoreFrame=0;document.documentElement.classList.remove('unitize-cursor-active');
    }
    function paint(){
      frame=0;
      const first=!document.documentElement.classList.contains('unitize-cursor-active');
      if(first){cursor1.style.transition='none';cursor2.style.transition='none';}
      const position=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      cursor1.style.transform=position;cursor2.style.transform=position;
      if(first){
        document.documentElement.classList.add('unitize-cursor-active');
        restoreFrame=requestAnimationFrame(()=>{restoreFrame=0;cursor1.style.transition='';cursor2.style.transition='';});
      }
    }
    window.addEventListener('pointermove',event=>{
      if(!cursorMode.matches||event.pointerType!=='mouse'){hideCursor();return;}
      x=event.clientX;y=event.clientY;if(!frame)frame=requestAnimationFrame(paint);
    },{passive:true});
    document.documentElement.addEventListener('pointerleave',hideCursor);
    window.addEventListener('blur',hideCursor);cursorMode.addEventListener('change',hideCursor);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)hideCursor();});
  })();
