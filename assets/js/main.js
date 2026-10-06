/* SAVI — interactions */
(function(){
  'use strict';

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

  // Mobile menu — hard lock the page beneath the overlay (including iOS Safari)
  const toggle = $('.menu-toggle');
  const mobile = $('.mobile-menu');
  let lockedScrollY = 0;
  let menuWasOpen = false;

  if(toggle && mobile){
    const lockPage = () => {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.documentElement.classList.add('menu-lock');
      document.body.classList.add('menu-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      menuWasOpen = true;
    };

    const unlockPage = () => {
      if(!menuWasOpen) return;
      document.documentElement.classList.remove('menu-lock');
      document.body.classList.remove('menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockedScrollY);
      menuWasOpen = false;
    };

    const openMenu = () => {
      mobile.classList.add('open');
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Close menu' : 'Закрити меню');
      lockPage();
    };

    const closeMenu = () => {
      mobile.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Menu' : 'Меню');
      unlockPage();
    };

    toggle.addEventListener('click', () => {
      mobile.classList.contains('open') ? closeMenu() : openMenu();
    });

    $$('a', mobile).forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });

    // Defensive fallback for mobile browsers that try to rubber-band the page.
    document.addEventListener('touchmove', e => {
      if(document.body.classList.contains('menu-open') && !mobile.contains(e.target)){
        e.preventDefault();
      }
    }, {passive:false});

    window.addEventListener('pagehide', unlockPage);
  }


  // Header depth on scroll
  const header = $('.site-header');
  const syncHeader = () => { if(header) header.classList.toggle('scrolled', window.scrollY > 12); };
  syncHeader(); window.addEventListener('scroll', syncHeader, {passive:true});

  // Reveal on scroll
  const reveals = $$('.reveal');
  if(reveals.length && 'IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){ entry.target.classList.add('visible'); io.unobserve(entry.target); }
    }), {threshold:.12, rootMargin:'0px 0px -48px 0px'});
    reveals.forEach(el => io.observe(el));
  }else{ reveals.forEach(el => el.classList.add('visible')); }

  // Count-up metrics
  $$('.stat-num [data-count]').forEach(el => {
    const target = Number(el.dataset.count || el.textContent.replace(/\D/g,''));
    if(!Number.isFinite(target)) return;
    let started=false;
    const run=()=>{ if(started) return; started=true; const start=performance.now(); const duration=900; const tick=t=>{ const p=Math.min(1,(t-start)/duration); el.textContent=Math.floor((1-Math.pow(1-p,3))*target); if(p<1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
    if('IntersectionObserver' in window){ new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&run()),{threshold:.7}).observe(el); } else run();
  });

  // Portfolio filter
  const filterBtns = $$('.filter-btn'); const items = $$('[data-cat]');
  if(filterBtns.length && items.length){
    filterBtns.forEach(btn=>btn.addEventListener('click',()=>{
      filterBtns.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
      const cat=btn.dataset.filter;
      items.forEach(item=>{
        const show=cat==='all'||item.dataset.cat===cat;
        item.hidden=!show;
        if(show){ item.classList.remove('visible'); requestAnimationFrame(()=>item.classList.add('visible')); }
      });
    }));
  }

  // Lightbox
  const lb=$('#lightbox');
  if(lb){
    const img=$('.lb-img-wrap img',lb), close=$('.lb-close',lb), prev=$('.lb-prev',lb), next=$('.lb-next',lb);
    let gallery=[], idx=0;
    const show=()=>{ if(!gallery.length) return; img.src=gallery[idx]; prev.hidden=next.hidden=gallery.length<2; };
    const open=(srcs,start,alt)=>{gallery=srcs;idx=start;img.alt=alt||'';show();lb.classList.add('open');document.body.classList.add('lb-open');};
    const closeLb=()=>{lb.classList.remove('open');document.body.classList.remove('lb-open');};
    $$('.service-gallery[data-gallery], .projects-grid[data-gallery]').forEach(container=>{
      const imgs=$$('img[data-full], img',container), srcs=imgs.map(x=>x.dataset.full||x.currentSrc||x.src);
      imgs.forEach((el,i)=>{el.style.cursor='pointer';el.addEventListener('click',()=>open(srcs,i,el.alt));});
    });
    close?.addEventListener('click',closeLb); lb.addEventListener('click',e=>{if(e.target===lb) closeLb();});
    prev?.addEventListener('click',()=>{idx=(idx-1+gallery.length)%gallery.length;show();}); next?.addEventListener('click',()=>{idx=(idx+1)%gallery.length;show();});
    document.addEventListener('keydown',e=>{if(!lb.classList.contains('open')) return;if(e.key==='Escape') closeLb();if(e.key==='ArrowLeft') prev?.click();if(e.key==='ArrowRight') next?.click();});
  }


  // Phone chooser: keep the visible CTA as a phone button, then let the visitor choose Phone / Telegram / Viber.
  const phoneChooserLabels = document.documentElement.lang === 'en'
    ? {title:'Choose contact method', phone:'Phone', telegram:'Telegram', viber:'Viber', phoneHint:'Call +38 068 244 80 79', telegramHint:'Open SAVI in Telegram', viberHint:'Open SAVI in Viber', close:'Close'}
    : {title:'Оберіть спосіб зв’язку', phone:'Телефон', telegram:'Telegram', viber:'Viber', phoneHint:'Подзвонити +38 068 244 80 79', telegramHint:'Відкрити SAVI у Telegram', viberHint:'Відкрити SAVI у Viber', close:'Закрити'};

  const contactChoice = document.createElement('div');
  contactChoice.className = 'contact-choice';
  contactChoice.setAttribute('aria-hidden','true');
  contactChoice.innerHTML = `
    <div class="contact-choice-panel" role="dialog" aria-modal="true" aria-label="${phoneChooserLabels.title}">
      <div class="contact-choice-head">
        <div class="contact-choice-title">${phoneChooserLabels.title}</div>
        <button class="contact-choice-close" type="button" aria-label="${phoneChooserLabels.close}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
          </svg>
        </button>
      </div>
      <div class="contact-choice-options">
        <a class="contact-choice-option" href="tel:+380682448079">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span class="meta"><span class="name">${phoneChooserLabels.phone}</span><span class="hint">${phoneChooserLabels.phoneHint}</span></span>
        </a>
        <a class="contact-choice-option" href="https://t.me/bc_savi" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.7 4.3 18.6 19c-.2 1-.8 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.4-4.8 8.8-8c.4-.4-.1-.6-.6-.2L6.6 13.2 2 11.7c-1-.3-1-1 .2-1.4L20.1 3.4c.9-.3 1.7.2 1.6.9Z" fill="currentColor"></path></svg>
          <span class="meta"><span class="name">${phoneChooserLabels.telegram}</span><span class="hint">${phoneChooserLabels.telegramHint}</span></span>
        </a>
        <a class="contact-choice-option" href="viber://chat?number=+380682448079">
          <svg viewBox="0 0 512 512" aria-hidden="true"><path d="M444 49.9C431.3 38.2 379.9.9 265.3.4c0 0-135.1-8.1-200.9 52.3C27.8 89.3 14.9 143 13.5 209.5c-1.4 66.5-3.1 191.1 117 224.9h.1l-.1 51.6s-.8 20.9 13 25.1c16.6 5.2 26.4-10.7 42.3-27.8 8.7-9.4 20.7-23.2 29.8-33.7 82.2 6.9 145.3-8.9 152.5-11.2 16.6-5.4 110.5-17.4 125.7-142 15.8-128.6-7.6-209.8-49.8-246.5zM457.9 287c-12.9 104-89 110.6-103 115.1-6 1.9-61.5 15.7-131.2 11.2 0 0-52 62.7-68.2 79-5.3 5.3-11.1 4.8-11-5.7 0-6.9.4-85.7.4-85.7-.1 0-.1 0 0 0-101.8-28.2-95.8-134.3-94.7-189.8 1.1-55.5 11.6-101 42.6-131.6 55.7-50.5 170.4-43 170.4-43 96.9.4 143.3 29.6 154.1 39.4 35.7 30.6 53.9 103.8 40.6 211.1zm-139-80.8c.4 8.6-12.5 9.2-12.9.6-1.1-22-11.4-32.7-32.6-33.9-8.6-.5-7.8-13.4.7-12.9 27.9 1.5 43.4 17.5 44.8 46.2zm20.3 11.3c1-42.4-25.5-75.6-75.8-79.3-8.5-.6-7.6-13.5.9-12.9 58 4.2 88.9 44.1 87.8 92.5-.1 8.6-13.1 8.2-12.9-.3zm47 13.4c.1 8.6-12.9 8.7-12.9.1-.6-81.5-54.9-125.9-120.8-126.4-8.5-.1-8.5-12.9 0-12.9 73.7.5 133 51.4 133.7 139.2zM374.9 329v.2c-10.8 19-31 40-51.8 33.3l-.2-.3c-21.1-5.9-70.8-31.5-102.2-56.5-16.2-12.8-31-27.9-42.4-42.4-10.3-12.9-20.7-28.2-30.8-46.6-21.3-38.5-26-55.7-26-55.7-6.7-20.8 14.2-41 33.3-51.8h.2c9.2-4.8 18-3.2 23.9 3.9 0 0 12.4 14.8 17.7 22.1 5 6.8 11.7 17.7 15.2 23.8 6.1 10.9 2.3 22-3.7 26.6l-12 9.6c-6.1 4.9-5.3 14-5.3 14s17.8 67.3 84.3 84.3c0 0 9.1.8 14-5.3l9.6-12c4.6-6 15.7-9.8 26.6-3.7 14.7 8.3 33.4 21.2 45.8 32.9 7 5.7 8.6 14.4 3.8 23.6z" fill="currentColor"></path></svg>
          <span class="meta"><span class="name">${phoneChooserLabels.viber}</span><span class="hint">${phoneChooserLabels.viberHint}</span></span>
        </a>
      </div>
    </div>`;
  document.body.appendChild(contactChoice);

  const closeContactChoice = () => {
    contactChoice.classList.remove('open');
    contactChoice.setAttribute('aria-hidden','true');
    document.body.classList.remove('contact-choice-open');
  };
  const openContactChoice = (e) => {
    e.preventDefault();
    contactChoice.classList.add('open');
    contactChoice.setAttribute('aria-hidden','false');
  };
  $$('.js-contact-choice').forEach(el => el.addEventListener('click', openContactChoice));
  $('.contact-choice-close', contactChoice)?.addEventListener('click', closeContactChoice);
  contactChoice.addEventListener('click', e => { if(e.target === contactChoice) closeContactChoice(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && contactChoice.classList.contains('open')) closeContactChoice(); });

  // Home hero depth
  const hero=$('.hero'); const heroBg=$('.hero-bg');
  if(hero && heroBg && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    window.addEventListener('scroll',()=>{ const y=Math.min(90,window.scrollY*.08); heroBg.style.transform=`scale(1.04) translateY(${y}px)`; },{passive:true});
  }
})();
