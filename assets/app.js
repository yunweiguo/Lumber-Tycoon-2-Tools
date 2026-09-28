(function(){
  const data = window.LT2_DATA || {};
  const money = n => '$' + Math.round(Number(n || 0)).toLocaleString();
  const byId = id => document.getElementById(id);

  function initTrade(){
    const sides = ['you','them'];
    const selected = {you:{many:1, rukiry:1}, them:{'end-boxed':1}};
    const itemById = Object.fromEntries(data.marketItems.map(i => [i.id, i]));

    const renderSide = side => {
      const box = byId(side+'-items');
      box.innerHTML = '';
      Object.entries(selected[side]).forEach(([id, qty]) => {
        const item = itemById[id]; if (!item) return;
        const row = document.createElement('div'); row.className='trade-item';
        row.innerHTML = `<div><strong>${item.name}</strong><small>${item.variant} · ${money(item.min)}–${money(item.max)}</small></div>
          <input aria-label="Quantity" type="number" min="1" max="99" value="${qty}" data-qty="${id}">
          <button class="btn small" aria-label="Remove ${item.name}" data-remove="${id}">×</button>`;
        box.appendChild(row);
      });
      box.querySelectorAll('[data-qty]').forEach(input => input.addEventListener('input', e => {
        selected[side][e.target.dataset.qty] = Math.max(1, Number(e.target.value)||1); update();
      }));
      box.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', e => {
        delete selected[side][e.currentTarget.dataset.remove]; renderSide(side); update();
      }));
    };

    sides.forEach(side => {
      const select = byId(side+'-select');
      data.marketItems.forEach(item => {
        const o=document.createElement('option'); o.value=item.id; o.textContent=`${item.name} — ${item.variant}`; select.appendChild(o);
      });
      byId(side+'-add').addEventListener('click', () => {
        const id=select.value; selected[side][id]=(selected[side][id]||0)+1; renderSide(side); update();
      });
      renderSide(side);
    });

    function total(side){
      return Object.entries(selected[side]).reduce((acc,[id,qty]) => {
        const i=itemById[id]; if(i){acc.min+=i.min*qty; acc.max+=i.max*qty;} return acc;
      },{min:0,max:0});
    }
    function update(){
      const a=total('you'), b=total('them');
      byId('you-total').textContent=`${money(a.min)} – ${money(a.max)}`;
      byId('them-total').textContent=`${money(b.min)} – ${money(b.max)}`;
      const overlap = Math.max(a.min,b.min) <= Math.min(a.max,b.max);
      const amid=(a.min+a.max)/2, bmid=(b.min+b.max)/2;
      const ratio = amid+bmid ? (amid/(amid+bmid))*100 : 50;
      byId('balance-fill').style.width=Math.max(4,Math.min(96,ratio))+'%';
      const label=byId('trade-label');
      if(!a.max || !b.max){ label.textContent='Add items to both sides'; label.className='badge'; }
      else if(overlap){ label.textContent='Ranges overlap'; label.className='badge good'; }
      else { label.textContent='Ranges do not overlap'; label.className='badge warn'; }
    }
    update();
  }

  function initValues(){
    const search=byId('value-search'); const body=byId('values-body'); let current='woods';
    const render=()=>{
      const q=(search.value||'').toLowerCase(); let rows=[];
      if(current==='woods') rows=data.woods.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).map(x=>`<tr><td><strong>${x.name}</strong></td><td>${x.location}</td><td>${money(x.plank)}/unit</td><td>${x.log==null?'—':money(x.log)+'/unit'}</td><td>${x.note}</td></tr>`);
      if(current==='axes') rows=data.axes.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).map(x=>`<tr><td><strong>${x.name}</strong></td><td>${money(x.originalCost)}</td><td>${x.damage}</td><td>${x.cooldown}</td><td>${x.dps}</td></tr>`);
      if(current==='vehicles') rows=data.vehicles.filter(x=>JSON.stringify(x).toLowerCase().includes(q)).map(x=>`<tr><td><strong>${x.name}</strong></td><td>${money(x.price)}</td><td>${x.location}</td><td>${x.respawn==null?'—':money(x.respawn)}</td><td>${x.note}</td></tr>`);
      body.innerHTML=rows.join('') || '<tr><td colspan="5" class="muted">No matching entries.</td></tr>';
      const heads={woods:['Name','Location','Plank sell','Log sell','Type'],axes:['Name','Original cost','Damage','Cooldown','DPS'],vehicles:['Name','Price','Location','Respawn','Notes']}[current];
      byId('values-head').innerHTML=heads.map(h=>`<th>${h}</th>`).join('');
    };
    document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); current=btn.dataset.tab; render();
    }));
    search.addEventListener('input',render); render();
  }

  function initWood(){
    const select=byId('wood-select');
    [...data.woods].sort((a,b)=>b.plank-a.plank).forEach(w=>{const o=document.createElement('option');o.value=w.name;o.textContent=`${w.name} — ${money(w.plank)}/unit`;select.appendChild(o)});
    const calc=()=>{
      const w=data.woods.find(x=>x.name===select.value)||data.woods[0];
      const units=Math.max(0,Number(byId('wood-units').value)||0); const mins=Math.max(.1,Number(byId('trip-minutes').value)||1);
      const trip=w.plank*units; const hourly=trip*(60/mins);
      byId('wood-trip').textContent=money(trip); byId('wood-hour').textContent=money(hourly)+'/hr';
      byId('wood-context').textContent=`${w.name} · ${w.location} · ${money(w.plank)} per plank unit`;
    };
    [select,byId('wood-units'),byId('trip-minutes')].forEach(el=>el.addEventListener('input',calc)); select.value='Gold'; calc();
  }

  function initMap(){
    const select=byId('route-select');
    const routes={
      'lost-cave':{title:'Spawn → Lost Cave', nodes:['spawn','woodrus','taiga','lostcave'], lines:['r1','r2','r3'], req:['Vehicle recommended','Work Light recommended','Snow / Taiga side of the map'], text:'Use this as a route orientation aid, not an exact-scale navigation map.'},
      'volcano':{title:'Spawn → Volcano', nodes:['spawn','woodrus','bridge','volcano'], lines:['r1','r4','r5'], req:['Vehicle recommended','Axe suited to Volcano wood'], text:'Useful for planning Lava / Volcano wood runs.'},
      'swamp':{title:'Spawn → Swamp', nodes:['spawn','bridge','swamp'], lines:['r4','r6'], req:['Vehicle recommended','Expect longer hauling time'], text:'Gold and Zombie wood are associated with the swamp region.'},
      'lone-cave':{title:'Spawn → Lone Cave', nodes:['spawn','bridge','lonecave'], lines:['r4','r7'], req:['Special route / access knowledge','High-value Phantom wood'], text:'Phantom wood has a high in-game sell value per plank unit.'}
    };
    const render=()=>{
      document.querySelectorAll('.map-node,.route-line').forEach(x=>x.classList.remove('active'));
      const r=routes[select.value];
      r.nodes.forEach(id=>document.querySelector(`[data-node="${id}"]`)?.classList.add('active'));
      r.lines.forEach(id=>byId(id)?.classList.add('active'));
      byId('route-title').textContent=r.title; byId('route-copy').textContent=r.text;
      byId('route-req').innerHTML=r.req.map(x=>`<li>${x}</li>`).join('');
    };
    select.addEventListener('change',render); render();
  }

  if(byId('trade-app')) initTrade();
  if(byId('values-app')) initValues();
  if(byId('wood-app')) initWood();
  if(byId('map-app')) initMap();
})();
