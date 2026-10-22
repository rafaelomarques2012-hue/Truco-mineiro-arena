import { useMemo, useState } from "react";
import { Activity, Bot, ChevronRight, CircleHelp, Copy, Crown, Gamepad2, Gift, House, LogIn, MessageCircle, Shield, Swords, Users, WalletCards, Zap } from "lucide-react";
import { Card, cardPower, chooseBotCard, createDeck, deal, gameOver, handOfIron, isManilha, resolveTrick, shuffle, type Team, type TrickPlay, type RaiseValue, applyHandScore, canCallTruco, nextRaise } from "./game/engine";

type Tab = "Início" | "Treino offline" | "Online casual" | "Amigos" | "Suporte";
const faces: Record<string,string> = { "4♣":"Zap", "7♥":"Pica-fumo", "A♠":"Espadilha", "7♦":"Sete de Ouros" };
function CardFace({card, onClick, selected=false}: {card:Card;onClick?:()=>void;selected?:boolean}) {
  const red = card.suit === "♦" || card.suit === "♥";
  return <button className={`playing-card ${red?"red":""} ${selected?"selected":""}`} onClick={onClick} title={faces[card.id] ?? `${card.rank} ${card.suit}`}>
    <span className="card-corner">{card.rank}<br/>{card.suit}</span><span className="card-center">{card.suit}</span><span className="card-name">{faces[card.id] ?? card.rank}</span>
  </button>;
}
export default function App() {
  const [tab,setTab] = useState<Tab>("Início");
  const [mode,setMode] = useState<2|4>(2);
  const [hands,setHands] = useState<Card[][]>([]);
  const [myCards,setMyCards] = useState<Card[]>([]);
  const [plays,setPlays] = useState<TrickPlay[]>([]);
  const [tricks,setTricks] = useState<{winner:Team|null;tied:boolean}[]>([]);
  const [scores,setScores] = useState<[number,number]>([0,0]);
  const [turn,setTurn] = useState(0);
  const [handValue,setHandValue] = useState<RaiseValue>(1);
  const [notice,setNotice] = useState("Sua vez! Escolha uma carta.");
  const [chat,setChat] = useState("Boa sorte! 🍀");
  const [support,setSupport] = useState({name:"",email:"",kind:"Sugestão",message:""});
  const [submitted,setSubmitted] = useState(false);
  const [profileId] = useState(() => `#TRUCO-${Math.floor(1000+Math.random()*9000)}`);
  const winner = gameOver(scores);
  const handScore = useMemo(()=>handOfIron(scores),[scores]);

  function startGame(players:2|4=2) {
    const d = shuffle(createDeck());
    const dealt = deal(d,players);
    setMode(players); setHands(dealt); setMyCards(dealt[0]); setPlays([]); setTricks([]); setScores([0,0]); setTurn(0); setHandValue(1);
    setNotice(players===2?"Treino 1v1 iniciado. Você começa.":"Treino 2v2 iniciado. Você e seu bot contra dois bots.");
    setTab("Treino offline");
  }
  function playCard(card:Card) {
    if (!hands.length || turn!==0 || winner!==null) return;
    let nextHands = hands.map(h=>[...h]);
    nextHands[0] = nextHands[0].filter(c=>c.id!==card.id);
    let nextPlays:TrickPlay[] = [...plays,{player:0,team:0,card}];
    if (mode===2) {
      const botCard=chooseBotCard(nextHands[1]);
      nextHands[1]=nextHands[1].filter(c=>c.id!==botCard.id);
      nextPlays.push({player:1,team:1,card:botCard});
    } else {
      const bot1=chooseBotCard(nextHands[2]); nextHands[2]=nextHands[2].filter(c=>c.id!==bot1.id);
      nextPlays.push({player:2,team:1,card:bot1});
      const partner=chooseBotCard(nextHands[1],true); nextHands[1]=nextHands[1].filter(c=>c.id!==partner.id);
      nextPlays.push({player:1,team:0,card:partner});
      const bot2=chooseBotCard(nextHands[3]); nextHands[3]=nextHands[3].filter(c=>c.id!==bot2.id);
      nextPlays.push({player:3,team:1,card:bot2});
    }
    const result=resolveTrick(nextPlays);
    const nextTricks=[...tricks,result];
    setPlays(nextPlays); setHands(nextHands); setMyCards(nextHands[0]); setTricks(nextTricks);
    if (result.winner!==null) setNotice(`Vaza ${nextTricks.length}: ${result.winner===0?"Sua dupla":"Adversários"} venceu!`);
    else setNotice(`Vaza ${nextTricks.length}: empatada.`);
    const teamWins:Record<Team,number>={0:0,1:0};
    nextTricks.forEach(t=>{if(t.winner!==null)teamWins[t.winner]++});
    if(teamWins[0]>=2 || teamWins[1]>=2 || nextTricks.length===3) {
      const handWinner:Team|null=teamWins[0]>teamWins[1]?0:teamWins[1]>teamWins[0]?1:(nextTricks.find(t=>t.winner!==null)?.winner ?? null);
      if(handWinner!==null) {
        const newScores=applyHandScore(handWinner,handValue,scores);
        setScores(newScores);
        setNotice(`${handWinner===0?"Você ganhou a mão!":"Os bots ganharam a mão."} Placar ${newScores[0]} × ${newScores[1]}.`);
        if(gameOver(newScores)!==null) setNotice(`🏆 ${gameOver(newScores)===0?"Vitória!":"Os bots venceram."} Placar final ${newScores[0]} × ${newScores[1]}.`);
      }
      setHands([]); setMyCards([]);
    } else {
      // Simplified demo: a new hand starts automatically after a hand is decided.
      setTurn(0);
    }
  }
  const nav: {label:Tab;icon:any}[]=[{label:"Início",icon:House},{label:"Treino offline",icon:Bot},{label:"Online casual",icon:Gamepad2},{label:"Amigos",icon:Users},{label:"Suporte",icon:CircleHelp}];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Zap size={21}/></div><div><b>TRUCO<span>ARENA</span></b><small>MINAS GERAIS</small></div></div>
      <div className="section-label">MENU PRINCIPAL</div>
      <nav>{nav.map(({label,icon:Icon})=><button key={label} className={`nav-item ${tab===label?"active":""}`} onClick={()=>setTab(label)}><Icon size={18}/>{label}{label==="Online casual"&&<i className="online-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="mini-user"><div className="avatar">RM</div><div><b>Rival Mineiro</b><small>{profileId}</small></div><button title="Copiar ID" onClick={()=>{navigator.clipboard?.writeText(profileId);setNotice("ID copiado!")}}><Copy size={14}/></button></div><div className="safe-note"><Shield size={15}/><span>Ambiente de demonstração<br/><b>Sem dinheiro real</b></span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="crumb">ARENA /</span> <b>{tab.toUpperCase()}</b></div><div className="top-actions"><span className="live"><i/> DEMO AO VIVO</span><button className="icon-button" title="Mensagens"><MessageCircle size={18}/></button><div className="avatar">RM</div></div></header>
      {tab==="Início"&&<section className="content">
        <div className="welcome"><div className="welcome-copy"><span className="eyebrow"><span className="eyebrow-dot"/> A TRADIÇÃO ENCONTRA A COMPETIÇÃO</span><h1>Chega mais,<br/><em>jogador.</em></h1><p>Embaralhe as cartas, chame no truco e mostre quem manda na mesa.</p><div className="welcome-buttons"><button className="primary" onClick={()=>startGame(2)}><Swords size={17}/> Jogar agora <ChevronRight size={17}/></button><button className="secondary" onClick={()=>setTab("Online casual")}><Users size={17}/> Encontrar mesa</button></div><div className="trust-line"><span><i/> Treino grátis</span><span><i/> Regras mineiras</span><span><i/> Sem apostas reais</span></div></div><div className="hero-art"><div className="hero-glow"/><div className="hero-card c1"><div>4<br/>♦</div><strong>Zap</strong></div><div className="hero-card c2"><div>7<br/>♥</div><strong>Pica-fumo</strong></div><div className="hero-card c3"><div>A<br/>♠</div><strong>Espadilha</strong></div><div className="hero-chip">MANILHAS FIXAS <b>✦</b></div></div></div>
        <div className="section-heading"><div><span className="eyebrow">ESCOLHA SEU DESAFIO</span><h2>Uma mesa te espera</h2></div><span className="muted">01 — 03</span></div>
        <div className="mode-grid"><button className="mode-card" onClick={()=>startGame(2)}><div className="mode-icon purple"><Bot/></div><span className="mode-tag">PRA COMEÇAR</span><h3>Treino solo</h3><p>Aprenda as manilhas e treine sua estratégia contra o bot.</p><div className="mode-foot">1 contra 1 <ChevronRight size={16}/></div></button><button className="mode-card" onClick={()=>startGame(4)}><div className="mode-icon green"><Users/></div><span className="mode-tag">JOGO EM DUPLA</span><h3>Duplas contra bots</h3><p>Monte uma parceria e tente fechar a mão antes dos rivais.</p><div className="mode-foot">2 contra 2 <ChevronRight size={16}/></div></button><button className="mode-card" onClick={()=>setTab("Online casual")}><div className="mode-icon orange"><Gamepad2/></div><span className="mode-tag">MULTIPLAYER</span><h3>Online casual</h3><p>Explore o lobby e prepare-se para desafiar outros jogadores.</p><div className="mode-foot">Salas demonstrativas <ChevronRight size={16}/></div></button></div>
        <div className="bottom-grid"><div className="panel"><div className="panel-title"><div><h3>Salas populares</h3><p>Mesas abertas para jogar</p></div><button className="text-button" onClick={()=>setTab("Online casual")}>Ver todas <ChevronRight size={14}/></button></div>{[["Mesa do Zé","1v1","1/2","#A9875F"],["Truco sem dó","2v2","2/4","#628F76"],["Só os brabos","1v1","1/2","#9878BA"]].map(r=><div className="room-row" key={r[0]}><div className="room-emblem" style={{background:r[3]}}>♠</div><div className="room-name"><b>{r[0]}</b><small>{r[1]} · Casual</small></div><span className="room-count">{r[2]}</span><button className="join-button" onClick={()=>setTab("Online casual")}>Entrar</button></div>)}</div><div className="panel tip-panel"><div className="tip-icon"><Crown/></div><span className="eyebrow">DICA DO MESTRE</span><h3>Guarde o Zap<br/>para a hora certa.</h3><p>O 4 de Paus é a carta mais forte do Truco Mineiro. Use-o com estratégia — não precisa mostrar tudo na primeira vaza.</p><div className="tip-foot">ESTRATÉGIA #001 <span>✦</span></div></div></div>
      </section>}
      {tab==="Treino offline"&&<section className="content"><div className="section-heading"><div><span className="eyebrow">MODO PRÁTICA</span><h2>Mesa de Truco</h2><p className="muted">Partida local demonstrativa contra bots.</p></div><button className="secondary" onClick={()=>startGame(mode)}>Nova partida ↻</button></div><div className="game-layout"><div className="table-wrap"><div className="scoreboard"><div><small>SUA DUPLA</small><b>{scores[0]}</b></div><div className="score-divider">×</div><div><small>ADVERSÁRIOS</small><b>{scores[1]}</b></div></div><div className="felt-table"><div className="seat top-seat"><div className="avatar bot-avatar">🤠</div><div><b>{mode===2?"Bot Mineiro":"Bot Rival"}</b><small>{hands[mode===2?1:2]?.length ? "● Jogando" : "● Pronto"}</small></div><div className="card-back mini-back">✦</div></div><div className="table-center"><div className="table-badge">VAZA {Math.min(tricks.length+1,3)} / 3</div><div className="played-cards">{plays.length?plays.map((p,i)=><div className="played-card" key={`${p.card.id}-${i}`}><CardFace card={p.card}/><small>{p.team===0?"Sua dupla":"Rivais"}</small></div>):<div className="empty-table"><span>♠</span><b>A mesa é sua</b><small>Jogue sua primeira carta</small></div>}</div><div className="table-notice">{notice}</div></div><div className="seat bottom-seat"><div className="avatar">RM</div><div><b>Você</b><small>● Sua vez</small></div><div className="card-back mini-back">✦</div></div></div><div className="hand-area"><div className="hand-title"><b>SUA MÃO</b><span>{myCards.length} cartas restantes</span></div><div className="my-hand">{myCards.map(c=><CardFace key={c.id} card={c} onClick={()=>playCard(c)}/>)}</div><div className="game-actions"><button className="primary" onClick={()=>{if(!hands.length)startGame(mode);else setNotice("Selecione uma carta para jogar.")}}>{hands.length?"Escolha uma carta":"Nova mão"} <ChevronRight size={16}/></button><button className="raise-button" disabled={!canCallTruco(scores[0],scores[1])||!hands.length} onClick={()=>{const n=nextRaise(handValue);if(n){setHandValue(n);setNotice(`Pedido aceito na demonstração: mão vale ${n} pontos.`)}else setNotice("A mão já está no valor máximo.")}}>⚡ Pedir truco ({handValue===2?"4":handValue})</button></div><p className="fine-print">Modo de demonstração: regras de jogadas e pontuação em desenvolvimento. Não representa uma mesa multiplayer real.</p></div></div><div className="panel chat-panel"><div className="panel-title"><div><h3><MessageCircle size={16}/> Conversa da mesa</h3><p>Mensagens e emotes locais</p></div></div><div className="chat-bubble"><span className="chat-avatar">🤠</span><div><b>Bot Mineiro</b><p>{chat}</p></div></div><div className="emotes">{["😎","😂","🃏","🔥","🍀","🤠"].map(e=><button key={e} onClick={()=>setChat(`Você enviou ${e}`)}>{e}</button>)}</div></div></div></section>}
      {tab==="Online casual"&&<section className="content"><div className="section-heading"><div><span className="eyebrow">MULTIPLAYER</span><h2>Encontre sua mesa</h2><p className="muted">Lobby visual de demonstração — conexão multiplayer ainda não configurada.</p></div><button className="primary" onClick={()=>setNotice("A criação de salas online requer configurar o servidor Socket.IO.")}>＋ Criar sala</button></div><div className="notice-banner"><Activity size={18}/><div><b>Lobby demonstrativo</b><p>As salas abaixo são exemplos de interface. Para partidas reais, configure o backend Socket.IO e autenticação.</p></div></div><div className="mode-grid">{[["Truco de boa","1v1","1 / 2 jogadores","Casual"],["Dupla fechada","2v2","2 / 4 jogadores","Casual"],["Mesa da galera","2v2","3 / 4 jogadores","Amigos"],["Treino aberto","1v1","1 / 2 jogadores","Iniciante"]].map((r,i)=><div className="mode-card room-card" key={r[0]}><div className="room-top"><div className="mode-icon green"><Swords/></div><span className="room-status"><i/> Aberta</span></div><h3>{r[0]}</h3><p>{r[1]} · {r[3]}</p><div className="mode-foot">{r[2]}<button className="join-button" onClick={()=>setNotice("Sala de demonstração selecionada. Backend multiplayer ainda não conectado.")}>Entrar</button></div></div>)}</div><div className="panel"><h3>Regras da mesa</h3><p className="muted">Manilhas fixas · Melhor de 3 vazas · Partida até 12 pontos · Sem apostas reais.</p></div></section>}
      {tab==="Amigos"&&<section className="content"><div className="section-heading"><div><span className="eyebrow">JOGUE COM SUA TURMA</span><h2>Amigos</h2><p className="muted">Busque pelo ID único do jogador.</p></div></div><div className="panel friend-search"><label>ID do amigo</label><div className="search-line"><input placeholder="#TRUCO-4821"/><button className="primary" onClick={()=>setNotice("Busca de amigos disponível após conectar o backend.")}>Buscar ID</button></div></div><div className="panel"><div className="panel-title"><div><h3>Jogadores sugeridos</h3><p>Perfis fictícios de demonstração</p></div></div>{[["JP","João Pimenta","Online"],["MG","Marina Goiás","Em partida"],["BC","Bruno Campeão","Offline"]].map((f,i)=><div className="room-row" key={f[1]}><div className="avatar">{f[0]}</div><div className="room-name"><b>{f[1]}</b><small>#TRUCO-{4822+i}</small></div><span className={`friend-status ${f[2]==="Online"?"is-online":""}`}>{f[2]}</span><button className="join-button" onClick={()=>setNotice(`Convite para ${f[1]} é demonstrativo até configurar WebSockets.`)}>Convidar</button></div>)}</div></section>}
      {tab==="Suporte"&&<section className="content"><div className="section-heading"><div><span className="eyebrow">OUVIMOS VOCÊ</span><h2>Suporte e sugestões</h2><p className="muted">Ajude a melhorar a Arena.</p></div></div>{submitted?<div className="panel success-panel"><Gift size={30}/><h3>Mensagem registrada nesta demonstração!</h3><p>O armazenamento persistente será ativado quando o banco de dados for configurado.</p><button className="secondary" onClick={()=>setSubmitted(false)}>Enviar outra mensagem</button></div>:<form className="panel support-form" onSubmit={e=>{e.preventDefault();setSubmitted(true)}}><label>Seu nome<input required value={support.name} onChange={e=>setSupport({...support,name:e.target.value})} placeholder="Como podemos te chamar?"/></label><label>E-mail<input required type="email" value={support.email} onChange={e=>setSupport({...support,email:e.target.value})} placeholder="voce@email.com"/></label><label>Tipo de mensagem<select value={support.kind} onChange={e=>setSupport({...support,kind:e.target.value})}><option>Sugestão</option><option>Relatar bug</option><option>Outro</option></select></label><label>Mensagem<textarea required rows={5} value={support.message} onChange={e=>setSupport({...support,message:e.target.value})} placeholder="Conte pra gente..."/></label><button className="primary" type="submit">Enviar mensagem <ChevronRight size={16}/></button></form>}</section>}
      <footer><span>© 2026 Truco Arena · Projeto demonstrativo</span><span><Shield size={13}/> Jogo justo. Jogo seguro.</span></footer>
    </main>
    {notice && <div className="toast" role="status"><span>{notice}</span><button onClick={()=>setNotice("")}>×</button></div>}
  </div>;
}
