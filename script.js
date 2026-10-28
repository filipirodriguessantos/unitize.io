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
  const languages={'pt-BR':{label:'Português (Brasil)',column:0},en:{label:'English',column:1},zh:{label:'中文',column:2},ja:{label:'日本語',column:3},de:{label:'Deutsch'},it:{label:'Italiano'},es:{label:'Español'},fr:{label:'Français'},nl:{label:'Nederlands'},ar:{label:'العربية',rtl:true},he:{label:'עברית',rtl:true},ru:{label:'Русский'},tr:{label:'Türkçe'},ko:{label:'한국어'},pl:{label:'Polski'}};
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
  const additionalTranslations={"de": {"Execuções": "Ausführungen", "Histórico": "Verlauf", "● Ambiente local": "● Lokale Umgebung", "Workspace / Operações": "Arbeitsbereich / Betrieb", "Seus agentes. Um só comando.": "Ihre Agenten. Ein Befehl.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Starten Sie eine Ausführung und verfolgen Sie jeden Verarbeitungsschritt an einem Ort.", "Organização": "Organisation", "Projeto atual": "Aktuelles Projekt", "Novo projeto": "Neues Projekt", "Criar projeto": "Projekt erstellen", "Orquestração": "Orchestrierung", "Nova execução": "Neue Ausführung", "Agente": "Agent", "Versão do agente": "Agentenversion", "Ambiente de execução": "Laufzeitumgebung", "Mensagem para o agente": "Nachricht an den Agenten", "Criar execução": "Ausführung erstellen", "Protótipo local · sem chamada a modelo externo": "Lokaler Prototyp · keine externen Modellaufrufe", "Execução": "Ausführung", "Exportar JSON": "JSON exportieren", "A exportação inclui entrada, saída e eventos da execução selecionada.": "Der Export enthält Eingabe, Ausgabe und Ereignisse der ausgewählten Ausführung.", "Resultado": "Ergebnis", "Eventos": "Ereignisse", "Execuções recentes": "Letzte Ausführungen", "Atualizar": "Aktualisieren", "Estado das execuções": "Ausführungsstatus", "Todos os estados": "Alle Status", "Na fila": "In Warteschlange", "Em execução": "Wird ausgeführt", "Concluídas": "Erfolgreich", "Com falha": "Fehlgeschlagen", "Canceladas": "Abgebrochen", "Anteriores": "Zurück", "Próximas": "Weiter", "Unitize.io · Central de agentes": "Unitize.io · Agentenzentrale", "Demonstração local · Agente sem modelo externo": "Lokale Demo · Agent ohne externes Modell", "Acesso local à Unitize": "Lokaler Zugang zu Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Verwenden Sie den individuellen Schlüssel aus Ihrem Terminal. Er bleibt nur im Speicher dieser Seite.", "Chave de acesso": "Zugangsschlüssel", "Entrar": "Anmelden", "Sair": "Abmelden", "Ex.: Piloto de atendimento": "Z. B. Support-Pilot", "Digite uma mensagem para o agente de demonstração…": "Nachricht für den Demo-Agenten eingeben…", "Selecionar idioma": "Sprache auswählen", "Navegação principal": "Hauptnavigation", "Projetos": "Projekte", "Paginação do histórico": "Verlaufsseiten", "Nenhuma execução criada ainda.": "Noch keine Ausführungen erstellt.", "Nenhuma execução encontrada neste estado.": "Keine Ausführungen mit diesem Status gefunden."}, "it": {"Execuções": "Esecuzioni", "Histórico": "Cronologia", "● Ambiente local": "● Ambiente locale", "Workspace / Operações": "Area di lavoro / Operazioni", "Seus agentes. Um só comando.": "I tuoi agenti. Un solo comando.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Avvia un’esecuzione e segui ogni fase dell’elaborazione in un unico posto.", "Organização": "Organizzazione", "Projeto atual": "Progetto attuale", "Novo projeto": "Nuovo progetto", "Criar projeto": "Crea progetto", "Orquestração": "Orchestrazione", "Nova execução": "Nuova esecuzione", "Agente": "Agente", "Versão do agente": "Versione dell’agente", "Ambiente de execução": "Ambiente di esecuzione", "Mensagem para o agente": "Messaggio per l’agente", "Criar execução": "Crea esecuzione", "Protótipo local · sem chamada a modelo externo": "Prototipo locale · nessuna chiamata a modelli esterni", "Execução": "Esecuzione", "Exportar JSON": "Esporta JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "L’esportazione include input, output ed eventi dell’esecuzione selezionata.", "Resultado": "Risultato", "Eventos": "Eventi", "Execuções recentes": "Esecuzioni recenti", "Atualizar": "Aggiorna", "Estado das execuções": "Stato delle esecuzioni", "Todos os estados": "Tutti gli stati", "Na fila": "In coda", "Em execução": "In esecuzione", "Concluídas": "Completate", "Com falha": "Non riuscite", "Canceladas": "Annullate", "Anteriores": "Precedenti", "Próximas": "Successive", "Unitize.io · Central de agentes": "Unitize.io · Centro agenti", "Demonstração local · Agente sem modelo externo": "Demo locale · Agente senza modello esterno", "Acesso local à Unitize": "Accesso locale a Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Usa la chiave personale creata nel terminale. Rimane solo nella memoria di questa pagina.", "Chave de acesso": "Chiave di accesso", "Entrar": "Accedi", "Sair": "Esci", "Ex.: Piloto de atendimento": "Es.: progetto pilota di assistenza", "Digite uma mensagem para o agente de demonstração…": "Scrivi un messaggio per l’agente demo…", "Selecionar idioma": "Seleziona lingua", "Navegação principal": "Navigazione principale", "Projetos": "Progetti", "Paginação do histórico": "Pagine della cronologia", "Nenhuma execução criada ainda.": "Nessuna esecuzione ancora creata.", "Nenhuma execução encontrada neste estado.": "Nessuna esecuzione trovata con questo stato."}, "es": {"Execuções": "Ejecuciones", "Histórico": "Historial", "● Ambiente local": "● Entorno local", "Workspace / Operações": "Espacio de trabajo / Operaciones", "Seus agentes. Um só comando.": "Tus agentes. Un solo comando.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Inicia una ejecución y sigue cada etapa del procesamiento en un solo lugar.", "Organização": "Organización", "Projeto atual": "Proyecto actual", "Novo projeto": "Nuevo proyecto", "Criar projeto": "Crear proyecto", "Orquestração": "Orquestación", "Nova execução": "Nueva ejecución", "Agente": "Agente", "Versão do agente": "Versión del agente", "Ambiente de execução": "Entorno de ejecución", "Mensagem para o agente": "Mensaje para el agente", "Criar execução": "Crear ejecución", "Protótipo local · sem chamada a modelo externo": "Prototipo local · sin llamadas a modelos externos", "Execução": "Ejecución", "Exportar JSON": "Exportar JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "La exportación incluye la entrada, la salida y los eventos de la ejecución seleccionada.", "Resultado": "Resultado", "Eventos": "Eventos", "Execuções recentes": "Ejecuciones recientes", "Atualizar": "Actualizar", "Estado das execuções": "Estado de las ejecuciones", "Todos os estados": "Todos los estados", "Na fila": "En cola", "Em execução": "En ejecución", "Concluídas": "Completadas", "Com falha": "Fallidas", "Canceladas": "Canceladas", "Anteriores": "Anteriores", "Próximas": "Siguientes", "Unitize.io · Central de agentes": "Unitize.io · Central de agentes", "Demonstração local · Agente sem modelo externo": "Demostración local · Agente sin modelo externo", "Acesso local à Unitize": "Acceso local a Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Usa la clave individual creada en tu terminal. Solo permanece en la memoria de esta página.", "Chave de acesso": "Clave de acceso", "Entrar": "Entrar", "Sair": "Salir", "Ex.: Piloto de atendimento": "Ej.: piloto de atención", "Digite uma mensagem para o agente de demonstração…": "Escribe un mensaje para el agente de demostración…", "Selecionar idioma": "Seleccionar idioma", "Navegação principal": "Navegación principal", "Projetos": "Proyectos", "Paginação do histórico": "Paginación del historial", "Nenhuma execução criada ainda.": "Todavía no hay ejecuciones.", "Nenhuma execução encontrada neste estado.": "No se encontraron ejecuciones con este estado."}, "fr": {"Execuções": "Exécutions", "Histórico": "Historique", "● Ambiente local": "● Environnement local", "Workspace / Operações": "Espace de travail / Opérations", "Seus agentes. Um só comando.": "Vos agents. Une seule commande.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Lancez une exécution et suivez chaque étape du traitement au même endroit.", "Organização": "Organisation", "Projeto atual": "Projet actuel", "Novo projeto": "Nouveau projet", "Criar projeto": "Créer un projet", "Orquestração": "Orchestration", "Nova execução": "Nouvelle exécution", "Agente": "Agent", "Versão do agente": "Version de l’agent", "Ambiente de execução": "Environnement d’exécution", "Mensagem para o agente": "Message pour l’agent", "Criar execução": "Créer une exécution", "Protótipo local · sem chamada a modelo externo": "Prototype local · aucun appel à un modèle externe", "Execução": "Exécution", "Exportar JSON": "Exporter en JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "L’export inclut les entrées, les sorties et les événements de l’exécution sélectionnée.", "Resultado": "Résultat", "Eventos": "Événements", "Execuções recentes": "Exécutions récentes", "Atualizar": "Actualiser", "Estado das execuções": "État des exécutions", "Todos os estados": "Tous les états", "Na fila": "En attente", "Em execução": "En cours", "Concluídas": "Réussies", "Com falha": "En échec", "Canceladas": "Annulées", "Anteriores": "Précédentes", "Próximas": "Suivantes", "Unitize.io · Central de agentes": "Unitize.io · Centre des agents", "Demonstração local · Agente sem modelo externo": "Démo locale · Agent sans modèle externe", "Acesso local à Unitize": "Accès local à Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Utilisez la clé individuelle créée dans votre terminal. Elle reste uniquement dans la mémoire de cette page.", "Chave de acesso": "Clé d’accès", "Entrar": "Se connecter", "Sair": "Se déconnecter", "Ex.: Piloto de atendimento": "Ex. : projet pilote d’assistance", "Digite uma mensagem para o agente de demonstração…": "Saisissez un message pour l’agent de démonstration…", "Selecionar idioma": "Choisir la langue", "Navegação principal": "Navigation principale", "Projetos": "Projets", "Paginação do histórico": "Pagination de l’historique", "Nenhuma execução criada ainda.": "Aucune exécution créée pour le moment.", "Nenhuma execução encontrada neste estado.": "Aucune exécution trouvée dans cet état."}, "nl": {"Execuções": "Uitvoeringen", "Histórico": "Geschiedenis", "● Ambiente local": "● Lokale omgeving", "Workspace / Operações": "Werkruimte / Beheer", "Seus agentes. Um só comando.": "Je agents. Eén opdracht.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Start een uitvoering en volg elke verwerkingsstap op één plek.", "Organização": "Organisatie", "Projeto atual": "Huidig project", "Novo projeto": "Nieuw project", "Criar projeto": "Project aanmaken", "Orquestração": "Orkestratie", "Nova execução": "Nieuwe uitvoering", "Agente": "Agent", "Versão do agente": "Agentversie", "Ambiente de execução": "Uitvoeromgeving", "Mensagem para o agente": "Bericht voor de agent", "Criar execução": "Uitvoering aanmaken", "Protótipo local · sem chamada a modelo externo": "Lokaal prototype · geen externe modelaanroepen", "Execução": "Uitvoering", "Exportar JSON": "JSON exporteren", "A exportação inclui entrada, saída e eventos da execução selecionada.": "De export bevat de invoer, uitvoer en gebeurtenissen van de geselecteerde uitvoering.", "Resultado": "Resultaat", "Eventos": "Gebeurtenissen", "Execuções recentes": "Recente uitvoeringen", "Atualizar": "Vernieuwen", "Estado das execuções": "Uitvoeringsstatus", "Todos os estados": "Alle statussen", "Na fila": "In wachtrij", "Em execução": "Bezig", "Concluídas": "Geslaagd", "Com falha": "Mislukt", "Canceladas": "Geannuleerd", "Anteriores": "Vorige", "Próximas": "Volgende", "Unitize.io · Central de agentes": "Unitize.io · Agentbeheer", "Demonstração local · Agente sem modelo externo": "Lokale demo · Agent zonder extern model", "Acesso local à Unitize": "Lokale toegang tot Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Gebruik de persoonlijke sleutel uit je terminal. Deze blijft alleen in het geheugen van deze pagina.", "Chave de acesso": "Toegangssleutel", "Entrar": "Inloggen", "Sair": "Uitloggen", "Ex.: Piloto de atendimento": "Bijv. supportpilot", "Digite uma mensagem para o agente de demonstração…": "Voer een bericht voor de demo-agent in…", "Selecionar idioma": "Taal kiezen", "Navegação principal": "Hoofdnavigatie", "Projetos": "Projecten", "Paginação do histórico": "Geschiedenispagina’s", "Nenhuma execução criada ainda.": "Er zijn nog geen uitvoeringen.", "Nenhuma execução encontrada neste estado.": "Geen uitvoeringen met deze status gevonden."}, "ar": {"Execuções": "عمليات التشغيل", "Histórico": "السجل", "● Ambiente local": "● بيئة محلية", "Workspace / Operações": "مساحة العمل / العمليات", "Seus agentes. Um só comando.": "وكلاؤك. أمر واحد.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "ابدأ عملية تشغيل وتابع كل خطوة من المعالجة في مكان واحد.", "Organização": "المؤسسة", "Projeto atual": "المشروع الحالي", "Novo projeto": "مشروع جديد", "Criar projeto": "إنشاء مشروع", "Orquestração": "التنسيق", "Nova execução": "عملية تشغيل جديدة", "Agente": "الوكيل", "Versão do agente": "إصدار الوكيل", "Ambiente de execução": "بيئة التشغيل", "Mensagem para o agente": "رسالة إلى الوكيل", "Criar execução": "إنشاء عملية تشغيل", "Protótipo local · sem chamada a modelo externo": "نموذج أولي محلي · دون استدعاء نموذج خارجي", "Execução": "عملية التشغيل", "Exportar JSON": "تصدير JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "يتضمن التصدير المدخلات والمخرجات وأحداث عملية التشغيل المحددة.", "Resultado": "النتيجة", "Eventos": "الأحداث", "Execuções recentes": "عمليات التشغيل الأخيرة", "Atualizar": "تحديث", "Estado das execuções": "حالة عمليات التشغيل", "Todos os estados": "جميع الحالات", "Na fila": "في قائمة الانتظار", "Em execução": "قيد التشغيل", "Concluídas": "مكتملة بنجاح", "Com falha": "فاشلة", "Canceladas": "ملغاة", "Anteriores": "السابق", "Próximas": "التالي", "Unitize.io · Central de agentes": "Unitize.io · مركز الوكلاء", "Demonstração local · Agente sem modelo externo": "عرض محلي · وكيل دون نموذج خارجي", "Acesso local à Unitize": "الوصول المحلي إلى Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "استخدم المفتاح الشخصي الذي أنشأته في الطرفية. يُحفظ فقط في ذاكرة هذه الصفحة.", "Chave de acesso": "مفتاح الوصول", "Entrar": "تسجيل الدخول", "Sair": "تسجيل الخروج", "Ex.: Piloto de atendimento": "مثال: مشروع تجريبي للدعم", "Digite uma mensagem para o agente de demonstração…": "أدخل رسالة للوكيل التجريبي…", "Selecionar idioma": "اختيار اللغة", "Navegação principal": "التنقل الرئيسي", "Projetos": "المشاريع", "Paginação do histórico": "صفحات السجل", "Nenhuma execução criada ainda.": "لم يتم إنشاء أي عملية تشغيل بعد.", "Nenhuma execução encontrada neste estado.": "لم يتم العثور على عمليات تشغيل بهذه الحالة."}, "he": {"Execuções": "הרצות", "Histórico": "היסטוריה", "● Ambiente local": "● סביבה מקומית", "Workspace / Operações": "סביבת עבודה / תפעול", "Seus agentes. Um só comando.": "הסוכנים שלך. פקודה אחת.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "התחילו הרצה ועקבו אחר כל שלב בעיבוד במקום אחד.", "Organização": "ארגון", "Projeto atual": "הפרויקט הנוכחי", "Novo projeto": "פרויקט חדש", "Criar projeto": "יצירת פרויקט", "Orquestração": "תזמור", "Nova execução": "הרצה חדשה", "Agente": "סוכן", "Versão do agente": "גרסת הסוכן", "Ambiente de execução": "סביבת הריצה", "Mensagem para o agente": "הודעה לסוכן", "Criar execução": "יצירת הרצה", "Protótipo local · sem chamada a modelo externo": "אב־טיפוס מקומי · ללא קריאות למודל חיצוני", "Execução": "הרצה", "Exportar JSON": "ייצוא JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "הייצוא כולל קלט, פלט ואירועים של ההרצה שנבחרה.", "Resultado": "תוצאה", "Eventos": "אירועים", "Execuções recentes": "הרצות אחרונות", "Atualizar": "רענון", "Estado das execuções": "מצב ההרצות", "Todos os estados": "כל המצבים", "Na fila": "בתור", "Em execução": "בתהליך הרצה", "Concluídas": "הושלמו בהצלחה", "Com falha": "נכשלו", "Canceladas": "בוטלו", "Anteriores": "הקודמות", "Próximas": "הבאות", "Unitize.io · Central de agentes": "Unitize.io · מרכז הסוכנים", "Demonstração local · Agente sem modelo externo": "הדגמה מקומית · סוכן ללא מודל חיצוני", "Acesso local à Unitize": "גישה מקומית ל־Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "השתמשו במפתח האישי שנוצר במסוף. הוא נשמר רק בזיכרון של דף זה.", "Chave de acesso": "מפתח גישה", "Entrar": "כניסה", "Sair": "יציאה", "Ex.: Piloto de atendimento": "לדוגמה: ניסוי תמיכה", "Digite uma mensagem para o agente de demonstração…": "הקלידו הודעה לסוכן ההדגמה…", "Selecionar idioma": "בחירת שפה", "Navegação principal": "ניווט ראשי", "Projetos": "פרויקטים", "Paginação do histórico": "דפדוף בהיסטוריה", "Nenhuma execução criada ainda.": "טרם נוצרו הרצות.", "Nenhuma execução encontrada neste estado.": "לא נמצאו הרצות במצב זה."}, "ru": {"Execuções": "Запуски", "Histórico": "История", "● Ambiente local": "● Локальная среда", "Workspace / Operações": "Рабочая область / Операции", "Seus agentes. Um só comando.": "Ваши агенты. Одна команда.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Запустите выполнение и отслеживайте каждый этап обработки в одном месте.", "Organização": "Организация", "Projeto atual": "Текущий проект", "Novo projeto": "Новый проект", "Criar projeto": "Создать проект", "Orquestração": "Оркестрация", "Nova execução": "Новый запуск", "Agente": "Агент", "Versão do agente": "Версия агента", "Ambiente de execução": "Среда выполнения", "Mensagem para o agente": "Сообщение агенту", "Criar execução": "Создать запуск", "Protótipo local · sem chamada a modelo externo": "Локальный прототип · без вызовов внешних моделей", "Execução": "Запуск", "Exportar JSON": "Экспорт JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "Экспорт включает входные данные, результат и события выбранного запуска.", "Resultado": "Результат", "Eventos": "События", "Execuções recentes": "Последние запуски", "Atualizar": "Обновить", "Estado das execuções": "Статус запусков", "Todos os estados": "Все статусы", "Na fila": "В очереди", "Em execução": "Выполняется", "Concluídas": "Успешные", "Com falha": "С ошибкой", "Canceladas": "Отменённые", "Anteriores": "Предыдущие", "Próximas": "Следующие", "Unitize.io · Central de agentes": "Unitize.io · Центр агентов", "Demonstração local · Agente sem modelo externo": "Локальная демонстрация · Агент без внешней модели", "Acesso local à Unitize": "Локальный доступ к Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Используйте личный ключ, созданный в терминале. Он хранится только в памяти этой страницы.", "Chave de acesso": "Ключ доступа", "Entrar": "Войти", "Sair": "Выйти", "Ex.: Piloto de atendimento": "Например: пилот поддержки", "Digite uma mensagem para o agente de demonstração…": "Введите сообщение для демонстрационного агента…", "Selecionar idioma": "Выбрать язык", "Navegação principal": "Основная навигация", "Projetos": "Проекты", "Paginação do histórico": "Страницы истории", "Nenhuma execução criada ainda.": "Запусков пока нет.", "Nenhuma execução encontrada neste estado.": "Запуски с этим статусом не найдены."}, "tr": {"Execuções": "Çalıştırmalar", "Histórico": "Geçmiş", "● Ambiente local": "● Yerel ortam", "Workspace / Operações": "Çalışma alanı / Operasyonlar", "Seus agentes. Um só comando.": "Ajanlarınız. Tek komut.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Bir çalıştırma başlatın ve tüm işleme adımlarını tek yerden izleyin.", "Organização": "Organizasyon", "Projeto atual": "Geçerli proje", "Novo projeto": "Yeni proje", "Criar projeto": "Proje oluştur", "Orquestração": "Orkestrasyon", "Nova execução": "Yeni çalıştırma", "Agente": "Ajan", "Versão do agente": "Ajan sürümü", "Ambiente de execução": "Çalıştırma ortamı", "Mensagem para o agente": "Ajana mesaj", "Criar execução": "Çalıştırma oluştur", "Protótipo local · sem chamada a modelo externo": "Yerel prototip · harici model çağrısı yok", "Execução": "Çalıştırma", "Exportar JSON": "JSON dışa aktar", "A exportação inclui entrada, saída e eventos da execução selecionada.": "Dışa aktarma, seçilen çalıştırmanın girdisini, çıktısını ve olaylarını içerir.", "Resultado": "Sonuç", "Eventos": "Olaylar", "Execuções recentes": "Son çalıştırmalar", "Atualizar": "Yenile", "Estado das execuções": "Çalıştırma durumu", "Todos os estados": "Tüm durumlar", "Na fila": "Kuyrukta", "Em execução": "Çalışıyor", "Concluídas": "Tamamlandı", "Com falha": "Başarısız", "Canceladas": "İptal edildi", "Anteriores": "Önceki", "Próximas": "Sonraki", "Unitize.io · Central de agentes": "Unitize.io · Ajan operasyonları", "Demonstração local · Agente sem modelo externo": "Yerel demo · Harici model kullanmayan ajan", "Acesso local à Unitize": "Unitize'ye yerel erişim", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Terminalinizde oluşturulan kişisel anahtarı kullanın. Anahtar yalnızca bu sayfanın belleğinde tutulur.", "Chave de acesso": "Erişim anahtarı", "Entrar": "Giriş yap", "Sair": "Çıkış yap", "Ex.: Piloto de atendimento": "Örn.: Destek pilotu", "Digite uma mensagem para o agente de demonstração…": "Demo ajanına bir mesaj yazın…", "Selecionar idioma": "Dil seç", "Navegação principal": "Ana gezinme", "Projetos": "Projeler", "Paginação do histórico": "Geçmiş sayfaları", "Nenhuma execução criada ainda.": "Henüz çalıştırma oluşturulmadı.", "Nenhuma execução encontrada neste estado.": "Bu durumda çalıştırma bulunamadı.", "Para quem já constrói agentes.": "Zaten ajan geliştiren ekipler için.", "Operação de agentes, com contexto.": "Bağlamıyla birlikte ajan operasyonları.", "Você traz seu agente. A Unitize cuida da operação.": "Ajanınızı getirin. Operasyonu Unitize yönetsin.", "Uma base. Diferentes entregas.": "Tek temel. Farklı çözümler.", "Ajude a definir a próxima etapa.": "Bir sonraki adımı birlikte şekillendirelim.", "Estamos construindo uma camada operacional para software houses e integradores executarem agentes com versões definidas, limites e histórico por projeto.": "Yazılım şirketleri ve entegratörlerin ajanları sabitlenmiş sürümler, sınırlar ve proje geçmişiyle çalıştırması için bir operasyon katmanı geliştiriyoruz.", "Uma interface para acompanhar o trabalho. Um runtime para executar. Um histórico para entender o que aconteceu.": "İşi izlemek için bir arayüz. Çalıştırmak için bir ortam. Olanları anlamak için bir geçmiş.", "Um fluxo simples entre o seu código e uma operação rastreável. O suporte inicial está sendo desenvolvido com um agente próprio de demonstração.": "Kodunuzdan izlenebilir operasyonlara uzanan basit bir akış. İlk desteği kendi demo ajanımızla geliştiriyoruz.", "Um convite para software houses e integradores no Brasil que queiram conversar sobre operação de agentes e participar dos primeiros pilotos.": "Brezilya'daki yazılım şirketlerini ve entegratörleri ajan operasyonlarını konuşmaya ve ilk pilotlara katılmaya davet ediyoruz.", "Protótipo em desenvolvimento": "Geliştirme aşamasında prototip", "Fluxo ilustrativo · sem execução nesta página": "Örnek akış · bu sayfada çalıştırma yapılmaz", "Projetos e permissões": "Projeler ve izinler", "Cada entrega tem seu contexto. A base local já organiza execuções por projeto, com acesso de administrador, operador ou leitor.": "Her çözümün kendi bağlamı vardır. Yerel prototip, çalıştırmaları projelere göre düzenler; yönetici, operatör veya görüntüleyici erişimi sunar.", "API e fila": "API ve kuyruk", "O pedido é validado antes de entrar na fila. Limites de trabalho pendente ajudam a controlar a carga sem esconder o estado da execução.": "İstekler kuyruğa alınmadan önce doğrulanır. Bekleyen iş sınırları, çalıştırma durumunu görünür tutarken yükü kontrol etmeye yardımcı olur.", "Worker e contêiner": "İşleyici ve konteyner", "O worker reserva o pedido e executa a versão escolhida. A demonstração Docker usa imagem fixada por ID e limites de recursos.": "İşleyici isteği üstlenir ve seçilen sürümü çalıştırır. Docker demosu sabitlenmiş imaj kimliği ve kaynak sınırları kullanır.", "Eventos e resultado": "Olaylar ve sonuçlar", "Consulte o que entrou, o que saiu e os eventos registrados. Veja espera na fila, processamento e exporte uma execução em JSON.": "Girdileri, çıktıları ve kaydedilen olayları inceleyin. Kuyrukta bekleme ve işleme sürelerini görün; çalıştırmayı JSON olarak dışa aktarın.", "Hoje no protótipo": "Bugünkü prototipte", "Execução local Python e Docker de demonstração, histórico por projeto e controles iniciais de acesso.": "Yerel Python ve demo Docker çalıştırmaları, proje geçmişi ve ilk erişim kontrolleri.", "Próximas etapas": "Sonraki adımlar", "Integração de agentes de clientes, login de produção e políticas de orçamento. Abertura de pilotos conforme validação técnica.": "Müşteri ajanlarının entegrasyonu, üretim ortamı için oturum açma ve bütçe politikaları. Teknik doğrulama ilerledikçe pilotlar açılacak.", "Prepare uma versão": "Bir sürüm hazırlayın", "Empacote o agente e defina seu contrato de entrada e saída. A proposta é preservar seu código e seu framework.": "Ajanı paketleyin, girdi ve çıktı sözleşmesini tanımlayın. Amaç, kodunuzu ve kullandığınız çatıyı korumaktır.", "Defina o contexto": "Bağlamı tanımlayın", "Associe a execução a um projeto e escolha quem pode operar. Estabeleça limites antes de aceitar novos pedidos.": "Çalıştırmayı bir projeye bağlayın ve kimlerin işlem yapabileceğini seçin. Yeni istekleri kabul etmeden önce sınırları belirleyin.", "Execute e acompanhe": "Çalıştırın ve izleyin", "Consulte a fila, o estado e os eventos. Cancele pedidos ainda não iniciados e acompanhe o tempo de processamento.": "Kuyruğu, durumu ve olayları inceleyin. Başlamamış istekleri iptal edin ve işleme süresini görün.", "Entenda e melhore": "Anlayın ve iyileştirin", "Use o histórico e o JSON exportado para investigar falhas e conversar com a equipe sobre a próxima versão.": "Hataları araştırmak ve sonraki sürümü ekibinizle değerlendirmek için geçmişi ve dışa aktarılan JSON'u kullanın.", "Software houses": "Yazılım şirketleri", "Organize a operação dos agentes que você entrega. Separe projetos, fixe versões e encontre o histórico de cada execução.": "Teslim ettiğiniz ajanların operasyonunu düzenleyin. Projeleri ayırın, sürümleri sabitleyin ve her çalıştırmanın geçmişine ulaşın.", "Integradores": "Entegratörler", "Uma base operacional para conectar entregas feitas com ferramentas diferentes, sem transformar cada piloto em um painel novo.": "Her pilot için yeni bir panel kurmadan, farklı araçlarla geliştirilen çözümler için ortak bir operasyon temeli.", "Equipes internas": "Şirket içi ekipler", "Uma referência comum para quem desenvolve e quem acompanha a operação: permissões, fila e evidências do processamento.": "Geliştirme ve operasyon ekipleri için ortak bir referans: izinler, kuyruklar ve işleme kayıtları.", "Da primeira demonstração à operação de clientes, com etapas claras.": "İlk demodan müşteri operasyonlarına, net adımlarla.", "Não prometemos execução de qualquer código nem isolamento de produção nesta fase. A proposta será expandida a partir de pilotos controlados.": "Bu aşamada herhangi bir kodu çalıştırma veya üretim ortamı yalıtımı vaat etmiyoruz. Çözüm kontrollü pilotlarla genişletilecek.", "Seu e-mail profissional": "İş e-posta adresiniz", "Quero receber novidades e convites para pilotos da Unitize.": "Unitize haberlerini ve pilot davetlerini almak istiyorum.", "Inscrição gratuita. Não cria uma conta nem garante uma data de acesso.": "Kayıt ücretsizdir. Hesap oluşturmaz ve erişim tarihi garantilemez.", "Sobre seus dados": "Verileriniz hakkında", "Coletamos seu e-mail e a data da inscrição para organizar a lista de interesse. Nesta versão, o cadastro fica no banco local da Unitize e nenhum e-mail é enviado automaticamente.": "İlgi listesini düzenlemek için e-posta adresinizi ve kayıt tarihinizi topluyoruz. Bu sürümde kayıt Unitize'nin yerel veritabanında saklanır; otomatik e-posta gönderilmez.", "Operação de agentes em construção. Feita com atenção a cada execução.": "Ajan operasyonları geliştiriliyor. Her çalıştırmaya özen gösterilerek.", "Ir para o conteúdo": "İçeriğe geç", "Abrir navegação": "Gezinmeyi aç", "Navegação móvel": "Mobil gezinme", "Camadas da arquitetura": "Mimari katmanlar", "Exemplo ilustrativo de execução": "Örnek çalıştırma gösterimi", "Início": "Ana sayfa", "Arquitetura": "Mimari", "Como funciona": "Nasıl çalışır", "Soluções": "Çözümler", "Lista de espera": "Bekleme listesi", "A doca dos seus agentes.": "Ajanlarınızın limanı.", "Entrar na lista": "Bekleme listesine katıl", "Explorar a arquitetura": "Mimariyi keşfet", "© 2026 Unitize.io. Todos os direitos reservados.": "© 2026 Unitize.io. Tüm hakları saklıdır.", "Uma camada operacional para agentes de diferentes ecossistemas.": "Farklı ekosistemlerden ajanlar için bir operasyon katmanı.", "Visão conceitual. Integrações em desenvolvimento.": "Kavramsal gösterim. Entegrasyonlar geliştirme aşamasındadır.", "Conhecer o projeto": "Projeyi keşfet", "Estamos preparando a próxima etapa.": "Bir sonraki adımı hazırlıyoruz.", "Acompanhe a evolução da Unitize. As inscrições para novidades e futuros pilotos serão abertas quando o cadastro estiver disponível.": "Unitize'nin gelişimini takip edin. Kayıt hazır olduğunda haberler ve gelecekteki pilotlar için başvurular açılacak.", "Em breve": "Yakında", "A lista de espera está chegando.": "Bekleme listesi yakında açılıyor.", "Por enquanto, conheça a proposta, a arquitetura e o caminho que estamos construindo.": "Şimdilik yaklaşımımızı, mimarimizi ve geliştirdiğimiz yolu keşfedin.", "Esta versão não recebe e-mails nem realiza inscrições.": "Bu sürüm e-posta adresi toplamaz ve kayıt almaz.", "Sobre esta versão": "Bu sürüm hakkında", "Esta é uma apresentação pública e temporária da Unitize. A plataforma e o cadastro de interesse continuam em desenvolvimento.": "Bu, Unitize'nin geçici ve herkese açık tanıtımıdır. Platform ve ilgi kaydı hâlâ geliştirilmektedir."}, "ko": {"Execuções": "실행 목록", "Histórico": "이력", "● Ambiente local": "● 로컬 환경", "Workspace / Operações": "작업 공간 / 운영", "Seus agentes. Um só comando.": "여러 에이전트, 하나의 명령.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "실행을 시작하고 모든 처리 단계를 한곳에서 확인하세요.", "Organização": "조직", "Projeto atual": "현재 프로젝트", "Novo projeto": "새 프로젝트", "Criar projeto": "프로젝트 만들기", "Orquestração": "오케스트레이션", "Nova execução": "새 실행", "Agente": "에이전트", "Versão do agente": "에이전트 버전", "Ambiente de execução": "실행 환경", "Mensagem para o agente": "에이전트에게 보낼 메시지", "Criar execução": "실행 만들기", "Protótipo local · sem chamada a modelo externo": "로컬 프로토타입 · 외부 모델 호출 없음", "Execução": "실행", "Exportar JSON": "JSON 내보내기", "A exportação inclui entrada, saída e eventos da execução selecionada.": "내보내기에는 선택한 실행의 입력, 출력, 이벤트가 포함됩니다.", "Resultado": "결과", "Eventos": "이벤트", "Execuções recentes": "최근 실행", "Atualizar": "새로고침", "Estado das execuções": "실행 상태", "Todos os estados": "모든 상태", "Na fila": "대기 중", "Em execução": "실행 중", "Concluídas": "성공", "Com falha": "실패", "Canceladas": "취소됨", "Anteriores": "이전", "Próximas": "다음", "Unitize.io · Central de agentes": "Unitize.io · 에이전트 운영", "Demonstração local · Agente sem modelo externo": "로컬 데모 · 외부 모델 없는 에이전트", "Acesso local à Unitize": "Unitize 로컬 접근", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "터미널에서 생성한 개인 키를 사용하세요. 키는 이 페이지의 메모리에만 보관됩니다.", "Chave de acesso": "접근 키", "Entrar": "로그인", "Sair": "로그아웃", "Ex.: Piloto de atendimento": "예: 고객 지원 파일럿", "Digite uma mensagem para o agente de demonstração…": "데모 에이전트에게 보낼 메시지를 입력하세요…", "Selecionar idioma": "언어 선택", "Navegação principal": "주 메뉴", "Projetos": "프로젝트", "Paginação do histórico": "이력 페이지 이동", "Nenhuma execução criada ainda.": "아직 생성된 실행이 없습니다.", "Nenhuma execução encontrada neste estado.": "이 상태의 실행이 없습니다.", "Para quem já constrói agentes.": "이미 에이전트를 개발하는 팀을 위해.", "Operação de agentes, com contexto.": "맥락을 갖춘 에이전트 운영.", "Você traz seu agente. A Unitize cuida da operação.": "에이전트를 가져오세요. 운영은 Unitize가 맡습니다.", "Uma base. Diferentes entregas.": "하나의 기반, 다양한 구축 사례.", "Ajude a definir a próxima etapa.": "다음 단계를 함께 만들어 주세요.", "Estamos construindo uma camada operacional para software houses e integradores executarem agentes com versões definidas, limites e histórico por projeto.": "소프트웨어 개발사와 통합 업체가 버전 고정, 실행 제한, 프로젝트별 이력을 바탕으로 에이전트를 운영할 수 있는 계층을 개발하고 있습니다.", "Uma interface para acompanhar o trabalho. Um runtime para executar. Um histórico para entender o que aconteceu.": "작업을 살펴보는 인터페이스, 작업을 실행하는 환경, 결과를 이해하는 이력.", "Um fluxo simples entre o seu código e uma operação rastreável. O suporte inicial está sendo desenvolvido com um agente próprio de demonstração.": "코드에서 추적 가능한 운영까지 이어지는 간단한 흐름입니다. 자체 데모 에이전트를 통해 초기 지원을 개발하고 있습니다.", "Um convite para software houses e integradores no Brasil que queiram conversar sobre operação de agentes e participar dos primeiros pilotos.": "브라질의 소프트웨어 개발사와 통합 업체를 에이전트 운영 논의와 초기 파일럿에 초대합니다.", "Protótipo em desenvolvimento": "개발 중인 프로토타입", "Fluxo ilustrativo · sem execução nesta página": "예시 흐름 · 이 페이지에서는 실행되지 않습니다", "Projetos e permissões": "프로젝트와 권한", "Cada entrega tem seu contexto. A base local já organiza execuções por projeto, com acesso de administrador, operador ou leitor.": "각 구축에는 고유한 맥락이 있습니다. 로컬 프로토타입은 실행을 프로젝트별로 정리하고 관리자, 운영자, 조회자 권한을 제공합니다.", "API e fila": "API와 대기열", "O pedido é validado antes de entrar na fila. Limites de trabalho pendente ajudam a controlar a carga sem esconder o estado da execução.": "요청은 대기열에 들어가기 전에 검증됩니다. 대기 작업 제한으로 부하를 관리하면서 실행 상태를 확인할 수 있습니다.", "Worker e contêiner": "워커와 컨테이너", "O worker reserva o pedido e executa a versão escolhida. A demonstração Docker usa imagem fixada por ID e limites de recursos.": "워커가 요청을 맡아 선택한 버전을 실행합니다. Docker 데모는 고정된 이미지 ID와 자원 제한을 사용합니다.", "Eventos e resultado": "이벤트와 결과", "Consulte o que entrou, o que saiu e os eventos registrados. Veja espera na fila, processamento e exporte uma execução em JSON.": "입력, 출력, 기록된 이벤트를 확인하세요. 대기 시간과 처리 시간을 검토하고 실행을 JSON으로 내보낼 수 있습니다.", "Hoje no protótipo": "현재 프로토타입", "Execução local Python e Docker de demonstração, histórico por projeto e controles iniciais de acesso.": "로컬 Python 실행, Docker 데모 실행, 프로젝트 이력과 초기 접근 제어.", "Próximas etapas": "다음 단계", "Integração de agentes de clientes, login de produção e políticas de orçamento. Abertura de pilotos conforme validação técnica.": "고객 에이전트 통합, 운영 환경용 로그인, 예산 정책을 준비합니다. 기술 검증이 진행됨에 따라 파일럿을 시작할 예정입니다.", "Prepare uma versão": "버전 준비", "Empacote o agente e defina seu contrato de entrada e saída. A proposta é preservar seu código e seu framework.": "에이전트를 패키징하고 입력 및 출력 규약을 정의하세요. 기존 코드와 프레임워크를 유지하는 것이 목표입니다.", "Defina o contexto": "맥락 설정", "Associe a execução a um projeto e escolha quem pode operar. Estabeleça limites antes de aceitar novos pedidos.": "실행을 프로젝트에 연결하고 운영할 사람을 선택하세요. 새 요청을 받기 전에 제한을 설정하세요.", "Execute e acompanhe": "실행 및 추적", "Consulte a fila, o estado e os eventos. Cancele pedidos ainda não iniciados e acompanhe o tempo de processamento.": "대기열, 상태, 이벤트를 확인하세요. 시작되지 않은 요청을 취소하고 처리 시간을 검토하세요.", "Entenda e melhore": "이해 및 개선", "Use o histórico e o JSON exportado para investigar falhas e conversar com a equipe sobre a próxima versão.": "이력과 내보낸 JSON으로 실패 원인을 조사하고 팀과 다음 버전을 논의하세요.", "Software houses": "소프트웨어 개발사", "Organize a operação dos agentes que você entrega. Separe projetos, fixe versões e encontre o histórico de cada execução.": "고객에게 제공하는 에이전트의 운영을 정리하세요. 프로젝트를 분리하고 버전을 고정하며 각 실행의 이력을 확인하세요.", "Integradores": "통합 업체", "Uma base operacional para conectar entregas feitas com ferramentas diferentes, sem transformar cada piloto em um painel novo.": "파일럿마다 새 대시보드를 만들지 않고도 다양한 도구로 구축한 솔루션을 운영하는 공통 기반입니다.", "Equipes internas": "사내 팀", "Uma referência comum para quem desenvolve e quem acompanha a operação: permissões, fila e evidências do processamento.": "개발팀과 운영팀이 함께 참고하는 권한, 대기열, 처리 기록.", "Da primeira demonstração à operação de clientes, com etapas claras.": "첫 데모부터 고객 운영까지, 명확한 단계로.", "Não prometemos execução de qualquer código nem isolamento de produção nesta fase. A proposta será expandida a partir de pilotos controlados.": "현 단계에서는 임의 코드 실행이나 운영 환경 수준의 격리를 보장하지 않습니다. 통제된 파일럿을 통해 제공 범위를 넓힐 예정입니다.", "Seu e-mail profissional": "업무용 이메일", "Quero receber novidades e convites para pilotos da Unitize.": "Unitize 소식과 파일럿 초대를 받고 싶습니다.", "Inscrição gratuita. Não cria uma conta nem garante uma data de acesso.": "무료 등록입니다. 계정이 생성되거나 이용 시작일이 보장되지는 않습니다.", "Sobre seus dados": "개인정보 안내", "Coletamos seu e-mail e a data da inscrição para organizar a lista de interesse. Nesta versão, o cadastro fica no banco local da Unitize e nenhum e-mail é enviado automaticamente.": "관심 등록 명단을 관리하기 위해 이메일과 등록일을 수집합니다. 이 버전에서는 Unitize 로컬 데이터베이스에 저장되며 이메일이 자동 발송되지 않습니다.", "Operação de agentes em construção. Feita com atenção a cada execução.": "개발 중인 에이전트 운영 플랫폼. 모든 실행을 세심하게 고려합니다.", "Ir para o conteúdo": "본문으로 건너뛰기", "Abrir navegação": "메뉴 열기", "Navegação móvel": "모바일 메뉴", "Camadas da arquitetura": "아키텍처 계층", "Exemplo ilustrativo de execução": "실행 예시", "Início": "홈", "Arquitetura": "아키텍처", "Como funciona": "작동 방식", "Soluções": "솔루션", "Lista de espera": "대기자 명단", "A doca dos seus agentes.": "에이전트의 운영 거점.", "Entrar na lista": "대기자 명단 등록", "Explorar a arquitetura": "아키텍처 살펴보기", "© 2026 Unitize.io. Todos os direitos reservados.": "© 2026 Unitize.io. 모든 권리 보유.", "Uma camada operacional para agentes de diferentes ecossistemas.": "다양한 생태계의 에이전트를 위한 운영 계층.", "Visão conceitual. Integrações em desenvolvimento.": "개념도입니다. 통합 기능은 개발 중입니다.", "Conhecer o projeto": "프로젝트 살펴보기", "Estamos preparando a próxima etapa.": "다음 단계를 준비하고 있습니다.", "Acompanhe a evolução da Unitize. As inscrições para novidades e futuros pilotos serão abertas quando o cadastro estiver disponível.": "Unitize의 발전을 지켜봐 주세요. 등록 기능이 준비되면 소식과 향후 파일럿 신청을 받을 예정입니다.", "Em breve": "곧 공개", "A lista de espera está chegando.": "대기자 명단을 곧 엽니다.", "Por enquanto, conheça a proposta, a arquitetura e o caminho que estamos construindo.": "지금은 제품의 방향, 아키텍처, 개발 과정을 살펴보세요.", "Esta versão não recebe e-mails nem realiza inscrições.": "이 버전은 이메일을 수집하거나 등록을 받지 않습니다.", "Sobre esta versão": "이 버전 안내", "Esta é uma apresentação pública e temporária da Unitize. A plataforma e o cadastro de interesse continuam em desenvolvimento.": "Unitize를 소개하는 임시 공개 페이지입니다. 플랫폼과 관심 등록 기능은 아직 개발 중입니다."}, "pl": {"Execuções": "Wykonania", "Histórico": "Historia", "● Ambiente local": "● Środowisko lokalne", "Workspace / Operações": "Obszar roboczy / Operacje", "Seus agentes. Um só comando.": "Twoi agenci. Jedno polecenie.", "Inicie uma execução e acompanhe cada etapa do processamento em um único lugar.": "Rozpocznij wykonanie i śledź każdy etap przetwarzania w jednym miejscu.", "Organização": "Organizacja", "Projeto atual": "Bieżący projekt", "Novo projeto": "Nowy projekt", "Criar projeto": "Utwórz projekt", "Orquestração": "Orkiestracja", "Nova execução": "Nowe wykonanie", "Agente": "Agent", "Versão do agente": "Wersja agenta", "Ambiente de execução": "Środowisko wykonawcze", "Mensagem para o agente": "Wiadomość dla agenta", "Criar execução": "Utwórz wykonanie", "Protótipo local · sem chamada a modelo externo": "Lokalny prototyp · bez wywołań zewnętrznych modeli", "Execução": "Wykonanie", "Exportar JSON": "Eksportuj JSON", "A exportação inclui entrada, saída e eventos da execução selecionada.": "Eksport obejmuje dane wejściowe, wyniki i zdarzenia wybranego wykonania.", "Resultado": "Wynik", "Eventos": "Zdarzenia", "Execuções recentes": "Ostatnie wykonania", "Atualizar": "Odśwież", "Estado das execuções": "Stan wykonania", "Todos os estados": "Wszystkie stany", "Na fila": "W kolejce", "Em execução": "W trakcie", "Concluídas": "Zakończone", "Com falha": "Nieudane", "Canceladas": "Anulowane", "Anteriores": "Poprzednie", "Próximas": "Następne", "Unitize.io · Central de agentes": "Unitize.io · Obsługa agentów", "Demonstração local · Agente sem modelo externo": "Lokalna demonstracja · Agent bez zewnętrznego modelu", "Acesso local à Unitize": "Lokalny dostęp do Unitize", "Use a chave individual criada no seu terminal. Ela fica somente na memória desta página.": "Użyj indywidualnego klucza utworzonego w terminalu. Pozostaje on wyłącznie w pamięci tej strony.", "Chave de acesso": "Klucz dostępu", "Entrar": "Zaloguj się", "Sair": "Wyloguj się", "Ex.: Piloto de atendimento": "Np. Pilotaż obsługi klienta", "Digite uma mensagem para o agente de demonstração…": "Wpisz wiadomość dla agenta demonstracyjnego…", "Selecionar idioma": "Wybierz język", "Navegação principal": "Nawigacja główna", "Projetos": "Projekty", "Paginação do histórico": "Stronicowanie historii", "Nenhuma execução criada ainda.": "Nie utworzono jeszcze żadnych wykonań.", "Nenhuma execução encontrada neste estado.": "Nie znaleziono wykonań w tym stanie.", "Para quem já constrói agentes.": "Dla zespołów, które już tworzą agentów.", "Operação de agentes, com contexto.": "Obsługa agentów z pełnym kontekstem.", "Você traz seu agente. A Unitize cuida da operação.": "Dostarcz agenta. Unitize zajmie się obsługą.", "Uma base. Diferentes entregas.": "Jedna podstawa. Różne wdrożenia.", "Ajude a definir a próxima etapa.": "Pomóż wyznaczyć kolejny krok.", "Estamos construindo uma camada operacional para software houses e integradores executarem agentes com versões definidas, limites e histórico por projeto.": "Tworzymy warstwę operacyjną dla firm programistycznych i integratorów, umożliwiającą uruchamianie agentów z ustalonymi wersjami, limitami i historią projektu.", "Uma interface para acompanhar o trabalho. Um runtime para executar. Um histórico para entender o que aconteceu.": "Interfejs do śledzenia pracy. Środowisko do jej wykonania. Historia pozwalająca zrozumieć przebieg.", "Um fluxo simples entre o seu código e uma operação rastreável. O suporte inicial está sendo desenvolvido com um agente próprio de demonstração.": "Prosta droga od kodu do operacji, których przebieg można prześledzić. Wstępne wsparcie rozwijamy na własnym agencie demonstracyjnym.", "Um convite para software houses e integradores no Brasil que queiram conversar sobre operação de agentes e participar dos primeiros pilotos.": "Zaproszenie dla firm programistycznych i integratorów w Brazylii do rozmowy o obsłudze agentów i udziału w pierwszych pilotażach.", "Protótipo em desenvolvimento": "Prototyp w trakcie rozwoju", "Fluxo ilustrativo · sem execução nesta página": "Przykładowy przebieg · ta strona niczego nie uruchamia", "Projetos e permissões": "Projekty i uprawnienia", "Cada entrega tem seu contexto. A base local já organiza execuções por projeto, com acesso de administrador, operador ou leitor.": "Każde wdrożenie ma własny kontekst. Lokalny prototyp porządkuje wykonania według projektu, z dostępem administratora, operatora lub obserwatora.", "API e fila": "API i kolejka", "O pedido é validado antes de entrar na fila. Limites de trabalho pendente ajudam a controlar a carga sem esconder o estado da execução.": "Żądania są sprawdzane przed dodaniem do kolejki. Limity oczekujących zadań pomagają kontrolować obciążenie przy zachowaniu widoczności stanu wykonania.", "Worker e contêiner": "Proces roboczy i kontener", "O worker reserva o pedido e executa a versão escolhida. A demonstração Docker usa imagem fixada por ID e limites de recursos.": "Proces roboczy przejmuje żądanie i uruchamia wybraną wersję. Demonstracja Docker korzysta z ustalonego identyfikatora obrazu i limitów zasobów.", "Eventos e resultado": "Zdarzenia i wyniki", "Consulte o que entrou, o que saiu e os eventos registrados. Veja espera na fila, processamento e exporte uma execução em JSON.": "Przeglądaj dane wejściowe, wyniki i zapisane zdarzenia. Sprawdzaj czas oczekiwania i przetwarzania oraz eksportuj wykonanie do JSON.", "Hoje no protótipo": "Obecnie w prototypie", "Execução local Python e Docker de demonstração, histórico por projeto e controles iniciais de acesso.": "Lokalne wykonania Python i demonstracyjne wykonania Docker, historia projektu oraz podstawowa kontrola dostępu.", "Próximas etapas": "Kolejne kroki", "Integração de agentes de clientes, login de produção e políticas de orçamento. Abertura de pilotos conforme validação técnica.": "Integracja agentów klientów, logowanie produkcyjne i zasady budżetowe. Pilotaże będą otwierane wraz z postępem weryfikacji technicznej.", "Prepare uma versão": "Przygotuj wersję", "Empacote o agente e defina seu contrato de entrada e saída. A proposta é preservar seu código e seu framework.": "Spakuj agenta i określ kontrakt danych wejściowych i wyjściowych. Celem jest zachowanie Twojego kodu i frameworka.", "Defina o contexto": "Określ kontekst", "Associe a execução a um projeto e escolha quem pode operar. Estabeleça limites antes de aceitar novos pedidos.": "Przypisz wykonanie do projektu i wybierz osoby uprawnione do obsługi. Ustal limity przed przyjęciem nowych żądań.", "Execute e acompanhe": "Uruchom i śledź", "Consulte a fila, o estado e os eventos. Cancele pedidos ainda não iniciados e acompanhe o tempo de processamento.": "Sprawdzaj kolejkę, stan i zdarzenia. Anuluj nierozpoczęte żądania i analizuj czas przetwarzania.", "Entenda e melhore": "Zrozum i ulepsz", "Use o histórico e o JSON exportado para investigar falhas e conversar com a equipe sobre a próxima versão.": "Wykorzystaj historię i wyeksportowany JSON do badania awarii oraz rozmów z zespołem o kolejnej wersji.", "Software houses": "Firmy programistyczne", "Organize a operação dos agentes que você entrega. Separe projetos, fixe versões e encontre o histórico de cada execução.": "Uporządkuj obsługę dostarczanych agentów. Rozdzielaj projekty, ustalaj wersje i odnajduj historię każdego wykonania.", "Integradores": "Integratorzy", "Uma base operacional para conectar entregas feitas com ferramentas diferentes, sem transformar cada piloto em um painel novo.": "Podstawa operacyjna dla rozwiązań zbudowanych różnymi narzędziami, bez tworzenia nowego panelu dla każdego pilotażu.", "Equipes internas": "Zespoły wewnętrzne", "Uma referência comum para quem desenvolve e quem acompanha a operação: permissões, fila e evidências do processamento.": "Wspólny punkt odniesienia dla zespołów programistycznych i operacyjnych: uprawnienia, kolejki i zapisy przetwarzania.", "Da primeira demonstração à operação de clientes, com etapas claras.": "Od pierwszej demonstracji po obsługę klientów, jasno określonymi krokami.", "Não prometemos execução de qualquer código nem isolamento de produção nesta fase. A proposta será expandida a partir de pilotos controlados.": "Na tym etapie nie obiecujemy uruchamiania dowolnego kodu ani izolacji produkcyjnej. Zakres będzie rozszerzany poprzez kontrolowane pilotaże.", "Seu e-mail profissional": "Twój służbowy adres e-mail", "Quero receber novidades e convites para pilotos da Unitize.": "Chcę otrzymywać wiadomości o Unitize i zaproszenia do pilotaży.", "Inscrição gratuita. Não cria uma conta nem garante uma data de acesso.": "Rejestracja jest bezpłatna. Nie tworzy konta ani nie gwarantuje daty dostępu.", "Sobre seus dados": "O Twoich danych", "Coletamos seu e-mail e a data da inscrição para organizar a lista de interesse. Nesta versão, o cadastro fica no banco local da Unitize e nenhum e-mail é enviado automaticamente.": "Zbieramy adres e-mail i datę rejestracji, aby prowadzić listę zainteresowanych. W tej wersji zapis trafia do lokalnej bazy Unitize, a wiadomości e-mail nie są wysyłane automatycznie.", "Operação de agentes em construção. Feita com atenção a cada execução.": "Obsługa agentów w trakcie rozwoju. Z dbałością o każde wykonanie.", "Ir para o conteúdo": "Przejdź do treści", "Abrir navegação": "Otwórz nawigację", "Navegação móvel": "Nawigacja mobilna", "Camadas da arquitetura": "Warstwy architektury", "Exemplo ilustrativo de execução": "Przykład wykonania", "Início": "Strona główna", "Arquitetura": "Architektura", "Como funciona": "Jak to działa", "Soluções": "Rozwiązania", "Lista de espera": "Lista oczekujących", "A doca dos seus agentes.": "Port macierzysty Twoich agentów.", "Entrar na lista": "Dołącz do listy oczekujących", "Explorar a arquitetura": "Poznaj architekturę", "© 2026 Unitize.io. Todos os direitos reservados.": "© 2026 Unitize.io. Wszelkie prawa zastrzeżone.", "Uma camada operacional para agentes de diferentes ecossistemas.": "Warstwa operacyjna dla agentów z różnych ekosystemów.", "Visão conceitual. Integrações em desenvolvimento.": "Ilustracja koncepcyjna. Integracje w trakcie rozwoju.", "Conhecer o projeto": "Poznaj projekt", "Estamos preparando a próxima etapa.": "Przygotowujemy kolejny krok.", "Acompanhe a evolução da Unitize. As inscrições para novidades e futuros pilotos serão abertas quando o cadastro estiver disponível.": "Śledź rozwój Unitize. Zapisy na wiadomości i przyszłe pilotaże zostaną otwarte po udostępnieniu rejestracji.", "Em breve": "Wkrótce", "A lista de espera está chegando.": "Lista oczekujących już wkrótce.", "Por enquanto, conheça a proposta, a arquitetura e o caminho que estamos construindo.": "Na razie poznaj naszą propozycję, architekturę i kierunek rozwoju.", "Esta versão não recebe e-mails nem realiza inscrições.": "Ta wersja nie zbiera adresów e-mail ani nie przyjmuje zapisów.", "Sobre esta versão": "O tej wersji", "Esta é uma apresentação pública e temporária da Unitize. A plataforma e o cadastro de interesse continuam em desenvolvimento.": "To tymczasowa publiczna prezentacja Unitize. Platforma i rejestracja zainteresowania są nadal rozwijane."}};
  const landingCopy={"Para quem já constrói agentes.": ["For teams already building agents."], "Operação de agentes, com contexto.": ["Agent operations, with context."], "Você traz seu agente. A Unitize cuida da operação.": ["Bring your agent. Unitize handles operations."], "Uma base. Diferentes entregas.": ["One foundation. Different deliveries."], "Ajude a definir a próxima etapa.": ["Help shape the next step."], "Estamos construindo uma camada operacional para software houses e integradores executarem agentes com versões definidas, limites e histórico por projeto.": ["We are building an operations layer for software houses and integrators to run agents with pinned versions, limits and project history."], "Uma interface para acompanhar o trabalho. Um runtime para executar. Um histórico para entender o que aconteceu.": ["One interface to follow the work. A runtime to execute it. A history to understand what happened."], "Um fluxo simples entre o seu código e uma operação rastreável. O suporte inicial está sendo desenvolvido com um agente próprio de demonstração.": ["A simple path from your code to traceable operations. Initial support is being developed with our own demo agent."], "Um convite para software houses e integradores no Brasil que queiram conversar sobre operação de agentes e participar dos primeiros pilotos.": ["An invitation to software houses and integrators in Brazil to discuss agent operations and take part in early pilots."], "Protótipo em desenvolvimento": ["Prototype in development"], "Fluxo ilustrativo · sem execução nesta página": ["Illustrative flow · no execution on this page"], "Projetos e permissões": ["Projects and permissions"], "Cada entrega tem seu contexto. A base local já organiza execuções por projeto, com acesso de administrador, operador ou leitor.": ["Each delivery has its own context. The local prototype organizes runs by project, with administrator, operator or viewer access."], "API e fila": ["API and queue"], "O pedido é validado antes de entrar na fila. Limites de trabalho pendente ajudam a controlar a carga sem esconder o estado da execução.": ["Requests are validated before queuing. Pending-work limits help control load while keeping run status visible."], "Worker e contêiner": ["Worker and container"], "O worker reserva o pedido e executa a versão escolhida. A demonstração Docker usa imagem fixada por ID e limites de recursos.": ["The worker claims a request and runs the selected version. The Docker demo uses a pinned image ID and resource limits."], "Eventos e resultado": ["Events and results"], "Consulte o que entrou, o que saiu e os eventos registrados. Veja espera na fila, processamento e exporte uma execução em JSON.": ["Inspect inputs, outputs and recorded events. Review queue wait and processing time, and export a run as JSON."], "Hoje no protótipo": ["In the prototype today"], "Execução local Python e Docker de demonstração, histórico por projeto e controles iniciais de acesso.": ["Local Python and demo Docker execution, project history and initial access controls."], "Próximas etapas": ["Next steps"], "Integração de agentes de clientes, login de produção e políticas de orçamento. Abertura de pilotos conforme validação técnica.": ["Customer-agent integration, production sign-in and budget policies. Pilots will open as technical validation progresses."], "Prepare uma versão": ["Prepare a version"], "Empacote o agente e defina seu contrato de entrada e saída. A proposta é preservar seu código e seu framework.": ["Package the agent and define its input and output contract. The goal is to preserve your code and framework."], "Defina o contexto": ["Define the context"], "Associe a execução a um projeto e escolha quem pode operar. Estabeleça limites antes de aceitar novos pedidos.": ["Assign the run to a project and choose who can operate it. Establish limits before accepting new requests."], "Execute e acompanhe": ["Run and follow"], "Consulte a fila, o estado e os eventos. Cancele pedidos ainda não iniciados e acompanhe o tempo de processamento.": ["Inspect the queue, status and events. Cancel requests that have not started and review processing time."], "Entenda e melhore": ["Understand and improve"], "Use o histórico e o JSON exportado para investigar falhas e conversar com a equipe sobre a próxima versão.": ["Use history and exported JSON to investigate failures and discuss the next version with your team."], "Software houses": ["Software houses"], "Organize a operação dos agentes que você entrega. Separe projetos, fixe versões e encontre o histórico de cada execução.": ["Organize operations for the agents you deliver. Separate projects, pin versions and find each run’s history."], "Integradores": ["Integrators"], "Uma base operacional para conectar entregas feitas com ferramentas diferentes, sem transformar cada piloto em um painel novo.": ["An operations foundation for deliveries built with different tools, without building a new dashboard for every pilot."], "Equipes internas": ["Internal teams"], "Uma referência comum para quem desenvolve e quem acompanha a operação: permissões, fila e evidências do processamento.": ["A shared reference for development and operations teams: permissions, queues and processing records."], "Da primeira demonstração à operação de clientes, com etapas claras.": ["From the first demo to customer operations, with clear steps."], "Não prometemos execução de qualquer código nem isolamento de produção nesta fase. A proposta será expandida a partir de pilotos controlados.": ["This phase does not promise arbitrary-code execution or production isolation. The offering will expand through controlled pilots."], "Seu e-mail profissional": ["Your work email"], "Quero receber novidades e convites para pilotos da Unitize.": ["I want to receive Unitize updates and pilot invitations."], "Inscrição gratuita. Não cria uma conta nem garante uma data de acesso.": ["Free registration. It does not create an account or guarantee an access date."], "Sobre seus dados": ["About your data"], "Coletamos seu e-mail e a data da inscrição para organizar a lista de interesse. Nesta versão, o cadastro fica no banco local da Unitize e nenhum e-mail é enviado automaticamente.": ["We collect your email and registration date to organize the interest list. In this version, registration is stored in Unitize’s local database and no email is sent automatically."], "Operação de agentes em construção. Feita com atenção a cada execução.": ["Agent operations in development. Built with attention to every run."], "Ir para o conteúdo": ["Skip to content"], "Abrir navegação": ["Open navigation"], "Navegação móvel": ["Mobile navigation"], "Camadas da arquitetura": ["Architecture layers"], "Exemplo ilustrativo de execução": ["Illustrative run example"], "Início": ["Home", "首页", "ホーム", "Start", "Inizio", "Inicio", "Accueil", "Start", "الرئيسية", "בית", "Главная"], "Arquitetura": ["Architecture", "架构", "アーキテクチャ", "Architektur", "Architettura", "Arquitectura", "Architecture", "Architectuur", "البنية", "ארכיטקטורה", "Архитектура"], "Como funciona": ["How it works", "工作原理", "仕組み", "So funktioniert es", "Come funziona", "Cómo funciona", "Fonctionnement", "Hoe het werkt", "كيف تعمل", "איך זה עובד", "Как это работает"], "Soluções": ["Solutions", "解决方案", "ソリューション", "Lösungen", "Soluzioni", "Soluciones", "Solutions", "Oplossingen", "الحلول", "פתרונות", "Решения"], "Lista de espera": ["Waitlist", "候补名单", "ウェイティングリスト", "Warteliste", "Lista d’attesa", "Lista de espera", "Liste d’attente", "Wachtlijst", "قائمة الانتظار", "רשימת המתנה", "Лист ожидания"], "A doca dos seus agentes.": ["A home port for your agents.", "智能体的运行港湾。", "エージェントの運用拠点。", "Der Heimathafen Ihrer Agenten.", "Il porto dei tuoi agenti.", "El puerto de tus agentes.", "Le port d’attache de vos agents.", "De thuishaven van je agents.", "مرسى وكلائك.", "נמל הבית של הסוכנים שלך.", "Порт для ваших агентов."], "Explorar a arquitetura": ["Explore the architecture", "探索架构", "構成を見る", "Architektur entdecken", "Esplora l’architettura", "Explorar la arquitectura", "Explorer l’architecture", "Bekijk de architectuur", "استكشف البنية", "לגלות את הארכיטקטורה", "Изучить архитектуру"], "© 2026 Unitize.io. Todos os direitos reservados.": ["© 2026 Unitize.io. All rights reserved.", "© 2026 Unitize.io. 保留所有权利。", "© 2026 Unitize.io. 無断転載を禁じます。", "© 2026 Unitize.io. Alle Rechte vorbehalten.", "© 2026 Unitize.io. Tutti i diritti riservati.", "© 2026 Unitize.io. Todos los derechos reservados.", "© 2026 Unitize.io. Tous droits réservés.", "© 2026 Unitize.io. Alle rechten voorbehouden.", "© 2026 Unitize.io. جميع الحقوق محفوظة.", "© 2026 Unitize.io. כל הזכויות שמורות.", "© 2026 Unitize.io. Все права защищены."], "Conhecer o projeto": ["Explore the project", "了解项目", "プロジェクトを知る", "Projekt kennenlernen", "Scopri il progetto", "Conocer el proyecto", "Découvrir le projet", "Ontdek het project", "تعرّف على المشروع", "הכירו את הפרויקט", "Познакомиться с проектом"], "Estamos preparando a próxima etapa.": ["We are preparing the next step.", "我们正在准备下一步。", "次のステップを準備しています。", "Wir bereiten den nächsten Schritt vor.", "Stiamo preparando il prossimo passo.", "Estamos preparando la próxima etapa.", "Nous préparons la prochaine étape.", "We bereiden de volgende stap voor.", "نستعد للخطوة التالية.", "אנחנו מכינים את השלב הבא.", "Мы готовим следующий шаг."], "Acompanhe a evolução da Unitize. As inscrições para novidades e futuros pilotos serão abertas quando o cadastro estiver disponível.": ["Follow Unitize’s progress. Registration for updates and future pilots will open when sign-up is available.", "关注 Unitize 的进展。登记功能开放后，即可申请接收动态和未来试点邀请。", "Unitize の進捗をご覧ください。登録機能の準備が整い次第、最新情報や今後のパイロットへの登録を開始します。", "Verfolgen Sie die Entwicklung von Unitize. Die Anmeldung für Neuigkeiten und künftige Piloten öffnet, sobald die Registrierung verfügbar ist.", "Segui i progressi di Unitize. Le iscrizioni per novità e futuri piloti apriranno quando la registrazione sarà disponibile.", "Sigue la evolución de Unitize. La inscripción para novedades y futuros pilotos se abrirá cuando el registro esté disponible.", "Suivez l’évolution de Unitize. Les inscriptions aux actualités et aux futurs pilotes ouvriront lorsque le formulaire sera disponible.", "Volg de ontwikkeling van Unitize. Aanmelden voor updates en toekomstige pilots kan zodra de registratie beschikbaar is.", "تابع تطور Unitize. سيفتح التسجيل للأخبار والمشاريع التجريبية المقبلة عندما تتوفر خدمة التسجيل.", "עקבו אחר התקדמות Unitize. ההרשמה לעדכונים ולניסויים עתידיים תיפתח כאשר שירות הרישום יהיה זמין.", "Следите за развитием Unitize. Запись на новости и будущие пилоты откроется, когда станет доступна регистрация."], "Em breve": ["Coming soon", "即将推出", "近日公開", "Demnächst", "Prossimamente", "Próximamente", "Bientôt", "Binnenkort", "قريبًا", "בקרוב", "Скоро"], "A lista de espera está chegando.": ["The waitlist is coming soon.", "候补名单即将开放。", "ウェイティングリストを準備中です。", "Die Warteliste kommt bald.", "La lista d’attesa è in arrivo.", "La lista de espera llegará pronto.", "La liste d’attente arrive bientôt.", "De wachtlijst komt eraan.", "قائمة الانتظار قادمة قريبًا.", "רשימת ההמתנה תיפתח בקרוב.", "Лист ожидания скоро откроется."], "Por enquanto, conheça a proposta, a arquitetura e o caminho que estamos construindo.": ["For now, explore our proposal, architecture and the path we are building.", "现在，你可以了解我们的方案、架构和发展方向。", "まずは構想、アーキテクチャ、これからの道のりをご覧ください。", "Entdecken Sie vorerst unsere Idee, Architektur und den Weg, den wir aufbauen.", "Nel frattempo, scopri la proposta, l’architettura e il percorso che stiamo costruendo.", "Por ahora, conoce la propuesta, la arquitectura y el camino que estamos construyendo.", "Pour le moment, découvrez notre proposition, notre architecture et le chemin que nous construisons.", "Ontdek voorlopig ons voorstel, de architectuur en het pad dat we bouwen.", "في الوقت الحالي، تعرّف على فكرتنا وبنيتنا والمسار الذي نبنيه.", "בינתיים, הכירו את ההצעה, הארכיטקטורה והדרך שאנחנו בונים.", "Пока познакомьтесь с нашей идеей, архитектурой и путём развития."], "Esta versão não recebe e-mails nem realiza inscrições.": ["This version does not collect email addresses or accept registrations.", "此版本不收集邮箱，也不接受登记。", "このバージョンではメールアドレスの収集や登録受付は行いません。", "Diese Version sammelt keine E-Mail-Adressen und nimmt keine Anmeldungen entgegen.", "Questa versione non raccoglie email e non accetta iscrizioni.", "Esta versión no recopila correos ni realiza inscripciones.", "Cette version ne recueille pas d’adresses e-mail et n’accepte pas d’inscriptions.", "Deze versie verzamelt geen e-mailadressen en accepteert geen aanmeldingen.", "لا يجمع هذا الإصدار عناوين البريد الإلكتروني ولا يقبل التسجيلات.", "גרסה זו אינה אוספת כתובות דוא״ל ואינה מקבלת הרשמות.", "Эта версия не собирает адреса электронной почты и не принимает регистрации."], "Sobre esta versão": ["About this version", "关于此版本", "このバージョンについて", "Über diese Version", "Informazioni su questa versione", "Sobre esta versión", "À propos de cette version", "Over deze versie", "حول هذا الإصدار", "על הגרסה הזו", "Об этой версии"], "Esta é uma apresentação pública e temporária da Unitize. A plataforma e o cadastro de interesse continuam em desenvolvimento.": ["This is a temporary public introduction to Unitize. The platform and interest registration are still in development.", "这是 Unitize 的临时公开展示。平台和意向登记功能仍在开发中。", "Unitize を紹介する一時的な公開ページです。プラットフォームと参加希望の登録機能は開発中です。", "Dies ist eine vorläufige öffentliche Vorstellung von Unitize. Plattform und Interessenregistrierung sind noch in Entwicklung.", "Questa è una presentazione pubblica temporanea di Unitize. La piattaforma e la registrazione di interesse sono ancora in sviluppo.", "Esta es una presentación pública temporal de Unitize. La plataforma y el registro de interés siguen en desarrollo.", "Il s’agit d’une présentation publique temporaire de Unitize. La plateforme et l’inscription à la liste d’intérêt sont en développement.", "Dit is een tijdelijke openbare presentatie van Unitize. Het platform en de interesseregistratie zijn nog in ontwikkeling.", "هذه صفحة تعريفية عامة ومؤقتة لـ Unitize. لا تزال المنصة وخدمة تسجيل الاهتمام قيد التطوير.", "זהו דף היכרות ציבורי וזמני של Unitize. הפלטפורמה ושירות הרישום עדיין בפיתוח.", "Это временная публичная презентация Unitize. Платформа и регистрация интереса ещё разрабатываются."]};
  Object.assign(landingCopy,{"Uma camada operacional para agentes de diferentes ecossistemas.": ["An operations layer for agents from different ecosystems."], "Visão conceitual. Integrações em desenvolvimento.": ["Conceptual illustration. Integrations in development."]});
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
  const ignored='script,style,code,pre,.language-picker,.ticket-terminal,.capture-managed,#project,#agent,#run-agent,#output,#events,#history,#error,#project-error,#run-id,#run-timing,#project-capacity,#history-scope,#history-page,#runtime-hint,#status,#access-error,#runtime,#agent-version,#waitlist-status';
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

/* BEGIN UNITIZE_REVEAL_BUNDLE */
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
  const mobile=window.matchMedia('(max-width:700px)');
  mobile.addEventListener?.('change',event=>{
    if(!event.matches)return;
    for(const [element,animation] of active){
      if(element.matches('.mission-window'))animation.cancel();
    }
  });
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
      if((mobile.matches&&element.matches('.mission-window'))||scrollingUp||reduced.matches||document.hidden||element.contains(document.activeElement))return;
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

/* END UNITIZE_REVEAL_BUNDLE */

/* BEGIN UNITIZE_CLOTH_ENGINE */
/*
Unitize adaptation, 2026-10-28.
Simulation/shaders adapted from Asimov ticket-cloth.js v9 and Canvas UI Cloth.
Original component Copyright (c) 2026 David Haz.
Source: https://ty.asimov.academy/js/ticket-cloth.js?v=9
Unitize changes: local card painter, lifecycle cleanup and integration; no campaign assets or tracking.

# MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of
an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as
you do not sell, sublicense, or redistribute the components themselves -
whether alone, in a bundle, or as a ported version.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


*/
// Papel-tecido em WebGL2 para o modo emissão (flow_type "form_print").
// Carregado só nesse modo. O ingresso do DOM é "fotografado" num canvas 2D (posições
// lidas da própria página, então fica idêntico) e desenhado como tecido.
//
// A simulação (campo de alturas com equação de onda), os shaders de tecido/sombra e
// os parâmetros são adaptados do componente Cloth do Canvas UI
// (https://canvasui.dev/docs/components/cloth) — Copyright (c) 2026 David Haz,
// MIT + Commons Clause; licença completa em ticket-cloth.LICENSE.md. A diferença é a
// origem da textura: o Canvas UI usa o recurso experimental html-in-canvas; aqui a
// textura vem do nosso próprio "pintor", para funcionar em qualquer navegador com WebGL2.
//
// Se não houver WebGL2, se algo falhar ou se o aparelho não sustentar o desempenho,
// quem chama cai no ingresso estático.
//
// API: window.UnitizeTicketCloth = { supported(), prepare(ticket), print({...}), stamp(), gust(n) }

(() => {
    // ─── Suporte ──────────────────────────────────────────────────────────

    function supported() {
        try {
            const c = document.createElement("canvas");
            return !!c.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
        } catch (_) {
            return false;
        }
    }

    // ─── "Foto" do ingresso num canvas 2D ────────────────────────────────

    function makeNoise(size, alpha) {
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const x = c.getContext("2d");
        const data = x.createImageData(size, size);
        for (let i = 0; i < data.data.length; i += 4) {
            data.data[i] = data.data[i + 1] = data.data[i + 2] = 0;
            data.data[i + 3] = Math.random() * 255 * alpha;
        }
        x.putImageData(data, 0, 0);
        return c;
    }

    // Opacidade acumulada do elemento até o ingresso (exclusive)
    function opacityOf(el, root) {
        let a = 1;
        for (let n = el; n && n !== root; n = n.parentElement) a *= parseFloat(getComputedStyle(n).opacity) || 0;
        return a;
    }

    // Desenha o texto de um elemento palavra por palavra, na posição exata em que
    // a página o desenhou (Range.getClientRects), com a fonte/cor/caixa computadas.
    function paintText(ctx, el, origin, root, { shadow = null } = {}) {
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(box.left - origin.left - 2, box.top - origin.top - 2, box.width + 4, box.height + 4);
        ctx.clip();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let last = null;
        let clipped = false;
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const text = node.textContent;
            if (!text.trim()) continue;
            const parent = node.parentElement;
            const st = getComputedStyle(parent);
            ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
            if ("letterSpacing" in ctx) ctx.letterSpacing = st.letterSpacing === "normal" ? "0px" : st.letterSpacing;
            ctx.fillStyle = st.color;
            const alpha = opacityOf(parent, root);
            const metrics = ctx.measureText("Hg");
            const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(st.fontSize) * 0.93;
            const upper = st.textTransform === "uppercase";
            const re = /\S+/g;
            for (let m = re.exec(text); m; m = re.exec(text)) {
                range.setStart(node, m.index);
                range.setEnd(node, m.index + m[0].length);
                const r = range.getClientRects()[0];
                if (!r) continue;
                const word = upper ? m[0].toUpperCase() : m[0];
                const x = r.left - origin.left;
                const y = r.top - origin.top + ascent;
                if (r.top >= box.bottom - 1) { clipped = true; continue; } // além do line-clamp
                if (shadow) {
                    ctx.globalAlpha = alpha * shadow.alpha;
                    const f = ctx.fillStyle;
                    ctx.fillStyle = shadow.color;
                    ctx.fillText(word, x, y + shadow.dy);
                    ctx.fillStyle = f;
                }
                ctx.globalAlpha = alpha;
                ctx.fillText(word, x, y);
                last = { x: r.right - origin.left, y, alpha };
            }
        }
        if (clipped && last) { ctx.globalAlpha = last.alpha; ctx.fillText("…", last.x, last.y); }
        ctx.restore();
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Unitize adaptation: paint only our local card, without external assets.
    async function snapshot(ticket, dpr) {
        if (document.fonts?.ready) await Promise.race([document.fonts.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('font_timeout')),3000))]);
        const brandImage=ticket.querySelector('.ticket-paper-logo');
        if(brandImage&&!brandImage.complete)await Promise.race([brandImage.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('logo_timeout')),3000))]);
        const origin = ticket.getBoundingClientRect();
        const W = origin.width, H = origin.height;
        if (!W || !H) throw new Error('empty_ticket');
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
        const gradient = ctx.createLinearGradient(0,0,W,H);
        gradient.addColorStop(0,'#99f3ff');gradient.addColorStop(.65,'#35d8ff');gradient.addColorStop(1,'#21bfd9');
        ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
        const glow=ctx.createRadialGradient(W*.15,0,0,W*.15,0,H*.8);
        glow.addColorStop(0,'#c6faff99');glow.addColorStop(1,'#c6faff00');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
        ctx.save();ctx.globalAlpha=.035;ctx.fillStyle=ctx.createPattern(makeNoise(128,.6),'repeat');ctx.fillRect(0,0,W,H);ctx.restore();
        const textSelectors='.ticket-paper-top strong,[data-ticket-badge],h3,dt,dd,.ticket-disclaimer,.ticket-paper-foot span';
        ticket.querySelectorAll(textSelectors).forEach(el=>paintText(ctx,el,origin,ticket));
        const badge=ticket.querySelector('[data-ticket-badge]');
        if(badge){const box=badge.getBoundingClientRect();ctx.strokeStyle='#07304266';ctx.lineWidth=1;roundRectPath(ctx,box.left-origin.left,box.top-origin.top,box.width,box.height,box.height/2);ctx.stroke();}
        if(brandImage?.naturalWidth){const box=brandImage.getBoundingClientRect();ctx.save();ctx.filter='brightness(0.25)';ctx.drawImage(brandImage,box.left-origin.left,box.top-origin.top,box.width,box.height);ctx.restore();}
        const perf=ticket.querySelector('.ticket-perforation').getBoundingClientRect();
        const y=perf.top-origin.top+1.5;
        ctx.save();ctx.strokeStyle='#07304255';ctx.lineWidth=2;ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();ctx.restore();
        // Preserve the rounded silhouette and the two ticket notches as alpha.
        ctx.save();ctx.globalCompositeOperation='destination-in';ctx.fillStyle='#000';roundRectPath(ctx,0,0,W,H,14);ctx.fill();
        ctx.globalCompositeOperation='destination-out';for(const x of [0,W]){ctx.beginPath();ctx.arc(x,y,12.5,0,Math.PI*2);ctx.fill();}ctx.restore();
        return {canvas,ctx,W,H,repaintCount:()=>null,stamp:null,ink:[7/255,48/255,66/255],radius:14};
    }

    const CFG = {
        wind: 2.6,          // força do vento
        speed: 0.5,         // velocidade do movimento
        amplitude: 22,      // altura das dobras (px)
        drape: 12,          // quanto o papel "enche" para a frente longe do topo (px)
        brush: 2.05,        // força da onda que o cursor/dedo cria
        brushSize: 140,     // raio do cursor (px)
        damping: 1,         // quão rápido as ondas acalmam
        light: 0.45,        // luz nas dobras (0–1)
        sheen: 0.12,        // brilho nas cristas (0–1)
        shadow: 0.28,       // sombra de contato (0–1)
        perspective: 1200,  // distância focal (px)
    };
    const SEG = 96;
    const NODES = SEG + 1;
    const DT = 1 / 120;
    const WAVE_SPEED = 30;
    const STIFFNESS = 0.55;
    const FORCE_GAIN = 5.0;
    const BLEED = 48;       // folga do canvas para as dobras e a sombra
    const FIRM = 70;        // px logo abaixo da fenda/topo em que o papel fica firme
    const MIN_FPS = 38;     // abaixo disso desiste e mostra o ingresso estático

    const CLOTH_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes;
uniform vec2 uOut;
uniform float uBleed;
uniform float uFocal;
uniform float uShift;
out vec2 vUv;
out vec3 vNormal;
out float vFold;
out vec2 vLocal;
void main () {
  vUv = aGrid;
  float z = aData.x;
  vec2 nxy = aData.yz;
  vNormal = vec3(nxy, sqrt(max(1.0 - dot(nxy, nxy), 0.04)));
  vFold = aData.w;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed) + vec2(0.0, uShift);
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float w = (uFocal - z) / uFocal;
  gl_Position = vec4(ndc, -z / uFocal, w);
}`;

    const SDF = `
float fabricDist (vec2 p, vec2 size, float radius) {
  vec2 half_ = size * 0.5;
  float r = min(radius, min(half_.x, half_.y));
  vec2 q = abs(p - half_) - (half_ - vec2(r));
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}`;

    const CLOTH_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vNormal;
in float vFold;
in vec2 vLocal;
out vec4 outColor;
uniform sampler2D uContent;
uniform sampler2D uStamp;
uniform float uLight;
uniform float uSheen;
uniform vec2 uRes;
uniform float uRadius;
uniform vec2 uStampC;
uniform float uStampSize;
uniform float uStampScale;
uniform float uStampAlpha;
uniform vec3 uInk;
${SDF}
void main () {
  vec2 uv = clamp(vUv, vec2(0.001), vec2(0.999));
  vec4 tex = texture(uContent, uv);
  if (tex.a < 0.004) discard;
  vec3 fabric = tex.rgb;
  // carimbo: sprite girado -16°, multiplicado na tinta (deforma junto com o papel)
  if (uStampAlpha > 0.0) {
    vec2 d = vLocal - uStampC;
    vec2 q = vec2(d.x * 0.9613 - d.y * 0.2756, d.x * 0.2756 + d.y * 0.9613) / (uStampSize * uStampScale) + 0.5;
    if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) {
      float a = texture(uStamp, q).a * uStampAlpha;
      fabric *= mix(vec3(1.0), uInk, a);
    }
  }
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(-0.3, 0.42, 0.86));
  float diffFlat = 0.58 + 0.42 * lightDir.z;
  float diff = 0.58 + 0.42 * dot(n, lightDir);
  float shade = mix(1.0, (diff / diffFlat) * vFold, uLight);
  vec3 lit = fabric * shade;
  vec3 halfway = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float specFlat = pow(halfway.z, 34.0);
  float spec = max(pow(max(dot(n, halfway), 0.0), 34.0) - specFlat, 0.0) / (1.0 - specFlat);
  lit += uSheen * spec * mix(vec3(1.0), fabric, 0.35);
  float dist = fabricDist(vLocal, uRes, uRadius);
  float hemT = smoothstep(0.0, 6.0, -dist);
  lit *= mix(1.0, mix(0.93, 1.0, hemT), uLight);
  float alpha = clamp(0.5 - dist, 0.0, 1.0) * tex.a;
  outColor = vec4(clamp(lit, 0.0, 1.0), 1.0) * alpha;
}`;

    const SHADOW_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes;
uniform vec2 uOut;
uniform float uBleed;
uniform float uShift;
out vec2 vLocal;
out float vLift;
void main () {
  float z = aData.x;
  vLift = z;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed) + vec2(0.0, uShift) + vec2(10.0, 14.0) + vec2(0.3, 0.42) * z;
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;

    const SHADOW_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vLift;
out vec4 outColor;
uniform float uShadow;
uniform vec2 uRes;
uniform float uRadius;
${SDF}
void main () {
  float d = fabricDist(vLocal, uRes, uRadius);
  float a = uShadow * smoothstep(0.0, 30.0, -d);
  a *= mix(1.0, 0.55, clamp(vLift / 50.0, 0.0, 1.0));
  outColor = vec4(0.0, 0.0, 0.0, a);
}`;

    const S = {
        gl: null, canvas: null, feed: null, ticket: null, snap: null, prep: null,
        W: 1, H: 1, dpr: 1,
        out: 0, freeAll: false,
        running: false, visible: true, raf: 0, last: 0, debt: 0,
        frames: 0, frameTime: 0, onFail: null, countTimer: 0, generation: 0, observer: null, abort: null,
        stampT: -1, pressed: false,
    };

    function compile(gl, type, text) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, text);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        return sh;
    }

    function link(gl, vert, frag) {
        const program = gl.createProgram();
        gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vert));
        gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, frag));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        const uniforms = {};
        const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < count; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        return { program, uniforms };
    }

    function makeTexture(gl, source) {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); // o shader multiplica pelo alpha
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
    }

    // Estado da simulação
    let hCur = new Float32Array(NODES * NODES);
    let hPrev = new Float32Array(NODES * NODES);
    let hNext = new Float32Array(NODES * NODES);
    const vertexData = new Float32Array(NODES * NODES * 4);
    const offsetData = new Float32Array(NODES * NODES * 2);
    const zField = new Float32Array(NODES * NODES);
    const rowForce = new Float32Array(NODES);
    const colForce = new Float32Array(NODES);
    const hangCurve = new Float32Array(NODES);
    for (let a = 0; a < NODES; a++) hangCurve[a] = Math.pow(a / SEG, 1.3);
    let simTime = Math.random() * 60;
    let gust = 0.5;
    let gustBoost = 0;
    const pointer = { x: -1e5, y: -1e5, inside: false };
    const touch = { x: -1e5, y: -1e5, vx: 0, vy: 0, s: 0 };

    function stepSim(dt) {
        simTime += dt * CFG.speed;
        const t = simTime;
        const windAmp = FORCE_GAIN * CFG.wind * (gust + gustBoost);
        const kb1 = (Math.PI * 2) / (SEG / 1.5);
        const kb2 = (Math.PI * 2) / (SEG / 3.8);
        const ka = (Math.PI * 2) / (SEG / 2.2);
        const w1 = WAVE_SPEED * kb1, w2 = WAVE_SPEED * kb2;
        const drift = 1.8 * Math.sin(0.23 * t);
        for (let b = 0; b < NODES; b++) {
            rowForce[b] = Math.sin(kb1 * b - w1 * t + drift) + 0.45 * Math.sin(kb2 * b + w2 * t * 0.8 + 3.0);
        }
        for (let a = 0; a < NODES; a++) colForce[a] = (0.7 + 0.3 * Math.sin(ka * a - 1.7 * t)) * hangCurve[a];
        const c2 = WAVE_SPEED * WAVE_SPEED;
        const dt2 = dt * dt;
        const decay = Math.exp(-Math.min(Math.max(CFG.damping, 0.05), 8) * dt);
        for (let y = 0; y < NODES; y++) {
            const up = Math.max(y - 1, 0) * NODES, down = Math.min(y + 1, SEG) * NODES, row = y * NODES;
            for (let x = 0; x < NODES; x++) {
                const i = row + x;
                const l = row + Math.max(x - 1, 0), r = row + Math.min(x + 1, SEG);
                const h = hCur[i];
                const lap = hCur[l] + hCur[r] + hCur[up + x] + hCur[down + x] - 4 * h;
                const acc = c2 * lap - STIFFNESS * h + windAmp * rowForce[x] * colForce[y];
                const next = 2 * h - hPrev[i] + dt2 * acc;
                let v = h + (next - h) * decay;
                if (v > 3.5) v = 3.5; else if (v < -3.5) v = -3.5;
                hNext[i] = v;
            }
        }
        for (let x = 0; x < NODES; x++) hNext[x] = 0; // preso pelo topo
        const spent = hPrev; hPrev = hCur; hCur = hNext; hNext = spent;
    }

    // Marca uma "impressão" gaussiana no campo (cursor/dedo, batida do carimbo)
    function imprint(px, py, radius, goal, rate) {
        const cellW = S.W / SEG, cellH = S.H / SEG;
        const rx = radius / cellW, ry = radius / cellH;
        const gx = px / cellW, gy = py / cellH;
        const x0 = Math.max(Math.ceil(gx - 2.5 * rx), 0), x1 = Math.min(Math.floor(gx + 2.5 * rx), SEG);
        const y0 = Math.max(Math.ceil(gy - 2.5 * ry), 1), y1 = Math.min(Math.floor(gy + 2.5 * ry), SEG);
        for (let y = y0; y <= y1; y++) {
            const oy = (y - gy) / ry;
            for (let x = x0; x <= x1; x++) {
                const ox = (x - gx) / rx;
                const g = Math.exp(-(ox * ox + oy * oy));
                if (g < 0.02) continue;
                const i = y * NODES + x;
                const pull = rate * g;
                hCur[i] += (goal * g - hCur[i]) * pull;
                hPrev[i] += (goal * g - hPrev[i]) * pull;
            }
        }
    }

    function foreshorten(axisStride, lineStride, ds, anchor, comp) {
        const ds2 = ds * ds;
        for (let l = 0; l < NODES; l++) {
            const base = l * lineStride;
            offsetData[(base + anchor * axisStride) * 2 + comp] = 0;
            let cum = 0;
            for (let k = anchor + 1; k < NODES; k++) {
                const i = base + k * axisStride;
                const dz = zField[i] - zField[i - axisStride];
                cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0));
                offsetData[i * 2 + comp] = -cum;
            }
            cum = 0;
            for (let k = anchor - 1; k >= 0; k--) {
                const i = base + k * axisStride;
                const dz = zField[i] - zField[i + axisStride];
                cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0));
                offsetData[i * 2 + comp] = cum;
            }
        }
    }

    function composeVertices() {
        const { W, H } = S;
        const cellW = W / SEG, cellH = H / SEG;
        const hidden = S.freeAll ? 0 : H - S.out; // parte ainda dentro da fenda
        const drape = CFG.drape * (0.3 + 0.7 * gust);
        for (let y = 0; y < NODES; y++) {
            const rowPx = (y / SEG) * H - hidden;           // distância abaixo da fenda/topo
            const t = Math.min(1, Math.max(0, rowPx / FIRM));
            const firm = t * t * (3 - 2 * t);                 // firme perto da fenda
            const hang = Math.pow(Math.min(1, Math.max(0, rowPx / H)), 1.3);
            const row = y * NODES;
            for (let x = 0; x < NODES; x++) {
                const i = row + x;
                zField[i] = (CFG.amplitude * Math.tanh(hCur[i]) * firm) + drape * hang;
            }
        }
        for (let y = 0; y < NODES; y++) {
            const up = Math.max(y - 1, 0) * NODES, down = Math.min(y + 1, SEG) * NODES, row = y * NODES;
            for (let x = 0; x < NODES; x++) {
                const i = row + x;
                const l = row + Math.max(x - 1, 0), r = row + Math.min(x + 1, SEG);
                const dzdx = (zField[r] - zField[l]) / (2 * cellW);
                const dzdy = (zField[down + x] - zField[up + x]) / (2 * cellH);
                const inv = 1 / Math.hypot(dzdx, dzdy, 1);
                const curve = zField[l] + zField[r] + zField[up + x] + zField[down + x] - 4 * zField[i];
                let fold = 1 - curve * 0.01;
                if (fold < 0.86) fold = 0.86; else if (fold > 1.06) fold = 1.06;
                const o = i * 4;
                vertexData[o] = zField[i];
                vertexData[o + 1] = -dzdx * inv;
                vertexData[o + 2] = -dzdy * inv;
                vertexData[o + 3] = fold;
            }
        }
        foreshorten(NODES, 1, cellH, 0, 1);
        foreshorten(1, NODES, cellW, SEG >> 1, 0);
    }

    function setupGL(snap) {
        const { W, H } = snap;
        const canvas = document.createElement("canvas");
        canvas.className = "unitize-cloth-gl";
        canvas.setAttribute("aria-hidden", "true");
        const cw = W + BLEED * 2, ch = H + BLEED * 2;
        Object.assign(canvas.style, { width: `${cw}px`, height: `${ch}px`, left: `${-BLEED}px`, top: `${-BLEED}px` });
        canvas.width = Math.round(cw * S.dpr);
        canvas.height = Math.round(ch * S.dpr);
        const gl = canvas.getContext("webgl2", { alpha: true, depth: false, stencil: false, antialias: true, premultipliedAlpha: true });
        if (!gl) throw new Error("sem WebGL2");

        S.gl=gl;S.canvas=canvas;
        const cloth = link(gl, CLOTH_VERT, CLOTH_FRAG);
        const shadow = link(gl, SHADOW_VERT, SHADOW_FRAG);

        const grid = new Float32Array(NODES * NODES * 2);
        for (let y = 0; y < NODES; y++) {
            for (let x = 0; x < NODES; x++) {
                grid[(y * NODES + x) * 2] = x / SEG;
                grid[(y * NODES + x) * 2 + 1] = y / SEG;
            }
        }
        const idx = new Uint32Array(SEG * SEG * 6);
        let o = 0;
        for (let y = 0; y < SEG; y++) {
            for (let x = 0; x < SEG; x++) {
                const a = y * NODES + x, b = a + 1, c = a + NODES, d = c + 1;
                idx[o++] = a; idx[o++] = c; idx[o++] = b;
                idx[o++] = b; idx[o++] = c; idx[o++] = d;
            }
        }
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        const gridBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
        gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const dataBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData.byteLength, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        const offBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, offBuf);
        gl.bufferData(gl.ARRAY_BUFFER, offsetData.byteLength, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
        const ib = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
        gl.bindVertexArray(null);

        gl.activeTexture(gl.TEXTURE0);
        const contentTex = makeTexture(gl, snap.canvas);
        gl.activeTexture(gl.TEXTURE1);
        const stampSrc = snap.stamp ? snap.stamp.canvas : document.createElement("canvas");
        makeTexture(gl, stampSrc);

        canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); if(S.canvas===canvas)fail(); });
        Object.assign(S, { gl, canvas, W, H, cloth, shadow, vao, dataBuf, offBuf, contentTex, count: idx.length, cw, ch });
    }

    function render() {
        const gl = S.gl;
        const shift = S.freeAll ? 0 : -(S.H - S.out);
        gl.viewport(0, 0, S.canvas.width, S.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindVertexArray(S.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, S.dataBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexData);
        gl.bindBuffer(gl.ARRAY_BUFFER, S.offBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, offsetData);

        const radius = S.snap.radius;
        let u = S.shadow.uniforms;
        gl.useProgram(S.shadow.program);
        gl.uniform2f(u.uRes, S.W, S.H);
        gl.uniform2f(u.uOut, S.cw, S.ch);
        gl.uniform1f(u.uBleed, BLEED);
        gl.uniform1f(u.uShift, shift);
        gl.uniform1f(u.uShadow, CFG.shadow);
        gl.uniform1f(u.uRadius, radius);
        gl.drawElements(gl.TRIANGLES, S.count, gl.UNSIGNED_INT, 0);

        u = S.cloth.uniforms;
        gl.useProgram(S.cloth.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, S.contentTex);
        gl.uniform1i(u.uContent, 0);
        gl.uniform1i(u.uStamp, 1);
        gl.uniform2f(u.uRes, S.W, S.H);
        gl.uniform2f(u.uOut, S.cw, S.ch);
        gl.uniform1f(u.uBleed, BLEED);
        gl.uniform1f(u.uShift, shift);
        gl.uniform1f(u.uFocal, CFG.perspective);
        gl.uniform1f(u.uLight, CFG.light);
        gl.uniform1f(u.uSheen, CFG.sheen);
        gl.uniform1f(u.uRadius, radius);
        gl.uniform3f(u.uInk, S.snap.ink[0], S.snap.ink[1], S.snap.ink[2]);
        const st = S.snap.stamp;
        let stampAlpha = 0, stampScale = 1;
        if (st && S.stampT >= 0) {
            const p = Math.min(1, Math.max(0, (S.stampT - 0.35) / 0.5));
            const c = 2.2; // cubic-bezier(.3,1.6,.5,1) aproximado: overshoot
            const e = 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
            stampScale = 2.2 - 1.2 * e;
            stampAlpha = 0.9 * Math.min(1, p * 1.6);
            gl.uniform2f(u.uStampC, st.cx, st.cy);
            gl.uniform1f(u.uStampSize, st.size);
        }
        gl.uniform1f(u.uStampScale, stampScale);
        gl.uniform1f(u.uStampAlpha, stampAlpha);
        gl.drawElements(gl.TRIANGLES, S.count, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }

    function frame(now) {
        S.raf = 0;
        if (!S.running || !S.visible || document.hidden) return;
        const delta = Math.min((now - (S.last || now)) / 1000, 1 / 20);
        // vigia de desempenho: média do 20º ao 110º quadro
        if (S.last) {
            S.frames++;
            if (S.frames > 20) S.frameTime += now - S.last;
            if (S.frames === 110 && S.frameTime / 90 > 1000 / MIN_FPS) { fail(); return; }
        }
        S.last = now;

        const t = simTime;
        const target = Math.max(0.55 + 0.35 * Math.sin(t * 0.31 + 1.3) + 0.25 * Math.sin(t * 0.83) * (0.5 + 0.5 * Math.sin(t * 0.17)), 0.15);
        gust += (target - gust) * Math.min(delta * 2, 1);
        gustBoost *= Math.exp(-1.6 * delta);

        // cursor/dedo: segue com mola e "levanta" o tecido sob ele
        const sTarget = pointer.inside && S.freeAll ? 1 : 0;
        touch.s += (sTarget - touch.s) * Math.min(delta * (pointer.inside ? 8 : 2.5), 1);
        const omega = 14;
        touch.vx += ((pointer.x - touch.x) * omega * omega - 2 * omega * touch.vx) * delta;
        touch.vy += ((pointer.y - touch.y) * omega * omega - 2 * omega * touch.vy) * delta;
        touch.x += touch.vx * delta;
        touch.y += touch.vy * delta;
        if (touch.s > 0.01) imprint(touch.x, touch.y, CFG.brushSize, 1.1 * CFG.brush * touch.s, Math.min(delta * 4, 1));

        // carimbo: no impacto, afunda o papel naquele ponto e manda uma onda
        if (S.stampT >= 0) {
            S.stampT += delta;
            if (!S.pressed && S.stampT > 0.7 && S.snap.stamp) {
                S.pressed = true;
                imprint(S.snap.stamp.cx, S.snap.stamp.cy, 60, -1.6, 1);
                gustBoost += 0.6;
            }
        }

        S.debt = Math.min(S.debt + delta, DT * 5);
        while (S.debt >= DT) { stepSim(DT); S.debt -= DT; }
        composeVertices();
        render();
        S.raf = requestAnimationFrame(frame);
    }

    function start() {
        if (!S.running || S.raf || !S.visible) return;
        S.last = 0;
        S.raf = requestAnimationFrame(frame);
    }

    function stop() {
        S.generation++;
        S.running=false;
        if(S.raf)cancelAnimationFrame(S.raf);
        S.raf=0;clearInterval(S.countTimer);
        S.observer?.disconnect();S.abort?.abort();
        S.canvas?.remove();S.ticket?.classList.remove('is-cloth-source');S.feed?.classList.remove('has-cloth');
        const gl=S.gl;S.gl=null;
        if(gl&&!gl.isContextLost())gl.getExtension('WEBGL_lose_context')?.loseContext();
        S.canvas=null;S.prep=null;S.snap=null;S.onFail=null;
        S.freeAll=false;S.visible=true;S.out=0;S.last=0;S.debt=0;S.frames=0;S.frameTime=0;S.stampT=-1;S.pressed=false;
        hCur.fill(0);hPrev.fill(0);hNext.fill(0);zField.fill(0);offsetData.fill(0);vertexData.fill(0);
        pointer.inside=false;touch.s=0;touch.vx=0;touch.vy=0;
    }
    function fail() {
        const callback=S.onFail;stop();callback?.();
    }

    function interact() {
        const feed = S.feed;
        const options={signal:S.abort.signal};
        feed.style.touchAction = "pan-y"; // arrasto lateral mexe o papel; rolagem vertical segue normal
        feed.addEventListener("pointermove", (e) => {
            const r = feed.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            if (touch.s < 0.01) { touch.x = x; touch.y = y; touch.vx = 0; touch.vy = 0; }
            pointer.x = x; pointer.y = y; pointer.inside = true;
        },options);
        const leave = () => { pointer.inside = false; };
        feed.addEventListener("pointerleave", leave,options);
        feed.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") leave(); },options);
        feed.addEventListener("pointercancel", leave,options);
    }

    // ─── API ──────────────────────────────────────────────────────────────

    // "Fotografa" o ingresso antes de qualquer mudança na tela (chamado no "Processando")
    function prepare(ticket) {
        S.dpr = Math.min(2, window.devicePixelRatio || 1);
        S.prep = snapshot(ticket, S.dpr);
        S.prep.catch(() => {});
        return S.prep;
    }

    // Imprime: o papel desce pela fenda; só a parte de fora ondula. Resolve quando
    // termina de sair. Rejeita se não der (quem chama usa o ingresso estático).
    async function print({ feed, ticket, durationMs, onFail }) {
        stop();
        const generation = ++S.generation;
        S.feed = feed; S.ticket = ticket; S.onFail = onFail;
        S.abort = new AbortController();
        const snap = await (S.prep || prepare(ticket));
        if(generation !== S.generation) throw new Error("cancelled_ticket");
        S.snap = snap;
        setupGL(snap);
        S.out = 0;
        S.running = true;
        composeVertices();
        render(); // primeiro quadro pronto antes de aparecer (sem piscada)
        feed.append(S.canvas);
        feed.classList.add("has-cloth");
        ticket.classList.add("is-cloth-source");

        // contador vivo: redesenha só a área dele e sobe esse pedaço da textura
        S.countTimer = setInterval(() => {
            const box = snap.repaintCount();
            if (!box || !S.gl) return;
            const gl = S.gl, d = S.dpr;
            const x = Math.floor(box.x * d), y = Math.floor(box.y * d);
            const w = Math.min(snap.canvas.width - x, Math.ceil(box.w * d));
            const h = Math.min(snap.canvas.height - y, Math.ceil(box.h * d));
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, S.contentTex);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, snap.ctx.getImageData(x, y, w, h));
        }, 1000);

        S.observer = new IntersectionObserver(([entry]) => {
            S.visible = entry.isIntersecting;
            start();
        });
        S.observer.observe(S.canvas);
        document.addEventListener("visibilitychange", () => { if (!document.hidden) start(); }, {signal:S.abort.signal});

        start();
        const t0 = performance.now();
        await new Promise((resolve) => {
            const feedFrame = (now) => {
                if (!S.running || generation !== S.generation) { resolve(); return; }
                const t = Math.min(1, (now - t0) / durationMs);
                const eased = 1 - Math.pow(1 - t, 2.4);
                const stepJerk = Math.sin(t * Math.PI * 34) * 0.012 * (1 - t); // motor de passo
                S.out = Math.max(0, Math.min(1, eased + stepJerk)) * S.H;
                if (t < 1) { requestAnimationFrame(feedFrame); return; }
                S.out = S.H;
                S.freeAll = true; // cortado: fica pendurado pelo topo
                gustBoost += 0.5;
                interact();
                resolve();
            };
            requestAnimationFrame(feedFrame);
        });
        if (!S.running) throw new Error("tecido desativado");
    }

    function stamp() {
        if (!S.gl) return;
        S.stampT = 0;
        S.pressed = false;
    }

    function gustNow(n) { gustBoost += n; }

    window.UnitizeTicketCloth = { supported, print, stop };
})();


/* END UNITIZE_CLOTH_ENGINE */
/* BEGIN UNITIZE_TICKET */
(function initWaitlistTicket(){
  const terminal=document.querySelector('.ticket-terminal');if(!terminal)return;
  const output=terminal.querySelector('.ticket-output'),empty=terminal.querySelector('.ticket-empty');
  const preview=terminal.querySelector('[data-ticket-preview]');
  let state='waiting',email='',date=null;
  const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
  let renderVersion=0,resizeTimer=0,printWatchdog=0;
  function stopPaper(){
    renderVersion++;clearTimeout(printWatchdog);
    window.UnitizeTicketCloth?.stop();terminal.dataset.cloth='static';
  }
  function renderPaper(){
    stopPaper();
    if(output.hidden)return;
    if(reduced.matches){terminal.dataset.clothFallback='reduced_motion';return;}
    if(!window.UnitizeTicketCloth?.supported()){terminal.dataset.clothFallback='webgl_unavailable';return;}
    delete terminal.dataset.clothFallback;
    terminal.dataset.cloth="queued";
    const version=renderVersion;
    void(async()=>{
      if(version!==renderVersion||output.hidden){terminal.dataset.clothFallback="cancelled_before_frame";return;}
      terminal.dataset.cloth='printing';
      printWatchdog=setTimeout(()=>{if(version===renderVersion&&terminal.dataset.cloth==='printing'){stopPaper();terminal.dataset.clothFallback='printing_timeout';}},6500);
      try{
        await window.UnitizeTicketCloth.print({feed:output,ticket:output.querySelector('.ticket-paper'),durationMs:3000,onFail:()=>{if(version===renderVersion){terminal.dataset.cloth='static';terminal.dataset.clothFallback='renderer_or_performance';}}});
        if(version===renderVersion){clearTimeout(printWatchdog);terminal.dataset.cloth='flowing';}
      }catch{
        if(version===renderVersion){stopPaper();terminal.dataset.clothFallback='renderer_error';}
      }
    })();
  }
  reduced.addEventListener?.('change',renderPaper);
  let ticketViewportWidth=window.innerWidth;
  window.addEventListener('resize',()=>{
    if(window.innerWidth===ticketViewportWidth)return;
    ticketViewportWidth=window.innerWidth;
    clearTimeout(resizeTimer);resizeTimer=setTimeout(renderPaper,220);
  });
  window.addEventListener('pagehide',stopPaper);
  window.addEventListener('pageshow',event=>{if(event.persisted)renderPaper();});
  const text=(pt,en)=>document.documentElement.lang.startsWith('pt')?pt:en;
  function translate(){
    const copy={terminal:text('Terminal de inscrições','Registration terminal'),empty:text('Sua inscrição alimenta o terminal. Seu cartão é emitido aqui ao terminar.','Your registration feeds the terminal. Your card is issued here when you finish.'),title:text('A próxima etapa começa com você.','The next step starts with you.'),date:text('Data','Date'),type:text('Modalidade','Type'),waitlist:text('Lista de espera','Waitlist'),disclaimer:text('Manifestação de interesse. Não garante acesso nem uma data de lançamento.','Expression of interest. Access and a launch date are not guaranteed.')};
    terminal.querySelectorAll('[data-ticket-copy]').forEach(el=>{el.textContent=copy[el.dataset.ticketCopy];});
    terminal.querySelector('[data-ticket-status]').textContent=state==='received'?text('Inscrição recebida','Registration received'):state==='example'?text('Prévia ilustrativa','Illustrative preview'):text('Aguardando inscrição','Awaiting registration');
    terminal.querySelector('[data-ticket-badge]').textContent=state==='received'?text('RECEBIDO','RECEIVED'):text('EXEMPLO','EXAMPLE');
    terminal.querySelector('[data-ticket-email]').textContent=email;
    terminal.querySelector('[data-ticket-date]').textContent=date?new Intl.DateTimeFormat(document.documentElement.lang,{dateStyle:'short'}).format(date):'—';
    preview.textContent=state==='example'?text('Fechar exemplo','Close preview'):text('Ver exemplo do cartão','Preview sample card');
  }
  function show(next,address){state=next;email=address;date=next==='received'?new Date():null;terminal.dataset.ticketState=state;output.hidden=false;empty.hidden=true;translate();renderPaper();}
  preview.addEventListener('click',()=>{
    if(state==='received')return;
    if(state==='example'){stopPaper();state='waiting';output.hidden=true;empty.hidden=false;translate();}
    else show('example','demo@example.com');
  });
  document.addEventListener('unitize:waitlist-received',event=>{
    if(typeof event.detail?.email!=='string')return;
    show('received',event.detail.email);preview.hidden=true;
  });
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{terminal.dataset.visible=String(entries[0].isIntersecting);});observer.observe(terminal);}
  else terminal.dataset.visible='true';
  let ticketLanguage=document.documentElement.lang;
  new MutationObserver(()=>{
    const nextLanguage=document.documentElement.lang;
    if(nextLanguage===ticketLanguage)return;
    ticketLanguage=nextLanguage;translate();renderPaper();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  translate();
})();
/* END UNITIZE_TICKET */

/* BEGIN UNITIZE_PUBLIC_CAPTURE */
/* Public lead form: only enabled after both local and server configuration agree. */
(async function initPublicCapture(){
  const placeholder=document.querySelector('.waitlist-form.coming-soon');if(!placeholder)return;
  const pt=document.documentElement.lang.startsWith('pt');const t=(a,b)=>pt?a:b;
  const root=new URL(document.documentElement.dataset.siteRoot||'./',document.baseURI);
  let settings,remote,endpoint;
  try{
    const response=await fetch(new URL('capture-config.json',root),{cache:'no-store',credentials:'omit'});
    settings=await response.json();if(settings.enabled!==true)return;
    endpoint=new URL(settings.api_origin);
    if(endpoint.protocol!=='https:'||endpoint.pathname!=='/'||endpoint.search||endpoint.hash||endpoint.username||endpoint.password||!(endpoint.hostname==='api.unitize.io'||endpoint.hostname.endsWith('.workers.dev')))return;
    const configResponse=await fetch(new URL('/v1/config',endpoint),{credentials:'omit',signal:AbortSignal.timeout(8000)});
    if(!configResponse.ok)return;remote=await configResponse.json();
    if(remote.enabled!==true||typeof remote.turnstile_site_key!=='string'||!remote.turnstile_site_key||typeof remote.controller_name!=='string'||!remote.controller_name.trim()||typeof remote.privacy_contact!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(remote.privacy_contact)||!Number.isInteger(remote.retention_days)||remote.retention_days<1||remote.retention_days>365)return;
  }catch{return;}
  const form=document.createElement('form');form.id='public-waitlist-form';form.className='waitlist-form capture-managed';
  const questions=[
    ['profile',t('Seu perfil','Your role'),[['software_house','Software house'],['integrator',t('Integrador','Integrator')],['internal_team',t('Equipe interna','Internal team')],['other',t('Outro','Other')]]],
    ['stage',t('Etapa atual','Current stage'),[['exploring',t('Explorando','Exploring')],['building',t('Desenvolvendo','Building')],['operating',t('Já operando agentes','Operating agents')]]],
    ['pain',t('Principal dificuldade','Main difficulty'),[['deployment',t('Implantação','Deployment')],['versions',t('Versões','Versions')],['errors',t('Falhas e histórico','Failures and history')],['permissions',t('Permissões','Permissions')],['costs',t('Custos','Costs')],['other',t('Outra','Other')]]],
    ['volume',t('Execuções estimadas por mês','Estimated runs per month'),[['up_to_100',t('Até 100','Up to 100')],['101_1000','101–1,000'],['1001_10000','1,001–10,000'],['over_10000',t('Mais de 10.000','Over 10,000')],['unknown',t('Não sei','Not sure')]]],
    ['pilot',t('Interesse em participar','Interest in participating'),[['not_now',t('Não agora','Not now')],['conversation',t('Quero conversar','I would like to talk')],['controlled_pilot',t('Piloto controlado','Controlled pilot')]]]
  ];
  const selects=questions.map(([name,label,options])=>`<label for="capture-${name}">${label}</label><select name="${name}" id="capture-${name}"><option value="">${t('Prefiro não responder','Prefer not to answer')}</option>${options.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select>`).join('');
  form.innerHTML=`<label for="capture-email"><i class="fa-solid fa-ticket" aria-hidden="true"></i> <span>${t('Seu e-mail profissional','Your work email')}</span></label><input id="capture-email" name="email" type="email" maxlength="254" autocomplete="email" dir="ltr" required placeholder="you@company.com"><details class="capture-questions"><summary>${t('Ajude a orientar o produto (opcional)','Help shape the product (optional)')}</summary>${selects}</details><p class="caption" data-capture-privacy></p><label class="consent"><input name="consent" type="checkbox" required><span>${t('Quero receber novidades e convites para pilotos da Unitize neste e-mail.','I would like to receive Unitize updates and pilot invitations at this email.')}</span></label><div data-capture-challenge></div><button type="submit" class="button button-primary"><span>${t('Entrar na lista','Join the waitlist')}</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button><p class="caption">${t('Inscrição gratuita. Não cria conta nem garante acesso ou data.','Free registration. It does not create an account or guarantee access or a date.')}</p><p class="form-status" role="status" aria-live="polite"></p>`;
  const privacy=form.querySelector('[data-capture-privacy]');
  privacy.append(document.createTextNode(t(`Responsável: ${remote.controller_name}. Guardamos e-mail, respostas opcionais e registro da autorização por até ${remote.retention_days} dias para organizar os convites. Solicite exclusão ou descadastro em `,`Controller: ${remote.controller_name}. We retain your email, optional answers and authorization record for up to ${remote.retention_days} days to organize invitations. Request deletion or unsubscribe at `)));
  const contact=document.createElement('a');contact.href='mailto:'+encodeURIComponent(remote.privacy_contact);contact.textContent=remote.privacy_contact;privacy.append(contact);
  privacy.append(document.createTextNode(t('. Hospedagem e proteção contra abuso: Cloudflare, com processamento que pode ocorrer fora do Brasil. Os registros vencem após esse prazo e a limpeza automática roda diariamente. A verificação antibot carrega ao enviar. Não ativamos publicidade ou rastreamento de navegação neste formulário.','. Hosting and abuse protection: Cloudflare, with processing that may occur outside your country. Records expire after this period and automatic cleanup runs daily. Anti-bot verification loads on submission. This form does not enable advertising or browsing trackers.')));
  placeholder.replaceWith(form);
  const invitation=document.querySelector('.waitlist-copy > p:not(.eyebrow)');if(invitation){invitation.classList.add('capture-managed');invitation.textContent=t('Cadastre seu e-mail para receber novidades e convites para pilotos controlados. Se quiser, conte quais desafios sua equipe enfrenta.','Register your email for updates and invitations to controlled pilots. If you wish, tell us about your team’s challenges.');}
  const oldNotice=document.querySelector('.privacy');if(oldNotice){oldNotice.classList.add('capture-managed');const p=oldNotice.querySelector('p');if(p)p.textContent=t('O cadastro da lista de espera é separado do login da plataforma. Os dados são armazenados de forma privada na Cloudflare. Não coletamos senhas, documentos ou prompts de clientes. A confirmação de recebimento não verifica a titularidade do e-mail.','Waitlist registration is separate from platform login. Data is stored privately on Cloudflare. We do not collect passwords, identity documents or client prompts. A receipt does not verify ownership of the email address.');}
  const status=form.querySelector('[role=status]'),button=form.querySelector('button[type=submit]');
  let token='',widgetId=null,challengePromise=null,sending=false,continueAfterChallenge=false;
  function notice(message,state='error'){status.textContent=message;status.dataset.state=state;}
  function unlock(){button.disabled=false;sending=false;}
  async function challenge(){
    if(!challengePromise)challengePromise=new Promise((resolve,reject)=>{
      if(window.turnstile){resolve();return;}
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;const timer=setTimeout(()=>reject(new Error('verification_timeout')),10000);script.onload=()=>{clearTimeout(timer);window.turnstile?resolve():reject(new Error());};script.onerror=()=>{clearTimeout(timer);reject(new Error());};document.head.append(script);
    }).catch(error=>{challengePromise=null;throw error;});
    await challengePromise;
    if(widgetId===null)widgetId=window.turnstile.render(form.querySelector('[data-capture-challenge]'),{sitekey:remote.turnstile_site_key,action:'waitlist',theme:'dark','response-field':false,callback:value=>{token=value;unlock();if(continueAfterChallenge){continueAfterChallenge=false;form.requestSubmit();}},'expired-callback':()=>{token='';continueAfterChallenge=false;unlock();},'timeout-callback':()=>{token='';continueAfterChallenge=false;unlock();notice(t('A verificação demorou. Tente novamente.','Verification timed out. Please try again.'));},'error-callback':()=>{token='';continueAfterChallenge=false;unlock();notice(t('Não foi possível concluir a verificação. Tente novamente.','Verification could not complete. Please try again.'));}});
    else window.turnstile.reset(widgetId);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||!form.reportValidity())return;
    if(!token){continueAfterChallenge=true;button.disabled=true;notice(t('Conclua a verificação para enviar sua inscrição.','Complete verification to submit your registration.'),'pending');try{await challenge();}catch{continueAfterChallenge=false;unlock();notice(t('Verificação indisponível. Tente novamente.','Verification is unavailable. Please try again.'));}return;}
    sending=true;button.disabled=true;notice(t('Salvando sua inscrição…','Saving your registration…'),'pending');
    const email=form.elements.email.value.trim();const questionnaire={};for(const [name] of questions){const value=form.elements[name].value;if(value)questionnaire[name]=value;}
    const body={email,consent:form.elements.consent.checked,locale:document.documentElement.lang,consent_version:remote.consent_version,privacy_version:remote.privacy_version,turnstile_token:token,questionnaire};
    try{
      const response=await fetch(new URL('/v1/waitlist',endpoint),{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
      const result=await response.json();if(!response.ok||result.status!=='received')throw new Error(result.error||'request_failed');
      notice(t('Inscrição recebida. Obrigado por acompanhar a Unitize!','Registration received. Thank you for following Unitize!'),'success');form.reset();
      document.dispatchEvent(new CustomEvent('unitize:waitlist-received',{detail:{email}}));
    }catch(error){
      const messages={rate_limited:t('Muitas tentativas. Aguarde um minuto e tente novamente.','Too many attempts. Wait a minute and try again.'),invalid_email:t('Informe um e-mail válido.','Enter a valid email address.'),notice_changed:t('O aviso foi atualizado. Recarregue a página antes de tentar novamente.','The notice has changed. Reload the page before trying again.'),verification_failed:t('A verificação expirou ou falhou. Tente novamente.','Verification expired or failed. Please try again.')};
      notice(messages[error.message]||t('Não foi possível confirmar a inscrição. Tente novamente.','Could not confirm registration. Please try again.'));
    }finally{token='';continueAfterChallenge=false;if(widgetId!==null)window.turnstile.reset(widgetId);unlock();}
  });
})();

/* END UNITIZE_PUBLIC_CAPTURE */
