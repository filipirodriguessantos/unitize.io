(function initLanding(){
  const mobileButton=document.getElementById('mobile_btn');
  const mobileMenu=document.getElementById('mobile_menu');
  function closeMenu(){mobileMenu.hidden=true;mobileButton.setAttribute('aria-expanded','false');}
  mobileButton.addEventListener('click',()=>{mobileMenu.hidden=!mobileMenu.hidden;mobileButton.setAttribute('aria-expanded',String(!mobileMenu.hidden));});
  mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileMenu.hidden){closeMenu();mobileButton.focus();}});
  window.matchMedia('(min-width:1151px)').addEventListener('change',event=>{if(event.matches)closeMenu();});
  const sections=[...document.querySelectorAll('main>section[id]')];
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('#nav_list a,#mobile_menu a').forEach(link=>{
        const active=link.hash==='#'+entry.target.id;
        link.classList.toggle('active',active);
        if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
      });}}
    },{rootMargin:'-15% 0px -55% 0px'});
    sections.forEach(section=>observer.observe(section));
  }

})();


  (() => {
    const cursor1 = document.querySelector('.cursor1');
    const cursor2 = document.querySelector('.cursor2');
    const cursorMode = window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
    const hideCursor = () => document.documentElement.classList.remove('unitize-cursor-active');

    window.addEventListener('pointermove', event => {
      if (!cursorMode.matches || event.pointerType !== 'mouse') {
        hideCursor();
        return;
      }
      const {clientX, clientY} = event;
      const position = `translate(-50%, -50%) translate(${clientX}px, ${clientY}px)`;
      // A primeira aparição não deve animar desde o canto da janela.
      if (!document.documentElement.classList.contains('unitize-cursor-active')) {
        cursor1.style.transition = 'none';
        cursor2.style.transition = 'none';
        cursor1.style.transform = position;
        cursor2.style.transform = position;
        void cursor2.offsetWidth;
        cursor1.style.transition = '';
        cursor2.style.transition = '';
      } else {
        cursor1.style.transform = position;
        cursor2.style.transform = position;
      }
      document.documentElement.classList.add('unitize-cursor-active');
    }, {passive:true});

    document.documentElement.addEventListener('pointerleave', hideCursor);
    window.addEventListener('blur', hideCursor);
    cursorMode.addEventListener('change', hideCursor);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hideCursor();
    });
  })();


  (function initStarfieldNav() {
    const canvas = document.getElementById('starfield-canvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const STAR_COUNT = 150;
    const SPEED_X = -.15;
    const SPEED_Y = .35;
    const WHITE_STAR = 'rgba(238,244,255,';
    const BLUE_STAR = 'rgba(153,243,255,';
    const CONNECTION_DISTANCE = 110;
    const MAX_CONNECTIONS = 28;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
    let stars = [];
    let width = 0;
    let height = 0;
    let frame = null;
    let lastTime = null;

    function createStars() {
      stars = Array.from({length:STAR_COUNT}, () => {
        const radius = Math.random()*1.5+.5;
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


(function initLanguages(){
  const languages={'pt-BR':{label:'Português (Brasil)',column:0},en:{label:'English',column:1},zh:{label:'中文',column:2},ja:{label:'日本語',column:3},de:{label:'Deutsch'},it:{label:'Italiano'},es:{label:'Español'},fr:{label:'Français'},nl:{label:'Nederlands'},ar:{label:'العربية',rtl:true},he:{label:'עברית',rtl:true},ru:{label:'Русский'}};
  // Textos de interface; entradas, saídas e nomes do cliente não são traduzidos.
  const rows=[
    ['Execuções','Runs','运行','実行'],['Histórico','History','历史记录','履歴'],
    ['● Ambiente local','● Local environment','● 本地环境','● ローカル環境'],
    ['Workspace / Operações','Workspace / Operations','工作区 / 操作','ワークスペース / 運用'],
    ['Seus agentes. Um só comando.','Your agents. One command.','你的智能体，一站式掌控。','エージェントを、一つの操作で。'],
    ['Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.','Start a run and follow every processing step in one place.','启动运行，在同一界面跟踪每个处理步骤。','実行を開始し、各処理段階を一か所で確認できます。'],
    ['Organização','Organization','组织','組織'],['Projeto atual','Current project','当前项目','現在のプロジェクト'],
    ['Novo projeto','New project','新建项目','新しいプロジェクト'],['Criar projeto','Create project','创建项目','プロジェクトを作成'],
    ['Orquestração','Orchestration','编排','オーケストレーション'],['Nova execução','New run','新建运行','新しい実行'],
    ['Agente','Agent','智能体','エージェント'],['Versão do agente','Agent version','智能体版本','エージェントのバージョン'],
    ['Ambiente de execução','Runtime','运行环境','実行環境'],['Mensagem para o agente','Message for the agent','发送给智能体的消息','エージェントへのメッセージ'],
    ['Criar execução','Create run','创建运行','実行を作成'],
    ['Protótipo local · sem chamada a modelo externo','Local prototype · no external model calls','本地原型 · 不调用外部模型','ローカル試作版 · 外部モデルの呼び出しなし'],
    ['Execução','Run','运行详情','実行の詳細'],['Exportar JSON','Export JSON','导出 JSON','JSON をエクスポート'],
    ['A exportação inclui entrada, saída e eventos da execução selecionada.','The export includes the selected run’s input, output and events.','导出文件包含所选运行的输入、输出和事件。','選択した実行の入力、出力、イベントが含まれます。'],
    ['Resultado','Result','结果','結果'],['Eventos','Events','事件','イベント'],
    ['Execuções recentes','Recent runs','最近的运行','最近の実行'],['Atualizar','Refresh','刷新','更新'],
    ['Estado das execuções','Run status','运行状态','実行ステータス'],['Todos os estados','All statuses','所有状态','すべてのステータス'],
    ['Na fila','Queued','排队中','待機中'],['Em execução','Running','运行中','実行中'],['Concluídas','Succeeded','已成功','成功'],
    ['Com falha','Failed','已失败','失敗'],['Canceladas','Cancelled','已取消','キャンセル済み'],
    ['Anteriores','Previous','上一页','前へ'],['Próximas','Next','下一页','次へ'],
    ['Unitize.io · Central de agentes','Unitize.io · Agent operations','Unitize.io · 智能体运营中心','Unitize.io · エージェント運用センター'],
    ['Demonstração local · Agente sem modelo externo','Local demo · Agent without an external model','本地演示 · 智能体不使用外部模型','ローカルデモ · 外部モデルを使わないエージェント'],
    ['Acesso local à Unitize','Local access to Unitize','访问本地 Unitize','Unitize へのローカルアクセス'],
    ['Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.','Use the individual key created in your terminal. It stays only in this page’s memory.','使用在终端创建的个人密钥。它仅保存在此页面的内存中。','ターミナルで作成した個人キーを使用します。キーはこのページのメモリ内にのみ保持されます。'],
    ['Chave de acesso','Access key','访问密钥','アクセスキー'],['Entrar','Sign in','登录','ログイン'],['Sair','Sign out','退出','ログアウト'],
    ['Ex.: Piloto de atendimento','E.g. Support pilot','例如：客服试点','例：サポートの試行'],
    ['Digite uma mensagem para o agente de demonstração…','Enter a message for the demo agent…','输入发送给演示智能体的消息…','デモ用エージェントへのメッセージを入力…'],
    ['Selecionar idioma','Select language','选择语言','言語を選択'],['Navegação principal','Main navigation','主导航','メインナビゲーション'],
    ['Projetos','Projects','项目','プロジェクト'],['Paginação do histórico','History pagination','历史记录分页','履歴のページ切り替え'],
    ['Nenhuma execução criada ainda.','No runs created yet.','尚未创建运行。','実行はまだありません。'],
    ['Nenhuma execução encontrada neste estado.','No runs found with this status.','未找到此状态的运行。','このステータスの実行はありません。']
  ];
  const additionalTranslations={"de": {"Execuções": "Ausführungen", "Histórico": "Verlauf", "● Ambiente local": "● Lokale Umgebung", "Workspace / Operações": "Arbeitsbereich / Betrieb", "Seus agentes. Um só comando.": "Ihre Agenten. Ein Befehl.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Starten Sie eine Ausführung und verfolgen Sie jeden Verarbeitungsschritt an einem Ort.", "Organização": "Organisation", "Projeto atual": "Aktuelles Projekt", "Novo projeto": "Neues Projekt", "Criar projeto": "Projekt erstellen", "Orquestração": "Orchestrierung", "Nova execução": "Neue Ausführung", "Agente": "Agent", "Versão do agente": "Agentenversion", "Ambiente de execução": "Laufzeitumgebung", "Mensagem para o agente": "Nachricht an den Agenten", "Criar execução": "Ausführung erstellen", "Protótipo local · sem chamada a modelo externo": "Lokaler Prototyp · keine externen Modellaufrufe", "Execução": "Ausführung", "Exportar JSON": "JSON exportieren", "A exportação inclui entrada, saída e eventos da execução selecionada.": "Der Export enthält Eingabe, Ausgabe und Ereignisse der ausgewählten Ausführung.", "Resultado": "Ergebnis", "Eventos": "Ereignisse", "Execuções recentes": "Letzte Ausführungen", "Atualizar": "Aktualisieren", "Estado das execuções": "Ausführungsstatus", "Todos os estados": "Alle Status", "Na fila": "In Warteschlange", "Em execução": "Wird ausgeführt", "Concluídas": "Erfolgreich", "Com falha": "Fehlgeschlagen", "Canceladas": "Abgebrochen", "Anteriores": "Zurück", "Próximas": "Weiter", "Unitize.io · Central de agentes": "Unitize.io · Agentenzentrale", "Demonstração local · Agente sem modelo externo": "Lokale Demo · Agent ohne externes Modell", "Acesso local à Unitize": "Lokaler Zugang zu Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Verwenden Sie den individuellen Schlüssel aus Ihrem Terminal. Er bleibt nur im Speicher dieser Seite.", "Chave de acesso": "Zugangsschlüssel", "Entrar": "Anmelden", "Sair": "Abmelden", "Ex.: Piloto de atendimento": "Z. B. Support-Pilot", "Digite uma mensagem para o agente de demonstração…": "Nachricht für den Demo-Agenten eingeben…", "Selecionar idioma": "Sprache auswählen", "Navegação principal": "Hauptnavigation", "Projetos": "Projekte", "Paginação do histórico": "Verlaufsseiten", "Nenhuma execução criada ainda.": "Noch keine Ausführungen erstellt.", "Nenhuma execução encontrada neste estado.": "Keine Ausführungen mit diesem Status gefunden."}, "it": {"Execuções": "Esecuzioni", "Histórico": "Cronologia", "● Ambiente local": "● Ambiente locale", "Workspace / Operações": "Area di lavoro / Operazioni", "Seus agentes. Um só comando.": "I tuoi agenti. Un solo comando.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Avvia un’esecuzione e segui ogni fase dell’elaborazione in un unico posto.", "Organização": "Organizzazione", "Projeto atual": "Progetto attuale", "Novo projeto": "Nuovo progetto", "Criar projeto": "Crea progetto", "Orquestração": "Orchestrazione", "Nova execução": "Nuova esecuzione", "Agente": "Agente", "Versão do agente": "Versione dell’agente", "Ambiente de execução": "Ambiente di esecuzione", "Mensagem para o agente": "Messaggio per l’agente", "Criar execução": "Crea esecuzione", "Protótipo local · sem chamada a modelo externo": "Prototipo locale · nessuna chiamata a modelli esterni", "Execução": "Esecuzione", "Exportar JSON": "Esporta JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "L’esportazione include input, output ed eventi dell’esecuzione selezionata.", "Resultado": "Risultato", "Eventos": "Eventi", "Execuções recentes": "Esecuzioni recenti", "Atualizar": "Aggiorna", "Estado das execuções": "Stato delle esecuzioni", "Todos os estados": "Tutti gli stati", "Na fila": "In coda", "Em execução": "In esecuzione", "Concluídas": "Completate", "Com falha": "Non riuscite", "Canceladas": "Annullate", "Anteriores": "Precedenti", "Próximas": "Successive", "Unitize.io · Central de agentes": "Unitize.io · Centro agenti", "Demonstração local · Agente sem modelo externo": "Demo locale · Agente senza modello esterno", "Acesso local à Unitize": "Accesso locale a Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Usa la chiave personale creata nel terminale. Rimane solo nella memoria di questa pagina.", "Chave de acesso": "Chiave di accesso", "Entrar": "Accedi", "Sair": "Esci", "Ex.: Piloto de atendimento": "Es.: progetto pilota di assistenza", "Digite uma mensagem para o agente de demonstração…": "Scrivi un messaggio per l’agente demo…", "Selecionar idioma": "Seleziona lingua", "Navegação principal": "Navigazione principale", "Projetos": "Progetti", "Paginação do histórico": "Pagine della cronologia", "Nenhuma execução criada ainda.": "Nessuna esecuzione ancora creata.", "Nenhuma execução encontrada neste estado.": "Nessuna esecuzione trovata con questo stato."}, "es": {"Execuções": "Ejecuciones", "Histórico": "Historial", "● Ambiente local": "● Entorno local", "Workspace / Operações": "Espacio de trabajo / Operaciones", "Seus agentes. Um só comando.": "Tus agentes. Un solo comando.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Inicia una ejecución y sigue cada etapa del procesamiento en un solo lugar.", "Organização": "Organización", "Projeto atual": "Proyecto actual", "Novo projeto": "Nuevo proyecto", "Criar projeto": "Crear proyecto", "Orquestração": "Orquestación", "Nova execução": "Nueva ejecución", "Agente": "Agente", "Versão do agente": "Versión del agente", "Ambiente de execução": "Entorno de ejecución", "Mensagem para o agente": "Mensaje para el agente", "Criar execução": "Crear ejecución", "Protótipo local · sem chamada a modelo externo": "Prototipo local · sin llamadas a modelos externos", "Execução": "Ejecución", "Exportar JSON": "Exportar JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "La exportación incluye la entrada, la salida y los eventos de la ejecución seleccionada.", "Resultado": "Resultado", "Eventos": "Eventos", "Execuções recentes": "Ejecuciones recientes", "Atualizar": "Actualizar", "Estado das execuções": "Estado de las ejecuciones", "Todos os estados": "Todos los estados", "Na fila": "En cola", "Em execução": "En ejecución", "Concluídas": "Completadas", "Com falha": "Fallidas", "Canceladas": "Canceladas", "Anteriores": "Anteriores", "Próximas": "Siguientes", "Unitize.io · Central de agentes": "Unitize.io · Central de agentes", "Demonstração local · Agente sem modelo externo": "Demostración local · Agente sin modelo externo", "Acesso local à Unitize": "Acceso local a Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Usa la clave individual creada en tu terminal. Solo permanece en la memoria de esta página.", "Chave de acesso": "Clave de acceso", "Entrar": "Entrar", "Sair": "Salir", "Ex.: Piloto de atendimento": "Ej.: piloto de atención", "Digite uma mensagem para o agente de demonstração…": "Escribe un mensaje para el agente de demostración…", "Selecionar idioma": "Seleccionar idioma", "Navegação principal": "Navegación principal", "Projetos": "Proyectos", "Paginação do histórico": "Paginación del historial", "Nenhuma execução criada ainda.": "Todavía no hay ejecuciones.", "Nenhuma execução encontrada neste estado.": "No se encontraron ejecuciones con este estado."}, "fr": {"Execuções": "Exécutions", "Histórico": "Historique", "● Ambiente local": "● Environnement local", "Workspace / Operações": "Espace de travail / Opérations", "Seus agentes. Um só comando.": "Vos agents. Une seule commande.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Lancez une exécution et suivez chaque étape du traitement au même endroit.", "Organização": "Organisation", "Projeto atual": "Projet actuel", "Novo projeto": "Nouveau projet", "Criar projeto": "Créer un projet", "Orquestração": "Orchestration", "Nova execução": "Nouvelle exécution", "Agente": "Agent", "Versão do agente": "Version de l’agent", "Ambiente de execução": "Environnement d’exécution", "Mensagem para o agente": "Message pour l’agent", "Criar execução": "Créer une exécution", "Protótipo local · sem chamada a modelo externo": "Prototype local · aucun appel à un modèle externe", "Execução": "Exécution", "Exportar JSON": "Exporter en JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "L’export inclut les entrées, les sorties et les événements de l’exécution sélectionnée.", "Resultado": "Résultat", "Eventos": "Événements", "Execuções recentes": "Exécutions récentes", "Atualizar": "Actualiser", "Estado das execuções": "État des exécutions", "Todos os estados": "Tous les états", "Na fila": "En attente", "Em execução": "En cours", "Concluídas": "Réussies", "Com falha": "En échec", "Canceladas": "Annulées", "Anteriores": "Précédentes", "Próximas": "Suivantes", "Unitize.io · Central de agentes": "Unitize.io · Centre des agents", "Demonstração local · Agente sem modelo externo": "Démo locale · Agent sans modèle externe", "Acesso local à Unitize": "Accès local à Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Utilisez la clé individuelle créée dans votre terminal. Elle reste uniquement dans la mémoire de cette page.", "Chave de acesso": "Clé d’accès", "Entrar": "Se connecter", "Sair": "Se déconnecter", "Ex.: Piloto de atendimento": "Ex. : projet pilote d’assistance", "Digite uma mensagem para o agente de demonstração…": "Saisissez un message pour l’agent de démonstration…", "Selecionar idioma": "Choisir la langue", "Navegação principal": "Navigation principale", "Projetos": "Projets", "Paginação do histórico": "Pagination de l’historique", "Nenhuma execução criada ainda.": "Aucune exécution créée pour le moment.", "Nenhuma execução encontrada neste estado.": "Aucune exécution trouvée dans cet état."}, "nl": {"Execuções": "Uitvoeringen", "Histórico": "Geschiedenis", "● Ambiente local": "● Lokale omgeving", "Workspace / Operações": "Werkruimte / Beheer", "Seus agentes. Um só comando.": "Je agents. Eén opdracht.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Start een uitvoering en volg elke verwerkingsstap op één plek.", "Organização": "Organisatie", "Projeto atual": "Huidig project", "Novo projeto": "Nieuw project", "Criar projeto": "Project aanmaken", "Orquestração": "Orkestratie", "Nova execução": "Nieuwe uitvoering", "Agente": "Agent", "Versão do agente": "Agentversie", "Ambiente de execução": "Uitvoeromgeving", "Mensagem para o agente": "Bericht voor de agent", "Criar execução": "Uitvoering aanmaken", "Protótipo local · sem chamada a modelo externo": "Lokaal prototype · geen externe modelaanroepen", "Execução": "Uitvoering", "Exportar JSON": "JSON exporteren", "A exportação inclui entrada, saída e eventos da execução selecionada.": "De export bevat de invoer, uitvoer en gebeurtenissen van de geselecteerde uitvoering.", "Resultado": "Resultaat", "Eventos": "Gebeurtenissen", "Execuções recentes": "Recente uitvoeringen", "Atualizar": "Vernieuwen", "Estado das execuções": "Uitvoeringsstatus", "Todos os estados": "Alle statussen", "Na fila": "In wachtrij", "Em execução": "Bezig", "Concluídas": "Geslaagd", "Com falha": "Mislukt", "Canceladas": "Geannuleerd", "Anteriores": "Vorige", "Próximas": "Volgende", "Unitize.io · Central de agentes": "Unitize.io · Agentbeheer", "Demonstração local · Agente sem modelo externo": "Lokale demo · Agent zonder extern model", "Acesso local à Unitize": "Lokale toegang tot Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Gebruik de persoonlijke sleutel uit je terminal. Deze blijft alleen in het geheugen van deze pagina.", "Chave de acesso": "Toegangssleutel", "Entrar": "Inloggen", "Sair": "Uitloggen", "Ex.: Piloto de atendimento": "Bijv. supportpilot", "Digite uma mensagem para o agente de demonstração…": "Voer een bericht voor de demo-agent in…", "Selecionar idioma": "Taal kiezen", "Navegação principal": "Hoofdnavigatie", "Projetos": "Projecten", "Paginação do histórico": "Geschiedenispagina’s", "Nenhuma execução criada ainda.": "Er zijn nog geen uitvoeringen.", "Nenhuma execução encontrada neste estado.": "Geen uitvoeringen met deze status gevonden."}, "ar": {"Execuções": "عمليات التشغيل", "Histórico": "السجل", "● Ambiente local": "● بيئة محلية", "Workspace / Operações": "مساحة العمل / العمليات", "Seus agentes. Um só comando.": "وكلاؤك. أمر واحد.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "ابدأ عملية تشغيل وتابع كل خطوة من المعالجة في مكان واحد.", "Organização": "المؤسسة", "Projeto atual": "المشروع الحالي", "Novo projeto": "مشروع جديد", "Criar projeto": "إنشاء مشروع", "Orquestração": "التنسيق", "Nova execução": "عملية تشغيل جديدة", "Agente": "الوكيل", "Versão do agente": "إصدار الوكيل", "Ambiente de execução": "بيئة التشغيل", "Mensagem para o agente": "رسالة إلى الوكيل", "Criar execução": "إنشاء عملية تشغيل", "Protótipo local · sem chamada a modelo externo": "نموذج أولي محلي · دون استدعاء نموذج خارجي", "Execução": "عملية التشغيل", "Exportar JSON": "تصدير JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "يتضمن التصدير المدخلات والمخرجات وأحداث عملية التشغيل المحددة.", "Resultado": "النتيجة", "Eventos": "الأحداث", "Execuções recentes": "عمليات التشغيل الأخيرة", "Atualizar": "تحديث", "Estado das execuções": "حالة عمليات التشغيل", "Todos os estados": "جميع الحالات", "Na fila": "في قائمة الانتظار", "Em execução": "قيد التشغيل", "Concluídas": "مكتملة بنجاح", "Com falha": "فاشلة", "Canceladas": "ملغاة", "Anteriores": "السابق", "Próximas": "التالي", "Unitize.io · Central de agentes": "Unitize.io · مركز الوكلاء", "Demonstração local · Agente sem modelo externo": "عرض محلي · وكيل دون نموذج خارجي", "Acesso local à Unitize": "الوصول المحلي إلى Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "استخدم المفتاح الشخصي الذي أنشأته في الطرفية. يُحفظ فقط في ذاكرة هذه الصفحة.", "Chave de acesso": "مفتاح الوصول", "Entrar": "تسجيل الدخول", "Sair": "تسجيل الخروج", "Ex.: Piloto de atendimento": "مثال: مشروع تجريبي للدعم", "Digite uma mensagem para o agente de demonstração…": "أدخل رسالة للوكيل التجريبي…", "Selecionar idioma": "اختيار اللغة", "Navegação principal": "التنقل الرئيسي", "Projetos": "المشاريع", "Paginação do histórico": "صفحات السجل", "Nenhuma execução criada ainda.": "لم يتم إنشاء أي عملية تشغيل بعد.", "Nenhuma execução encontrada neste estado.": "لم يتم العثور على عمليات تشغيل بهذه الحالة."}, "he": {"Execuções": "הרצות", "Histórico": "היסטוריה", "● Ambiente local": "● סביבה מקומית", "Workspace / Operações": "סביבת עבודה / תפעול", "Seus agentes. Um só comando.": "הסוכנים שלך. פקודה אחת.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "התחילו הרצה ועקבו אחר כל שלב בעיבוד במקום אחד.", "Organização": "ארגון", "Projeto atual": "הפרויקט הנוכחי", "Novo projeto": "פרויקט חדש", "Criar projeto": "יצירת פרויקט", "Orquestração": "תזמור", "Nova execução": "הרצה חדשה", "Agente": "סוכן", "Versão do agente": "גרסת הסוכן", "Ambiente de execução": "סביבת הריצה", "Mensagem para o agente": "הודעה לסוכן", "Criar execução": "יצירת הרצה", "Protótipo local · sem chamada a modelo externo": "אב־טיפוס מקומי · ללא קריאות למודל חיצוני", "Execução": "הרצה", "Exportar JSON": "ייצוא JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "הייצוא כולל קלט, פלט ואירועים של ההרצה שנבחרה.", "Resultado": "תוצאה", "Eventos": "אירועים", "Execuções recentes": "הרצות אחרונות", "Atualizar": "רענון", "Estado das execuções": "מצב ההרצות", "Todos os estados": "כל המצבים", "Na fila": "בתור", "Em execução": "בתהליך הרצה", "Concluídas": "הושלמו בהצלחה", "Com falha": "נכשלו", "Canceladas": "בוטלו", "Anteriores": "הקודמות", "Próximas": "הבאות", "Unitize.io · Central de agentes": "Unitize.io · מרכז הסוכנים", "Demonstração local · Agente sem modelo externo": "הדגמה מקומית · סוכן ללא מודל חיצוני", "Acesso local à Unitize": "גישה מקומית ל־Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "השתמשו במפתח האישי שנוצר במסוף. הוא נשמר רק בזיכרון של דף זה.", "Chave de acesso": "מפתח גישה", "Entrar": "כניסה", "Sair": "יציאה", "Ex.: Piloto de atendimento": "לדוגמה: ניסוי תמיכה", "Digite uma mensagem para o agente de demonstração…": "הקלידו הודעה לסוכן ההדגמה…", "Selecionar idioma": "בחירת שפה", "Navegação principal": "ניווט ראשי", "Projetos": "פרויקטים", "Paginação do histórico": "דפדוף בהיסטוריה", "Nenhuma execução criada ainda.": "טרם נוצרו הרצות.", "Nenhuma execução encontrada neste estado.": "לא נמצאו הרצות במצב זה."}, "ru": {"Execuções": "Запуски", "Histórico": "История", "● Ambiente local": "● Локальная среда", "Workspace / Operações": "Рабочая область / Операции", "Seus agentes. Um só comando.": "Ваши агенты. Одна команда.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Запустите выполнение и отслеживайте каждый этап обработки в одном месте.", "Organização": "Организация", "Projeto atual": "Текущий проект", "Novo projeto": "Новый проект", "Criar projeto": "Создать проект", "Orquestração": "Оркестрация", "Nova execução": "Новый запуск", "Agente": "Агент", "Versão do agente": "Версия агента", "Ambiente de execução": "Среда выполнения", "Mensagem para o agente": "Сообщение агенту", "Criar execução": "Создать запуск", "Protótipo local · sem chamada a modelo externo": "Локальный прототип · без вызовов внешних моделей", "Execução": "Запуск", "Exportar JSON": "Экспорт JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "Экспорт включает входные данные, результат и события выбранного запуска.", "Resultado": "Результат", "Eventos": "События", "Execuções recentes": "Последние запуски", "Atualizar": "Обновить", "Estado das execuções": "Статус запусков", "Todos os estados": "Все статусы", "Na fila": "В очереди", "Em execução": "Выполняется", "Concluídas": "Успешные", "Com falha": "С ошибкой", "Canceladas": "Отменённые", "Anteriores": "Предыдущие", "Próximas": "Следующие", "Unitize.io · Central de agentes": "Unitize.io · Центр агентов", "Demonstração local · Agente sem modelo externo": "Локальная демонстрация · Агент без внешней модели", "Acesso local à Unitize": "Локальный доступ к Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Используйте личный ключ, созданный в терминале. Он хранится только в памяти этой страницы.", "Chave de acesso": "Ключ доступа", "Entrar": "Войти", "Sair": "Выйти", "Ex.: Piloto de atendimento": "Например: пилот поддержки", "Digite uma mensagem para o agente de demonstração…": "Введите сообщение для демонстрационного агента…", "Selecionar idioma": "Выбрать язык", "Navegação principal": "Основная навигация", "Projetos": "Проекты", "Paginação do histórico": "Страницы истории", "Nenhuma execução criada ainda.": "Запусков пока нет.", "Nenhuma execução encontrada neste estado.": "Запуски с этим статусом не найдены."}};
  const landingCopy={"Para quem já constrói agentes.": ["For teams already building agents."], "Operação de agentes, com contexto.": ["Agent operations, with context."], "Você traz seu agente. A Unitize cuida da operação.": ["Bring your agent. Unitize handles operations."], "Uma base. Diferentes entregas.": ["One foundation. Different deliveries."], "Ajude a definir a próxima etapa.": ["Help shape the next step."], "Estamos construindo uma camada operacional para software houses e integradores executarem agentes com versões definidas, limites e histórico por projeto.": ["We are building an operations layer for software houses and integrators to run agents with pinned versions, limits and project history."], "Uma interface para acompanhar o trabalho. Um runtime para executar. Um histórico para entender o que aconteceu.": ["One interface to follow the work. A runtime to execute it. A history to understand what happened."], "Um fluxo simples entre o seu código e uma operação rastreável. O suporte inicial está sendo desenvolvido com um agente próprio de demonstração.": ["A simple path from your code to traceable operations. Initial support is being developed with our own demo agent."], "Um convite para software houses e integradores no Brasil que queiram conversar sobre operação de agentes e participar dos primeiros pilotos.": ["An invitation to software houses and integrators in Brazil to discuss agent operations and take part in early pilots."], "Protótipo em desenvolvimento": ["Prototype in development"], "Fluxo ilustrativo · sem execução nesta página": ["Illustrative flow · no execution on this page"], "Projetos e permissões": ["Projects and permissions"], "Cada entrega tem seu contexto. A base local já organiza execuções por projeto, com acesso de administrador, operador ou leitor.": ["Each delivery has its own context. The local prototype organizes runs by project, with administrator, operator or viewer access."], "API e fila": ["API and queue"], "O pedido é validado antes de entrar na fila. Limites de trabalho pendente ajudam a controlar a carga sem esconder o estado da execução.": ["Requests are validated before queuing. Pending-work limits help control load while keeping run status visible."], "Worker e contêiner": ["Worker and container"], "O worker reserva o pedido e executa a versão escolhida. A demonstração Docker usa imagem fixada por ID e limites de recursos.": ["The worker claims a request and runs the selected version. The Docker demo uses a pinned image ID and resource limits."], "Eventos e resultado": ["Events and results"], "Consulte o que entrou, o que saiu e os eventos registrados. Veja espera na fila, processamento e exporte uma execução em JSON.": ["Inspect inputs, outputs and recorded events. Review queue wait and processing time, and export a run as JSON."], "Hoje no protótipo": ["In the prototype today"], "Execução local Python e Docker de demonstração, histórico por projeto e controles iniciais de acesso.": ["Local Python and demo Docker execution, project history and initial access controls."], "Próximas etapas": ["Next steps"], "Integração de agentes de clientes, login de produção e políticas de orçamento. Abertura de pilotos conforme validação técnica.": ["Customer-agent integration, production sign-in and budget policies. Pilots will open as technical validation progresses."], "Prepare uma versão": ["Prepare a version"], "Empacote o agente e defina seu contrato de entrada e saída. A proposta é preservar seu código e seu framework.": ["Package the agent and define its input and output contract. The goal is to preserve your code and framework."], "Defina o contexto": ["Define the context"], "Associe a execução a um projeto e escolha quem pode operar. Estabeleça limites antes de aceitar novos pedidos.": ["Assign the run to a project and choose who can operate it. Establish limits before accepting new requests."], "Execute e acompanhe": ["Run and follow"], "Consulte a fila, o estado e os eventos. Cancele pedidos ainda não iniciados e acompanhe o tempo de processamento.": ["Inspect the queue, status and events. Cancel requests that have not started and review processing time."], "Entenda e melhore": ["Understand and improve"], "Use o histórico e o JSON exportado para investigar falhas e conversar com a equipe sobre a próxima versão.": ["Use history and exported JSON to investigate failures and discuss the next version with your team."], "Software houses": ["Software houses"], "Organize a operação dos agentes que você entrega. Separe projetos, fixe versões e encontre o histórico de cada execução.": ["Organize operations for the agents you deliver. Separate projects, pin versions and find each run’s history."], "Integradores": ["Integrators"], "Uma base operacional para conectar entregas feitas com ferramentas diferentes, sem transformar cada piloto em um painel novo.": ["An operations foundation for deliveries built with different tools, without building a new dashboard for every pilot."], "Equipes internas": ["Internal teams"], "Uma referência comum para quem desenvolve e quem acompanha a operação: permissões, fila e evidências do processamento.": ["A shared reference for development and operations teams: permissions, queues and processing records."], "Da primeira demonstração à operação de clientes, com etapas claras.": ["From the first demo to customer operations, with clear steps."], "Não prometemos execução de qualquer código nem isolamento de produção nesta fase. A proposta será expandida a partir de pilotos controlados.": ["This phase does not promise arbitrary-code execution or production isolation. The offering will expand through controlled pilots."], "Seu e-mail profissional": ["Your work email"], "Quero receber novidades e convites para pilotos da Unitize.": ["I want to receive Unitize updates and pilot invitations."], "Inscrição gratuita. Não cria uma conta nem garante uma data de acesso.": ["Free registration. It does not create an account or guarantee an access date."], "Sobre seus dados": ["About your data"], "Coletamos seu e-mail e a data da inscrição para organizar a lista de interesse. Nesta versão, o cadastro fica no banco local da Unitize e nenhum e-mail é enviado automaticamente.": ["We collect your email and registration date to organize the interest list. In this version, registration is stored in Unitize’s local database and no email is sent automatically."], "Operação de agentes em construção. Feita com atenção a cada execução.": ["Agent operations in development. Built with attention to every run."], "Ir para o conteúdo": ["Skip to content"], "Abrir navegação": ["Open navigation"], "Navegação móvel": ["Mobile navigation"], "Camadas da arquitetura": ["Architecture layers"], "Exemplo ilustrativo de execução": ["Illustrative run example"], "Início": ["Home", "首页", "ホーム", "Start", "Inizio", "Inicio", "Accueil", "Start", "الرئيسية", "בית", "Главная"], "Arquitetura": ["Architecture", "架构", "アーキテクチャ", "Architektur", "Architettura", "Arquitectura", "Architecture", "Architectuur", "البنية", "ארכיטקטורה", "Архитектура"], "Como funciona": ["How it works", "工作原理", "仕組み", "So funktioniert es", "Come funziona", "Cómo funciona", "Fonctionnement", "Hoe het werkt", "كيف تعمل", "איך זה עובד", "Как это работает"], "Soluções": ["Solutions", "解决方案", "ソリューション", "Lösungen", "Soluzioni", "Soluciones", "Solutions", "Oplossingen", "الحلول", "פתרונות", "Решения"], "Lista de espera": ["Waitlist", "候补名单", "ウェイティングリスト", "Warteliste", "Lista d’attesa", "Lista de espera", "Liste d’attente", "Wachtlijst", "قائمة الانتظار", "רשימת המתנה", "Лист ожидания"], "A doca dos seus agentes.": ["A home port for your agents.", "智能体的运行港湾。", "エージェントの運用拠点。", "Der Heimathafen Ihrer Agenten.", "Il porto dei tuoi agenti.", "El puerto de tus agentes.", "Le port d’attache de vos agents.", "De thuishaven van je agents.", "مرسى وكلائك.", "נמל הבית של הסוכנים שלך.", "Порт для ваших агентов."], "Explorar a arquitetura": ["Explore the architecture", "探索架构", "構成を見る", "Architektur entdecken", "Esplora l’architettura", "Explorar la arquitectura", "Explorer l’architecture", "Bekijk de architectuur", "استكشف البنية", "לגלות את הארכיטקטורה", "Изучить архитектуру"], "© 2026 Unitize.io. Todos os direitos reservados.": ["© 2026 Unitize.io. All rights reserved.", "© 2026 Unitize.io. 保留所有权利。", "© 2026 Unitize.io. 無断転載を禁じます。", "© 2026 Unitize.io. Alle Rechte vorbehalten.", "© 2026 Unitize.io. Tutti i diritti riservati.", "© 2026 Unitize.io. Todos los derechos reservados.", "© 2026 Unitize.io. Tous droits réservés.", "© 2026 Unitize.io. Alle rechten voorbehouden.", "© 2026 Unitize.io. جميع الحقوق محفوظة.", "© 2026 Unitize.io. כל הזכויות שמורות.", "© 2026 Unitize.io. Все права защищены."], "Conhecer o projeto": ["Explore the project", "了解项目", "プロジェクトを知る", "Projekt kennenlernen", "Scopri il progetto", "Conocer el proyecto", "Découvrir le projet", "Ontdek het project", "تعرّف على المشروع", "הכירו את הפרויקט", "Познакомиться с проектом"], "Estamos preparando a próxima etapa.": ["We are preparing the next step.", "我们正在准备下一步。", "次のステップを準備しています。", "Wir bereiten den nächsten Schritt vor.", "Stiamo preparando il prossimo passo.", "Estamos preparando la próxima etapa.", "Nous préparons la prochaine étape.", "We bereiden de volgende stap voor.", "نستعد للخطوة التالية.", "אנחנו מכינים את השלב הבא.", "Мы готовим следующий шаг."], "Acompanhe a evolução da Unitize. As inscrições para novidades e futuros pilotos serão abertas quando o cadastro estiver disponível.": ["Follow Unitize’s progress. Registration for updates and future pilots will open when sign-up is available.", "关注 Unitize 的进展。登记功能开放后，即可申请接收动态和未来试点邀请。", "Unitize の進捗をご覧ください。登録機能の準備が整い次第、最新情報や今後のパイロットへの登録を開始します。", "Verfolgen Sie die Entwicklung von Unitize. Die Anmeldung für Neuigkeiten und künftige Piloten öffnet, sobald die Registrierung verfügbar ist.", "Segui i progressi di Unitize. Le iscrizioni per novità e futuri piloti apriranno quando la registrazione sarà disponibile.", "Sigue la evolución de Unitize. La inscripción para novedades y futuros pilotos se abrirá cuando el registro esté disponible.", "Suivez l’évolution de Unitize. Les inscriptions aux actualités et aux futurs pilotes ouvriront lorsque le formulaire sera disponible.", "Volg de ontwikkeling van Unitize. Aanmelden voor updates en toekomstige pilots kan zodra de registratie beschikbaar is.", "تابع تطور Unitize. سيفتح التسجيل للأخبار والمشاريع التجريبية المقبلة عندما تتوفر خدمة التسجيل.", "עקבו אחר התקדמות Unitize. ההרשמה לעדכונים ולניסויים עתידיים תיפתח כאשר שירות הרישום יהיה זמין.", "Следите за развитием Unitize. Запись на новости и будущие пилоты откроется, когда станет доступна регистрация."], "Em breve": ["Coming soon", "即将推出", "近日公開", "Demnächst", "Prossimamente", "Próximamente", "Bientôt", "Binnenkort", "قريبًا", "בקרוב", "Скоро"], "A lista de espera está chegando.": ["The waitlist is coming soon.", "候补名单即将开放。", "ウェイティングリストを準備中です。", "Die Warteliste kommt bald.", "La lista d’attesa è in arrivo.", "La lista de espera llegará pronto.", "La liste d’attente arrive bientôt.", "De wachtlijst komt eraan.", "قائمة الانتظار قادمة قريبًا.", "רשימת ההמתנה תיפתח בקרוב.", "Лист ожидания скоро откроется."], "Por enquanto, conheça a proposta, a arquitetura e o caminho que estamos construindo.": ["For now, explore our proposal, architecture and the path we are building.", "现在，你可以了解我们的方案、架构和发展方向。", "まずは構想、アーキテクチャ、これからの道のりをご覧ください。", "Entdecken Sie vorerst unsere Idee, Architektur und den Weg, den wir aufbauen.", "Nel frattempo, scopri la proposta, l’architettura e il percorso che stiamo costruendo.", "Por ahora, conoce la propuesta, la arquitectura y el camino que estamos construyendo.", "Pour le moment, découvrez notre proposition, notre architecture et le chemin que nous construisons.", "Ontdek voorlopig ons voorstel, de architectuur en het pad dat we bouwen.", "في الوقت الحالي، تعرّف على فكرتنا وبنيتنا والمسار الذي نبنيه.", "בינתיים, הכירו את ההצעה, הארכיטקטורה והדרך שאנחנו בונים.", "Пока познакомьтесь с нашей идеей, архитектурой и путём развития."], "Esta versão não recebe e-mails nem realiza inscrições.": ["This version does not collect email addresses or accept registrations.", "此版本不收集邮箱，也不接受登记。", "このバージョンではメールアドレスの収集や登録受付は行いません。", "Diese Version sammelt keine E-Mail-Adressen und nimmt keine Anmeldungen entgegen.", "Questa versione non raccoglie email e non accetta iscrizioni.", "Esta versión no recopila correos ni realiza inscripciones.", "Cette version ne recueille pas d’adresses e-mail et n’accepte pas d’inscriptions.", "Deze versie verzamelt geen e-mailadressen en accepteert geen aanmeldingen.", "لا يجمع هذا الإصدار عناوين البريد الإلكتروني ولا يقبل التسجيلات.", "גרסה זו אינה אוספת כתובות דוא״ל ואינה מקבלת הרשמות.", "Эта версия не собирает адреса электронной почты и не принимает регистрации."], "Sobre esta versão": ["About this version", "关于此版本", "このバージョンについて", "Über diese Version", "Informazioni su questa versione", "Sobre esta versión", "À propos de cette version", "Over deze versie", "حول هذا الإصدار", "על הגרסה הזו", "Об этой версии"], "Esta é uma apresentação pública e temporária da Unitize. A plataforma e o cadastro de interesse continuam em desenvolvimento.": ["This is a temporary public introduction to Unitize. The platform and interest registration are still in development.", "这是 Unitize 的临时公开展示。平台和意向登记功能仍在开发中。", "Unitize を紹介する一時的な公開ページです。プラットフォームと参加希望の登録機能は開発中です。", "Dies ist eine vorläufige öffentliche Vorstellung von Unitize. Plattform und Interessenregistrierung sind noch in Entwicklung.", "Questa è una presentazione pubblica temporanea di Unitize. La piattaforma e la registrazione di interesse sono ancora in sviluppo.", "Esta es una presentación pública temporal de Unitize. La plataforma y el registro de interés siguen en desarrollo.", "Il s’agit d’une présentation publique temporaire de Unitize. La plateforme et l’inscription à la liste d’intérêt sont en développement.", "Dit is een tijdelijke openbare presentatie van Unitize. Het platform en de interesseregistratie zijn nog in ontwikkeling.", "هذه صفحة تعريفية عامة ومؤقتة لـ Unitize. لا تزال المنصة وخدمة تسجيل الاهتمام قيد التطوير.", "זהו דף היכרות ציבורי וזמני של Unitize. הפלטפורמה ושירות הרישום עדיין בפיתוח.", "Это временная публичная презентация Unitize. Платформа и регистрация интереса ещё разрабатываются."]};
  for(const [source,values] of Object.entries(landingCopy)){
    rows.push([source,values[0],values[1]||values[0],values[2]||values[0]]);
    for(const [offset,language] of ['de','it','es','fr','nl','ar','he','ru'].entries()){
      (additionalTranslations[language]??={})[source]=values[offset+3]||values[0];
    }
  }
  const dictionary=new Map(rows.map(row=>[row[0],row]));

  const operationalDictionary={"Consultando capacidade do projeto…": "Checking project capacity…", "Nenhum projeto disponível para consulta.": "No projects are available.", "Não foi possível consultar a capacidade do projeto.": "Could not retrieve project capacity.", "A API respondeu sem os dados de capacidade. Consulte /health para identificar a versão do servidor.": "The API returned no capacity data. Check /health to identify the server version.", "Não foi possível carregar o histórico.": "Could not load run history.", "Nenhuma execução disponível nesta página. Volte para a anterior ou atualize o histórico.": "No runs are available on this page. Go back or refresh history.", "Nenhuma execução encontrada neste estado.": "No runs were found with this status.", "Nenhuma execução criada ainda.": "No runs have been created yet.", "Carregando histórico…": "Loading history…", "Carregando projetos…": "Loading projects…", "Selecione um projeto para consultar sua capacidade.": "Select a project to check its capacity.", "As 20 execuções mais recentes do projeto selecionado.": "The latest 20 runs in the selected project.", "Abrir": "Open", "Cancelar": "Cancel", "não disponível": "unavailable", "aguardando início": "waiting to start", "não iniciado": "not started", "em andamento": "in progress", "Processamento": "Processing", "Até detectar interrupção": "Until interruption detection", "Aguardando processamento…": "Waiting for processing…", "Enviando…": "Submitting…", "Execução cancelada antes de iniciar.": "Run cancelled before starting.", "Execução encerrada sem resultado.": "Run finished without a result.", "ainda processando": "still processing", "Python local · demonstração": "Local Python · demo", "Docker · contêiner com limites": "Docker · container with limits", "Reinicie o servidor para carregar a integração Docker.": "Restart the server to load Docker integration.", "Docker usa a imagem aprovada e registrada para esta versão.": "Docker uses the approved image registered for this version.", "Docker ainda não registrado. Consulte o guia de integração para habilitar.": "Docker is not registered yet. See the integration guide to enable it.", "Catálogo de agentes indisponível.": "Agent catalog unavailable.", "Chave inválida, expirada ou revogada.": "Invalid, expired or revoked access key.", "Acesso expirado ou revogado.": "Access expired or revoked.", "Entre com sua chave de acesso local.": "Sign in with your local access key.", "Não foi possível exportar esta execução.": "Could not export this run.", "Não foi possível criar o projeto.": "Could not create the project.", "Não foi possível cancelar esta execução.": "Could not cancel this run.", "Não foi possível carregar projetos. Reinicie o servidor e atualize a página.": "Could not load projects. Restart the server and refresh the page.", "Execução não encontrada.": "Run not found.", "Não foi possível consultar esta execução.": "Could not retrieve this run.", "Não foi possível concluir a solicitação.": "Could not complete the request.", "A API recusou o pedido.": "The API rejected the request.", "Falha ao consultar agentes.": "Could not retrieve agents.", "Reinicie o servidor para carregar o catálogo com versões de agentes.": "Restart the server to load the versioned agent catalog.", "Seu acesso permite somente leitura.": "Your access is read-only.", "Só é possível cancelar uma execução que ainda está na fila.": "Only queued runs can be cancelled.", "O nome deve ter entre 1 e 80 caracteres.": "The name must contain between 1 and 80 characters.", "Já existe um projeto com esse nome.": "A project with this name already exists.", "Escolha um projeto válido.": "Select a valid project.", "Projeto não encontrado.": "Project not found.", "Agente não registrado.": "Agent is not registered.", "Versão do agente não registrada.": "Agent version is not registered.", "Escolha python ou docker.": "Choose python or docker.", "Imagem e contêiner são definidos pela Unitize.": "Unitize manages the image and container.", "Registre a imagem local antes de usar Docker.": "Register the local image before using Docker.", "Entrada Docker limitada a 64 KiB.": "Docker input is limited to 64 KiB.", "Este projeto atingiu o limite de execuções pendentes. Aguarde e tente novamente.": "This project reached its pending-run limit. Wait and try again.", "Sua organização atingiu o limite de execuções pendentes. Aguarde e tente novamente.": "Your organization reached its pending-run limit. Wait and try again.", "A capacidade local está ocupada. Aguarde e tente novamente.": "Local capacity is full. Wait and try again.", "Informe um único project_id não vazio.": "Provide one non-empty project_id.", "Informe um único estado válido para filtrar o histórico.": "Provide one valid status to filter history.", "Cursor de histórico inválido.": "Invalid history cursor.", "agent_id precisa ser texto.": "agent_id must be a string.", "agent_version precisa ser texto não vazio.": "agent_version must be a non-empty string.", "O corpo precisa ter entre 1 byte e 1 MiB.": "The request body must be between 1 byte and 1 MiB.", "O corpo precisa ser um objeto JSON.": "The request body must be a JSON object.", "Autor sem permissão atual para executar neste projeto.": "The requester no longer has permission to run agents in this project.", "O worker deixou de renovar sua reserva. A execução foi marcada como interrompida; o resultado externo pode ser desconhecido.": "The worker stopped renewing its lease. The run was marked interrupted; external results may be unknown.", "Execução Docker sem imagem aprovada para este agente e versão.": "Docker run has no approved image for this agent and version.", "Runtime não suportado.": "Unsupported runtime.", "O campo 'message' deve ser texto.": "The 'message' field must be a string.", "Execução interrompida ou excedeu o prazo de 15 segundos.": "Run interrupted or exceeded the 15-second timeout."};
  const operationalOriginal=new WeakMap();
  function translateOperation(source){
    if(current==='pt-BR')return source;
    if(operationalDictionary[source])return operationalDictionary[source];
    let match;
    if((match=source.match(/^Página (\d+)$/)))return `Page ${match[1]}`;
    if((match=source.match(/^(\d+) na fila · (\d+) em execução · (\d+)\/(\d+) vagas ocupadas · (\d+) disponíveis no projeto\. Consulta: (.+)\.$/)))
      return `${match[1]} queued · ${match[2]} running · ${match[3]}/${match[4]} slots used · ${match[5]} available in this project. Checked: ${match[6]}.`;
    if((match=source.match(/^Até 20 execuções (?:mais recentes|por página) de (.+) · (.+)\.$/)))
      return `Up to 20 runs per page in ${match[1]} · ${match[2]}.`;
    if((match=source.match(/^Espera na fila: (.+) · (Processamento|Até detectar interrupção): (.+)$/)))
      return `Queue wait: ${operationalDictionary[match[1]]||match[1]} · ${operationalDictionary[match[2]]||match[2]}: ${operationalDictionary[match[3]]||match[3]}`;
    return source.replace('versão não registrada','version not recorded')
      .replace(' · limpeza pendente',' · cleanup pending')
      .replace(' · remoção do contêiner ainda não confirmada',' · container removal not confirmed yet')
      .replace(' · padrão',' · default');
  }
  function applyOperations(){
    const selectors=['#project-capacity','#run-timing','#history-scope','#history-page','#runtime-hint',
      '#status','#error','#project-error','#access-error','#history','#runtime','#agent-version','#run-agent'];
    for(const root of document.querySelectorAll(selectors.join(','))){
      root.lang=current==='pt-BR'?'pt-BR':'en';root.dir='ltr';
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
      while((node=walker.nextNode())){
        const saved=operationalOriginal.get(node);
        const source=saved && node.textContent===saved.last?saved.source:node.textContent;
        const translated=translateOperation(source);
        if(node.textContent!==translated)node.textContent=translated;
        operationalOriginal.set(node,{source,last:translated});
      }
    }
    const output=document.getElementById('output');
    if(output){
      const saved=operationalOriginal.get(output);
      const source=saved && output.textContent===saved.last?saved.source:output.textContent;
      if(operationalDictionary[source]){
        const translated=translateOperation(source);
        if(output.textContent!==translated)output.textContent=translated;
        operationalOriginal.set(output,{source,last:translated});
      }
    }
  }

  const originalText=new WeakMap();
  const originalAttributes=new WeakMap();
  const menu=document.getElementById('langDropdown');
  const trigger=document.getElementById('langMenuButton');
  const options=[...menu.querySelectorAll('[data-language]')];
  // Não percorremos conteúdo de execuções, nomes de projetos ou catálogo.
  const ignored='script,style,code,pre,.language-picker,#project,#agent,#run-agent,#output,#events,#history,#error,#project-error,#run-id,#run-timing,#project-capacity,#history-scope,#history-page,#runtime-hint,#status,#access-error,#runtime,#agent-version,#waitlist-status';
  let manualChoice=false;
  function browserLanguage(){
    for(const language of navigator.languages||[navigator.language]){
      const base=String(language||'').toLowerCase().split('-')[0];
      const code=base==='pt'?'pt-BR':base==='iw'?'he':base;
      if(languages[code])return code;
    }
    return 'en';
  }
  const pageLanguage=document.documentElement.dataset.pageLanguage;
  let current=languages[pageLanguage]?pageLanguage:browserLanguage();
  try {const stored=localStorage.getItem('unitize-language');if(!pageLanguage&&languages[stored]){current=stored;manualChoice=true;}}catch{}

  const localizedCopy={};
  const pendingLocales=new Map();
  async function loadLandingLocale(language){
    if(localizedCopy[language])return;
    if(pendingLocales.has(language))return pendingLocales.get(language);
    const task=(async()=>{
      try{
        const response=await fetch(new URL(`locales/${language}.json`,new URL(document.documentElement.dataset.siteRoot||'./',document.baseURI)),{cache:'no-cache'});
        if(!response.ok)throw new Error('locale_unavailable');
        const data=await response.json();
        if(data.language!==language||!data.messages||typeof data.messages!=='object')throw new Error('invalid_locale');
        localizedCopy[language]=Object.fromEntries(Object.entries(data.messages).filter(([key,value])=>Object.hasOwn(landingCopy,key)&&typeof value==='string'));
        if(current===language)apply();
      }catch{
        // Falhas mantêm o texto de fallback; não mudamos a escolha do usuário.
        if(current===language)trigger.title=language==='pt-BR'?'Não foi possível carregar a tradução completa. Atualize após reiniciar o servidor.':'Could not load the full translation. Refresh after restarting the server.';
      }finally{pendingLocales.delete(language);}
    })();
    pendingLocales.set(language,task);
    return task;
  }

  function translate(value){return localizedCopy[current]?.[value]||additionalTranslations[current]?.[value]||dictionary.get(value)?.[languages[current].column]||value;}
  let scheduled=false;
  const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}});
  function apply(){
    observer.disconnect();
    document.documentElement.lang=current==='zh'?'zh-CN':current;
    document.documentElement.dir=languages[current].rtl?'rtl':'ltr';
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      if(node.parentElement?.closest(ignored)) continue;
      const text=node.textContent;
      const saved=originalText.get(node);
      const source=saved && text===saved.last?saved.source:text.trim();
      const translated=translate(source);
      if(dictionary.has(source)){
        const next=text.replace(text.trim(),translated);
        if(text!==next) node.textContent=next;
        originalText.set(node,{source,last:next});
      }
    }
    document.querySelectorAll('[placeholder],[aria-label]').forEach(element=>{
      if(element.closest('.language-picker') && element!==trigger) return;
      let saved=originalAttributes.get(element);
      if(!saved){saved={};originalAttributes.set(element,saved);}
      for(const attribute of ['placeholder','aria-label']){
        if(!element.hasAttribute(attribute))continue;
        if(!saved[attribute])saved[attribute]=element.getAttribute(attribute);
        const next=translate(saved[attribute]);
        if(element.getAttribute(attribute)!==next)element.setAttribute(attribute,next);
      }
    });
    trigger.querySelector('.lang-current').textContent=languages[current].label;
    options.forEach(option=>option.setAttribute('aria-checked',String(option.dataset.language===current)));
    applyOperations();
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  function close(focus=false){menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus();}
  function open(){menu.hidden=false;trigger.setAttribute('aria-expanded','true');(options.find(option=>option.dataset.language===current)||options[0]).focus();}
  trigger.addEventListener('click',()=>menu.hidden?open():close());
  trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();open();}});
  menu.addEventListener('keydown',event=>{
    const index=options.indexOf(document.activeElement);
    if(event.key==='Escape'){event.preventDefault();close(true);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
      options[next].focus();
    }
  });
  options.forEach(option=>option.addEventListener('click',event=>{
    event.preventDefault();
    current=option.dataset.language;
    manualChoice=true;
    try{localStorage.setItem('unitize-language',current);}catch{}
    location.assign(option.href);
  }));
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.language-picker'))close();});
  document.addEventListener('focusin',event=>{if(!event.target.closest('.language-picker'))close();});
  apply();
  loadLandingLocale(current);
})();
