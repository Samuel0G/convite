const baseItems = [
  { emoji:'🍟', name:'Batata frita', description:'Crocante e perfeita para dividir', quantity:true },
  { emoji:'🥤', name:'Refrigerante', description:'Para brindar nosso momento', quantity:true },
  { emoji:'🍫', name:'Chocolate', description:'Um docinho para adoçar a noite', quantity:true },
  { emoji:'🍔', name:'Hambúrguer', description:'Caprichado, do jeitinho que você gosta', quantity:true },
  { emoji:'🎬', name:'Filme depois do jogo', description:'Você escolhe o filme', quantity:false },
  { emoji:'🧸', name:'Cobertor', description:'Para ficar bem juntinho', quantity:false },
  { emoji:'🤗', name:'Abraços', description:'Quantidade ilimitada', quantity:false },
  { emoji:'💋', name:'Beijinhos', description:'O melhor item do cardápio', quantity:false }
];
const themes={game:'🇧🇷 Noite de jogo',movie:'🎬 Cinema em casa',dinner:'🍝 Jantar a dois',picnic:'🧺 Piquenique',surprise:'✨ Surpresa romântica'};
const state={offered:new Set(['Batata frita','Refrigerante','Chocolate','Filme depois do jogo','Cobertor','Abraços','Beijinhos']),draft:{},current:null,order:{}};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const safe=text=>{const el=document.createElement('div');el.textContent=text;return el.innerHTML};

function tomorrow(){const d=new Date();d.setDate(d.getDate()+1);return d.toISOString().slice(0,10)}
$('#date').value=tomorrow();
function showView(name){$$('.view').forEach(v=>v.classList.remove('active'));$(`#${name}View`)?.classList.add('active');$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===name));document.body.classList.toggle('guest-mode',['received','success','declined'].includes(name));window.scrollTo({top:0,behavior:'smooth'});if(name==='history')renderHistory()}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));

function itemInfo(name){return baseItems.find(i=>i.name===name)||{emoji:'💛',name,description:'Um detalhe escolhido com carinho',quantity:true}}
function renderCreatorItems(){const extras=[...state.offered].filter(name=>!baseItems.some(i=>i.name===name)).map(name=>itemInfo(name));const all=[...baseItems,...extras];$('#itemsGrid').innerHTML=all.map(item=>`<button type="button" class="item-option ${state.offered.has(item.name)?'selected':''}" data-name="${safe(item.name)}"><span>${item.emoji}</span><strong>${safe(item.name)}</strong><small>${safe(item.description)}</small></button>`).join('');$('#selectedCount').textContent=state.offered.size;$$('.item-option').forEach(b=>b.onclick=()=>{state.offered.has(b.dataset.name)?state.offered.delete(b.dataset.name):state.offered.add(b.dataset.name);renderCreatorItems()})}
renderCreatorItems();
$('#toItems').onclick=()=>{if(!$('#inviteForm').reportValidity())return;state.draft={title:$('#title').value.trim(),message:$('#message').value.trim(),date:$('#date').value,time:$('#time').value,location:$('#location').value.trim(),theme:$('#theme').value};showView('items')};
$('#addCustom').onclick=()=>{const value=$('#customItem').value.trim();if(!value)return;state.offered.add(value);$('#customItem').value='';renderCreatorItems();toast('Opção adicionada ao cardápio 💛')};
$('#customItem').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#addCustom').click()}};

function invites(){try{return JSON.parse(localStorage.getItem('combinado-invites')||'[]')}catch{return[]}}
function saveInvites(list){localStorage.setItem('combinado-invites',JSON.stringify(list))}
function code(){return Math.random().toString(36).slice(2,8)}
function formatDate(date,time){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(new Date(`${date}T${time}`))+' · '+time}
function payload(invite){return btoa(unescape(encodeURIComponent(JSON.stringify(invite))))}
function fromPayload(value){try{return JSON.parse(decodeURIComponent(escape(atob(value))))}catch{return null}}
function inviteUrl(invite){const data=payload({...invite,status:'pending',responseItems:undefined,responseDate:undefined});if(location.protocol==='file:')return `${location.href.split('?')[0]}?convite=${invite.code}&dados=${encodeURIComponent(data)}`;return `${location.origin}/convite/${invite.code}?dados=${encodeURIComponent(data)}`}

$('#finishInvite').onclick=()=>{if(!state.offered.size){toast('Adicione pelo menos uma opção ao cardápio ✨');return}const invite={id:Date.now(),code:code(),...state.draft,items:[...state.offered],status:'pending',createdAt:new Date().toISOString()};const list=invites();list.unshift(invite);saveInvites(list);state.current=invite;$('#shareLink').value=inviteUrl(invite);showView('share')};
$('#copyLink').onclick=async()=>{try{await navigator.clipboard.writeText($('#shareLink').value);toast('Link copiado! Agora é só enviar 💌')}catch{$('#shareLink').select();document.execCommand('copy');toast('Link copiado! 💌')}};
$('#previewInvite').onclick=()=>{openInvite(state.current)};

function openInvite(invite){state.current=invite;state.order={};$('#receivedTitle').textContent=invite.title;$('#receivedDate').textContent=formatDate(invite.date,invite.time);$('#receivedLocation').textContent=invite.location;$('#confirmDate').textContent=formatDate(invite.date,invite.time);$('#confirmLocation').textContent=invite.location;$('#receivedTheme').textContent=themes[invite.theme]||'NOSSO MOMENTINHO';renderGuestMenu();showGuestStep(1);showView('received')}
function renderGuestMenu(){const items=state.current.items.map(itemInfo);$('#guestMenu').innerHTML=items.map(item=>{const qty=state.order[item.name]||0;return `<article class="guest-item ${qty?'selected':''}"><div class="guest-emoji">${item.emoji}</div><div class="guest-copy"><strong>${safe(item.name)}</strong><small>${safe(item.description)}</small></div>${qty?`<div class="stepper"><button data-action="minus" data-name="${safe(item.name)}">−</button><b>${qty}</b><button data-action="plus" data-name="${safe(item.name)}">+</button></div>`:`<button class="add-item" data-action="plus" data-name="${safe(item.name)}">Adicionar</button>`}</article>`}).join('');$$('[data-action]').forEach(b=>b.onclick=()=>{const name=b.dataset.name;const max=itemInfo(name).quantity?9:1;state.order[name]=Math.max(0,Math.min(max,(state.order[name]||0)+(b.dataset.action==='plus'?1:-1)));if(!state.order[name])delete state.order[name];renderGuestMenu();renderOrder()});renderOrder()}
function renderOrder(){const entries=Object.entries(state.order);$('#chosenCount').textContent=entries.reduce((sum,[,qty])=>sum+qty,0);$('#orderLines').innerHTML=entries.map(([name,qty])=>{const item=itemInfo(name);return `<span class="confirm-line"><i>${item.emoji}</i><strong>${safe(name)}</strong><b>${qty}x</b></span>`}).join('')}
function showGuestStep(step){$$('.guest-step').forEach(el=>el.classList.toggle('active',Number(el.dataset.step)===step));$('#stepLabel').textContent=`${step} / 3`;$('#progressFill').style.width=`${step/3*100}%`;window.scrollTo(0,0)}
$$('[data-next-step]').forEach(button=>button.onclick=()=>showGuestStep(Number(button.dataset.nextStep)));
$('#continueOrder').onclick=()=>{if(!Object.keys(state.order).length){toast('Escolha pelo menos uma coisinha 💛');return}showGuestStep(3)};
function updateStatus(status){if(!state.current)return;const list=invites();let item=list.find(i=>i.code===state.current.code);if(!item){item={...state.current};list.unshift(item)}item.status=status;item.responseItems=Object.entries(state.order).map(([name,quantity])=>({name,quantity}));item.responseDate=new Date().toISOString();saveInvites(list);state.current={...item}}
$('#acceptInvite').onclick=()=>{if(!Object.keys(state.order).length){toast('Escolha pelo menos uma coisinha do cardápio 💛');return}updateStatus('accepted');showView('success')};
$('#declineInvite').onclick=()=>{updateStatus('declined');showView('declined')};

function renderHistory(filter='all'){const list=invites().filter(i=>filter==='all'||i.status===filter);const labels={pending:'Pendente',accepted:'Aceito',declined:'Recusado'};$('#historyList').innerHTML=list.length?list.map(i=>{const chosen=i.responseItems?.length?`<div class="history-choice"><small>ESCOLHAS DA PESSOA</small><div>${i.responseItems.map(x=>`<span>${itemInfo(x.name).emoji} ${safe(x.name)} · ${x.quantity}x</span>`).join('')}</div>${i.responseDate?`<time>Respondido em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(i.responseDate))}</time>`:''}</div>`:'';return `<article class="history-item"><div class="history-main"><div class="history-emoji">${i.status==='accepted'?'💛':i.status==='declined'?'🌷':'💌'}</div><div class="history-copy"><h4>${safe(i.title)}</h4><small>${formatDate(i.date,i.time)} · ${safe(i.location)}</small></div><span class="status ${i.status}">${labels[i.status]}</span></div>${chosen}<div class="history-actions"><button data-copy-code="${i.code}">Copiar link</button></div></article>`}).join(''):'<div class="empty">Nenhum momentinho por aqui ainda.<br>Que tal criar o primeiro? 💛</div>';$$('[data-copy-code]').forEach(b=>b.onclick=async()=>{const invite=invites().find(i=>i.code===b.dataset.copyCode);await navigator.clipboard.writeText(inviteUrl(invite));toast('Link copiado 💌')})}
$$('[data-filter]').forEach(b=>b.onclick=()=>{$$('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderHistory(b.dataset.filter)});
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

function bootFromLink(){const query=new URLSearchParams(location.search);const match=location.pathname.match(/\/convite\/([a-z0-9]+)/i);const inviteCode=query.get('convite')||match?.[1];if(!inviteCode)return;let invite=invites().find(i=>i.code===inviteCode);if(!invite&&query.get('dados'))invite=fromPayload(query.get('dados'));if(invite)openInvite(invite)}
bootFromLink();
