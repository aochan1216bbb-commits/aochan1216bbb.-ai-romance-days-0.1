function renderSelect(){const g=$('characterGrid');if(!g)return;g.innerHTML='';Object.values(CHARACTERS).forEach(c=>{const saved=safeGet(stateKey(c.id),null);const card=document.createElement('button');card.type='button';card.className='charCard';card.dataset.characterId=c.id;card.setAttribute('aria-label',c.name+'を選択');card.innerHTML=`<img class="charThumb" src="assets/${c.id}/standing_01.webp?v=${APP_BUILD}" alt="${c.name}"><div class="charInfo"><strong>${c.name}</strong> <span class="small">${c.age}歳</span><div class="rel">${c.relationship}</div><div class="desc">${c.personality}<br>${c.height}cm / ${c.startWeight}kg</div>${saved?`<span class="continueMark">DAY ${saved.day||1} から続き</span>`:''}</div>`;const im=card.querySelector('img');if(im)im.addEventListener('error',e=>placeholder(e.currentTarget,c.name));card.onclick=function(e){e.preventDefault();startCharacter(c.id)};g.appendChild(card)});const gs=globalSettings();if($('globalApiKey'))$('globalApiKey').value=gs.apiKey||'';if($('globalModel'))$('globalModel').value=normalizeModel(gs.model);setApiStatus(gs.apiKey?`API設定あり：${normalizeModel(gs.model)}（接続未確認）`:'API接続：未確認','neutral')}
function startCharacter(id){try{if(!CHARACTERS[id])throw new Error('character not found: '+id);activeId=id;state=loadState(id);if(!state.history.length){const c=CHARACTERS[id];state.history.push({role:'narration',content:firstScene(c),meta:'☀ 朝 / DAY 1'});state.history.push({role:'assistant',content:firstGreeting(c),meta:'☀ 朝 / DAY 1'});save()}$('selectScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');render();
 if(id==='erika'&&!blockingEventType())setTimeout(()=>maybeErikaDaypartEvent(),0);
 if(id==='emi'&&!blockingEventType())setTimeout(()=>{addBubble('system','絵美には専用システムがあります：まかない依存度・競技コンディション・後輩との関係・大会結果・ライバル美咲。ステータス表示から確認できます。','絵美専用システム');maybeEmiSystemTurnEvent();},0);
if(id==='yui'&&state.forceYuiWeightEventMigration){
  state.forceYuiWeightEventMigration=false;
  const st=evolutionStage();
  save();
  if(st>=1&&!state.pendingWeightEvent)queueWeightEventIfNeeded(CHARACTERS[id],st-1);
}}catch(err){console.error(err);const st=$('runtimeStatus');if(st){st.textContent='キャラ選択エラー: '+err.message;st.style.background='#f8d7da';st.style.color='#842029'}alert('キャラクターを開始できませんでした: '+err.message)}}
function firstScene(c){
 if(c.id==='risa')return'朝の教室。梨沙は茶色のポニーテールを揺らしながら、いつものように明るい表情でこちらへ近づいてきた。';
 if(c.id==='emi')return'朝の大学キャンパス。講義前、絵美は大学陸上部の練習道具を肩にかけながら、少し忙しそうにこちらを見る。';
 if(c.id==='yui')return'朝の静かな時間。結衣は柔らかい表情でこちらに気づき、軽く会釈した。';
 if(c.id==='erika')return'朝の大学キャンパス。講義前の教室で、絵里香は姿勢よく座ったまま、こちらの気配に気づいてわずかに視線だけを向けた。';
 return'朝の教室。怜は窓際で静かに過ごしていたが、こちらに気づくとじっと観察するように目を向けた。';
}
function firstGreeting(c){if(c.id==='risa')return'おはよ。今日も一緒だね。なんか話す？';if(c.id==='emi')return'おはよ。どうしたの？ このあと講義も練習もあるけど、少しくらいなら話せるよ。';if(c.id==='yui')return'おはよう。こんな時間から会うと、ちょっと不思議な感じだね。';if(c.id==='erika')return'……朝から何ですの？ 用があるなら手短にしてくださいませ。';return'……おはよう。今日は、何の話する？'}
function currentExerciseText(c){
 if(c.id==='emi'&&evolutionStage()>=5)return '以前は頻繁 / 現在はかなり少ない';
 return c.exercise;
}
function currentBodyViewText(c){
 if(c.id==='emi'&&evolutionStage()>=5)return '大学陸上部を退部し、走れていた頃の自分と今の自分の差を強く意識している。';
 if(c.id==='emi'&&evolutionStage()>=3)return 'タイムや動きの変化から、体型増加が競技に影響しているのではと焦り始めている。';
 return c.bodyView;
}
function currentFeaturesText(c){
 if(c.id==='emi'&&evolutionStage()>=5)return '20歳の大学生。主人公とは大学の同級生。かつては大学陸上部のエースだったが、大会での挫折をきっかけに退部。走れていた頃の自分との落差を抱えている。';
 if(c.id==='emi')return c.features+' ライバルの美咲、まかない依存度、競技コンディション、後輩との関係、大会結果システムが進行に応じて変動する。';
 return c.features;
}

function syncChoiceModalState(){
 const ids=['weightEventModal','dateEventPanel','initiativeChoicePanel','routineChoicePanel','nightChoicePanel','restraintEventPanel'];
 let any=false;
 ids.forEach(id=>{
   const el=$(id);if(!el)return;
   const open=!el.classList.contains('hidden');
   el.setAttribute('aria-hidden',open?'false':'true');
   if(open)any=true;
 });
 document.body.classList.toggle('choiceOpen',any);
}

function render(){if(!activeId||!state)return;trackRelationshipStage();const c=CHARACTERS[activeId];$('day').textContent=state.day;$('turnLabel').textContent=turns[state.turn].label;$('affection').textContent=Math.round(state.affection);$('mood').textContent=Math.round(state.mood);$('fullness').textContent=Math.round(state.fullness);$('restraint').textContent=Math.round(state.restraint);$('weight').textContent=state.weight.toFixed(1);$('money').textContent=Math.round(state.money??2500).toLocaleString();$('weightBadge').textContent=state.weight.toFixed(1);$('height').textContent=c.height;$('charName').textContent=c.name;$('headerRelationship').textContent=`${c.relationship} / ${relationshipLabel()}`;const bt=bodyType();$('bodyType').textContent=bt;$('bodyTypeTop').textContent=bt;$('profileMini').textContent=`${c.age}歳｜関係:${relationshipLabel()}｜${c.speech}｜主人公バイト${state.workCount||0}回${c.id==='emi'?`｜まかない依存${Math.round(state.emiMessDependence||0)}/100｜競技コンディション${Math.round(refreshEmiCondition()||0)}/100`:''}`;const eb=$('emotionBadge');if(eb)eb.textContent=emotionLabel(state.lastEmotion||'normal');const img=$('characterImage');img.dataset.fallback='';img.dataset.stageFallback='0';img.onload=()=>{img.style.visibility='visible'};img.onerror=()=>{if(img.dataset.stageFallback==='0'){img.dataset.stageFallback='1';img.src=`assets/${c.id}/standing_01.webp?v=${APP_BUILD}`}else{placeholder(img,c.name)}};img.style.visibility='visible';img.src=imagePath(c);const chat=$('chat');chat.innerHTML='';state.history.forEach(m=>{if(m.role==='narration')addNarration(m.content,m.meta,false);else if(m.role==='cg')addCGMessage(m.title,m.path,m.meta,false);else addBubble(m.role,m.content,m.meta,false)});chat.scrollTop=chat.scrollHeight;$('gameLog').innerHTML=state.gameLog.slice().reverse().map(x=>`<div>• ${escapeHtml(x)}</div>`).join('')||'<div>まだログはありません。</div>';$('profileDetail').innerHTML=`<b>性格</b><br>${escapeHtml(c.personality)}<br><br><b>食欲 / 太りやすさ / 運動</b><br>${escapeHtml(c.appetite)} / ${escapeHtml(c.gainTendency)} / ${escapeHtml(currentExerciseText(c))}<br><br><b>体型・体重への考え</b><br>${escapeHtml(currentBodyViewText(c))}<br><br><b>好きな食べ物</b><br>${escapeHtml(state.favoriteFoods.length?state.favoriteFoods.join('、'):'特になし')}<br><br><b>その他</b><br>${escapeHtml(currentFeaturesText(c))}${c.id==='emi'?`<br><br><b>絵美専用システム</b><br>まかない依存度 ${Math.round(state.emiMessDependence||0)}/100<br>競技コンディション ${Math.round(refreshEmiCondition()||0)}/100<br>後輩との関係 ${Math.round(state.emiJuniorBond||0)}/100<br>陸上継続 ${state.emiTrackActive!==false?'継続中':'退部済み'}<br>ダイエット ${state.emiDietMode?`進行中（残り${state.emiDietDaysLeft}日）`:(state.emiDietLastResult==='success'?'直近成功':state.emiDietLastResult==='failure'?'直近失敗':'未実施 / 終了')}<br>怪我 ${state.emiInjuryDaysLeft>0?`回復まで${state.emiInjuryDaysLeft}日`:'なし'}<br>ライバル美咲 ${state.misakiWeight.toFixed(1)}kg / 体型Lv.${misakiBodyLv()} / コンディション ${Math.round(state.misakiCondition||0)}/100<br>居酒屋バイト 週3〜4回のランダムシフト（夜のみ）`:''}`;renderDateEvent();renderWeightEvent();renderInitiativeChoices();renderRestraintEvent();renderRoutineChoices();renderNightChoice();renderCGGallery();renderHookDebugPanel();syncEventLockUI();syncChoiceModalState();}

function normalizeEmotion(v){
 const x=String(v||'normal').toLowerCase();
 const map={normal:'normal',happy:'happy',smile:'happy',embarrassed:'embarrassed',shy:'embarrassed',angry:'angry',mad:'angry',troubled:'troubled',sad:'troubled',surprised:'surprised'};
 return map[x]||'normal';
}
function normalizeAIResult(raw){
 if(!raw)return {narration:'',dialogue:'……。',emotion:'normal'};
 if(typeof raw==='object'){
   return {narration:String(raw.narration||''),dialogue:String(raw.dialogue||raw.content||'……。'),emotion:normalizeEmotion(raw.emotion)};
 }
 let txt=String(raw).trim();
 try{
   const parsed=JSON.parse(txt);
   if(parsed&&typeof parsed==='object')return {narration:String(parsed.narration||''),dialogue:String(parsed.dialogue||'……。'),emotion:normalizeEmotion(parsed.emotion)};
 }catch(e){}
 const fenced=txt.match(/```(?:json)?\s*([\s\S]*?)```/i);
 if(fenced){
   try{
     const parsed=JSON.parse(fenced[1]);
     if(parsed&&typeof parsed==='object')return {narration:String(parsed.narration||''),dialogue:String(parsed.dialogue||'……。'),emotion:normalizeEmotion(parsed.emotion)};
   }catch(e){}
 }
 return {narration:'',dialogue:txt||'……。',emotion:'normal'};
}
function emotionLabel(e){return {normal:'通常',happy:'笑顔',embarrassed:'照れ',angry:'怒り',troubled:'困惑',surprised:'驚き'}[e]||'通常'}
function emotionImagePath(c,e){
 // 表情差分を追加した場合は assets/<id>/standing_XX_<emotion>.webp を自動利用。
 return `assets/${c.id}/standing_${String(imageStage()).padStart(2,'0')}_${e}.webp?v=${APP_BUILD}`;
}
function applyEmotion(e){
 if(!state||!activeId)return;
 e=normalizeEmotion(e);state.lastEmotion=e;
 const badge=$('emotionBadge');if(badge)badge.textContent=emotionLabel(e);
 const img=$('characterImage'),c=CHARACTERS[activeId];if(!img)return;
 if(e==='normal'){img.src=imagePath(c);return}
 img.dataset.emotionFallback='0';
 img.onerror=()=>{
   if(img.dataset.emotionFallback==='0'){
     img.dataset.emotionFallback='1';
     img.onerror=()=>{placeholder(img,c.name)};
     img.src=imagePath(c);
   }else placeholder(img,c.name);
 };
 img.src=emotionImagePath(c,e);
}

function addNarration(text,meta='',persist=true){
 if(!text)return;
 const div=document.createElement('div');div.className='narration';div.textContent=text;
 if(meta){const m=document.createElement('div');m.className='meta';m.textContent=meta;div.appendChild(m)}
 $('chat').appendChild(div);$('chat').scrollTop=$('chat').scrollHeight;
 if(persist){state.history.push({role:'narration',content:text,meta});if(state.history.length>80)state.history=state.history.slice(-80);save()}
}
function addAIResponse(result,meta=''){
 const r=normalizeAIResult(result);
 if(r.narration)addNarration(r.narration,meta);
 addBubble('assistant',r.dialogue,meta);
 applyEmotion(r.emotion);
}
function addBubble(role,content,meta='',persist=true){if(content&&typeof content==='object'){const safe=normalizeAIResult(content);content=safe.dialogue||JSON.stringify(content)}const div=document.createElement('div');const cls=role==='assistant'?'ai':role==='user'?'you':role==='misaki'?'misaki':'system';div.className='msg '+cls;div.textContent=String(content??'');if(meta){const m=document.createElement('div');m.className='meta';m.textContent=meta;div.appendChild(m)}$('chat').appendChild(div);$('chat').scrollTop=$('chat').scrollHeight;if(persist){state.history.push({role,content,meta});if(state.history.length>80)state.history=state.history.slice(-80);save()}}
function log(text){state.gameLog.push(`DAY ${state.day} ${turns[state.turn].label}: ${text}`);if(state.gameLog.length>120)state.gameLog=state.gameLog.slice(-120);save()}
function cnameSafe(){return activeId&&CHARACTERS[activeId]?CHARACTERS[activeId].name:'相手'}
function currentTurnKey(){return `${state.day}:${state.turn}`}
function markErikaAttention(reason='interaction'){
 if(activeId!=='erika'||!state)return;
 state.lastErikaAttentionTurnKey=currentTurnKey();
 state.lastErikaAttentionDay=state.day;
 state.erikaNeglectTurns=0;
}
function applyErikaNeglectTick(){
 if(activeId!=='erika'||!state)return 0;
 updateGrowthTraits(CHARACTERS[activeId]);
 const dep=state.growthTraits?.dependence||0;
 if(dep<25){state.erikaNeglectTurns=0;return 0}
 if(state.lastErikaAttentionTurnKey===currentTurnKey()){state.erikaNeglectTurns=0;return 0}
 state.erikaNeglectTurns=(state.erikaNeglectTurns||0)+1;
 let loss=dep>=75?2:dep>=55?1:(dep>=35&&state.erikaNeglectTurns>=2)?1:(dep>=25&&state.erikaNeglectTurns>=3)?1:0;
 if(loss){state.mood=clamp(state.mood-loss);log(`絵里香は構ってもらえず機嫌 -${loss}（依存度${dep}/100・放置感${state.erikaNeglectTurns}）`)}
 return -loss;
}
function evaluateErikaJealousy(text){
 if(activeId!=='erika'||!state||!text)return null;
 updateGrowthTraits(CHARACTERS[activeId]);
 const dep=state.growthTraits?.dependence||0;
 if(dep<25)return null;
 const mentionsGirl=/(他の女|ほかの女|別の女|女子|女の子|梨沙|絵美|結衣|怜|可愛い子|かわいい子)/.test(text);
 const romantic=/(デート|遊んだ|二人で|可愛い|かわいい|好き|気になる|会って|一緒にいた)/.test(text);
 if(!mentionsGirl)return null;
 let moodLoss=dep>=90?6:dep>=75?4:dep>=55?3:dep>=35?2:1;
 let affectionLoss=0;
 if(romantic&&dep>=60)affectionLoss=dep>=85?2:1;
 state.mood=clamp(state.mood-moodLoss);
 if(affectionLoss)state.affection=clamp(state.affection-affectionLoss);
 state.erikaJealousyCount=(state.erikaJealousyCount||0)+1;
 state.lastErikaJealousyDay=state.day;
 const level=dep>=90?'かなり強い嫉妬':dep>=70?'強い嫉妬':dep>=45?'明確な嫉妬':'少し気になる';
 log(`絵里香の嫉妬: ${level} / 機嫌-${moodLoss}${affectionLoss?` / 好感度-${affectionLoss}`:''}`);
 return {dep,moodLoss,affectionLoss,level,romantic};
}
function erikaRequestConflict(kind='お願い',accepted=true){
 if(activeId!=='erika'||!state)return '';
 updateGrowthTraits(CHARACTERS[activeId]);
 const dep=state.growthTraits?.dependence||0,anx=state.growthTraits?.weightAnxiety||0;
 if(dep<40)return '';
 if(accepted){
  return `絵里香専用心理: 依存度${dep}/100、体型への焦り${anx}/100。本来は${kind}を断ったり控えたりしたい気持ちがあっても、主人公から頼まれると断りづらい。「あなたがそこまで言うなら」「今回だけですわ」など、主人公だから受け入れたニュアンスを自然に出してよい。ただし毎回同じ台詞にしない。`;
 }
 return `絵里香専用心理: 依存度${dep}/100。今回は断ったが、主人公のお願いを断ったこと自体を少し気にしている。高依存ほど「嫌われないか」が一瞬よぎってもよい。`;
}
function foodOfferAlreadyUsed(){return false}
function markFoodOfferUsed(){}

function initiatedEventChance(){
 const base=[12,16,21,27,34,40,45][relationshipIndex()]||15;
 let bonus=0;
 const c=CHARACTERS[activeId];updateGrowthTraits(c);const g=state.growthTraits||{};
 if(c.id==='yui'&&(g.oilyPreference||0)>=45)bonus+=4;
 if(c.id==='rei'&&(state.weightInterest||0)>=35)bonus+=8;
 if(c.id==='erika'&&relationshipIndex()>=3){bonus+=6;const dep=state.growthTraits?.dependence||0;bonus+=Math.round(dep*.10);if((state.erikaNeglectTurns||0)>=1)bonus+=6;}
 if((c.id==='risa'&&(g.bodyConcern||0)>=35)||(c.id==='emi'&&(g.weightAlarm||0)>=35))bonus+=5;
 let chance=base+bonus;
 // 結衣は年齢差・食嗜好など専用イベント候補が多いため、他キャラより発生頻度を抑える。
 if(c.id==='yui')chance*=0.62;
 if(c.id==='emi')chance*=0.42;
 return clamp(chance,c.id==='yui'?7:(c.id==='emi'?4:8),c.id==='yui'?32:(c.id==='emi'?22:55));
}
function chooseInitiatedEvent(){
 const c=CHARACTERS[activeId];updateGrowthTraits(c);const g=state.growthTraits||{},stage=relationshipStage(),fav=(state.favoriteFoods||[])[0]||'好きなもの';
 const candidates=[];
 const canSelfFood=!state.lastFoodWasRefused&&state.fullness<72;
 if(canSelfFood&&c.id==='yui'&&(g.oilyPreference||0)>=55)candidates.push({
   type:'self_food',foodKey:'fried',
   situation:`${c.name}は油物嗜好が${g.oilyPreference||0}/100まで高まり、自分から揚げ物を食べたいと思っている。`,
   goal:'自分から「何か揚げ物を食べたい」と主人公へ提案する。まだ食べたことは確定しない。'
 });
 if(canSelfFood&&c.id==='rei'&&(state.weightInterest||0)>=55)candidates.push({
   type:'self_food',foodKey:(state.favoriteFoods||[]).length?'favorite':'dessert',
   situation:`${c.name}は体重増加への興味が${state.weightInterest||0}/100まで高まり、食べることへの抵抗が以前より薄い。`,
   goal:'自分から何か食べに行くことを提案する。まだ食べたことは確定しない。'
 });
 if(canSelfFood&&c.id==='erika'&&relationshipIndex()>=4&&(state.favoriteFoods||[]).length)candidates.push({
   type:'self_food',foodKey:'favorite',
   situation:`${c.name}は主人公との経験で増えた好物を思い出し、珍しく自分から誘いたくなっている。`,
   goal:'ツンを残しながら、好物を食べに行くことを自分から提案する。まだ食べたことは確定しない。'
 });
 if(c.id==='yui'&&!state.isLover&&relationshipIndex()>=1){
   const ageGapEvent={
    type:'age_gap',
    situation:`${c.name}は主人公よりかなり年上であることを改めて意識している。好感度が高いほど惹かれている一方、「自分が相手でいいのか」「若い主人公の将来を邪魔しないか」という迷いも強い。`,
    goal:'年齢差そのものを自然に話題にし、主人公の気持ちを確かめるような問いかけをする。説教調にせず、結衣らしい柔らかさと少しの自虐を残す。'
   };
   candidates.push(ageGapEvent);
 }
 if(c.id==='yui'&&(g.oilyPreference||0)>=35)candidates.push({
   type:'craving',
   situation:`${c.name}は最近、以前より油物を好むようになっている。今日は自分から食べ物の話題を出したくなった。`,
   goal:'揚げ物やこってりした食べ物を少し気にしている様子で、自分から話題を出す。ただし勝手に食事を開始・購入しない。'
 });
 if(c.id==='rei'&&(state.weightInterest||0)>=25)candidates.push({
   type:'weight_curiosity',
   situation:`${c.name}は最近の体重・体型変化そのものへの興味が${state.weightInterest||0}/100まで高まっている。`,
   goal:'自分の最近の変化について、淡々と主人公へ話題を振る。体重測定や食事を勝手に実行しない。'
 });
 if(c.id==='erika'&&relationshipIndex()>=3)candidates.push({
   type:'attention',
   situation:`${c.name}は主人公への好意と依存傾向が以前より高まっている。現在の関係段階は「${stage.label}」。依存度は${g.dependence||0}/100。`,
   goal:'ツンデレらしさを残しつつ、自分から主人公の予定や反応を気にして話しかける。'
 });
 if(c.id==='erika'&&(g.dependence||0)>=35)candidates.push({type:'whereabouts',situation:`${c.name}は主人公が今日どこで何をしていたのか妙に気になっている。依存度は${g.dependence||0}/100。`,goal:'強がりながら主人公の予定・誰といたのか・次に何をするのかを聞く。'});
 if(c.id==='erika'&&(g.dependence||0)>=55)candidates.push({type:'reassurance',situation:`${c.name}は最近、自分が主人公に嫌われていないかを必要以上に気にしている。体型への焦りは${g.weightAnxiety||0}/100。`,goal:'自分に飽きていないか・嫌になっていないかを遠回しに確かめる。体型変化があれば不安の理由に少し混ぜてもよい。'});
 if(c.id==='erika'&&(g.dependence||0)>=60&&(state.erikaNeglectTurns||0)>=1)candidates.push({type:'neglect',situation:`${c.name}は主人公に構ってもらえていないと感じている。放置感は${state.erikaNeglectTurns||0}、依存度は${g.dependence||0}/100。`,goal:'寂しいとは素直に言わず、不機嫌さと寂しさをツンデレらしく出す。'});
 if(c.id==='erika'&&stageNum()>=3&&(g.dependence||0)>=45)candidates.push({
   type:'body_reassurance',
   situation:`${c.name}は体型Lv.${stageNum()}まで変化し、以前より自分の見た目を気にしている。依存度${g.dependence||0}/100、体型への焦り${g.weightAnxiety||0}/100。`,
   goal:'太った自分を主人公がどう見ているのか気になるが、露骨に「可愛いと言って」とは言わず、遠回しに嫌われていないか確かめる。'
 });
 if(c.id==='erika'&&stageNum()>=4&&(g.dependence||0)>=60)candidates.push({
   type:'comparison',
   situation:`${c.name}は最近、自分の体型変化と周囲の女子を無意識に比べてしまっている。依存度${g.dependence||0}/100。`,
   goal:'他の女子と自分を比べて主人公の好みを気にする。嫉妬を露骨な悪口にはせず、強がりの裏に不安を出す。'
 });
 if(c.id==='erika'&&stageNum()>=6&&(g.dependence||0)>=75)candidates.push({
   type:'cling_body',
   situation:`${c.name}は体型Lv.${stageNum()}となり、以前との違いを強く自覚している。それでも主人公が自分を構ってくれるかが気になって仕方ない。依存度${g.dependence||0}/100。`,
   goal:'「今のわたくしでも変わらず相手をしてくださる？」という不安を、プライドを保ちながら遠回しに確かめる。'
 });
 if(c.id==='risa'&&(g.bodyConcern||0)>=30)candidates.push({
   type:'body_concern',
   situation:`${c.name}は最近の体型変化を以前より意識している。開始時から${weightGainAmount().toFixed(1)}kg変化している。`,
   goal:'服の着心地や最近の食生活などを自然に話題にする。主人公に答えを強要しない。'
 });
 if(c.id==='emi'&&(g.weightAlarm||0)>=30)candidates.push({
   type:'training',
   situation:`${c.name}は最近の体重変化や運動への影響を気にしている。`,
   goal:'大学陸上部の練習・競技・身体の動きについて自分から話題を出す。ぶっきらぼうさを維持する。'
 });
 if((state.favoriteFoods||[]).length)candidates.push({
   type:'favorite',
   situation:`${c.name}には現在「${fav}」という好物がある。`,
   goal:`「${fav}」を思い出したり話題にしたりする。ただし食べることは確定させない。`
 });
 const period=turns[state.turn].label;
 candidates.push({
   type:'daily',
   situation:`DAY ${state.day}の${period}。${c.name}から主人公へ自然に話しかけるタイミング。現在の関係段階は「${stage.label}」。${c.id==='emi'?'絵美は20歳の大学生で、大学陸上部所属。':''}`,
   goal:period.includes('朝')?'今日の予定、昨日のこと、最近気になっていることのどれかを自然に話題にする。':period.includes('昼')?(c.id==='emi'?'昼の出来事や食事、大学の講義・空きコマ・大学陸上部・アルバイトについて自然に話題にする。':'昼の出来事や食事、学校・仕事・活動について自然に話題にする。'):'今日あったことや主人公との最近の出来事を自然に話題にする。'
 });
 return candidates[Math.floor(Math.random()*candidates.length)];
}


function restraintEventChance(style){
 const c=CHARACTERS[activeId],ri=relationshipIndex();
 let chance=42 + state.affection*.22 + (state.mood-50)*.18 - Math.max(0,state.restraint-45)*.42 + ri*4;
 if(style==='gentle')chance+=12;
 if(style==='empathy')chance+=6;
 if(style==='push')chance-=10;
 if(c.id==='erika'){
   const lv=stageNum();
   if(state.restraint>=65)chance-=Math.max(0,10-(lv-1)*2);
   chance+=(lv-1)*4;
 }
 if(c.id==='yui')chance+=5;
 if(c.id==='rei'&&(state.weightInterest||0)>=45)chance+=8;
 if(c.id==='emi'&&evolutionStage()>=2)chance-=7;
 return clamp(chance,12,88);
}
function startRestraintEvent(){
 if(blockingEventType()){showBlockingNotice();return}
 if(state.pendingRestraintEvent)return;
 const c=CHARACTERS[activeId];
 state.pendingRestraintEvent={
   day:state.day,turn:state.turn,
   intro:`${c.name}は最近、自分なりに食事や体型を気にしている。どう声をかける？`,
   choices:[
    {label:'「たまには気にしすぎなくていいよ」',style:'gentle',tone:'責めずに安心させ、自制を少し緩めてもよいと伝える。'},
    {label:'「我慢ばかりだと疲れない？」',style:'empathy',tone:'我慢のしんどさに共感し、本人に考えさせる。'},
    {label:'「そんなに気にしなくていいって」',style:'push',tone:'やや強めに、気にしすぎだと押し切ろうとする。'}
   ]
 };
 save();render();
 const ctx=`抑止力に働きかける会話イベント開始。
現在の抑止力:${Math.round(state.restraint)}
現在の心理:${psychologicalProfile(c)}
主人公はまだ3択を選んでいない。
${c.name}が最近の食事・体型・我慢について少し意識している場面を自然に描写し、主人公が声をかけられる余地を残すこと。`;
 if(activeId!=='emi'){
   showEventAI('（相手が最近の我慢について考えている）',ctx,'抑止力イベント').catch(()=>{});
 }else{
   addNarration(stageNum()<=2
     ?'絵美は特に食事制限をしている様子はなく、主人公は普段の食べ方について話を切り出せそうだ。'
     :'絵美は最近の食事や体型を気にしながら、少し神経質になっているようだ。','抑止力イベント');
 }
}
function renderRestraintEvent(){
 const panel=$('restraintEventPanel'),text=$('restraintEventText'),chance=$('restraintEventChance'),box=$('restraintEventChoices');
 if(!panel||!text||!chance||!box)return;
 const p=state?.pendingRestraintEvent;
 if(!p){panel.classList.add('hidden');box.innerHTML='';return}
 panel.classList.remove('hidden');text.textContent=p.intro;box.innerHTML='';
 const selectedType=blockingEventType();
 p.choices.forEach((ch,i)=>{
  const b=document.createElement('button');b.type='button';b.className='btn';
  const pct=Math.round(restraintEventChance(ch.style));
  b.textContent=`${ch.label}（成功目安 ${pct}%）`;
  b.disabled=selectedType!=='restraint';
  b.addEventListener('click',()=>resolveRestraintChoice(i));box.appendChild(b);
 });
 const lv=activeId==='erika'?stageNum():1;
 chance.textContent=activeId==='erika'
   ?`成功すると抑止力が低下。絵里香は体型Lv.${lv}のため、高Lvほど成功率・低下量が大きくなります。`
   :'成功すると抑止力が約8〜12低下。大成功では最大15程度。失敗すると5〜10上昇します。';
}
async function resolveRestraintChoice(i){
 if(blockingEventType()!=='restraint'){showBlockingNotice();return}
 const p=state.pendingRestraintEvent,ch=p?.choices?.[i];if(!ch)return;
 const box=$('restraintEventChoices');if(box)box.querySelectorAll('button').forEach(b=>b.disabled=true);
 const before=state.restraint,prob=restraintEventChance(ch.style),roll=Math.random()*100;
 let delta,outcome;
 const erikaLv=activeId==='erika'?stageNum():1;
 const erikaDrop=activeId==='erika'?Math.floor((erikaLv-1)*1.25):0;
 if(roll<prob*.18){
   delta=-(13+Math.floor(Math.random()*3)+erikaDrop);outcome='大成功';
 }else if(roll<prob){
   delta=-(8+Math.floor(Math.random()*5)+erikaDrop);outcome='成功';
 }else{
   const failRise=5+Math.floor(Math.random()*6);
   delta=activeId==='erika'?Math.max(2,failRise-Math.floor((erikaLv-1)/2)):failRise;outcome='失敗';
 }
 if(activeId==='erika'){
   if(delta>0)delta=erikaRestraintDelta(delta,'抑止力イベント');
   else if(delta<0&&stageNum()>=3)delta-=Math.max(1,stageNum()-2);
 }
 if(activeId==='emi'){
   if(stageNum()<=2){
     // まだ体型自制の時期ではないので、失敗しても「警戒して抑止力UP」にはしない。
     if(delta>0)delta=0;
     else delta=Math.min(delta,-6);
   }else if(delta<0){
     // Lv3以降は些細な声かけで自制が崩れやすい。
     delta-=Math.min(5,stageNum());
   }
 }
 state.restraint=clamp(state.restraint+delta);
 if(activeId==='emi'&&stageNum()<=2)capEmiLowStageRestraint('抑止力イベント');
 if(outcome==='失敗')state.mood=clamp(state.mood-1);
 else state.mood=clamp(state.mood+1);
 const playerLine=await generatePlayerChoiceLine(ch.label,ch.tone);
 addBubble('user',playerLine,'抑止力イベント');
 const ctx=`抑止力に働きかける会話イベントの結果。
主人公が選んだ方針:${ch.label}\n主人公の実際の発言:${playerLine}\n意図:${ch.tone}
判定:${outcome}
成功率:${Math.round(prob)}%
抑止力:${before}→${state.restraint} (${delta>=0?'+':''}${delta})
この数値変化は確定。成功なら少し肩の力が抜ける反応、失敗なら逆に警戒・自制を強める反応をキャラクターらしく返すこと。`;
 try{const r=await askAI(playerLine,null,null,ctx);addAIResponse(r,'抑止力イベント')}
 catch(e){addAIResponse({narration:`${CHARACTERS[activeId].name}はその言葉を聞いて、少し考え込んだ。`,dialogue:outcome==='失敗'?'……そう言われると、逆に気をつけたくなるかも。':'……少しくらいなら、気にしすぎなくてもいいのかな。',emotion:outcome==='失敗'?'troubled':'happy'},'抑止力イベント')}
 addBubble('system',`${outcome}：抑止力 ${delta>=0?'+':''}${delta}`,'抑止力判定');
 remember('restraint',`${CHARACTERS[activeId].name}への働きかけ「${ch.label}」は${outcome}し、抑止力が${Math.abs(delta)}${delta<0?'下がった':'上がった'}`,outcome==='大成功'?4:2,['restraint']);
 log(`抑止力イベント ${outcome}: ${delta>=0?'+':''}${delta}`);
 state.pendingRestraintEvent=null;save();render();
}
function restraintConversationKey(text){
 return String(text).replace(/[！？!?,。、\s]/g,'').slice(0,28);
}
function evaluateRestraintConversation(text){
 if(!text||detectFoodOffer(text))return 0;
 const relax=/気にしすぎ|たまには|我慢しすぎ|無理しなくて|好きなもの|楽しんで|自分を責め|少しくらい|大丈夫/.test(text);
 const pressure=/太る|痩せろ|我慢しろ|食べるな|絶対控え/.test(text);
 if(!relax&&!pressure)return 0;
 const key=restraintConversationKey(text);
 state.restraintTalkRewards=state.restraintTalkRewards||[];
 const recent=state.restraintTalkRewards.filter(x=>x.day===state.day&&x.key===key);
 if(recent.length)return 0;
 let delta=0;
 if(relax){
   const chance=clamp(48+state.affection*.22+(state.mood-50)*.15-(state.restraint-50)*.24,18,82);
   if(Math.random()*100<chance)delta=-(2+Math.floor(Math.random()*4));
   else delta=1+Math.floor(Math.random()*3);
 }else if(pressure){
   delta=2+Math.floor(Math.random()*3);
 }
 if(activeId==='erika'){
   if(delta>0)delta=erikaRestraintDelta(delta,'会話');
   else if(delta<0&&stageNum()>=3)delta-=Math.max(1,stageNum()-2);
 }
 state.restraint=clamp(state.restraint+delta);
 state.restraintTalkRewards.push({day:state.day,key,delta});
 state.restraintTalkRewards=state.restraintTalkRewards.slice(-20);
 if(delta)log(`会話による抑止力 ${delta>0?'+':''}${delta}`);
 return delta;
}
function initiativeChoiceSet(ev){
 const c=CHARACTERS[activeId],ri=relationshipIndex();
 if(ev.type==='self_food')return [
  {label:'「いいね、行こう」',affection:4,mood:4,tone:'相手自身が食べたいと提案した内容を肯定し、一緒に食べに行く。',selfFood:'accept'},
  {label:'「どんなのが食べたい？」',affection:3,mood:3,tone:'提案を否定せず、相手が今食べたいものや希望をもう少し聞く。',selfFood:'ask'},
  {label:'「今日はやめておこう」',affection:-1,mood:-2,tone:'相手の食事提案を今回は断り、食べに行かない。',selfFood:'decline'}
 ];
 if(c.id==='yui'&&ev.type==='age_gap')return [
  {label:'「年齢差は気にしてないよ」',affection:4,mood:3,tone:'年齢差ではなく結衣本人を見ていると安心させる。',ageGap:true},
  {label:'「結衣さんはどう思ってる？」',affection:3,mood:2,tone:'結衣自身が年齢差をどう感じているのか、本音を急かさず聞く。',ageGap:true},
  {label:'「確かに結構離れてるね」',affection:-1,mood:-2,tone:'年齢差が大きいことを率直に認め、結衣の不安を少し刺激する。',ageGap:true}
 ];
 if(c.id==='yui'&&ev.type==='craving')return [
  {label:'「何が食べたくなったの？」',affection:4,mood:3,tone:'結衣の食欲や嗜好を責めず、具体的に何が気になっているのか聞く。'},
  {label:'「最近そういうの好きになったね」',affection:2,mood:0,tone:'最近の嗜好変化に気づいていることを、責めずに伝える。'},
  {label:'「ちょっと控えた方がいいんじゃない？」',affection:-2,mood:-3,tone:'最近の食生活を心配し、やや抑える方向へ話を向ける。'}
 ];
 if(c.id==='rei'&&ev.type==='weight_curiosity')return [
  {label:'「どんな変化が面白い？」',affection:4,mood:2,tone:'怜の体型変化への興味を否定せず、何を面白いと感じているのか聞く。'},
  {label:'「自分ではどう感じてる？」',affection:3,mood:2,tone:'主人公の評価を押しつけず、怜自身の感覚を聞く。'},
  {label:'「あまり気にしない方がいいんじゃない？」',affection:-1,mood:-1,tone:'怜の関心に深入りせず、変化を気にしすぎないよう促す。'}
 ];
 if(c.id==='risa'&&ev.type==='body_concern')return [
  {label:'「どの辺が気になる？」',affection:4,mood:2,tone:'梨沙の不安を茶化さず、具体的に気になっている点を聞く。'},
  {label:'「無理に気にしなくてもいいと思うよ」',affection:3,mood:2,tone:'体型を評価せず、梨沙が必要以上に気にしないよう安心させる。'},
  {label:'「食べすぎたんじゃない？」',affection:-2,mood:-3,tone:'最近の食生活が原因ではないかと率直に指摘する。'}
 ];
 if(c.id==='emi'&&ev.type==='training')return [
  {label:'「動きにくいところある？」',affection:4,mood:2,tone:'絵美の運動時の違和感を真面目に聞き、具体的な影響を確かめる。'},
  {label:'「少し休んだ方がいいんじゃない？」',affection:2,mood:1,tone:'大学陸上部の競技生活を否定せず、身体を気遣って休息を提案する。'},
  {label:'「練習不足なんじゃない？」',affection:-2,mood:-3,tone:'体型より努力不足の可能性をぶっきらぼうに指摘する。'}
 ];
 if(c.id==='erika'&&ev.type==='whereabouts')return [
  {label:'「今日はこうしてたよ」と普通に教える',affection:4,mood:3,tone:'今日の予定や行動を自然に教えて安心させる。'},
  {label:'「どうしてそんなに気になるの？」',affection:2,mood:0,tone:'主人公の動向を気にする理由を本人に聞く。'},
  {label:'「別に言わなくてもいいだろ」',affection:-3,mood:-4,tone:'距離を置き、絵里香の依存心を刺激する。'}
 ];
 if(c.id==='erika'&&ev.type==='reassurance')return [
  {label:'「嫌ってないよ。心配しなくていい」',affection:5,mood:5,tone:'嫌っていないとはっきり伝えて安心させる。告白前なら恋愛告白まではしない。'},
  {label:'「何か気になることでもある？」',affection:4,mood:2,tone:'不安の理由を急かさず聞く。'},
  {label:'「急にどうしたんだよ」',affection:-2,mood:-3,tone:'不安に十分寄り添わず少し面倒そうに返す。'}
 ];
 if(c.id==='erika'&&ev.type==='neglect')return [
  {label:'「ごめん。ちゃんと話そう」',affection:5,mood:6,tone:'構えなかったことを謝り、今は向き合う。'},
  {label:'「そんなに構ってほしかった？」',affection:2,mood:0,tone:'少しからかいながら寂しかったのか確かめる。'},
  {label:'「こっちにも予定があるんだよ」',affection:-4,mood:-6,tone:'不満を突き放し依存心と不機嫌さを刺激する。'}
 ];
 if(c.id==='erika'&&ev.type==='body_reassurance')return [
  {label:'「見た目が変わっても気にしてないよ」',affection:5,mood:5,tone:'体型変化だけで絵里香への態度が変わらないと安心させる。告白前なら恋愛告白まではしない。'},
  {label:'「それが気になってたの？」',affection:4,mood:2,tone:'主人公にどう見られているか気にしていたことを、責めずに聞く。'},
  {label:'「前とは結構変わったよな」',affection:-3,mood:-5,tone:'見た目の変化を率直に強調し、絵里香の不安を刺激する。'}
 ];
 if(c.id==='erika'&&ev.type==='comparison')return [
  {label:'「他の子と比べなくていいだろ」',affection:5,mood:4,tone:'他の女子との比較をやめるよう安心させ、絵里香本人に目を向ける。'},
  {label:'「急に他の女子のこと気にしてどうした？」',affection:3,mood:1,tone:'嫉妬や比較の理由を少し掘り下げる。'},
  {label:'「まあ、細い子は多いよな」',affection:-4,mood:-6,tone:'周囲の女子との比較を肯定し、絵里香の嫉妬と不安を強く刺激する。'}
 ];
 if(c.id==='erika'&&ev.type==='cling_body')return [
  {label:'「今まで通りでいいだろ」',affection:6,mood:6,tone:'体型が変わっても距離を変えるつもりはないと伝え、強い不安を安心させる。'},
  {label:'「そんなに嫌われるのが怖い？」',affection:3,mood:1,tone:'絵里香の依存と不安を本人に自覚させるよう問いかける。'},
  {label:'「そこまで気にされると重いよ」',affection:-5,mood:-7,tone:'依存の強さを負担だと伝え、絵里香の最も恐れている拒絶を刺激する。'}
 ];
 if(c.id==='erika'&&ev.type==='attention'){
   if(ri<=1)return [
    {label:'「絵里香はどうしたいの？」',affection:4,mood:3,tone:'強がりを茶化さず、絵里香自身の希望を自然に聞く。'},
    {label:'「別に予定は決めてないよ」',affection:2,mood:1,tone:'距離を詰めすぎず、聞かれたことへ普通に答える。'},
    {label:'「俺のこと気になるの？」',affection:-2,mood:-2,tone:'関係が浅い段階で、絵里香の好意を直接指摘して踏み込む。'}
   ];
   return [
    {label:'「絵里香と一緒なら空けるよ」',affection:5,mood:3,tone:'好意を隠さず、絵里香と過ごす意思を示す。'},
    {label:'「絵里香は何したい？」',affection:4,mood:3,tone:'絵里香の希望を優先して聞く。'},
    {label:'「なんでそんなこと聞くの？」',affection:0,mood:-1,tone:'絵里香の問いかけの意図を正面から尋ねる。'}
   ];
 }
 if(ev.type==='favorite')return [
  {label:'「それ、そんなに好きなんだね」',affection:3,mood:2,tone:'相手の好物への気持ちを肯定的に受け止める。'},
  {label:'「どこが一番好き？」',affection:4,mood:2,tone:'好物について相手自身の好みや理由をもう少し聞く。'},
  {label:'「またその話？」',affection:-1,mood:-2,tone:'好物の話題にあまり興味を示さず、少し素っ気なく返す。'}
 ];
 return [
  {label:'相手の話に自然に返す',affection:3,mood:2,tone:'直前の相手の発言内容を受け止め、その内容に直接返答する。'},
  {label:'相手の本音をもう少し聞く',affection:ri>=2?4:2,mood:ri>=2?2:1,tone:'直前の発言に沿って、相手の考えや気持ちを一段だけ掘り下げる。'},
  {label:'話題を軽く流す',affection:-1,mood:-1,tone:'直前の話題には深く踏み込まず、短く返して流す。'}
 ];
}

async function generateInitiativeOpeningAndChoices(c,ev,baseChoices){
 const gs=globalSettings();
 const fallbackDialogue=ev.type==='body_reassurance'?'……最近、前より見た目が変わったでしょう？ あなた、別に……嫌になったりしてませんわよね？':ev.type==='comparison'?'……あなた、細い子の方がお好みだったりしますの？ べ、別に深い意味はありませんけれど。':ev.type==='cling_body'?'……今のわたくしでも、今まで通り相手をしてくださいますわよね？':ev.type==='whereabouts'?'……今日、何をしていましたの？ べ、別に気になっているわけではありませんけれど。':ev.type==='reassurance'?'……あなた、最近わたくしのことを嫌になったりしていませんわよね？':ev.type==='neglect'?'……最近、わたくしを放っておきすぎではなくて？':ev.type==='self_food'?'……ねえ、今日は何か食べに行かない？':ev.type==='age_gap'?'……私の方がずっと年上だけど、やっぱり気になったりする？':ev.type==='craving'?'……最近、ちょっとこってりしたものが気になるんだよね。':ev.type==='weight_curiosity'?'……最近の変化、自分でも少し気になってる。あなたはどう見える？':ev.type==='training'?'……最近ちょっと動きの感覚が違うんだよね。どう思う？':ev.type==='body_concern'?'……最近、服の感じが少し違う気がするんだけど、気のせいかな？':'……ちょっと聞いてもいい？';
 const fallback={narration:`${c.name}は少し考えてから、こちらへ話しかけた。`,dialogue:fallbackDialogue,emotion:'normal',choices:baseChoices.map(x=>x.label)};
 if(!gs.apiKey)return fallback;
 const intents=baseChoices.map((x,i)=>`${i+1}. 意図:${x.tone} / 好感度:${(x.affection||0)>=0?'+':''}${x.affection||0} / 機嫌:${(x.mood||0)>=0?'+':''}${x.mood||0}`).join('\n');
 const instructions=`恋愛シミュレーションゲームの「キャラクター発イベント」を生成する。JSONだけを返す。\n形式:{"narration":"情景1〜2文","dialogue":"キャラクターの発言1〜3文","emotion":"normal|happy|embarrassed|angry|troubled|surprised","choices":["主人公の返答1","主人公の返答2","主人公の返答3"]}\n最重要ルール:\n- dialogueとchoicesを必ず会話として噛み合わせる。dialogueで聞いていないことへの返答をchoicesに出さない。\n- choicesはdialogueの最後の問いかけ・発言に直接返せる短い主人公の台詞にする。\n- choicesは3件で、下記3つの選択意図と順番・好感度方向を保つ。ただし文言はその場面に合わせて全面的に言い換えてよい。\n- 3択同士の意味を重複させない。肯定・掘り下げ・否定/距離を置く等、元の意図差を保つ。\n- キャラクターの性格・口調・関係段階を守る。主人公の返答を先に書かない。\n- 相手が結衣の場合、主人公はかなり年下なので、choicesは必ず礼儀正しい敬語にする。告白成立前は「好きです」「惚れています」「結衣さんだから特別です」「付き合いたいです」など明確な恋愛好意をchoicesに出さない。肯定・励まし・気遣い・節度ある褒め言葉は可。明確な恋愛感情は告白イベントで交際成立後のみ。恋人後も敬語ベースを維持する。馴れ馴れしいタメ口・命令口調・呼び捨ては禁止。`;
 const input=`キャラクター:${c.name} / ${c.age}歳\n性格:${c.personality}\n話し方:${c.speech}\n関係:${relationshipLabel()} / 好感度:${Math.round(state.affection)} / 機嫌:${Math.round(state.mood)}\nDAY ${state.day} / ${turns[state.turn].label}\nイベント種別:${ev.type}\n状況:${ev.situation}\n狙い:${ev.goal}\n3択の固定された意味・効果:\n${intents}\n${c.id==='erika'?'絵里香は20歳の大学生で、主人公とは大学の同級生。高校生・制服・部活中心の生活として描写しない。大学の講義、キャンパス、サークル、アルバイト、私服など大学生らしい生活文脈を優先する。':''}
${c.id==='emi'?'絵美は20歳の大学生で、主人公とは大学の同級生。大学陸上部のエース。高校生・制服・高校の教室として描写しない。大学の講義、キャンパス、大学陸上部、競技場、アルバイト、私服など大学生らしい生活文脈を優先する。\n口調は女の子らしい自然な20歳女性のタメ口を基本にする。『〜じゃん』『〜でしょ』『ちょっと』『もう』『やめてよ』『最悪』などを中心にし、勝気さは残す。強く怒った時や美咲と張り合う時だけ少し口が悪くなってよいが、『〜だろ』『うるせえ』『見んなって』など男性的・粗暴な言い回しを通常会話で使わない。居酒屋バイトは絵美自身の夜シフト専用イベントで、朝・昼の描写として絶対に発生させない。主人公の「バイトする」ボタンは主人公本人のバイトであり、絵美の居酒屋バイトとは無関係。':''}
${c.id==='yui'?'結衣は主人公よりかなり年上。年齢差イベント以外では毎回年齢差の話にしない。主人公から結衣への返答は、告白成立前は必ず敬語で礼儀正しくする。ポジティブな声かけは可だが、「好き」「特別」「付き合いたい」など主人公側の明確な恋愛好意は告白成立後まで言わせない。恋人後は明確な好意表現を許可しつつ、敬語ベースを維持する。':''}`;
 const model=normalizeModel(gs.model),body={model,instructions,input,max_output_tokens:550};if(/^gpt-5/.test(model))body.reasoning={effort:'minimal'};
 try{
  const res=await aiFetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+gs.apiKey},body:JSON.stringify(body)});
  if(!res.ok)throw new Error('HTTP '+res.status);
  const data=await res.json(),raw=extractResponseText(data);if(!raw)throw new Error('empty');
  const txt=String(raw).trim().replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim(),obj=JSON.parse(txt);
  const choices=Array.isArray(obj.choices)?obj.choices.map(x=>String(x||'').trim()).filter(Boolean).slice(0,3):[];
  if(choices.length!==3)throw new Error('choices');
  return {narration:String(obj.narration||fallback.narration),dialogue:String(obj.dialogue||fallback.dialogue),emotion:normalizeEmotion(obj.emotion),choices};
 }catch(e){return fallback}
}

function renderInitiativeChoices(){
 const panel=$('initiativeChoicePanel'),box=$('initiativeChoices');
 if(!panel||!box)return;
 const p=state?.pendingInitiatedChoice;
 if(!p){panel.classList.add('hidden');box.innerHTML='';return}
 panel.classList.remove('hidden');
 $('initiativeChoiceText').textContent=p.type==='confession'?`${CHARACTERS[activeId].name}から告白された。どう返す？`:`${CHARACTERS[activeId].name}から話しかけてきた。どう返す？`;
 box.innerHTML='';
 p.choices.forEach((ch,i)=>{
   const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=(p.aiChoices&&p.aiChoices[i])||ch.label;
   b.addEventListener('click',()=>resolveInitiativeChoice(i));box.appendChild(b);
 });
}
async function resolveInitiativeChoice(i){
 if(state?.pendingWeightEvent||state?.pendingDate){showBlockingNotice();render();return}
 const p=state?.pendingInitiatedChoice;if(!p)return;
 markErikaAttention('問いかけへの返答');
 const ch=p.choices[i];if(!ch)return;
 const box=$('initiativeChoices');if(box)box.querySelectorAll('button').forEach(b=>b.disabled=true);
 const before=state.affection,wasLover=!!state.isLover;
 state.affection=clamp(state.affection+ch.affection);state.mood=clamp(state.mood+ch.mood);
 if(p.type==='confession'){
   if(ch.confession==='accept'){state.isLover=true;state.confessionCompleted=true;state.confessionDeferredUntilDay=0}
   else if(ch.confession==='wait'){state.confessionDeferredUntilDay=state.day+4}
   else if(ch.confession==='decline'){state.confessionDeferredUntilDay=state.day+10}
 }
 let selfFoodEffect=null,selfFoodName='';
 if(p.type==='age_gap')state.ageGapTalkCount=(state.ageGapTalkCount||0)+1;
 if(p.type==='self_food'&&ch.selfFood==='accept'){
   let key=p.foodKey;
   if(key==='favorite'){
     const fav=(state.favoriteFoods||[])[0]||'デザート';
     key=/揚げ/.test(fav)?'fried':/ラーメン/.test(fav)?'ramen':/和食/.test(fav)?'japanese':'dessert';
   }
   const meal=mealFor(key);
   selfFoodName=meal.name;selfFoodEffect=applyGuaranteedFoodEffect(meal,'キャラからの食事提案');
   state.selfFoodCount=(state.selfFoodCount||0)+1;
   unlockCG(`self_food:${activeId}:${key}`,`${CHARACTERS[activeId].name}からの食事のお誘い`,cgPath(CHARACTERS[activeId],`food_${key}`));
 }
 const selectedLabel=(p.aiChoices&&p.aiChoices[i])||ch.label;
 const playerLine=await generatePlayerChoiceLine(
   selectedLabel,
   `直前の${CHARACTERS[activeId].name}の発言:${p.openingDialogue||''} / 選択意図:${ch.tone||ch.label} / イベント:${p.type}`
 );
 addBubble('user',playerLine,'自発イベント選択');
 const ctx=`キャラクター発イベントへの主人公の返答。
元イベント:${p.type}${p.type==='confession'?`（正式な告白イベント）`:''}
イベント状況:${p.situation||''}
直前の${CHARACTERS[activeId].name}の発言:${p.openingDialogue||''}
主人公の選択方針:${ch.label}\n主人公の実際の発言:${playerLine}\n選択の意味:${ch.tone}
ゲーム側確定結果: 好感度 ${before}→${state.affection} (${ch.affection>=0?'+':''}${ch.affection}) / 機嫌 ${ch.mood>=0?'+':''}${ch.mood}
${selfFoodEffect?`相手自身の提案で実際に${selfFoodName}を食べた。体重+${selfFoodEffect.weightGain.toFixed(2)}kg / 満腹度+${selfFoodEffect.fullnessDelta} / 抑止力${selfFoodEffect.restraintDelta>=0?'+':''}${selfFoodEffect.restraintDelta}。この事実を変更しないこと。`:''}
${p.type==='confession'?`交際状態:${wasLover?'恋人':'未交際'}→${state.isLover?'恋人':'未交際'}。${ch.confession==='accept'?'告白を受け入れたので、ここから正式に恋人として反応する。':'告白への返答を尊重し、まだ恋人扱いしない。'}`:''}
この結果を覆さず、直前の自分の発言と主人公の実際の返答を受けた直後の反応を返すこと。選ばれていない選択肢の内容には反応しない。`;
 try{const r=await askAI(playerLine,null,null,ctx);addAIResponse(r,'自発イベント')}
 catch(e){addAIResponse({narration:`${CHARACTERS[activeId].name}はその返事を聞き、少しだけ表情を変えた。`,dialogue:'……そう。',emotion:ch.affection>=3?'embarrassed':ch.affection<0?'angry':'normal'},'自発イベント')}
 if(selfFoodEffect){
   addBubble('system',`${CHARACTERS[activeId].name}は${selfFoodName}を食べた。満腹度 +${selfFoodEffect.fullnessDelta}｜体重 +${selfFoodEffect.weightGain.toFixed(2)}kg｜抑止力 ${selfFoodEffect.restraintDelta>=0?'+':''}${selfFoodEffect.restraintDelta}`,'食事結果');
   await maybeYuiOvereatHook('相手からの食事提案');if(activeId==='emi'&&foodResult?.accepted)maybeEmiSpecialHook('食事のあと');
 }
 addBubble('system',p.type==='confession'?(state.isLover?`告白成立。${CHARACTERS[activeId].name}と恋人になりました。`:(ch.confession==='wait'?'告白への返事を保留しました。':'告白を断りました。')):`好感度 ${ch.affection>=0?'+':''}${ch.affection}｜機嫌 ${ch.mood>=0?'+':''}${ch.mood}`,p.type==='confession'?'関係変化':'選択結果');
 remember(p.type==='confession'?'confession_result':'initiative_choice',p.type==='confession'?`${CHARACTERS[activeId].name}の告白に「${ch.label}」と返した`:`${CHARACTERS[activeId].name}からの話題に「${selectedLabel||ch.label}」と返した`,p.type==='confession'?5:(ch.affection>=4?4:2),p.type==='confession'?['relationship','confession']:['initiative']);
 state.pendingInitiatedChoice=null;save();render();renderInitiativeChoices();
}
const CONFESSION_RULES={
 risa:{affection:88,minDay:10,scene:'夕方の帰り道。幼馴染として積み重ねてきた時間を思い出せる静かな場所で、明るさの裏に緊張をにじませて告白する。'},
 emi:{affection:90,minDay:12,scene:'部活や運動のあと。人気の少ない場所で、いつもの強気を保とうとしながらも言葉が少し詰まる不器用な告白。'},
 yui:{affection:96,minDay:24,ageGapTalks:3,scene:'夜、自宅近くかデートの帰り道。主人公よりかなり年上であることを最後まで気にし、「私みたいな年上でいいの？」という迷いを越えて告白する。'},
 erika:{affection:92,minDay:14,scene:'少し特別感のある場所。最後まで強がりとお嬢様口調を崩しきれず、先に主人公へ察してほしそうにしながら告白する。'},
 rei:{affection:94,minDay:16,scene:'静かな夜や人の少ない場所。感情を分析するように話しながら、最後に「たぶん、好き」と自分なりの言葉で告白する。'}
};
function confessionRule(c=CHARACTERS[activeId]){return CONFESSION_RULES[c.id]||{affection:92,minDay:12,scene:'二人きりで落ち着いて話せる場所で、そのキャラクターらしく告白する。'}}
function confessionEligible(){
 if(!state||!activeId||state.isLover||state.confessionCompleted||state.pendingInitiatedChoice)return false;
 const c=CHARACTERS[activeId],r=confessionRule(c);
 if(state.affection<r.affection||state.day<r.minDay||state.day<(state.confessionDeferredUntilDay||0))return false;
 if(c.id==='yui'&&(state.ageGapTalkCount||0)<(r.ageGapTalks||0))return false;
 return true;
}
function confessionBodyGuidance(){
 const lv=stageNum();
 if(lv<=2)return '体型への自虐はほぼ入れず、純粋な恋愛の緊張を中心にする。';
 if(lv===3)return '最近少し体型が変わったことを気にする程度の弱い照れを混ぜてもよい。';
 if(lv<=5)return '今の体型を気にして「こんな私でいいのかな」と軽く自虐するが、自分を過度に貶めない。';
 return '体型変化への不安が強く、「前よりずいぶん変わっちゃったけど」など少し強めの自虐を混ぜる。ただし自己否定だけの告白にはしない。';
}
function confessionEventDefinition(c){
 const r=confessionRule(c);
 return {type:'confession',situation:r.scene,goal:`${c.name}本人から主人公へ正式に恋愛感情を伝える告白シーン。現在体型Lv.${stageNum()}。${confessionBodyGuidance()} ${c.id==='yui'?'年齢差への迷いを告白の中心要素の一つにする。':''}`};
}
function confessionChoiceSet(c=CHARACTERS[activeId]){
 if(c&&c.id==='yui')return [
  {label:'「僕も結衣さんのことが好きです。よければ、僕と付き合ってください」',affection:5,mood:6,tone:'敬意を保ちながら告白を受け入れ、正式に恋人になる。',confession:'accept'},
  {label:'「すごく嬉しいです。ただ、少しだけ考える時間をいただけますか」',affection:0,mood:-1,tone:'丁寧に気持ちを受け止めつつ、今すぐ交際開始はしない。',confession:'wait'},
  {label:'「気持ちは本当に嬉しいです。でも、恋人としてはお応えできません」',affection:-10,mood:-8,tone:'礼儀正しく、恋愛関係になることを断る。',confession:'decline'}
 ];
 return [
  {label:'「俺も好き。付き合ってほしい」',affection:5,mood:6,tone:'告白を受け入れ、正式に恋人になる。',confession:'accept'},
  {label:'「嬉しい。でも少し考える時間がほしい」',affection:0,mood:-1,tone:'気持ちは否定しないが、今すぐ交際開始はしない。',confession:'wait'},
  {label:'「ごめん、恋人としては見られない」',affection:-10,mood:-8,tone:'恋愛関係になることを断る。',confession:'decline'}
 ];
}
async function startConfessionEvent(){
 if(!confessionEligible())return false;
 const c=CHARACTERS[activeId],ev=confessionEventDefinition(c),choices=confessionChoiceSet(c);
 state.pendingInitiatedChoice={type:'confession',situation:ev.situation,choices,confession:true,openingDialogue:'',openingNarration:''};state.lastInitiatedTurnKey=currentTurnKey();save();
 const ctx=`正式な告白イベント。主人公はまだ返答していない。
キャラクター:${c.name}
現在の関係:${relationshipLabel()} / 好感度:${Math.round(state.affection)}
DAY:${state.day}
現在体型:Lv.${stageNum()} / ${state.weight.toFixed(1)}kg
シーン:${ev.situation}
告白方針:${ev.goal}
この場面では${c.name}本人が、自分の言葉で主人公へ告白すること。主人公の返答は絶対に書かない。告白の最後は主人公が返事できる形で終える。`;
 try{const result=await askAI('（相手が自分から正式な告白をする。主人公はまだ返事をしていない）',null,null,ctx);addAIResponse(result,'告白イベント')}
 catch(e){addAIResponse({narration:`${c.name}はしばらく迷ったあと、覚悟を決めたように主人公を見た。`,dialogue:c.id==='yui'?'……私の方がずっと年上だし、色々気になることもあるけど。それでも、あなたのことが好き。……迷惑じゃなかったら、私と付き合ってくれる？':'……ずっと言えなかったけど、好き。私と付き合ってほしい。',emotion:'embarrassed'},'告白イベント')}
 remember('confession',`${c.name}が主人公へ告白した`,5,['relationship','confession']);log(`告白イベント発生: ${c.name}`);save();render();renderInitiativeChoices();return true;
}
async function maybeCharacterInitiatedEvent(force=false){
 if(confessionEligible())return startConfessionEvent();
 if(!state||!activeId||state.pendingWeightEvent||state.pendingDate||state.pendingInitiatedChoice)return false;
 const key=currentTurnKey();if(state.lastInitiatedTurnKey===key)return false;
 const c=CHARACTERS[activeId];
 // 結衣は専用イベント候補が多いため、通常のキャラ発イベントは1日最大1回に制限。
 if(!force&&c.id==='yui'&&(state.lastYuiInitiatedDay||0)===state.day)return false;
 if(!force&&c.id==='emi'&&state.day-(state.lastEmiInitiatedDay||0)<2)return false;
 const chance=initiatedEventChance();if(!force&&Math.random()*100>=chance)return false;
 state.lastInitiatedTurnKey=key;state.initiatedEventCount=(state.initiatedEventCount||0)+1;
 if(c.id==='yui')state.lastYuiInitiatedDay=state.day;
 if(c.id==='emi')state.lastEmiInitiatedDay=state.day;
 const ev=chooseInitiatedEvent();
 const choices=initiativeChoiceSet(ev);
 state.pendingInitiatedChoice={type:ev.type,situation:ev.situation,goal:ev.goal,foodKey:ev.foodKey||null,choices,aiChoices:null,openingDialogue:'',openingNarration:''};save();
 const generated=await generateInitiativeOpeningAndChoices(c,ev,choices);
 if(!state.pendingInitiatedChoice)return false;
 state.pendingInitiatedChoice.aiChoices=generated.choices;
 state.pendingInitiatedChoice.openingDialogue=generated.dialogue;
 state.pendingInitiatedChoice.openingNarration=generated.narration;
 save();
 addAIResponse(generated,'キャラ発イベント');
 remember('initiative',`${c.name}が自分から「${ev.type}」の話題を振った`,2,['initiative',ev.type]);
 log(`キャラ発イベント発生: ${ev.type}（発生率${Math.round(chance)}%）`);
 save();render();renderInitiativeChoices();return true;
}


function recentDaySummary(day){
 const logs=(state.gameLog||[]).slice(-18).filter(x=>String(x).includes(`DAY ${day}`)||true).slice(-10);
 const mem=(state.memories||[]).filter(m=>m.day===day).slice(-6).map(m=>m.text);
 return [...mem,...logs].slice(-10).join(' / ')||'特別な出来事は少なかった。';
}
function nightRestraintDrift(){
 if(state.restraint>=80)return 2;
 if(state.restraint<=25)return -2;
 if(state.restraint>=60)return 1;
 if(state.restraint<=40)return -1;
 return Math.random()<.5?-1:1;
}

const YUI_NIGHT_EVENTS=[
 {id:'mirror',title:'鏡の前の違和感',minLv:1,maxLv:3,baseWeight:13,cg:true,
  effect:'restraint:+2..+4',
  desc:'鏡で腰回りを確認し、以前より丸くなった感覚を一人で確かめる。'},
 {id:'sitting_belly',title:'座った時のお腹',minLv:2,maxLv:4,baseWeight:12,cg:true,
  effect:'restraint:+3',
  desc:'ソファに座った時にできる腹部の段に触れ、立っている時との違いを実感する。'},
 {id:'sweet_temptation',title:'夜の甘い誘惑',minLv:1,maxLv:7,baseWeight:11,cg:true,choice:true,
  effect:'3choice',
  desc:'冷蔵庫に残ったケーキを見つけ、食べるかどうか一人で迷う。'},
 {id:'overeaten',title:'食べすぎた夜',minLv:1,maxLv:7,baseWeight:19,cg:true,
  effect:'restraint:+5,mood:-2',
  desc:'その日の食事量を思い返し、苦しいほど食べたことを後悔する。'},
 {id:'old_clothes',title:'昔の服',minLv:4,maxLv:7,baseWeight:11,cg:true,
  effect:'restraint:+5..+8',
  desc:'昔よく着ていた服を試すが、ボタンやホックが閉まらず現実を突きつけられる。'},
 {id:'photo_folder',title:'写真フォルダ',minLv:4,maxLv:7,baseWeight:10,cg:true,
  effect:'restraint:+4,mood:±2',
  desc:'スマホの昔の写真を偶然見つけ、現在の自分と見比べる。'},
 {id:'side_view',title:'横から見る自分',minLv:5,maxLv:7,baseWeight:10,cg:true,
  effect:'restraint:+3..+6',
  desc:'鏡の前で横を向き、脇腹から下腹に手を添えて現在のシルエットを確認する。'},
 {id:'whatever',title:'「まあ、いっか」',minLv:1,maxLv:7,baseWeight:15,cg:false,
  effect:'restraint:-3..-6,mood:+2',
  desc:'気にはなるものの、考え続けるのに疲れて「今日はもういい」と開き直る。'},
 {id:'one_more_bite',title:'もう一口だけ',minLv:1,maxLv:7,baseWeight:14,cg:true,
  effect:'weight:+,restraint:-4',
  desc:'夜食を一口だけのつもりで始め、気づけば止まらなくなっている。'},
 {id:'what_did_he_think',title:'あの人はどう思った？',minLv:1,maxLv:7,baseWeight:12,cg:false,
  effect:'affection:+1,restraint:conditional',
  desc:'今日のデートを思い返し、主人公が今の自分をどう見ていたか気にする。'},
 {id:'date_photo',title:'デート写真',minLv:1,maxLv:7,baseWeight:10,cg:false,
  effect:'restraint:+3,affection:+1',
  desc:'今日撮った写真を見直し、昔の写真との体型差に気づく。'},
 {id:'body_heavy',title:'身体が重い',minLv:5,maxLv:7,baseWeight:11,cg:true,
  effect:'restraint:+5',
  desc:'着替えや階段など何気ない動作で、以前より身体が重くなった感覚を思い返す。'},
 {id:'past_self',title:'昔の私なら…',minLv:6,maxLv:7,baseWeight:9,cg:true,
  effect:'restraint:+2..+5',
  desc:'昔の細かった頃の自分を見ながら、現在との違いに自嘲気味に笑う。'},
 {id:'catch_breath',title:'息を整えながら',minLv:7,maxLv:7,baseWeight:9,cg:true,
  effect:'restraint:+4..+8',
  desc:'ソファに座って息を整えながら、お腹に手を添えて体型変化を実感する。'},
 {id:'child_tease',title:'子供にからかわれて赤面',minLv:4,maxLv:7,baseWeight:8,cg:false,
  effect:'restraint:+3..+6,mood:-5',
  desc:'昼間、幼い子供に体型の変化を無邪気に指摘されたことを夜になって思い返す。'}
];

function nightEventCGPath(ev,lv){
 const n=String(Math.max(1,Math.min(7,lv))).padStart(2,'0');
 const map={
  mirror:'night_mirror',
  sitting_belly:'night_sitting_belly',
  sweet_temptation:'night_sweet_temptation',
  overeaten:'night_overeat',
  old_clothes:'night_old_clothes',
  photo_folder:'night_photo_folder',
  side_view:'night_side_view',
  one_more_bite:'night_one_more_bite',
  body_heavy:'night_body_heavy',
  past_self:'night_past_self'
 };
 if(ev.id==='catch_breath')return `assets/yui/memories/night_thought_07.webp?v=${APP_BUILD}`;
 const base=map[ev.id];return base?`assets/yui/memories/${base}_${n}.webp?v=${APP_BUILD}`:'';
}
function yuiNightEligible(ev){
 const lv=stageNum();
 // 夜イベントは同じ体型Lvの間だけイベントID単位で一度きり。Lvが変わると既出判定をリセットする。
 if((state.seenNightEventIds||[]).includes(ev.id))return false;
 if(lv<ev.minLv||lv>ev.maxLv)return false;
 if(ev.id==='overeaten'&&(state.dailyFoodLoad||0)<78)return false;
 if(ev.id==='whatever'&&state.restraint>30)return false;
 if(ev.id==='one_more_bite'&&state.restraint>40)return false;
 if((ev.id==='what_did_he_think'||ev.id==='date_photo')&&!state.todayDateKey)return false;
 if(ev.id==='what_did_he_think'&&state.affection<50)return false;
 if(ev.id==='date_photo'&&state.affection<60)return false;
 return true;
}
function yuiNightWeight(ev){
 let w=ev.baseWeight||10;
 const lv=stageNum();
 if(ev.id==='sweet_temptation')w+=Math.max(0,(state.hunger||0)-45)*.18+Math.max(0,45-state.restraint)*.15;
 if(ev.id==='overeaten')w+=Math.max(0,(state.dailyFoodLoad||0)-78)*.28;
 if(ev.id==='one_more_bite')w+=Math.max(0,40-state.restraint)*.35;
 if(ev.id==='what_did_he_think'||ev.id==='date_photo')w+=Math.max(0,state.affection-50)*.08;
 if(ev.id==='child_tease')w+=lv>=6?3:0;
 return Math.max(0,w);
}
function chooseYuiNightEvent(){
 const pool=YUI_NIGHT_EVENTS.filter(yuiNightEligible).map(ev=>({ev,w:yuiNightWeight(ev)})).filter(x=>x.w>0);
 if(!pool.length)return null;
 const total=pool.reduce((a,x)=>a+x.w,0);let r=Math.random()*total;
 for(const x of pool){r-=x.w;if(r<=0)return x.ev}
 return pool[pool.length-1].ev;
}
function rememberNightEvent(ev,endedDay){
 state.nightEventHistory=state.nightEventHistory||[];
 state.seenNightEventIds=state.seenNightEventIds||[];
 state.seenNightEventStage=stageNum();
 // 同じLvの間では一度だけ。別Lvに進んだら同じイベントも再度発生できる。
 if(!state.seenNightEventIds.includes(ev.id))state.seenNightEventIds.push(ev.id);
 const lv=stageNum();
 if(!state.nightEventHistory.some(x=>x&&x.id===ev.id&&Number(x.lv)===lv)){
   state.nightEventHistory.push({id:ev.id,day:endedDay,lv});
 }
}
function randomInt(min,max){return min+Math.floor(Math.random()*(max-min+1))}
function applySimpleNightEffect(ev){
 let detail=[];
 if(ev.id==='mirror'){const d=randomInt(2,4);state.restraint=clamp(state.restraint+d);detail.push(`抑止力 +${d}`)}
 if(ev.id==='sitting_belly'){state.restraint=clamp(state.restraint+3);detail.push('抑止力 +3')}
 if(ev.id==='overeaten'){state.restraint=clamp(state.restraint+5);state.mood=clamp(state.mood-2);detail.push('抑止力 +5','機嫌 -2')}
 if(ev.id==='old_clothes'){const d=randomInt(5,8);state.restraint=clamp(state.restraint+d);detail.push(`抑止力 +${d}`)}
 if(ev.id==='photo_folder'){state.restraint=clamp(state.restraint+4);const m=state.mood>=55?1:-2;state.mood=clamp(state.mood+m);detail.push('抑止力 +4',`機嫌 ${m>=0?'+':''}${m}`)}
 if(ev.id==='side_view'){const d=randomInt(3,6);state.restraint=clamp(state.restraint+d);detail.push(`抑止力 +${d}`)}
 if(ev.id==='whatever'){const d=randomInt(3,6);state.restraint=clamp(state.restraint-d);state.mood=clamp(state.mood+2);detail.push(`抑止力 -${d}`,'機嫌 +2')}
 if(ev.id==='one_more_bite'){
   const c=CHARACTERS[activeId],wg=.22*gainFactor(c)*(0.9+Math.random()*.25);
   state.weight=Math.round((state.weight+wg)*10)/10;state.fullness=clamp(state.fullness+22);state.restraint=clamp(state.restraint-4);
   state.dailyFoodLoad=(state.dailyFoodLoad||0)+22;state.dailyFoodCount=(state.dailyFoodCount||0)+1;
   detail.push(`体重 +${wg.toFixed(2)}kg`,'満腹度 +22','抑止力 -4');
   updateEvolution(c);
 }
 if(ev.id==='what_did_he_think'){state.affection=clamp(state.affection+1);const d=state.mood>=60?-2:2;state.restraint=clamp(state.restraint+d);detail.push('好感度 +1',`抑止力 ${d>=0?'+':''}${d}`)}
 if(ev.id==='date_photo'){state.restraint=clamp(state.restraint+3);state.affection=clamp(state.affection+1);detail.push('抑止力 +3','好感度 +1')}
 if(ev.id==='body_heavy'){state.restraint=clamp(state.restraint+5);detail.push('抑止力 +5')}
 if(ev.id==='past_self'){const d=randomInt(2,5);state.restraint=clamp(state.restraint+d);detail.push(`抑止力 +${d}`)}
 if(ev.id==='catch_breath'){const d=randomInt(4,8);state.restraint=clamp(state.restraint+d);detail.push(`抑止力 +${d}`)}
 if(ev.id==='child_tease'){const d=randomInt(3,6);state.restraint=clamp(state.restraint+d);state.mood=clamp(state.mood-5);detail.push(`抑止力 +${d}`,'機嫌 -5')}
 return detail;
}

function erikaRoutineCGPath(kind,lv=stageNum()){
 const n=String(Math.max(1,Math.min(7,lv))).padStart(2,'0');
 return `assets/erika/memories/${kind}_${n}.webp?v=${APP_BUILD}`;
}
function erikaRoutineTitle(kind,lv=stageNum()){
 const names={morning_clothes:'朝の着替え',morning_yoga:'朝ヨガ',morning_scale:'体重計',noon_hook:'昼のホック事故',noon_hunger:'昼の空腹我慢',noon_stairs:'大学の階段',noon_convenience:'コンビニ葛藤',night_bodycheck:'夜の体型確認',night_binge:'夜の爆食',night_message:'夜のメッセージ確認'};
 return `絵里香 Lv.${lv}：${names[kind]||kind}`;
}
function rememberErikaRoutine(kind,detail,lv=stageNum()){
 state.erikaRoutineHistory=state.erikaRoutineHistory||[];
 state.erikaRoutineHistory.push({day:state.day,turn:turns[state.turn]?.key||'',kind,lv,detail});
 if(state.erikaRoutineHistory.length>80)state.erikaRoutineHistory=state.erikaRoutineHistory.slice(-80);
 remember('routine',`DAY ${state.day} ${turns[state.turn]?.label||''}：${detail}`,2,['erika','routine',kind]);
}
function showErikaRoutineCG(kind,lv=stageNum(),title=erikaRoutineTitle(kind,lv)){
 const path=erikaRoutineCGPath(kind,lv);
 unlockCG(`routine:erika:${kind}:${lv}`,title,path);
 addCGMessage(title,path,'絵里香の日常CG');
 return path;
}
function erikaClothesScene(lv){
 const scenes=[
  '絵里香はいつもの服へ迷いなく袖を通し、鏡の前で手早く身支度を整えた。',
  'いつものスカートを履いた絵里香は、ウエストが少しだけきついことに気づき、何度か位置を直している。',
  'パンツのファスナーを上げるため、絵里香は息を止めてお腹をへこませる。留まると何事もなかったように姿勢を正した。',
  '絵里香はパンツのホックを留めるため両手でウエストを寄せ、鏡の前で何度も格闘している。',
  '何着か試しても座った時にウエストが食い込み、絵里香は苛立ちながら今日着る服を何度も替えている。',
  'お気に入りの服が入らず、別のブラウスもボタンが危うい。絵里香はベッドの上に服を広げたまま、悔しそうに立ち尽くす。',
  '大きいサイズの服しか楽に着られず、絵里香はサイズタグと鏡の中の自分を交互に見て、朝からかなり落ち込んでいる。'
 ];
 return scenes[lv-1];
}
function erikaYogaScene(lv){
 const scenes=[
  '朝、自室のヨガマットで。絵里香は背筋を伸ばし、片足立ちのポーズを美しく安定してキープしている。呼吸にも余裕がある。',
  'ヨガの片足立ちで一瞬だけバランスを崩す。すぐ立て直すが、本人は納得していない。',
  '前屈すると以前より腹部が圧迫され、絵里香はわずかに顔をしかめる。それでも意地でポーズを続ける。',
  '片足立ちのキープ時間が明らかに短くなり、何度も足をついてしまう。絵里香は「集中力の問題ですわ」と言い訳する。',
  '数ポーズで額に汗が浮かび、息も少し上がる。絵里香は休憩を挟むこと自体が悔しそうだ。',
  'ヨガマットの上で数ポーズ試しただけで息が上がり、お腹や脚が邪魔になって思うように形を作れない。',
  '最初の数ポーズすら維持できず、絵里香はヨガマットに座り込む。以前は簡単だった動きができず、悔しさを隠せない。'
 ];
 return scenes[lv-1];
}
function erikaScaleScene(lv){
 const scenes=[
  '朝、自室で一人。絵里香は体重計を一瞥するだけで、特に気にせず身支度へ戻った。',
  '体重計の数字を見た絵里香は眉を寄せ、「誤差ですわ」と小さく呟く。',
  '表示された数字を疑い、絵里香は一度降りてからもう一度体重計へ乗り直す。',
  '絵里香は服の重さのせいだと考え、上着を脱いでもう一度測る。それでも数字はほとんど変わらない。',
  '何度測っても同じ数字が出るため、「これ、少しおかしいのではなくて？」と体重計を疑い始める。',
  '大きく増えた数字を見て、絵里香はしばらく無言になる。足元の表示から目を逸らせない。',
  '体重計の数字を確認した絵里香は言い訳すらせず、静かに降りる。現実を突きつけられたように表情が沈んでいる。'
 ];
 return scenes[lv-1];
}
function erikaHookScene(lv){
 const scenes={
 3:'昼食後、椅子に座った瞬間にパンツのホックが外れかける。絵里香は慌ててウエストを手で押さえ、周囲を確認する。',
 4:'満腹で座った拍子にパンツのホックが弾けて外れ、トップスの下から丸くなった下腹が少し覗く。絵里香は真っ赤になって隠す。',
 5:'昼食後、張ったウエストに耐えられずホックが勢いよく弾ける。ファスナーも少し下がり、柔らかいお腹がはっきり露出する。',
 6:'かなり満腹の状態で座ると、ホックが弾け、ファスナーも大きく開く。絵里香は両手で大きくなったお腹を必死に隠している。',
 7:'満腹で張った大きなお腹にパンツが耐えられず、ホックが完全に弾けてファスナーまで開く。露わになった腹部を両腕で抱えるように隠し、強い羞恥と焦りを見せる。'
 };
 return scenes[lv]||'';
}
function erikaHookTriggerProfile(lv,fullness){
 return hookTriggerProfile('erika',lv,fullness);
}
function erikaBodyCheckScene(lv){
 const scenes={
 2:'夜、鏡の前で横向きになり、以前よりわずかに丸くなった下腹のラインを気にしている。',
 3:'鏡の前でトップスを少し持ち上げ、下腹の柔らかい肉を指先で軽くつまんで確かめている。',
 4:'絵里香は鏡の前で両手を腹部へ当て、増えたお腹の肉をしっかり掴む。思った以上の柔らかさに表情が曇る。',
 5:'ベッドに腰掛け、座った時に腹部へできる段差を両手で触って確認する。目を逸らしたくても何度も見てしまう。',
 6:'鏡の前で腹部だけでなく腰回りや背中の肉まで手で確かめ、以前のシルエットとの違いに落ち込んでいる。',
 7:'大きくなった腹部を両手で持ち上げるように掴み、重さと柔らかさを確かめる。絵里香は鏡を見たまま、悔しさと不安で目を潤ませている。'
 };
 return scenes[lv]||'';
}
function erikaBingeScene(lv){
 const scenes={
 2:'夜遅く、空腹に負けて小さなお菓子を一つ開ける。食べ終えると少しだけ後ろめたそうに袋を見る。',
 3:'夜中、スナック菓子と甘い飲み物を机に並べ、止めるつもりだったのに手が進んでいる。',
 4:'一食分ほどの夜食を食べ終え、空になった皿を見て「何をしていますの、わたくし……」と後悔している。',
 5:'夜食に加えてデザートまで食べ、満腹になったお腹へ手を当てながら強い罪悪感を覚えている。',
 6:'複数の料理と甘いものを次々食べ、テーブルに空容器が増えている。食べている最中は夢中だが、終盤になるほど表情が曇る。',
 7:'深夜、かなり大量の料理・スナック・スイーツの空容器に囲まれ、満腹の大きなお腹を抱えるように座っている。満足感の直後に強い自己嫌悪と「また太る」という恐怖が押し寄せている。'
 };
 return scenes[Math.max(2,lv)]||'';
}
async function runErikaRoutineNarrative(kind,detail,effects=[],cg=false){
 const c=CHARACTERS[activeId],lv=stageNum();
 if(cg)showErikaRoutineCG(kind,lv);
 addBubble('system',`${turns[state.turn].label}｜${detail}`,'絵里香の日常イベント');
 if(effects.length)addBubble('system',effects.join('｜'),'日常イベント効果');
 rememberErikaRoutine(kind,detail,lv);
 const privateMonologue=kind.startsWith('morning_')||kind.startsWith('night_');
 const ctx=`絵里香専用の日常イベント。
時間帯:${turns[state.turn].label}
イベント:${detail}
現在体型:Lv.${lv} / ${state.weight.toFixed(1)}kg
満腹度:${Math.round(state.fullness)} / 空腹度:${Math.round(state.hunger)} / 抑止力:${Math.round(state.restraint)} / 機嫌:${Math.round(state.mood)}
依存度:${state.growthTraits?.dependence||0}/100 / 体型焦り:${state.growthTraits?.weightAnxiety||0}/100
確定ステータス変化:${effects.join(' / ')||'なし'}
${privateMonologue?`【最重要：一人きりの独り言イベント】
この朝/夜イベントでは主人公はその場に存在しない。
絵里香は自室などで一人きり。主人公の視線・返事・行動・台詞を絶対に描写しない。
主人公について頭の中で考えたり、スマホの履歴を見たりするのはよいが、主人公へ直接話しかけている会話形式にはしない。
dialogueは絵里香自身の小声の独り言・心の声として書く。narrationは絵里香一人の動作だけを書く。
「あなた」「ねえ」など、その場に主人公がいるように呼びかける表現は禁止。`:`主人公がその場にいない私生活イベントの場合は主人公へ直接話しかけない。`}
絵里香は太ること自体を喜ばない。食欲が増えていても、体型変化への焦り・悔しさ・罪悪感は残す。
${lv<3?'体型Lv1〜2なので、本人はまだ自分が太ったとは認めていない。体型変化を理由に「食事を控えなければ」と決意させない。':'体型Lv3以降なので、太ったことは認識している。ただし自制は不安定で長続きしない。'}
大学生らしい生活文脈と、お嬢様口調・高いプライドを保つ。`;
 try{const r=await askAI(`（${privateMonologue?'主人公不在。絵里香一人の独り言として描写する。':''}${detail}）`,null,null,ctx);addAIResponse(r,privateMonologue?'絵里香の独り言':'絵里香の日常')}
 catch(e){addNarration(detail,'絵里香の日常')}
 log(`絵里香日常: ${kind}${effects.length?' / '+effects.join(' / '):''}`);
 save();render();
}
function chooseErikaRoutineWithCoverage(daypart,outcomes,eligibleKinds){
 // 「5回に1回は各パターン」を守るための救済。条件を満たしているイベントだけを対象にする。
 // eligibleKinds が3種なら3回未登場で救済開始、2種なら4回、1種なら5回。
 state.erikaRoutineCoverage=state.erikaRoutineCoverage||{morning:{},night:{}};
 const bucket=state.erikaRoutineCoverage[daypart]||(state.erikaRoutineCoverage[daypart]={});
 const eligible=[...new Set((eligibleKinds||[]).filter(Boolean))];
 const n=Math.max(1,eligible.length);
 const forceThreshold=Math.max(1,6-n);
 eligible.forEach(k=>{bucket[k]=Math.max(0,Number(bucket[k]||0))+1});
 // 今回は条件外の種類のカウンタは進めない。
 const due=eligible.filter(k=>(bucket[k]||0)>=forceThreshold).sort((a,b)=>(bucket[b]||0)-(bucket[a]||0));
 let chosen=null;
 if(due.length){
   // 同率なら通常ウェイトの高いものを優先する。
   const maxMiss=bucket[due[0]]||0;
   const tied=due.filter(k=>(bucket[k]||0)===maxMiss);
   tied.sort((a,b)=>{
     const wa=(outcomes.find(x=>x.kind===a)?.weight||0),wb=(outcomes.find(x=>x.kind===b)?.weight||0);
     return wb-wa;
   });
   chosen=tied[0];
 }else{
   const pool=(outcomes||[]).filter(x=>(x.weight||0)>0);
   const total=pool.reduce((s,x)=>s+x.weight,0);
   if(total>0){
     let r=Math.random()*total;
     for(const x of pool){r-=x.weight;if(r<=0){chosen=x.kind||null;break}}
   }
 }
 if(chosen&&eligible.includes(chosen))bucket[chosen]=0;
 return chosen;
}
async function maybeErikaMorningEvent(){
 if(activeId!=='erika'||!state||state.turn!==0)return false;
 const lv=stageNum(),key=`${state.day}:morning`;
 if(state.lastErikaRoutineKey===key)return false;
 state.lastErikaRoutineKey=key;
 // 元の重みを維持。Lv6〜7では体重計の通常ウェイトが0でも、5回保証で救済される。
 const clothesChance=[12,22,35,48,60,72,82][lv-1];
 const yogaChance=Math.max(0,Math.min(28,100-clothesChance));
 const scaleChance=lv>=2?Math.max(0,100-clothesChance-yogaChance):0;
 const outcomes=[
   {kind:'morning_clothes',weight:clothesChance},
   {kind:'morning_yoga',weight:yogaChance},
   {kind:'morning_scale',weight:scaleChance},
   {kind:null,weight:lv===1?Math.max(0,100-clothesChance-yogaChance):0}
 ];
 const eligible=lv>=2?['morning_clothes','morning_yoga','morning_scale']:['morning_clothes','morning_yoga'];
 const chosen=chooseErikaRoutineWithCoverage('morning',outcomes,eligible);
 if(chosen==='morning_clothes'){
  const effects=[];
  if(lv>=3){const d=Math.min(9,lv+1);state.restraint=clamp(state.restraint+d);effects.push(`抑止力 +${d}`)}
  if(lv>=5){state.mood=clamp(state.mood-2);effects.push('機嫌 -2')}
  await runErikaRoutineNarrative('morning_clothes',erikaClothesScene(lv),effects,lv>=2);return true;
 }
 if(chosen==='morning_yoga'){
  const effects=[];
  if(lv>=3){const d=Math.min(10,lv+2);state.restraint=clamp(state.restraint+d);effects.push(`抑止力 +${d}`)}
  if(lv>=5){state.mood=clamp(state.mood-2);effects.push('機嫌 -2')}
  await runErikaRoutineNarrative('morning_yoga',erikaYogaScene(lv),effects,true);return true;
 }
 if(chosen==='morning_scale'&&lv>=2){
  const effects=[];let d=erikaRestraintDelta(Math.min(7,lv),'朝の体重計');
  if(d){state.restraint=clamp(state.restraint+d);effects.push(`抑止力 +${d}`)}
  else effects.push('抑止力変化なし');
  if(lv>=5){state.mood=clamp(state.mood-2);effects.push('機嫌 -2')}
  await runErikaRoutineNarrative('morning_scale',erikaScaleScene(lv),effects,true);return true;
 }
 return false;
}

async function maybeErikaNoonEvent(){
 if(activeId!=='erika'||!state||state.turn!==1)return false;
 const lv=stageNum(),key=`${state.day}:noon`;
 if(state.lastErikaRoutineKey===key)return false;
 state.lastErikaRoutineKey=key;
 // 最優先：高満腹時のホック事故
 const hook=erikaHookTriggerProfile(lv,state.fullness);
 if(lv>=3&&hook.eligible&&Math.random()<hook.chance){
  const moodLoss=Math.min(8,lv+1);
  const restraintGain=Math.min(9,lv+(state.fullness>=90?2:1));
  state.mood=clamp(state.mood-moodLoss);
  const hookRestraint=erikaRestraintDelta(restraintGain,'ホック事故');
  state.restraint=clamp(state.restraint+hookRestraint);
  await runErikaRoutineNarrative('noon_hook',erikaHookScene(lv),[`機嫌 -${moodLoss}`,`抑止力 +${hookRestraint}`],true);
  openErikaHookFollowup(lv);
  return true;
 }
 // 空腹を我慢してイライラ＋抑止力低下
 if(lv>=2&&state.hunger>=60&&state.restraint>=45&&Math.random()<0.55){
  const rLoss=Math.min(9,2+lv),mLoss=Math.min(7,1+Math.floor(lv/2));
  state.restraint=clamp(state.restraint-rLoss);state.mood=clamp(state.mood-mLoss);state.erikaDayHungerStrain=true;
  const detail=`昼食を控えようとする絵里香は、空腹を我慢している。食事をする学生や食べ物の匂いへ何度も反応しながら、「食べませんわ」と意地を張り続け、次第に苛立っている。`;
  await runErikaRoutineNarrative('noon_hunger',detail,[`抑止力 -${rLoss}`,`機嫌 -${mLoss}`],lv>=4);return true;
 }
 // 階段回避
 if(lv>=4&&Math.random()<0.38){
  const detail=lv>=6
   ?'大学の建物で階段を見た絵里香は一瞬足を止め、主人公や知人に気づかれないよう自然な顔でエレベーターへ向かう。'
   :'大学の移動中、絵里香は階段よりエスカレーターを選ぶ。以前なら気にも留めなかった選択を、自分で少し気にしている。';
  state.mood=clamp(state.mood-1);state.restraint=clamp(state.restraint+2);
  await runErikaRoutineNarrative('noon_stairs',detail,['機嫌 -1','抑止力 +2'],true);return true;
 }
 // コンビニ葛藤
 if(lv>=2&&state.hunger>=50&&Math.random()<0.48){
  let amount=0,name='',detail='';
  const impulse=Math.random()*100 + state.hunger*.35 - state.restraint*.25 + lv*7;
  if(impulse<40){detail='コンビニへ入った絵里香はスイーツ棚を見たものの、何も買わずに店を出る。何度か振り返ったことだけは自分でも気にしている。';}
  else if(impulse<65){amount=18;name='小さなコンビニスイーツ';detail='買わないつもりだった絵里香は、結局小さなスイーツを一つだけ手に取る。';}
  else if(impulse<85){amount=38;name='スイーツ＆ホットスナック';detail='絵里香はスイーツだけのつもりが、ホットスナックまで一緒に買ってしまう。';}
  else{amount=62;name='弁当・ホットスナック・スイーツ';detail='空腹に負けた絵里香は、弁当、ホットスナック、スイーツまでまとめて買い込んでしまう。';}
  const effects=[];
  if(amount){
   const food={name,fullness:amount,weight:amount>=60?.55:amount>=35?.32:.12,restraintHit:amount>=60?18:amount>=35?13:7,tags:['sweet','fried']};
   const ef=applyGuaranteedFoodEffect(food,'昼のコンビニ');
   effects.push(`満腹度 +${ef.fullnessDelta}`,`体重 +${ef.weightGain.toFixed(2)}kg`,`罪悪感 ${ef.regret||0}`);
  }else{
    const d=erikaRestraintDelta(3,'コンビニで我慢');
    if(d){state.restraint=clamp(state.restraint+d);effects.push(`抑止力 +${d}`)}
    else effects.push('抑止力変化なし');
  }
  await runErikaRoutineNarrative('noon_convenience',detail,effects,true);return true;
 }
 return false;
}
async function maybeErikaNightEvent(){
 if(activeId!=='erika'||!state||state.turn!==2)return false;
 const lv=stageNum(),key=`${state.day}:night`;
 if(state.lastErikaRoutineKey===key)return false;
 state.lastErikaRoutineKey=key;
 updateGrowthTraits(CHARACTERS[activeId]);
 const dep=state.growthTraits?.dependence||0;
 const bingeScore=(state.hunger||0)+(state.erikaDayHungerStrain?24:0)+Math.max(0,55-state.restraint)*.8+lv*5;
 const bingeEligible=lv>=2&&bingeScore>=95;
 const bodyEligible=lv>=2;
 const messageEligible=dep>=50;
 // 元の順次判定を「無条件ウェイト」に変換して、通常時の重みをほぼ維持する。
 // binge 72% → 残りに bodycheck 55%（罪悪感高なら100%）→ さらに残りに message 58%。
 const pBinge=bingeEligible?.72:0;
 const pBody=bodyEligible?(state.erikaFoodGuiltToday>=18?1:.55):0;
 const pMessage=messageEligible?.58:0;
 const wBinge=pBinge;
 const wBody=(1-pBinge)*pBody;
 const wMessage=(1-pBinge)*(1-pBody)*pMessage;
 const wNone=Math.max(0,1-wBinge-wBody-wMessage);
 const outcomes=[
   {kind:'night_binge',weight:wBinge},
   {kind:'night_bodycheck',weight:wBody},
   {kind:'night_message',weight:wMessage},
   {kind:null,weight:wNone}
 ];
 const eligible=[];
 if(bingeEligible)eligible.push('night_binge');
 if(bodyEligible)eligible.push('night_bodycheck');
 if(messageEligible)eligible.push('night_message');
 const chosen=chooseErikaRoutineWithCoverage('night',outcomes,eligible);
 if(chosen==='night_binge'&&bingeEligible){
  const base=[0,12,24,38,54,72,90][lv-1];
  const food={name:'夜の爆食',fullness:base,weight:[0,.08,.18,.32,.52,.78,1.08][lv-1],restraintHit:[0,5,8,12,17,22,27][lv-1],tags:['sweet','fried']};
  const ef=applyGuaranteedFoodEffect(food,'夜の爆食');
  state.mood=clamp(state.mood+2);
  const detail=erikaBingeScene(lv);
  await runErikaRoutineNarrative('night_binge',detail,[`満腹度 +${ef.fullnessDelta}`,`体重 +${ef.weightGain.toFixed(2)}kg`,`罪悪感 ${ef.regret||0}`],true);return true;
 }
 if(chosen==='night_bodycheck'&&bodyEligible){
  const d=erikaRestraintDelta(Math.min(9,1+lv),'夜の体型確認');
  if(d)state.restraint=clamp(state.restraint+d);
  state.mood=clamp(state.mood-(lv>=5?3:1));
  let detail=erikaBodyCheckScene(lv);
  if(dep>=60)detail+=' そして最後に、「今の自分を主人公がどう見ているのか」が頭をよぎる。';
  await runErikaRoutineNarrative('night_bodycheck',detail,[d?`抑止力 +${d}`:'抑止力変化なし',`機嫌 -${lv>=5?3:1}`],true);return true;
 }
 if(chosen==='night_message'&&messageEligible){
  const gotAttention=state.lastErikaAttentionDay===state.day;
  let detail,effects=[];
  if(gotAttention){
   detail='夜、自室で一人きりの絵里香はスマホを手にし、主人公との今日のやり取りを何度も見返している。返信があったことに安心しながらも、その事実を自分では認めたくない。';
   state.mood=clamp(state.mood+3);effects.push('機嫌 +3');
  }else{
   detail='夜、自室で一人きりの絵里香はスマホの通知欄を何度も確認するが、主人公から新しい反応はない。「別に待ってなどいませんわ」と言いながら、明らかに落ち着かない。';
   const loss=dep>=75?4:2;state.mood=clamp(state.mood-loss);effects.push(`機嫌 -${loss}`);
  }
  await runErikaRoutineNarrative('night_message',detail,effects,true);return true;
 }
 return false;
}

async function maybeErikaDaypartEvent(){
 if(activeId!=='erika'||!state||blockingEventType())return false;
 if(state.turn===0)return await maybeErikaMorningEvent();
 if(state.turn===1)return await maybeErikaNoonEvent();
 if(state.turn===2)return await maybeErikaNightEvent();
 return false;
}
function renderNightChoice(){
 const panel=$('nightChoicePanel'),box=$('nightChoiceChoices'),title=$('nightChoiceTitle'),text=$('nightChoiceText');
 if(!panel||!box||!title||!text)return;
 const p=state?.pendingNightChoice;
 if(!p){panel.classList.add('hidden');box.innerHTML='';return}
 panel.classList.remove('hidden');title.textContent=p.title;text.textContent=p.text;box.innerHTML='';
 p.choices.forEach((ch,i)=>{
   const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=ch.label;
   b.addEventListener('click',()=>resolveNightChoice(i));box.appendChild(b);
 });
}
function createSweetTemptationChoice(ev,endedDay){
 const lv=stageNum(),path=nightEventCGPath(ev,lv),title=`結衣の夜 Lv.${lv}：${ev.title}`;
 state.pendingNightChoice={
  eventId:ev.id,endedDay,title,path,
  text:'冷蔵庫を開けると、昼間に残しておいたケーキが目に入った。結衣は扉に手をかけたまま、しばらく迷っている。',
  choices:[
   {label:'「今日はやめておこう」と冷蔵庫を閉める',kind:'stop'},
   {label:'「少しくらいなら…」と一切れだけ食べる',kind:'little'},
   {label:'「もう今日は気にしない」と好きなだけ食べる',kind:'indulge'}
  ]
 };
 if(path){unlockCG(`night:yui:${ev.id}:${lv}`,title,path);addCGMessage(title,path,'夜の思い出CG')}
 rememberNightEvent(ev,endedDay);save();render();return 'pending';
}
async function resolveNightChoice(index){
 const p=state?.pendingNightChoice;if(!p)return;
 const ch=p.choices[index];if(!ch)return;
 const c=CHARACTERS[activeId],before={r:state.restraint,m:state.mood,w:state.weight,f:state.fullness};
 let result='',wg=0;
 if(ch.kind==='stop'){
   const chance=clamp(35+state.restraint*.55+(state.mood-50)*.15,25,90);
   if(Math.random()*100<chance){state.restraint=clamp(state.restraint+5);result='誘惑に勝った。抑止力 +5'}
   else{wg=.12*gainFactor(c);state.weight=Math.round((state.weight+wg)*10)/10;state.fullness=clamp(state.fullness+16);state.restraint=clamp(state.restraint-2);result=`我慢しきれず少し食べた。体重 +${wg.toFixed(2)}kg / 抑止力 -2`}
 }else if(ch.kind==='little'){
   wg=.18*gainFactor(c);state.weight=Math.round((state.weight+wg)*10)/10;state.fullness=clamp(state.fullness+24);state.restraint=clamp(state.restraint-4);state.mood=clamp(state.mood+2);result=`一切れ食べた。体重 +${wg.toFixed(2)}kg / 抑止力 -4 / 機嫌 +2`
 }else{
   wg=.36*gainFactor(c);state.weight=Math.round((state.weight+wg)*10)/10;state.fullness=clamp(state.fullness+42);state.restraint=clamp(state.restraint-8);state.mood=clamp(state.mood+3);result=`好きなだけ食べた。体重 +${wg.toFixed(2)}kg / 抑止力 -8 / 機嫌 +3`
 }
 if(wg>0){state.dailyFoodLoad=(state.dailyFoodLoad||0)+(ch.kind==='indulge'?42:24);state.dailyFoodCount=(state.dailyFoodCount||0)+1}
 updateEvolution(c);
 addBubble('system',result,'夜イベント結果');
 const ctx=`結衣専用の夜イベント「夜の甘い誘惑」。
主人公はその場にいない。これは結衣自身が一人で選んだ行動。
選択:${ch.label}
確定結果:${result}
選択前:抑止力${before.r} / 機嫌${before.m} / 体重${before.w.toFixed(1)}kg / 満腹度${before.f}
選択後:抑止力${state.restraint} / 機嫌${state.mood} / 体重${state.weight.toFixed(1)}kg / 満腹度${state.fullness}
一人の独白として、誘惑に負けた/勝った感情を自然に描写する。主人公へ話しかけない。`;
 try{const r=await askAI('（夜、一人でケーキを前に決断した）',null,null,ctx);addAIResponse(r,'夜の独白')}
 catch(e){addNarration('結衣はしばらくケーキを見つめ、自分で決めた行動を受け止めるように小さく息を吐いた。','夜の独白')}
 const endedDay=p.endedDay;
 state.pendingNightChoice=null;save();
 await finishEndOfDayTransition(endedDay);
}
function nightEventPrompt(ev,endedDay,effects){
 const c=CHARACTERS[activeId];
 return `結衣専用の夜のランダムイベント。
イベント名:${ev.title}
イベント内容:${ev.desc}
これはDAY ${endedDay}の夜。主人公はその場にいない。
現在体型:Lv.${stageNum()} / ${state.weight.toFixed(1)}kg
現在心理:${psychologicalProfile(c)}
今日の食事量指標:${Math.round(state.dailyFoodLoad||0)} / 食事回数:${state.dailyFoodCount||0}
今日食べたもの:${(state.dailyFoodNames||[]).slice(-6).join('、')||'特になし'}
今日のデート:${state.todayDateName||'なし'}
今回の確定ステータス変化:${effects.join(' / ')||'なし'}
主人公への直接の会話は禁止。結衣が一人で自問自答する。
イベント内容から逸脱せず、現在Lvに合った身体感覚と心理を反映する。
抑止力が高いほど焦り・後悔・自制を強く、低いほど開き直りや誘惑への弱さを強くする。
機嫌が高い時は必要以上に落ち込ませず、低い時は自嘲や後悔を強めてもよい。
毎回同じ語尾・同じ「明日から頑張ろう」で終えない。
dialogueは独り言1〜3文、narrationは1〜3文。`;
}
async function genericEndOfDayMonologue(endedDay){
 const c=CHARACTERS[activeId],before=state.restraint,drift=nightRestraintDrift();
 state.restraint=clamp(state.restraint+drift);
 const summary=recentDaySummary(endedDay);
 const ctx=`1日の終わりに主人公がいない場所で一人で考える独白。
DAY ${endedDay}。今日の主な出来事:${summary}
現在の心理:${psychologicalProfile(c)}
抑止力:${before}→${state.restraint} (${drift>=0?'+':''}${drift})
主人公への直接会話は禁止。`;
 try{const r=await askAI('（一日の終わり、一人で今日を振り返る）',null,null,ctx);addBubble('system',`DAY ${endedDay} 終了後のひとりごと`,'夜のランダムイベント');addAIResponse(r,'夜の独白')}
 catch(e){addNarration(`${c.name}は一人で今日一日のことを思い返した。`,'夜の独白')}
 return true;
}
async function maybeEndOfDayMonologue(endedDay){
 if(!state||state.lastNightEventDay===endedDay)return false;
 state.lastNightEventDay=endedDay;
 if(Math.random()>.70){save();return false}
 if(activeId==='erika'){save();return false}
 if(activeId!=='yui')return await genericEndOfDayMonologue(endedDay);
 const ev=chooseYuiNightEvent();if(!ev)return false;
 if(ev.choice)return createSweetTemptationChoice(ev,endedDay);
 const lv=stageNum(),path=ev.cg?nightEventCGPath(ev,lv):'',title=`結衣の夜 Lv.${lv}：${ev.title}`;
 const effects=applySimpleNightEffect(ev);
 rememberNightEvent(ev,endedDay);
 if(path){unlockCG(`night:yui:${ev.id}:${lv}`,title,path);addCGMessage(title,path,'夜の思い出CG')}
 addBubble('system',`DAY ${endedDay}｜${ev.title}`,'夜のランダムイベント');
 const ctx=nightEventPrompt(ev,endedDay,effects);
 try{const r=await askAI(`（夜、一人で「${ev.title}」の出来事を振り返る）`,null,null,ctx);addAIResponse(r,'夜の独白')}
 catch(e){addNarration(`結衣は一人になった部屋で、「${ev.title}」のことを静かに考えた。`,'夜の独白')}
 if(effects.length)addBubble('system',effects.join('｜'),'夜イベント効果');
 remember('night',`DAY ${endedDay}の夜、「${ev.title}」が起きた`,3,['night',ev.id]);
 log(`夜イベント: ${ev.title}${effects.length?' / '+effects.join(' / '):''}`);
 save();return true;
}
function resetDailyNightTrackers(){
 state.dailyFoodLoad=0;state.dailyFoodCount=0;state.dailyFoodNames=[];state.todayDateKey=null;state.todayDateName=null;
 state.erikaDayHungerStrain=false;state.erikaFoodGuiltToday=0;
}
async function finishEndOfDayTransition(endedDay){
 state.turn=0;state.day++;
 if(state.day%5===0)remember('milestone',`${cnameSafe()}との時間がDAY ${state.day}まで続いている`,2,['milestone']);
 const prevStage=evolutionStage();
 state.weight=Math.max(30,state.weight+(state.fullness>70?.08:state.fullness<20?-.03:0));
 updateEvolution(CHARACTERS[activeId]);queueWeightEventIfNeeded(CHARACTERS[activeId],prevStage);
 if(activeId==='emi')applyEmiDailySystems();
 resetDailyNightTrackers();
 state.lastFoodWasRefused=false;state.lastFoodTurnKey=null;
 log('翌日に進みました');addBubble('system',`${turns[state.turn].label}になりました。`);
 save();render();
 if(!state.pendingWeightEvent&&!state.pendingDate){
 maybeYuiBellyGrab(false);
 if(activeId==='erika')await maybeErikaDaypartEvent();
 if(!blockingEventType())await maybeCharacterInitiatedEvent(false);
 if(activeId==='emi'){
   if(state.turn===2)maybeEmiIzakayaShift();
   if(!blockingEventType())maybeEmiSystemTurnEvent();
 }
}
}

function decay(){
 state.fullness=clamp(state.fullness-20);
 state.hunger=clamp(state.hunger+18);
 state.mood=clamp(state.mood+(Math.random()*4-2));
 if(activeId==='erika'){
   const lv=stageNum();
   // Lv1〜2はそもそも体型を気にして自制していない。
   // Lv3以降は「上がるが長続きしない」性質を強くする。
   const erosion=[0,0,5,7,9,12,15][lv-1];
   if(erosion>0){
     state.restraint=clamp(state.restraint-erosion);
     log(`絵里香の自制が早く揺らぐ：抑止力 -${erosion}（体型Lv.${lv}）`);
   }
 }
 if(activeId==='emi'){
   erodeEmiRestraint('時間経過');
 }
}
async function advance(){
 if(blockingEventType()){showBlockingNotice();return}
 if(state&&state.pendingInitiatedChoice){addBubble('system','相手からの問いかけに先に答えてください。','イベント中');return}
 if(state&&state.pendingWeightEvent){addBubble('system','体重変化イベントの選択肢を先に選んでください。','イベント中');return}
 if(state&&state.pendingDate){addBubble('system','デート中イベントの選択肢を先に選んでください。','デート中');return}
 const erikaNeglectDelta=applyErikaNeglectTick();
 if(erikaNeglectDelta<0)addBubble('system',`絵里香はあまり構ってもらえなかったことを気にしている。機嫌 ${erikaNeglectDelta}`,'依存度');
 decay();
 if(state.turn>=2){
   const endedDay=state.day;
   const nightResult=await maybeEndOfDayMonologue(endedDay);
   if(nightResult==='pending'){save();render();return}
   await finishEndOfDayTransition(endedDay);
   return;
 }else{
   state.turn++;
   log('次の時間帯へ進みました');
 }
 state.lastFoodWasRefused=false;state.lastFoodTurnKey=null;
 addBubble('system',`${turns[state.turn].label}になりました。`);
 save();render();
 if(!state.pendingWeightEvent&&!state.pendingDate){
 maybeYuiBellyGrab(false);
 if(activeId==='erika')await maybeErikaDaypartEvent();
 if(!blockingEventType())await maybeCharacterInitiatedEvent(false);
 if(activeId==='emi'){
   if(state.turn===2)maybeEmiIzakayaShift();
   if(!blockingEventType())maybeEmiSystemTurnEvent();
 }
}
}
const MEAL_CATEGORIES={
 japanese:{name:'和食',tiers:[
  {label:'焼き魚定食',price:700,fullness:24,weight:.08,restraintHit:3,tags:['rice']},
  {label:'ご飯大盛り定食',price:950,fullness:32,weight:.13,restraintHit:4,tags:['rice']},
  {label:'ご飯おかわり付き御膳',price:1250,fullness:42,weight:.20,restraintHit:5,tags:['rice']},
  {label:'特盛和食御膳',price:1650,fullness:54,weight:.30,restraintHit:7,tags:['rice']},
  {label:'特盛御膳＋丼もの追加',price:2200,fullness:66,weight:.43,restraintHit:9,tags:['rice']},
  {label:'豪華和食膳＋大盛り丼＋甘味',price:2900,fullness:78,weight:.60,restraintHit:11,tags:['rice','sweet']},
  {label:'超特盛和食フルコース＋おかわり自由',price:3800,fullness:90,weight:.82,restraintHit:14,tags:['rice','sweet']}
 ]},
 ramen:{name:'ラーメン',tiers:[
  {label:'醤油ラーメン',price:850,fullness:30,weight:.12,restraintHit:5,tags:['noodle','oily']},
  {label:'チャーシューメン',price:1100,fullness:39,weight:.19,restraintHit:6,tags:['noodle','oily']},
  {label:'濃厚ラーメン＋半チャーハン',price:1450,fullness:50,weight:.29,restraintHit:8,tags:['noodle','oily']},
  {label:'特盛ラーメン＋チャーハン',price:1900,fullness:62,weight:.42,restraintHit:10,tags:['noodle','oily']},
  {label:'背脂特盛ラーメン＋大盛りチャーハン＋餃子',price:2500,fullness:74,weight:.58,restraintHit:12,tags:['noodle','oily']},
  {label:'超濃厚メガ盛りラーメン＋丼＋餃子',price:3300,fullness:86,weight:.78,restraintHit:15,tags:['noodle','oily']},
  {label:'限界盛りラーメンセット＋替え玉・ご飯付き',price:4300,fullness:96,weight:1.02,restraintHit:18,tags:['noodle','oily']}
 ]},
 fried:{name:'揚げ物',tiers:[
  {label:'唐揚げ',price:650,fullness:27,weight:.11,restraintHit:5,tags:['oily']},
  {label:'唐揚げ定食',price:950,fullness:38,weight:.18,restraintHit:7,tags:['oily']},
  {label:'揚げ物盛り合わせ定食',price:1350,fullness:50,weight:.28,restraintHit:9,tags:['oily']},
  {label:'特盛揚げ物プレート',price:1800,fullness:63,weight:.43,restraintHit:11,tags:['oily']},
  {label:'メガ唐揚げ＆とんかつ盛り＋大盛りご飯',price:2400,fullness:75,weight:.59,restraintHit:13,tags:['oily','rice']},
  {label:'揚げ物オールスター盛り＋特盛ご飯',price:3200,fullness:87,weight:.80,restraintHit:16,tags:['oily','rice']},
  {label:'超重量級フライ盛り＋おかわりご飯',price:4200,fullness:97,weight:1.05,restraintHit:19,tags:['oily','rice']}
 ]},
 dessert:{name:'デザート',tiers:[
  {label:'ショートケーキ',price:550,fullness:17,weight:.07,restraintHit:5,tags:['sweet']},
  {label:'ケーキ＋アイス',price:800,fullness:25,weight:.12,restraintHit:7,tags:['sweet']},
  {label:'大きめパフェ',price:1150,fullness:35,weight:.19,restraintHit:9,tags:['sweet']},
  {label:'スペシャルデザートプレート',price:1600,fullness:47,weight:.29,restraintHit:11,tags:['sweet']},
  {label:'特大パフェ＋ケーキ2種＋アイス',price:2200,fullness:60,weight:.42,restraintHit:13,tags:['sweet']},
  {label:'メガ盛りスイーツタワー',price:3000,fullness:74,weight:.59,restraintHit:16,tags:['sweet']},
  {label:'超巨大デザートビュッフェセット',price:4000,fullness:88,weight:.82,restraintHit:19,tags:['sweet']}
 ]}
};
const GIFTS={
 snack:{name:'お菓子の詰め合わせ',price:700,baseAffection:2,mood:2,tags:['sweet','food'],food:{name:'お菓子の詰め合わせ',fullness:18,weight:.10,restraintHit:5,tags:['sweet'],isGift:true}},
 flowers:{name:'花束',price:1800,baseAffection:4,mood:5,tags:['romantic']},
 sweets:{name:'高級スイーツBOX',price:2800,baseAffection:6,mood:7,tags:['sweet','luxury','food'],food:{name:'高級スイーツBOX',fullness:30,weight:.20,restraintHit:8,tags:['sweet'],isGift:true}},
 cosmetics:{name:'コスメセット',price:3200,baseAffection:6,mood:6,tags:['beauty']},
 bakery:{name:'人気店のパン詰め合わせ',price:3600,baseAffection:7,mood:7,tags:['sweet','food'],food:{name:'パン詰め合わせ',fullness:34,weight:.23,restraintHit:8,tags:['bread'],isGift:true}},
 accessory:{name:'アクセサリー',price:4500,baseAffection:8,mood:7,tags:['fashion','romantic']},
 clothes:{name:'洋服',price:6500,baseAffection:10,mood:8,tags:['fashion']},
 luxury:{name:'高級なプレゼント',price:9000,baseAffection:13,mood:10,tags:['luxury','romantic']}
};
const GIFT_PREFERENCES={
 risa:{sweet:2,romantic:2,beauty:1,fashion:2,luxury:0},
 emi:{sweet:1,romantic:-1,beauty:-1,fashion:0,luxury:-1},
 yui:{sweet:2,romantic:2,beauty:1,fashion:1,luxury:1},
 erika:{sweet:0,romantic:1,beauty:3,fashion:3,luxury:3},
 rei:{sweet:1,romantic:0,beauty:0,fashion:1,luxury:1}
};
const DATES={
 park:{name:'公園',price:0,affection:3,mood:4},
 cafe:{name:'カフェ',price:1600,affection:5,mood:6},
 shopping:{name:'ショッピング',price:3000,affection:6,mood:6},
 movie:{name:'映画',price:2600,affection:6,mood:7},
 amusement:{name:'遊園地',price:5200,affection:9,mood:10},
 restaurant:{name:'レストラン',price:6500,affection:10,mood:9}
};
const DATE_PREFERENCES={
 risa:{park:2,cafe:2,shopping:1,movie:1,amusement:3,restaurant:1},
 emi:{park:2,cafe:0,shopping:-1,movie:0,amusement:3,restaurant:0},
 yui:{park:1,cafe:3,shopping:1,movie:3,amusement:0,restaurant:3},
 erika:{park:-1,cafe:1,shopping:3,movie:1,amusement:1,restaurant:3},
 rei:{park:2,cafe:2,shopping:0,movie:3,amusement:0,restaurant:1}
};
const DATE_EVENTS={
 park:{text:'公園を歩いていると、屋台とベンチが見えてきた。',choices:[
  {label:'そのまま散歩を続ける',affection:2,mood:3,restraint:-1,note:'二人でゆっくり散歩した。'},
  {label:'クレープを買って一緒に食べる',cost:900,food:{name:'クレープ',fullness:22,weight:.13,restraintHit:6,tags:['sweet']},affection:2,mood:4,note:'クレープを食べながら休憩した。'},
  {label:'ベンチで長く話す',affection:4,mood:2,note:'ベンチで落ち着いて話した。'}]},
 cafe:{text:'カフェに入り、追加注文をするか話している。',choices:[
  {label:'飲み物だけにする',affection:2,mood:2,note:'飲み物だけで会話を楽しんだ。'},
  {label:'ケーキセットを勧める',cost:1300,food:{name:'ケーキセット',fullness:30,weight:.20,restraintHit:8,tags:['sweet']},affection:3,mood:5,note:'ケーキセットを追加した。'},
  {label:'デザートをもう一品追加する',cost:2100,food:{name:'追加デザート2品',fullness:42,weight:.32,restraintHit:11,tags:['sweet']},affection:2,mood:6,note:'デザートを追加で楽しんだ。'}]},
 shopping:{text:'買い物の途中。フードコートの前を通りかかった。',choices:[
  {label:'買い物を続けて歩き回る',affection:2,mood:4,fullness:-5,restraint:-1,note:'そのまま買い物を続けた。'},
  {label:'ラーメンを食べて休憩する',cost:1600,food:{name:'フードコートのラーメン',fullness:34,weight:.23,restraintHit:8,tags:['ramen']},affection:3,mood:4,note:'ラーメンで休憩した。'},
  {label:'スイーツ店にも寄る',cost:1900,food:{name:'買い物途中のスイーツ',fullness:28,weight:.19,restraintHit:7,tags:['sweet']},affection:3,mood:5,note:'スイーツ店にも寄った。'}]},
 movie:{text:'映画の前。売店で何を買うか選ぶことになった。',choices:[
  {label:'飲み物だけ買う',cost:500,affection:2,mood:2,note:'飲み物だけで映画を観た。'},
  {label:'ポップコーンをシェアする',cost:1100,food:{name:'大きめポップコーン',fullness:26,weight:.16,restraintHit:6,tags:['snack']},affection:4,mood:4,note:'ポップコーンをシェアした。'},
  {label:'ポップコーン＋ホットドッグ＋甘い飲み物',cost:2200,food:{name:'映画館フードセット',fullness:44,weight:.34,restraintHit:11,tags:['fried','sweet']},affection:3,mood:6,note:'映画館フードをたっぷり楽しんだ。'}]},
 amusement:{text:'遊園地で遊んでいると、食べ歩きエリアに着いた。',choices:[
  {label:'乗り物を優先して遊ぶ',affection:4,mood:6,fullness:-6,note:'食べ歩きよりアトラクションを優先した。'},
  {label:'チュロスとアイスを買う',cost:1600,food:{name:'チュロス＆アイス',fullness:32,weight:.22,restraintHit:8,tags:['sweet']},affection:4,mood:7,note:'甘いものを食べ歩いた。'},
  {label:'食べ歩きを何軒も回る',cost:3600,food:{name:'遊園地食べ歩きセット',fullness:55,weight:.46,restraintHit:14,tags:['sweet','fried']},affection:5,mood:9,note:'何軒も食べ歩きを楽しんだ。'}]},
 restaurant:{text:'レストランでメインを食べ終えた。まだ追加注文ができそうだ。',choices:[
  {label:'ここで食事を終える',affection:3,mood:3,note:'満足したところで食事を終えた。'},
  {label:'デザートを追加する',cost:1800,food:{name:'レストランデザート',fullness:28,weight:.19,restraintHit:7,tags:['sweet']},affection:4,mood:5,note:'食後のデザートも楽しんだ。'},
  {label:'追加料理＋デザートまで頼む',cost:4200,food:{name:'追加コース＆デザート',fullness:58,weight:.52,restraintHit:15,tags:['fried','sweet']},affection:5,mood:8,note:'追加料理までたっぷり注文した。'}]}
}; 
function emiDateEvent(key){
 const lv=stageNum();
 const diet=!!state.emiDietMode;
 const retired=state.emiTrackActive===false||lv>=6;
 const maps={
  park:[
   {text:'公園のランニングコースに着くと、絵美は楽しそうに軽く身体をほぐし、「せっかくだし少し走ろっか」と先に駆け出した。フォームは軽快で、主人公を振り返る余裕まである。',choices:[
    {label:'本気で追いかける',affection:4,mood:5,fullness:-8,note:'絵美のペースに合わせて一緒に走った。絵美は最後まで余裕を保っていた。'},
    {label:'「やっぱり速いね」と褒める',affection:5,mood:4,fullness:-5,note:'走りながら絵美のフォームと速さを素直に褒めた。'},
    {label:'景色を楽しみながら軽く走る',affection:3,mood:4,fullness:-4,note:'競争にはせず、軽いジョギングを一緒に楽しんだ。'}]},
   {text:'絵美は主人公より前を走っているが、前回より少しだけ呼吸が早い。それでも振り返って笑い、「まだ追いつけないの？」と軽くからかっている。',choices:[
    {label:'少しペースを上げて追いつく',affection:4,mood:4,fullness:-7,note:'主人公がペースを上げ、絵美のすぐ後ろまで追いついた。'},
    {label:'無理せず絵美の後ろを走る',affection:3,mood:4,fullness:-5,note:'絵美のペースに合わせ、二人で気持ちよく走った。'},
    {label:'「今日は少し息上がってない？」と聞く',affection:2,mood:1,restraint:2,note:'少し呼吸が早いことを指摘すると、絵美は気のせいだと笑って流した。'}]},
   {text:'最初は絵美が先行したが、中盤から少しずつペースが落ち、主人公との差が縮まってきた。本人もそれに気づき、焦ったように時計と主人公を交互に見ている。',choices:[
    {label:'絵美の横まで追いついてペースを合わせる',affection:5,mood:4,fullness:-6,note:'主人公が横まで追いつき、無理に競わず並んで走った。'},
    {label:'「今日は軽めでいいんじゃない？」と提案する',affection:4,mood:3,restraint:2,note:'調子が悪い日もあると伝え、ペースを落とした。'},
    {label:'そのまま勝負を続ける',affection:2,mood:-2,fullness:-8,restraint:3,note:'絵美は負けたくない気持ちから無理にペースを上げた。'}]},
   {text:'公園を走っていると、ついに主人公が絵美へ追いついた。絵美は驚いて横を見るが、すでに息が上がり、汗も目立っている。',choices:[
    {label:'速度を落として並んで走る',affection:5,mood:4,fullness:-5,note:'主人公が速度を合わせ、二人で並んで走った。'},
    {label:'「少し休憩しよう」と声をかける',affection:5,mood:5,restraint:2,note:'近くのベンチで少し休み、絵美は呼吸を整えた。'},
    {label:'あと少しだけ一緒に走る',affection:3,mood:1,fullness:-7,restraint:3,note:'もう少しだけ走ったが、絵美の疲れはかなり目立った。'}]},
   {text:'走り始めてしばらくすると主人公が先へ出た。絵美は悔しそうに追いかけるが差は縮まらず、呼吸もかなり荒くなっている。',choices:[
    {label:'振り返って絵美を待つ',affection:5,mood:4,fullness:-4,note:'主人公が速度を落として待ち、絵美と合流した。'},
    {label:'ベンチで休憩することを提案する',affection:5,mood:5,restraint:2,note:'二人でベンチへ移動し、絵美は悔しそうに息を整えた。'},
    {label:'「無理しなくていいよ」と伝える',affection:4,mood:3,restraint:3,note:'昔のペースにこだわらなくてもいいと落ち着かせた。'}]},
   {text:'退部後の絵美と公園を走ってみると、主人公がすぐ先へ出た。絵美は追おうとするが長く続かず、立ち止まって膝に手をつきながら荒い呼吸を整えている。',choices:[
    {label:'すぐ絵美のところへ戻る',affection:5,mood:5,note:'主人公はすぐ引き返し、絵美が落ち着くまでそばにいた。'},
    {label:'「今日は歩こう」と切り替える',affection:5,mood:4,note:'ランニングをやめ、二人でゆっくり歩くデートに切り替えた。'},
    {label:'「前より走れなくなったね」と言う',affection:-2,mood:-5,restraint:4,note:'昔との違いを直接言われ、絵美はかなり悔しそうにした。'}]},
   {text:'公園で軽く走り始めたものの、絵美は序盤から呼吸が乱れ、ほどなく足を止めた。膝に両手をついて前かがみになり、汗を流しながら何度も大きく息をしている。',choices:[
    {label:'飲み物を渡してゆっくり休ませる',affection:5,mood:5,note:'主人公が飲み物を渡し、絵美はベンチでしばらく休んだ。'},
    {label:'この後は散歩にしようと提案する',affection:5,mood:4,note:'運動の強度を落とし、ゆっくり公園を歩くことにした。'},
    {label:'「無理しなくても楽しく過ごせるよ」と伝える',affection:5,mood:4,restraint:1,note:'走れないことを責めず、デート自体を楽しもうと伝えた。'}]}
  ],
  cafe:[
   {text:'カフェに入ると、絵美は迷わず飲み物だけを注文した。ケーキのショーケースにもほとんど目を向けない。',choices:[{label:'飲み物だけでゆっくり話す',affection:4,mood:4,note:'飲み物だけで会話を楽しんだ。'},{label:'主人公だけ軽食を頼む',affection:3,mood:3,note:'絵美は自分は食べず、主人公の軽食を気にせず会話した。'}]},
   {text:'飲み物を選んだあと、絵美は小さなスイーツを一つ追加した。まだカロリーを気にする様子はなく、美味しそうに食べている。',choices:[{label:'小さなスイーツを一緒に楽しむ',cost:800,food:{name:'小さなスイーツ',fullness:18,weight:.09,restraintHit:4,tags:['sweet']},affection:4,mood:5,note:'小さなスイーツを一つ食べた。'},{label:'飲み物だけに戻す',affection:3,mood:2,note:'追加注文はせず飲み物だけで過ごした。'}]},
   {text:`${diet?'ダイエット中の':'体型を気にし始めた'}絵美は飲み物だけにするつもりだったが、ショーケースのケーキを何度も見ている。`,choices:[{label:'飲み物だけにする',affection:4,mood:2,restraint:4,note:'食べたい気持ちはあったが飲み物だけにした。'},{label:'ケーキを一つだけ頼む',cost:1200,food:{name:'ケーキ',fullness:27,weight:.17,restraintHit:8,tags:['sweet']},affection:4,mood:5,note:'迷った末にケーキを一つ食べた。'}]},
   {text:'結局ケーキを注文した絵美は、美味しそうに食べながらも途中で少し表情を曇らせる。食べたい気持ちと体型への焦りがぶつかっている。',choices:[{label:'ケーキ一つをゆっくり食べる',cost:1200,food:{name:'ケーキ',fullness:30,weight:.20,restraintHit:9,tags:['sweet']},affection:4,mood:5,note:'ケーキ一つをゆっくり楽しんだ。'},{label:'「今日は楽しんでもいいんじゃない？」と伝える',cost:1500,food:{name:'ケーキと甘い飲み物',fullness:40,weight:.29,restraintHit:11,tags:['sweet']},affection:5,mood:6,note:'ケーキと甘い飲み物を楽しんだが、少し罪悪感も残った。'},{label:'追加はせず会話を続ける',affection:4,mood:3,restraint:3,note:'それ以上は食べず、会話を楽しんだ。'}]},
   {text:'絵美はケーキと甘い飲み物を前に、嬉しそうにしながらも「また食べてるな」と自分でも気づいている。',choices:[{label:'ケーキと飲み物だけにする',cost:1600,food:{name:'ケーキと甘い飲み物',fullness:43,weight:.31,restraintHit:12,tags:['sweet']},affection:5,mood:6,note:'ケーキと飲み物で終えた。'},{label:'もう一品スイーツを追加する',cost:2400,food:{name:'ケーキと追加スイーツ',fullness:61,weight:.48,restraintHit:16,tags:['sweet']},affection:5,mood:7,note:'迷いながらもスイーツを追加した。'},{label:'ここで止めておく',affection:4,mood:2,restraint:5,note:'食べたい気持ちを抑え、追加注文はしなかった。'}]},
   {text:'退部後の絵美は、以前なら選ばなかったケーキや甘い飲み物を複数気にしている。食べることへの抵抗は弱くなったが、ふと自分のお腹へ視線を落とした。',choices:[{label:'好きなケーキを一つ選ぶ',cost:1500,food:{name:'ケーキセット',fullness:36,weight:.27,restraintHit:10,tags:['sweet']},affection:4,mood:5,note:'好きなケーキを一つ選んで食べた。'},{label:'ケーキと追加スイーツを頼む',cost:2700,food:{name:'ケーキと追加スイーツ',fullness:66,weight:.54,restraintHit:17,tags:['sweet']},affection:5,mood:8,note:'複数のスイーツを楽しんだ。'},{label:'飲み物だけに切り替える',affection:4,mood:1,restraint:5,note:'迷ったが飲み物だけにした。'}]},
   {text:'テーブルには複数のスイーツと甘い飲み物。絵美はかなり満腹そうなのに、最後のケーキへまだ視線を向けている。',choices:[{label:'ここで食べるのを止める',affection:4,mood:1,restraint:7,note:'満腹を自覚し、残りは無理に食べなかった。'},{label:'最後のケーキまで食べる',cost:2200,food:{name:'複数スイーツとケーキ',fullness:76,weight:.70,restraintHit:20,tags:['sweet']},affection:5,mood:7,note:'満腹ながら最後のケーキまで食べた。'},{label:'二人で少しずつシェアする',cost:1800,food:{name:'シェアしたスイーツ',fullness:52,weight:.42,restraintHit:14,tags:['sweet']},affection:5,mood:6,note:'残りは主人公とシェアして楽しんだ。'}]}
  ],
  shopping:[
   {text:'スポーツショップで絵美は新しいウェアを身体に当て、鏡の前で主人公へ見せている。引き締まった体型に自信があり、楽しそうだ。',choices:[{label:'「すごく似合ってる」と伝える',affection:5,mood:5,note:'スポーツウェア姿を褒めた。'},{label:'一緒に別のウェアも選ぶ',affection:4,mood:4,note:'二人でスポーツウェアを何着か見て回った。'}]},
   {text:'以前と同じサイズを試着すると、少しだけ身体へのフィット感が強い。絵美は「こんなもんでしょ」と深く気にしていない。',choices:[{label:'今のサイズで似合っていると伝える',affection:4,mood:4,note:'少しぴったりした服をそのまま楽しんだ。'},{label:'別サイズも試してみる',affection:3,mood:3,note:'念のため別サイズも試すことにした。'}]},
   {text:'試着室で以前のサイズのボトムスを履くと、予想よりウエストがきつい。絵美はタグと自分の腰回りを交互に見ている。',choices:[{label:'無理せず一つ上のサイズも試す',affection:5,mood:3,restraint:2,note:'一つ上のサイズを試し、今の身体に合う服を探した。'},{label:'「まだ十分似合ってるよ」と伝える',affection:4,mood:4,note:'体型だけに触れず似合っていることを伝えた。'},{label:'以前よりきつそうだと指摘する',affection:-2,mood:-4,restraint:4,note:'サイズ変化を直接指摘され、絵美はむっとした。'}]},
   {text:'スポーツウェアを試着した絵美は、腹部や腰回りが以前より窮屈なことに気づき、鏡の前で横向きになって確認している。',choices:[{label:'今の体型に合うデザインを一緒に探す',affection:5,mood:4,note:'無理に以前と同じ形へこだわらず、似合う服を探した。'},{label:'少し休んでから別の店も見る',affection:4,mood:3,note:'試着をいったんやめて気分を切り替えた。'},{label:'スポーツウェア以外も見てみる',affection:4,mood:4,note:'普段着も含めて楽しく買い物を続けた。'}]},
   {text:'昔と同じサイズの練習用ショートパンツを試すが、ウエストがかなりきつい。絵美は何度も引き上げながら、悔しそうに眉を寄せている。',choices:[{label:'「無理に昔のサイズに合わせなくていいよ」と言う',affection:5,mood:3,restraint:1,note:'今の身体に合うサイズを選ぶよう促した。'},{label:'一つ上のサイズを持ってくる',affection:5,mood:4,note:'主人公が自然に別サイズを探した。'},{label:'昔のサイズとの差を話題にする',affection:-2,mood:-5,restraint:4,note:'昔との違いを言われ、絵美はかなり悔しそうにした。'}]},
   {text:'退部後、スポーツウェア売り場の前で絵美が足を止めた。昔なら迷わず選んだ細身のウェアを見つめたあと、視線を普段着売り場へ向ける。',choices:[{label:'「着たい服を選べばいいよ」と伝える',affection:5,mood:5,note:'昔の自分に縛られず、今着たい服を一緒に選んだ。'},{label:'普段着を一緒に選ぶ',affection:5,mood:4,note:'スポーツウェアを離れ、似合う普段着を探した。'},{label:'スポーツウェアも一着だけ見てみる',affection:4,mood:2,note:'少し複雑そうだったが、スポーツウェアも一着だけ確認した。'}]},
   {text:'大きめの服を試着した絵美は、余裕ができた着心地には安心しつつ、サイズタグを見て複雑そうにしている。',choices:[{label:'サイズより似合うかどうかで選ぶ',affection:5,mood:5,note:'数字より今の絵美に似合う服を基準に選んだ。'},{label:'動きやすい服を一緒に探す',affection:4,mood:4,note:'今の身体でも快適に着られる服を探した。'},{label:'タグを気にしていることに触れる',affection:2,mood:-2,restraint:2,note:'サイズを気にしていることを指摘され、絵美は少し恥ずかしそうにした。'}]}
  ],
  amusement:[
   {text:'遊園地に着くと、絵美は主人公より先に歩きながら次のアトラクションを指差している。朝から何個も乗るつもりで元気いっぱいだ。',choices:[{label:'絵美について次々乗る',affection:5,mood:7,fullness:-6,note:'朝からアトラクションを何個も楽しんだ。'},{label:'途中で写真も撮りながら回る',affection:5,mood:6,fullness:-4,note:'アトラクションと写真撮影を楽しんだ。'}]},
   {text:'まだ活発にアトラクションを回る絵美は、途中で軽食を一つ買って楽しそうに食べている。運動量も多く、本人は特に気にしていない。',choices:[{label:'軽食を一緒に食べる',cost:1000,food:{name:'遊園地の軽食',fullness:24,weight:.13,restraintHit:5,tags:['fried']},affection:5,mood:7,note:'軽食を食べてすぐ次のアトラクションへ向かった。'},{label:'乗り物を優先する',affection:4,mood:6,fullness:-6,note:'軽食は後回しにしてアトラクションを回った。'}]},
   {text:'歩き回って少し疲れた絵美は、フードワゴンの食べ物へ何度も視線を向けている。ダイエットも気になり、買うか迷っている。',choices:[{label:'飲み物だけ買って休憩する',cost:500,affection:4,mood:4,note:'飲み物だけで短く休憩した。'},{label:'軽食を一つだけ食べる',cost:1100,food:{name:'遊園地の軽食',fullness:28,weight:.17,restraintHit:7,tags:['fried']},affection:5,mood:6,note:'軽食を一つだけ食べた。'},{label:'そのまま次の乗り物へ行く',affection:3,mood:2,fullness:-5,restraint:3,note:'食べ物は我慢して次のアトラクションへ向かった。'}]},
   {text:'アトラクションを回る途中で絵美の息が少し上がってきた。食べ物を片手にベンチへ座り、以前より疲れやすくなったことを気にしている。',choices:[{label:'ベンチでゆっくり休む',affection:5,mood:5,note:'焦らずベンチで休憩した。'},{label:'軽食をシェアして休む',cost:1300,food:{name:'遊園地の軽食',fullness:31,weight:.20,restraintHit:8,tags:['fried']},affection:5,mood:7,note:'軽食をシェアしながら休憩した。'},{label:'次はゆったりした乗り物にする',affection:5,mood:5,note:'体力を使いすぎないアトラクションへ切り替えた。'}]},
   {text:'絵美はアトラクションよりフードワゴンを気にする時間が増えている。歩き疲れてベンチに座り、高カロリーな軽食を手にしながら少し罪悪感を浮かべている。',choices:[{label:'一品だけ一緒に食べる',cost:1400,food:{name:'遊園地の高カロリー軽食',fullness:38,weight:.29,restraintHit:11,tags:['fried']},affection:5,mood:6,note:'一品だけ食べて休憩した。'},{label:'食べ歩きを少し楽しむ',cost:2400,food:{name:'遊園地食べ歩き',fullness:57,weight:.45,restraintHit:15,tags:['fried','sweet']},affection:5,mood:8,note:'いくつか食べ歩きを楽しんだ。'},{label:'ここでは休憩だけにする',affection:4,mood:2,restraint:4,note:'食べ物は追加せず休憩だけにした。'}]},
   {text:'退部後の絵美はベンチに座り、いくつかの遊園地グルメを前にしている。遠くのアトラクションを見ながら、昔なら一日中動き回れたことを思い出している。',choices:[{label:'好きなものを一つずつ楽しむ',cost:2200,food:{name:'遊園地グルメ',fullness:55,weight:.43,restraintHit:14,tags:['fried','sweet']},affection:5,mood:8,note:'休憩しながら遊園地グルメを楽しんだ。'},{label:'食事よりゆっくり園内を回る',affection:5,mood:5,note:'無理に乗り物を詰め込まずゆっくり園内を回った。'},{label:'昔の話を聞く',affection:5,mood:3,note:'以前の自分を思い出しながら、絵美の陸上の話を聞いた。'}]},
   {text:'少し歩いただけで疲れた絵美は、食べ物と飲み物を前にベンチで休んでいる。遊園地での過ごし方が、昔とはかなり変わったことを本人も感じている。',choices:[{label:'無理せず食べ歩き中心で楽しむ',cost:2600,food:{name:'遊園地食べ歩きセット',fullness:70,weight:.61,restraintHit:18,tags:['fried','sweet']},affection:5,mood:8,note:'乗り物を無理に回らず、食べ歩きと休憩中心で楽しんだ。'},{label:'景色やショーを中心に回る',affection:5,mood:6,note:'体力を使いすぎずショーや景色を楽しんだ。'},{label:'食べる量は少し抑える',affection:4,mood:1,restraint:5,note:'食べ歩きを控えめにしてゆっくり過ごした。'}]}
  ],
  movie:[
   {text:'映画館の売店で、絵美は飲み物だけを選んだ。軽食は買わず、上映を楽しみにしている。',choices:[{label:'飲み物だけで映画を見る',cost:500,affection:4,mood:5,note:'飲み物だけで映画を楽しんだ。'},{label:'そのまま席へ向かう',affection:4,mood:4,note:'売店では何も追加せず上映を待った。'}]},
   {text:'絵美は小さなポップコーンを選び、主人公と分けながら映画を見るつもりらしい。食べる量は特に気にしていない。',choices:[{label:'小さなポップコーンをシェアする',cost:900,food:{name:'小さなポップコーン',fullness:20,weight:.10,restraintHit:4,tags:['snack']},affection:5,mood:6,note:'小さなポップコーンを二人でシェアした。'},{label:'飲み物だけにする',cost:500,affection:4,mood:4,note:'ポップコーンは買わず飲み物だけにした。'}]},
   {text:'ポップコーンを買うか迷った絵美は、ダイエットを意識しながら小さめのサイズを手にしている。',choices:[{label:'小さいサイズをシェアする',cost:900,food:{name:'小さなポップコーン',fullness:21,weight:.11,restraintHit:5,tags:['snack']},affection:5,mood:5,note:'小さいポップコーンをシェアした。'},{label:'飲み物だけにする',cost:500,affection:4,mood:2,restraint:3,note:'迷った末、飲み物だけにした。'}]},
   {text:'上映中、絵美は大きめのポップコーンへ無意識に何度も手を伸ばしている。途中でかなり減っていることに気づき、少し驚いた。',choices:[{label:'そのまま二人でシェアする',cost:1200,food:{name:'大きめポップコーン',fullness:34,weight:.21,restraintHit:8,tags:['snack']},affection:5,mood:6,note:'大きめポップコーンを二人で食べた。'},{label:'途中で食べるのを止める',affection:4,mood:2,restraint:4,note:'減った量に気づき、途中で手を止めた。'}]},
   {text:'大きなポップコーンと甘い飲み物を手にして映画を見ていた絵美は、かなり食べ進めたところで我に返り、少し気まずそうに容器を見ている。',choices:[{label:'ポップコーンと飲み物を楽しむ',cost:1800,food:{name:'大ポップコーンと甘い飲み物',fullness:48,weight:.35,restraintHit:12,tags:['snack','sweet']},affection:5,mood:7,note:'映画を見ながらポップコーンと甘い飲み物を楽しんだ。'},{label:'残りは主人公が食べる',affection:5,mood:3,restraint:4,note:'絵美は途中で食べるのを止め、残りを主人公へ渡した。'}]},
   {text:'退部後の絵美は、大きなポップコーンに軽食、甘い飲み物まで選んでいる。上映中につい手が止まらなくなりそうだ。',choices:[{label:'映画館フードを一緒に楽しむ',cost:2400,food:{name:'映画館フードセット',fullness:62,weight:.50,restraintHit:16,tags:['fried','sweet']},affection:5,mood:8,note:'映画を見ながらフードセットを楽しんだ。'},{label:'ポップコーンだけにする',cost:1200,food:{name:'ポップコーン',fullness:35,weight:.22,restraintHit:9,tags:['snack']},affection:4,mood:5,note:'軽食は追加せずポップコーンだけにした。'}]},
   {text:'大容量のポップコーンと複数の軽食を前に、絵美は映画を楽しみながらかなり食べている。食べ終わった容器の多さには本人も気づいている。',choices:[{label:'そのまま最後まで楽しむ',cost:2900,food:{name:'大容量映画館フード',fullness:78,weight:.72,restraintHit:20,tags:['fried','sweet']},affection:5,mood:8,note:'かなり満腹になるまで映画館フードを楽しんだ。'},{label:'軽食は途中で残す',affection:4,mood:2,restraint:5,note:'満腹を感じ、途中で食べるのを止めた。'},{label:'二人で分けながらゆっくり食べる',cost:2100,food:{name:'シェアした映画館フード',fullness:55,weight:.44,restraintHit:14,tags:['fried','sweet']},affection:5,mood:7,note:'主人公と分けながらゆっくり食べた。'}]}
  ],
  restaurant:[
   {text:'レストランでは、絵美は栄養バランスの良い料理を普通量だけ選んだ。競技者として食事管理することが自然になっている。',choices:[{label:'バランスの良い食事を一緒に楽しむ',cost:1200,food:{name:'バランスの良い食事',fullness:30,weight:.11,restraintHit:3,tags:['rice']},affection:5,mood:6,note:'適量の食事を楽しんだ。'},{label:'食後は追加せず会話を楽しむ',affection:4,mood:5,note:'追加注文はせず会話を楽しんだ。'}]},
   {text:'通常の料理に加えて、絵美は小さなサイドメニューも気にしている。まだ体型変化は意識せず、純粋にお腹が空いているようだ。',choices:[{label:'小さなサイドも追加する',cost:1500,food:{name:'メインと小さなサイド',fullness:38,weight:.18,restraintHit:5,tags:['rice']},affection:5,mood:6,note:'サイドメニューも追加して楽しんだ。'},{label:'メインだけで終える',affection:4,mood:4,note:'追加せずメインだけで食事を終えた。'}]},
   {text:'ダイエットを意識する絵美は軽めの料理を選んだが、追加メニューや主人公の料理へ何度も視線を向けている。',choices:[{label:'軽めの料理だけにする',cost:1200,food:{name:'軽めの料理',fullness:26,weight:.10,restraintHit:3,tags:['rice']},affection:4,mood:3,restraint:3,note:'ダイエットを優先し軽めの料理だけにした。'},{label:'サイドを一つ追加する',cost:1800,food:{name:'軽めの料理とサイド',fullness:39,weight:.21,restraintHit:8,tags:['rice','fried']},affection:5,mood:5,note:'迷った末、サイドを一つ追加した。'}]},
   {text:'メインを食べ終えた絵美は追加料理を気にしている。頼みたい気持ちはあるが、食べた後に後悔することも分かっている。',choices:[{label:'デザートだけ追加する',cost:1600,food:{name:'食後のデザート',fullness:29,weight:.19,restraintHit:8,tags:['sweet']},affection:5,mood:6,note:'デザートだけ追加した。'},{label:'追加料理を一品頼む',cost:2100,food:{name:'追加料理',fullness:41,weight:.29,restraintHit:11,tags:['fried']},affection:5,mood:6,note:'追加料理を一品食べた。'},{label:'ここで終える',affection:4,mood:2,restraint:4,note:'追加注文はせず食事を終えた。'}]},
   {text:'テーブルには複数の料理とデザート。絵美はかなり食べ進めており、満腹なのにまだ食欲が残っていることへ自分でも戸惑っている。',choices:[{label:'追加料理とデザートを楽しむ',cost:3200,food:{name:'追加料理とデザート',fullness:68,weight:.57,restraintHit:17,tags:['fried','sweet']},affection:5,mood:8,note:'かなり満腹になるまで追加料理とデザートを食べた。'},{label:'デザートだけにする',cost:1700,food:{name:'食後のデザート',fullness:31,weight:.21,restraintHit:9,tags:['sweet']},affection:4,mood:5,note:'追加料理はやめ、デザートだけ楽しんだ。'},{label:'ここで食事を終える',affection:4,mood:1,restraint:5,note:'満腹を優先し追加注文はやめた。'}]},
   {text:'退部後の絵美は、高カロリーなメインにサイド、デザートまで気にしている。以前なら自然にかけていた食事のブレーキが少し弱くなっている。',choices:[{label:'食べたいものを二人で楽しむ',cost:3600,food:{name:'メイン・サイド・デザート',fullness:76,weight:.68,restraintHit:19,tags:['fried','sweet']},affection:5,mood:8,note:'メインからデザートまでしっかり楽しんだ。'},{label:'メインとサイドだけにする',cost:2500,food:{name:'メインとサイド',fullness:56,weight:.43,restraintHit:14,tags:['fried']},affection:4,mood:6,note:'デザートは追加せず食事を終えた。'},{label:'量を少し控える',affection:4,mood:2,restraint:5,note:'昔との違いを意識し、追加注文は控えた。'}]},
   {text:'テーブルいっぱいの料理とデザートを前に、絵美はかなり満腹そうだ。それでも最後のデザートへ手を伸ばすか迷っている。',choices:[{label:'最後のデザートまで食べる',cost:4200,food:{name:'満腹レストランフルセット',fullness:92,weight:.92,restraintHit:23,tags:['fried','sweet']},affection:5,mood:8,note:'かなり満腹になりながら最後のデザートまで食べた。'},{label:'デザートは主人公とシェアする',cost:2800,food:{name:'シェアしたデザート付き食事',fullness:66,weight:.54,restraintHit:16,tags:['fried','sweet']},affection:5,mood:7,note:'最後のデザートは主人公とシェアした。'},{label:'ここで食べるのを止める',affection:4,mood:1,restraint:7,note:'満腹を認め、追加のデザートはやめた。'}]}
  ]
 };
 const arr=maps[key];
 return arr?arr[Math.max(0,Math.min(6,lv-1))]:null;
}

function yuiShoppingEvent(){
 const lv=stageNum();
 const defs=[
  {text:'試着室で気になる服を試すことになった。今の結衣なら余裕をもって着られそうだ。',label:'鏡で似合うか確認する',note:'いつものサイズを自然に着こなして、鏡の前で確認した。',affection:4,mood:4},
  {text:'試着してみると、以前より生地が身体に沿う感覚が少し強い。',label:'「よく似合ってる」と伝える',note:'少しフィット感が増した服を、照れながら確認した。',affection:4,mood:3},
  {text:'試着室でウエストを合わせると、少し力を入れないと閉まりにくい。',label:'急かさず見守る',note:'ウエストを気にしながらも、なんとか自分で留めた。',affection:4,mood:2},
  {text:'試着したボトムのホックが届かない。結衣は何度か引き寄せるが、どうしても閉まらない。',label:'別サイズを一緒に探す',note:'ホックが閉まらず、別サイズを探すことにした。',affection:5,mood:1},
  {text:'以前選んでいたサイズを試すが、お腹がウエストに乗り、引っ張ってもホックが閉まらない。',label:'無理に閉めなくていいと伝える',note:'かなりサイズが合わなくなったことを、本人もはっきり自覚した。',affection:5,mood:1},
  {text:'大きめのサイズを選び直したのに、まだウエストがかなり窮屈だ。',label:'さらに大きいサイズを探す',note:'サイズを見直しながら、昔との違いに戸惑った。',affection:4,mood:0},
  {text:'かなり大きいサイズを試しても身体にぴったり沿う。鏡の前で、結衣は変化を強く実感している。',label:'今の結衣に合う服を一緒に選ぶ',note:'今の体型に合う服を前向きに探した。',affection:5,mood:2}
 ][lv-1];
 return {text:defs.text,choices:[
   {label:defs.label,affection:defs.affection,mood:defs.mood,note:defs.note,shoppingMemory:true},
   {label:'「別のデザインも見よう」と提案する',affection:3,mood:3,note:'体型のことだけに触れず、別の服も一緒に探した。',shoppingMemory:true},
   {label:lv>=4?'「前よりサイズ上がったね」と言う':'「少しぴったりしてるね」と言う',
    affection:lv>=4?-3:-1,mood:lv>=4?-4:-2,restraint:lv>=4?4:2,
    note:'体型変化を直接指摘され、結衣は少し恥ずかしそうにした。',shoppingMemory:true}
 ]};
}
function erikaParkEvent(){
 const lv=stageNum(),aff=Math.round(state.affection);
 if(lv<=2){const low=aff<40;return {text:low?'公園に着いた絵里香は露骨につまらなそうにしている。「どうしてわたくしが、あなたと公園なんか……」と不満を隠さない。':'公園を歩く絵里香は少し退屈そうだが、主人公と一緒なら仕方ないと付き合っている。',auto:true,choices:[{auto:true,label:'公園を散歩する',affection:low?0:2,mood:low?-4:1,note:low?'公園という行き先が気に入らず、絵里香は終始不機嫌だった。':'食べ物にはほとんど興味を示さず二人で公園を歩いた。'}]};}
 const d={
 3:{text:'公園を歩いているとクレープの屋台が目に入り、絵里香の視線が一瞬止まる。',choices:[{label:'そのまま散歩を続ける',affection:3,mood:2,note:'クレープを気にしながらも散歩を続けた。'},{label:'クレープを一つ買う',cost:800,food:{name:'公園のクレープ',fullness:22,weight:.13,restraintHit:7,tags:['sweet']},affection:4,mood:5,note:'気になっていたクレープを一つ食べた。',erikaDependency:true}]},
 4:{text:'クレープとソフトクリームの屋台が並び、絵里香は何度もそちらを見ている。',choices:[{label:'飲み物だけ買って休む',cost:400,affection:3,mood:3,note:'飲み物だけで休憩した。'},{label:'クレープを買う',cost:800,food:{name:'公園のクレープ',fullness:24,weight:.15,restraintHit:8,tags:['sweet']},affection:4,mood:5,note:'クレープを食べて休憩した。',erikaDependency:true},{label:'クレープとソフトクリームを買う',cost:1300,food:{name:'クレープ＆ソフトクリーム',fullness:37,weight:.25,restraintHit:11,tags:['sweet']},affection:4,mood:6,note:'甘いものを二つ続けて食べた。',erikaDependency:true}]},
 5:{text:'少し歩いただけで休憩したくなった絵里香は、ベンチより先に屋台のメニューを確認している。',choices:[{label:'ベンチで休むだけにする',affection:3,mood:2,note:'食べ物は買わずベンチで休んだ。'},{label:'ホットスナックを買う',cost:1100,food:{name:'公園のホットスナック',fullness:34,weight:.24,restraintHit:10,tags:['fried']},affection:4,mood:5,note:'ホットスナックを食べた。',erikaDependency:true},{label:'ホットスナックとクレープを買う',cost:1800,food:{name:'ホットスナック＆クレープ',fullness:52,weight:.39,restraintHit:14,tags:['fried','sweet']},affection:5,mood:7,note:'軽食と甘いものまで食べた。',erikaDependency:true}]},
 6:{text:'絵里香は歩くより屋台を見て回ることに興味を示し、「せっかく来たのですもの」と食べ歩きの理由を作っている。',choices:[{label:'一品だけにする',cost:1000,food:{name:'公園の軽食',fullness:32,weight:.23,restraintHit:10,tags:['fried']},affection:4,mood:4,note:'一品だけと決めて軽食を食べた。',erikaDependency:true},{label:'屋台を二軒回る',cost:1900,food:{name:'公園の食べ歩き2品',fullness:54,weight:.43,restraintHit:15,tags:['fried','sweet']},affection:5,mood:7,note:'二軒の屋台を回って食べ歩いた。',erikaDependency:true},{label:'軽食・クレープ・アイスまで食べる',cost:2900,food:{name:'公園食べ歩きセット',fullness:72,weight:.62,restraintHit:18,tags:['fried','sweet']},affection:5,mood:8,note:'軽食から甘いものまでかなり食べた。',erikaDependency:true},{label:'「今日は控えたら？」と声をかける',affection:1,mood:-2,restraint:5,note:'食べ歩きを控えるよう言われ、不満そうにした。'}]},
 7:{text:'公園に着くなり、絵里香は散歩道より屋台の配置を確認している。以前なら退屈だと言っていた場所が、今は食べ歩きの場所として気になるようだ。',choices:[{label:'屋台を一軒だけ選ぶ',cost:1200,food:{name:'公園の屋台フード',fullness:38,weight:.29,restraintHit:12,tags:['fried']},affection:4,mood:4,note:'一軒だけ選んで食べた。',erikaDependency:true},{label:'食べ歩きを何軒か楽しむ',cost:2600,food:{name:'公園食べ歩き3品',fullness:68,weight:.58,restraintHit:18,tags:['fried','sweet']},affection:5,mood:8,note:'複数の屋台を回りかなり食べた。',erikaDependency:true},{label:'軽食も甘いものも気になるだけ頼む',cost:3800,food:{name:'公園フード満喫セット',fullness:88,weight:.82,restraintHit:21,tags:['fried','sweet']},affection:5,mood:9,note:'目についた軽食と甘いものを次々に食べた。',erikaDependency:true},{label:'途中で食べるのを止めるよう促す',affection:1,mood:-3,restraint:7,note:'まだ食べたそうだったが主人公に止められ不機嫌そうにした。'}]}
 };return d[lv];
}
function erikaCafeEvent(){
 const lv=stageNum();if(lv===1)return {text:'カフェに入ると、絵里香は迷わず紅茶だけを注文した。ショーケースのスイーツにはほとんど目を向けない。',auto:true,choices:[{auto:true,label:'紅茶だけを飲む',affection:2,mood:3,note:'紅茶だけで会話を楽しみ食べ物は注文しなかった。'}]};
 const d={
 2:{text:'紅茶を選んだあと、レジ横の小さな焼き菓子へ一瞬だけ視線を向ける。',choices:[{label:'飲み物だけにする',affection:3,mood:2,note:'紅茶だけにした。'},{label:'小さな焼き菓子を一つ付ける',cost:500,food:{name:'小さな焼き菓子',fullness:14,weight:.07,restraintHit:5,tags:['sweet']},affection:4,mood:4,note:'紅茶と一緒に小さな焼き菓子を食べた。',erikaDependency:true}]},
 3:{text:'ショーケースのケーキを何度も見たあと、絵里香は何でもないようにメニューを閉じる。',choices:[{label:'飲み物だけにする',affection:2,mood:1,note:'気になりながらも飲み物だけにした。'},{label:'ケーキセットを頼む',cost:1200,food:{name:'ケーキセット',fullness:29,weight:.19,restraintHit:9,tags:['sweet']},affection:4,mood:5,note:'ケーキセットを食べた。',erikaDependency:true},{label:'主人公おすすめのケーキも頼む',cost:1600,food:{name:'おすすめケーキセット',fullness:36,weight:.25,restraintHit:11,tags:['sweet']},affection:5,mood:6,note:'主人公に勧められたケーキまで楽しんだ。',erikaDependency:true}]},
 4:{text:'絵里香はケーキを一つ選んだあとも、アイスや季節限定メニューを気にしている。',choices:[{label:'ケーキ一つにする',cost:1200,food:{name:'ケーキセット',fullness:30,weight:.20,restraintHit:9,tags:['sweet']},affection:4,mood:4,note:'ケーキ一つで終えた。',erikaDependency:true},{label:'ケーキ＋アイスにする',cost:1700,food:{name:'ケーキ＆アイス',fullness:42,weight:.29,restraintHit:12,tags:['sweet']},affection:5,mood:6,note:'ケーキにアイスも追加した。',erikaDependency:true},{label:'季節限定スイーツも追加する',cost:2300,food:{name:'ケーキ＆限定スイーツ',fullness:55,weight:.41,restraintHit:15,tags:['sweet']},affection:5,mood:7,note:'限定スイーツまで追加して食べた。',erikaDependency:true}]},
 5:{text:'席に着くなりスイーツメニューを開いた絵里香は、大きなパフェとケーキの両方が気になっている。',choices:[{label:'ケーキセットにする',cost:1300,food:{name:'ケーキセット',fullness:31,weight:.21,restraintHit:10,tags:['sweet']},affection:4,mood:4,note:'ケーキセットだけにした。',erikaDependency:true},{label:'大きめパフェを頼む',cost:1700,food:{name:'大きめパフェ',fullness:47,weight:.33,restraintHit:13,tags:['sweet']},affection:5,mood:6,note:'大きめのパフェを食べた。',erikaDependency:true},{label:'パフェとケーキを両方頼む',cost:2500,food:{name:'パフェ＆ケーキ',fullness:65,weight:.50,restraintHit:17,tags:['sweet']},affection:5,mood:8,note:'パフェとケーキを両方食べた。',erikaDependency:true},{label:'「今日は一つにしたら？」と提案する',affection:2,mood:-1,restraint:4,note:'一つにするよう言われ名残惜しそうにメニューを閉じた。'}]},
 6:{text:'絵里香は最初の注文を決めてもメニューを手放さず、「別に全部食べたいわけではありませんわ」と言いながら追加候補を探している。',choices:[{label:'パフェ一つにする',cost:1800,food:{name:'特大パフェ',fullness:52,weight:.39,restraintHit:15,tags:['sweet']},affection:4,mood:5,note:'特大パフェ一つにした。',erikaDependency:true},{label:'ケーキ2種＋アイスを頼む',cost:2600,food:{name:'ケーキ2種＆アイス',fullness:69,weight:.56,restraintHit:18,tags:['sweet']},affection:5,mood:8,note:'ケーキ二種類とアイスまで食べた。',erikaDependency:true},{label:'スイーツプレートとパフェを頼む',cost:3400,food:{name:'スイーツプレート＆パフェ',fullness:84,weight:.74,restraintHit:21,tags:['sweet']},affection:5,mood:9,note:'スイーツプレートにパフェまで追加した。',erikaDependency:true},{label:'追加注文はやめる',affection:2,mood:-2,restraint:6,note:'追加を諦めたがかなり名残惜しそうだった。'}]},
 7:{text:'カフェに入ると、絵里香は飲み物より先にスイーツメニューを開く。食べたい気持ちは隠しきれないが、注文するたびに体型のことも頭をよぎっている。',choices:[{label:'大きなパフェを一つ頼む',cost:1900,food:{name:'特大パフェ',fullness:55,weight:.42,restraintHit:16,tags:['sweet']},affection:4,mood:5,note:'大きなパフェを一つ食べた。',erikaDependency:true},{label:'ケーキ・アイス・パフェを頼む',cost:3200,food:{name:'ケーキ＆アイス＆パフェ',fullness:79,weight:.69,restraintHit:21,tags:['sweet']},affection:5,mood:9,note:'ケーキ、アイス、パフェまでまとめて食べた。',erikaDependency:true},{label:'気になるスイーツを一通り頼む',cost:4200,food:{name:'カフェスイーツ満喫セット',fullness:94,weight:.91,restraintHit:24,tags:['sweet']},affection:5,mood:10,note:'気になったスイーツを一通り注文しかなり食べた。',erikaDependency:true},{label:'「さすがに食べすぎじゃない？」と言う',affection:0,mood:-4,restraint:8,note:'食べすぎを指摘され図星を突かれて強く不機嫌になった。'}]}
 };return d[lv];
}
function erikaShoppingEvent(){
 const lv=stageNum(),dep=state.growthTraits?.dependence||0;
 const defs=[
  {text:'高級ブランド店の試着室。絵里香は当然のようにいつものサイズを選び、鏡の前で仕上がりを確認している。',label:'「よく似合ってる」と伝える',note:'いつものサイズを自信たっぷりに着こなし、主人公の反応を横目で確認した。',mood:4,restraint:0},
  {text:'試着したスカートのウエストが以前より少しぴったりしている。絵里香は気づいているが、何でもない顔を装っている。',label:'体型には触れず服を褒める',note:'少し窮屈そうでも体型には触れず、服そのものを褒めた。',mood:4,restraint:2},
  {text:'試着室で鏡を見る絵里香は、スカートの上に少し乗るお腹を気にしている。主人公の視線も妙に気になるようだ。',label:'「気にしなくていいよ」と安心させる',note:'お腹を気にする絵里香を、必要以上に体型へ触れず安心させた。',mood:5,restraint:2},
  {text:'いつものサイズのスカートを試すが、ホックを留めるのにかなり苦労する。店員に一つ上のサイズを勧められ、絵里香は露骨に不機嫌そうだ。',label:'自然に別サイズも見てみようと提案する',note:'サイズアップを恥ずかしいことのように扱わず、一緒に別サイズを探した。',mood:3,restraint:4},
  {text:'いくつか試着しただけなのに絵里香は少し息を弾ませ、額に汗を浮かべている。本人はそれを悟られまいと平静を装っている。',label:'休憩しようとさりげなく提案する',note:'疲れを指摘しすぎず、自然に休憩へ誘った。',mood:4,restraint:3},
  {text:'きれいめのジャケットを試した瞬間、胸元から腹部にかけて生地が強く張る。絵里香はボタンを警戒しながら、主人公の表情を気にしている。',label:'今の体型に合う服を一緒に探す',note:'無理に昔のサイズへ戻そうとせず、今似合う服を一緒に選んだ。',mood:5,restraint:3},
  {text:'かなり大きいサイズの服を手に取る絵里香は、以前なら選ばなかった数字を見て複雑そうに黙り込む。それでも主人公が隣にいることを何度も確認している。',label:'「一緒に選ぶから大丈夫」と伝える',note:'サイズの数字ではなく、今の絵里香に似合うものを一緒に選ぶ姿勢を示した。',mood:6,restraint:2}
 ][lv-1];
 const attentionChoice=dep>=55?{label:'「俺にどう見えるか気にしてる？」',affection:4,mood:dep>=75?5:3,note:'主人公の評価を気にしていることへ触れ、絵里香の本音を引き出した。',erikaDependency:true}:{label:'別の服も見て回る',affection:3,mood:3,note:'一着だけにこだわらず絵里香の買い物に付き合った。'};
 return {text:defs.text,choices:[{label:defs.label,affection:4,mood:defs.mood,restraint:defs.restraint,note:defs.note,erikaDate:true},attentionChoice,{label:lv>=3?'「前よりだいぶサイズ上がったな」と言う':'「少しきつそうだな」と言う',affection:lv>=3?-3:-1,mood:lv>=3?-5:-2,restraint:lv>=3?6:3,note:'体型変化を正面から指摘され絵里香は強く動揺した。',erikaDate:true}]};
}
function erikaMovieEvent(){
 const lv=stageNum();if(lv===1)return {text:'映画館の売店を通り過ぎ、絵里香は飲み物だけを手に上映を待っている。軽食には興味を示さない。',auto:true,choices:[{auto:true,label:'飲み物だけで映画を見る',affection:3,mood:4,note:'飲み物だけで映画を楽しみ軽食は買わなかった。'}]};
 const d={
 2:{text:'売店の小さなポップコーンを見て、絵里香が少しだけ迷っている。',choices:[{label:'飲み物だけにする',cost:500,affection:3,mood:3,note:'飲み物だけにした。'},{label:'小さなポップコーンを買う',cost:800,food:{name:'小ポップコーン',fullness:17,weight:.09,restraintHit:6,tags:['snack']},affection:4,mood:4,note:'小さなポップコーンを食べながら映画を見た。',erikaDependency:true}]},
 3:{text:'絵里香はポップコーンのサイズ表を見比べながら、甘い飲み物にも目を向けている。',choices:[{label:'小ポップコーンだけにする',cost:800,food:{name:'小ポップコーン',fullness:18,weight:.10,restraintHit:6,tags:['snack']},affection:3,mood:3,note:'小ポップコーンだけにした。',erikaDependency:true},{label:'大きめポップコーンを買う',cost:1200,food:{name:'大ポップコーン',fullness:29,weight:.18,restraintHit:8,tags:['snack']},affection:4,mood:5,note:'大きめのポップコーンを食べた。',erikaDependency:true},{label:'ポップコーン＋甘い飲み物',cost:1500,food:{name:'ポップコーン＆甘いドリンク',fullness:38,weight:.25,restraintHit:10,tags:['snack','sweet']},affection:4,mood:6,note:'ポップコーンと甘い飲み物を楽しんだ。',erikaDependency:true}]},
 4:{text:'映画が始まる前、絵里香はポップコーンに加えてホットドッグのメニューも気にしている。',choices:[{label:'大ポップコーンにする',cost:1200,food:{name:'大ポップコーン',fullness:30,weight:.19,restraintHit:8,tags:['snack']},affection:4,mood:4,note:'大ポップコーンだけにした。',erikaDependency:true},{label:'ポップコーン＋ホットドッグ',cost:1900,food:{name:'ポップコーン＆ホットドッグ',fullness:48,weight:.34,restraintHit:12,tags:['snack','fried']},affection:5,mood:6,note:'ポップコーンにホットドッグまで追加した。',erikaDependency:true},{label:'飲み物だけにしておく',cost:500,affection:2,mood:0,restraint:4,note:'食べ物を我慢して飲み物だけにした。'}]},
 5:{text:'売店に着くと、絵里香はセットメニューを先に確認する。映画より前に何を食べるかで少し迷っている。',choices:[{label:'ポップコーン＋ホットドッグ',cost:1900,food:{name:'ポップコーン＆ホットドッグ',fullness:50,weight:.36,restraintHit:13,tags:['snack','fried']},affection:4,mood:5,note:'定番の二品を食べた。',erikaDependency:true},{label:'ナチョス＋甘い飲み物',cost:1800,food:{name:'ナチョス＆甘いドリンク',fullness:46,weight:.34,restraintHit:13,tags:['fried','sweet']},affection:4,mood:6,note:'ナチョスと甘い飲み物を楽しんだ。',erikaDependency:true},{label:'大セットを二人でシェアする',cost:2600,food:{name:'映画館大セット',fullness:65,weight:.51,restraintHit:17,tags:['snack','fried','sweet']},affection:5,mood:8,note:'大きなセットをかなり食べた。',erikaDependency:true},{label:'軽食は一つだけにする',cost:900,food:{name:'映画館の軽食一品',fullness:24,weight:.15,restraintHit:8,tags:['snack']},affection:3,mood:2,note:'食べたいものを一つだけ選んだ。',erikaDependency:true}]},
 6:{text:'絵里香はポップコーン、ホットドッグ、ナチョスを順番に見て、どれか一つに絞る気がなかなか起きない。',choices:[{label:'大ポップコーンだけにする',cost:1300,food:{name:'大ポップコーン',fullness:33,weight:.22,restraintHit:10,tags:['snack']},affection:3,mood:3,note:'大ポップコーン一つで我慢した。',erikaDependency:true},{label:'ポップコーン＋ホットドッグ＋ドリンク',cost:2400,food:{name:'映画館ボリュームセット',fullness:65,weight:.52,restraintHit:17,tags:['snack','fried','sweet']},affection:5,mood:8,note:'ボリュームのあるセットを食べた。',erikaDependency:true},{label:'ナチョスも追加する',cost:3100,food:{name:'映画館フード4品セット',fullness:82,weight:.72,restraintHit:21,tags:['snack','fried','sweet']},affection:5,mood:9,note:'ポップコーン、ホットドッグ、ナチョス、甘い飲み物まで食べた。',erikaDependency:true},{label:'「映画が始まるし、もう十分じゃない？」と言う',affection:1,mood:-2,restraint:6,note:'追加を止められ不満そうに売店を離れた。'}]},
 7:{text:'映画館に着くと、絵里香は上映時間より先に売店のフード一覧を確認する。注文する気満々なのに、食べ終えた後のことを考えると表情が少し曇る。',choices:[{label:'大ポップコーンを買う',cost:1400,food:{name:'特大ポップコーン',fullness:40,weight:.29,restraintHit:12,tags:['snack']},affection:3,mood:3,note:'特大ポップコーンだけにした。',erikaDependency:true},{label:'定番フードを一通り頼む',cost:2900,food:{name:'映画館定番フードセット',fullness:75,weight:.65,restraintHit:20,tags:['snack','fried','sweet']},affection:5,mood:8,note:'ポップコーン、ホットドッグ、ナチョスを食べた。',erikaDependency:true},{label:'気になるフードを全部頼む',cost:4100,food:{name:'映画館フード全部盛り',fullness:96,weight:.94,restraintHit:24,tags:['snack','fried','sweet']},affection:5,mood:10,note:'売店で気になったフードをほぼ全部注文した。',erikaDependency:true},{label:'食べすぎを止める',affection:0,mood:-4,restraint:8,note:'まだ注文したそうだったが主人公に止められ不機嫌になった。'}]}
 };return d[lv];
}
function erikaAmusementEvent(){
 const lv=stageNum();if(lv<=2)return {text:lv===1?'遊園地に着いた絵里香は食べ物の屋台には目もくれず次々とアトラクションへ向かう。いつもの高飛車さを忘れるほど楽しそうだ。':'絵里香はまだアトラクション中心で、次に何へ乗るかを楽しそうに考えている。食べ物は後回しだ。',auto:true,choices:[{auto:true,label:'アトラクションを満喫する',affection:4,mood:7,fullness:-5,note:'食べ物には寄らずアトラクションを思い切り楽しんだ。'}]};
 const d={
 3:{text:'次のアトラクションへ向かう途中、チュロスの甘い匂いに絵里香が一瞬足を止める。',choices:[{label:'次のアトラクションへ行く',affection:4,mood:6,fullness:-4,note:'食べ物よりアトラクションを優先した。'},{label:'チュロスを一本買う',cost:700,food:{name:'チュロス',fullness:20,weight:.12,restraintHit:7,tags:['sweet']},affection:4,mood:6,note:'チュロスを一本食べてから遊んだ。',erikaDependency:true}]},
 4:{text:'アトラクションの合間、チュロスとアイスの屋台を見つけた絵里香は休憩を提案する理由を探している。',choices:[{label:'そのまま遊ぶ',affection:4,mood:5,fullness:-4,note:'食べ物は買わずそのまま遊んだ。'},{label:'チュロスとアイスを買う',cost:1500,food:{name:'チュロス＆アイス',fullness:36,weight:.25,restraintHit:11,tags:['sweet']},affection:5,mood:7,note:'甘いものを二つ楽しんだ。',erikaDependency:true},{label:'フードコートで軽く休む',cost:1700,food:{name:'遊園地の軽食',fullness:40,weight:.29,restraintHit:11,tags:['fried']},affection:4,mood:6,note:'フードコートで軽食を食べて休んだ。',erikaDependency:true}]},
 5:{text:'以前より休憩が増えた絵里香は、アトラクションの待ち時間より食べ歩きエリアのメニューを気にしている。',choices:[{label:'アトラクションを優先する',affection:3,mood:3,fullness:-3,note:'少し疲れながらもアトラクションを優先した。'},{label:'チュロス・アイスを食べ歩く',cost:1700,food:{name:'チュロス＆アイス',fullness:39,weight:.28,restraintHit:12,tags:['sweet']},affection:4,mood:7,note:'甘いものを食べ歩いた。',erikaDependency:true},{label:'フードコートでしっかり食べる',cost:2400,food:{name:'遊園地フードセット',fullness:58,weight:.45,restraintHit:16,tags:['fried','sweet']},affection:5,mood:8,note:'休憩しながらしっかり食べた。',erikaDependency:true},{label:'食事してからデザートも食べる',cost:3200,food:{name:'遊園地食事＆デザート',fullness:75,weight:.63,restraintHit:20,tags:['fried','sweet']},affection:5,mood:9,note:'食事のあとにデザートまで食べた。',erikaDependency:true}]},
 6:{text:'遊園地に来たのに、絵里香はアトラクション一覧と同じくらいフードマップを熱心に見ている。',choices:[{label:'アトラクションを一つ乗ってから休む',affection:3,mood:3,note:'まず一つだけ乗ってから休憩した。'},{label:'食べ歩きを何軒か回る',cost:2700,food:{name:'遊園地食べ歩きセット',fullness:68,weight:.57,restraintHit:18,tags:['sweet','fried']},affection:5,mood:8,note:'何軒も食べ歩きを楽しんだ。',erikaDependency:true},{label:'レストランで食事＋スイーツ',cost:3500,food:{name:'遊園地レストラン＆スイーツ',fullness:82,weight:.72,restraintHit:21,tags:['fried','sweet']},affection:5,mood:9,note:'しっかりした食事とスイーツを食べた。',erikaDependency:true},{label:'「食べる方が目的になってない？」と言う',affection:0,mood:-3,restraint:7,note:'図星を突かれて絵里香は強く反発した。'}]},
 7:{text:'遊園地のゲートを抜けた絵里香は、アトラクションより先に期間限定フードを確認する。食べたい気持ちはかなり強いが、食べ終えた後に後悔することも自分で分かっている。',choices:[{label:'好きな屋台を一軒だけ選ぶ',cost:1400,food:{name:'限定屋台フード',fullness:40,weight:.31,restraintHit:13,tags:['fried','sweet']},affection:4,mood:5,note:'一軒だけ選びそこで食べた。',erikaDependency:true},{label:'期間限定フードを食べ歩く',cost:3000,food:{name:'限定フード食べ歩き',fullness:76,weight:.68,restraintHit:21,tags:['fried','sweet']},affection:5,mood:9,note:'限定フードを何種類も食べ歩いた。',erikaDependency:true},{label:'食べ歩き＋レストラン＋デザート',cost:4500,food:{name:'遊園地フード完全満喫',fullness:98,weight:1.02,restraintHit:25,tags:['fried','sweet']},affection:5,mood:10,note:'食べ歩き、レストラン、デザートまでかなり食べた。',erikaDependency:true},{label:'途中で休憩だけに切り替える',affection:2,mood:-2,restraint:7,note:'まだ食べたそうだったが途中で休憩だけに切り替えた。'}]}
 };return d[lv];
}
function erikaRestaurantEvent(){
 const lv=stageNum();if(lv===1)return {text:'メインを食べ終えると、絵里香はナプキンを整えて当然のように食事を終えた。追加注文をする気はない。',auto:true,choices:[{auto:true,label:'追加せず食事を終える',affection:3,mood:4,note:'メインだけで満足し追加注文はしなかった。'}]};
 const d={
 2:{text:'メインを食べ終えたあと、小さなデザートメニューだけ少し気にしている。',choices:[{label:'ここで終える',affection:3,mood:3,note:'追加せず食事を終えた。'},{label:'小さなデザートを追加する',cost:1100,food:{name:'小さなデザート',fullness:18,weight:.10,restraintHit:6,tags:['sweet']},affection:4,mood:4,note:'小さなデザートを追加した。',erikaDependency:true}]},
 3:{text:'食後、絵里香はデザートメニューを閉じたあともう一度開いている。',choices:[{label:'ここで終える',affection:3,mood:2,note:'追加せず終えた。'},{label:'デザートを追加する',cost:1600,food:{name:'レストランデザート',fullness:27,weight:.18,restraintHit:8,tags:['sweet']},affection:4,mood:5,note:'食後のデザートを食べた。',erikaDependency:true},{label:'主人公おすすめの一品を追加する',cost:2000,food:{name:'おすすめ追加料理',fullness:35,weight:.25,restraintHit:10,tags:['fried']},affection:5,mood:5,note:'主人公に勧められた追加料理を食べた。',erikaDependency:true}]},
 4:{text:'メインを食べ終えたのに、絵里香は「まだ少しくらいなら」と追加メニューに目を落としている。',choices:[{label:'デザートだけ追加する',cost:1700,food:{name:'食後のデザート',fullness:29,weight:.20,restraintHit:9,tags:['sweet']},affection:4,mood:4,note:'デザートだけ追加した。',erikaDependency:true},{label:'追加料理を一品頼む',cost:2200,food:{name:'追加料理',fullness:39,weight:.29,restraintHit:11,tags:['fried']},affection:4,mood:5,note:'追加料理を一品食べた。',erikaDependency:true},{label:'追加料理＋デザート',cost:3100,food:{name:'追加料理＆デザート',fullness:58,weight:.47,restraintHit:16,tags:['fried','sweet']},affection:5,mood:7,note:'追加料理にデザートまで食べた。',erikaDependency:true}]},
 5:{text:'食事を終えるタイミングになっても、絵里香は追加料理とデザートの両方を気にしている。',choices:[{label:'追加料理を一品だけ',cost:2200,food:{name:'追加料理一品',fullness:40,weight:.30,restraintHit:12,tags:['fried']},affection:4,mood:4,note:'追加料理一品だけにした。',erikaDependency:true},{label:'デザートを2品頼む',cost:2600,food:{name:'デザート2品',fullness:49,weight:.39,restraintHit:14,tags:['sweet']},affection:4,mood:6,note:'デザートを二品食べた。',erikaDependency:true},{label:'追加料理＋デザート2品',cost:3900,food:{name:'追加料理＆デザート2品',fullness:73,weight:.66,restraintHit:20,tags:['fried','sweet']},affection:5,mood:9,note:'追加料理にデザート二品まで食べた。',erikaDependency:true},{label:'ここで終えようと提案する',affection:2,mood:-2,restraint:5,note:'まだ食べたそうだったがここで食事を終えた。'}]},
 6:{text:'メインを食べ終えた絵里香は、追加メニューを当然のように手元へ残している。「少しくらいなら」と言いながら候補は一つではない。',choices:[{label:'追加料理＋デザート',cost:3300,food:{name:'追加料理＆デザート',fullness:62,weight:.53,restraintHit:17,tags:['fried','sweet']},affection:4,mood:6,note:'追加料理とデザートを食べた。',erikaDependency:true},{label:'追加料理を二品＋デザート',cost:4300,food:{name:'追加料理2品＆デザート',fullness:84,weight:.79,restraintHit:22,tags:['fried','sweet']},affection:5,mood:9,note:'追加料理を二品とデザートまで食べた。',erikaDependency:true},{label:'おすすめを気になるだけ追加する',cost:5200,food:{name:'追加フルコース',fullness:98,weight:1.05,restraintHit:25,tags:['fried','sweet']},affection:5,mood:10,note:'追加の料理とデザートをかなり多く食べた。',erikaDependency:true},{label:'「もう十分じゃない？」と止める',affection:1,mood:-3,restraint:7,note:'追加を止められ絵里香は不満そうにメニューを閉じた。'}]},
 7:{text:'メインを食べ終えたあとも、絵里香は満腹そうにお腹を気にしながら追加メニューを見ている。食べたい気持ちと、食べた後に必ず後悔することの両方を自覚している。',choices:[{label:'デザートだけ追加する',cost:1900,food:{name:'大きなデザート',fullness:35,weight:.26,restraintHit:11,tags:['sweet']},affection:3,mood:3,note:'大きなデザートだけ追加した。',erikaDependency:true},{label:'追加料理＋デザート2品',cost:4300,food:{name:'追加料理＆デザート2品',fullness:82,weight:.77,restraintHit:22,tags:['fried','sweet']},affection:5,mood:8,note:'追加料理とデザート二品を食べた。',erikaDependency:true},{label:'食べたいものを全部追加する',cost:5800,food:{name:'追加料理フルセット',fullness:105,weight:1.18,restraintHit:27,tags:['fried','sweet']},affection:5,mood:10,note:'食べたい追加料理とデザートをほぼ全部頼んだ。',erikaDependency:true},{label:'追加注文をやめさせる',affection:0,mood:-4,restraint:9,note:'まだ食べたそうだったが主人公に止められ強く不満を見せた。'}]}
 };return d[lv];
}
function getDateEvent(key){
 if(activeId==='emi'){const ev=emiDateEvent(key);if(ev)return ev;}
 if(key==='shopping'&&activeId==='yui')return yuiShoppingEvent();
 if(activeId==='erika'){if(key==='park')return erikaParkEvent();if(key==='cafe')return erikaCafeEvent();if(key==='shopping')return erikaShoppingEvent();if(key==='movie')return erikaMovieEvent();if(key==='amusement')return erikaAmusementEvent();if(key==='restaurant')return erikaRestaurantEvent();}
 return DATE_EVENTS[key];
}

function mealFor(key){
 const map={japanese:'japanese',ramen:'ramen',fried:'fried',dessert:'dessert'};
 const k=map[key]||'dessert';
 // 自発的な食事提案でも通常の食事定義と同じ現在Lv向けデータを使う。
 // 以前は未定義の mealData() を呼んでいたため、選択時に ReferenceError で停止していた。
 return getMealOffer(k);
}
function mealTier(){const d=state.weight-state.startWeight;if(d<3)return 0;if(d<8)return 1;if(d<15)return 2;if(d<25)return 3;if(d<40)return 4;if(d<60)return 5;return 6}
function mealTierLabel(){const i=mealTier();return ['+0〜3kg未満','+3〜8kg','+8〜15kg','+15〜25kg','+25〜40kg','+40〜60kg','+60kg以上'][i]}
function getMealOffer(category){const cat=MEAL_CATEGORIES[category]||MEAL_CATEGORIES.japanese;const item=cat.tiers[mealTier()];return {...item,id:category,name:item.label,category,isGift:false}}
function detectFoodOffer(text){let category=null;if(/ラーメン/.test(text))category='ramen';else if(/揚げ|唐揚げ|からあげ|フライ|とんかつ/.test(text))category='fried';else if(/ケーキ|スイーツ|デザート|パフェ|アイス|チョコ/.test(text))category='dessert';else if(/和食|定食|ご飯|ごはん|寿司|魚/.test(text))category='japanese';if(!category||!/食べ|行こ|行か|どう|奢|おご/.test(text))return null;return getMealOffer(category)}
async function foodEvent(){
 if(blockingEventType()){showBlockingNotice();return}
 markErikaAttention('食事の誘い');if(state&&state.pendingWeightEvent){addBubble('system','体重変化イベントの選択肢を先に選んでください。','イベント中');return}const offer=getMealOffer($('mealSelect').value);state.money=state.money??2500;if(state.money<offer.price){addBubble('system',`${offer.name}を勧めるには ¥${offer.price.toLocaleString()} 必要です。バイトでお金を稼いでください。`,'所持金不足');return}state.money-=offer.price;const pressure=state.lastFoodWasRefused&&state.lastFoodTurnKey===currentTurnKey();let pressureResult=null;if(pressure){pressureResult=pressurePenalty('いいから食べてよ');addBubble('system',pressureResult.summary,'強引な再提案')}addBubble('user',`${offer.name}食べない？`,`購入 ¥${offer.price.toLocaleString()}`);const result=resolveFoodOffer(offer);addBubble('system',result.summary,'食事判定');log(`${offer.name}を購入 ¥${offer.price}。${result.accepted?'食べた':'断った'}`);try{const aiResult=await askAI(`${offer.name}食べない？`,result,pressureResult);addAIResponse(aiResult,`${turns[state.turn].label} / DAY ${state.day}`)}catch(e){const errMsg=e&&e.message?e.message:String(e);addBubble('system','AI接続エラー：'+errMsg+'\nデモ返答に切り替えました。','API ERROR',false);addAIResponse(demoStructuredReply('',result,pressureResult),`${turns[state.turn].label} / DAY ${state.day}`);log('API接続エラー: '+errMsg)}
 if(result&&result.accepted)await maybeYuiOvereatHook('食事');
 save();render()}
function earlyStageGainBoost(){
 const st=evolutionStage();
 return [1.45,1.30,1.18,1.08,1,1,1][st]||1;
}
function gainFactor(c){
 const tendency=c.gainTendency==='太りやすい'?1.35:c.gainTendency==='太りにくい'?.75:c.gainTendency==='かなり太りにくい'?.55:1;
 let mult=tendency*earlyStageGainBoost();
 if(c.id==='emi'&&evolutionStage()>=5)mult*=1.18;
 return mult;
}
function foodAcceptanceChance(c,offer){let score=48;score+=(state.affection-50)*0.28;score+=(state.hunger-40)*0.42;score-=state.fullness*0.38;score-=state.restraint*0.42;if(c.appetite==='よく食べる')score+=14;if(c.appetite==='少食')score-=12;if(state.favoriteFoods.some(x=>offer.name.includes(x)||x.includes(offer.name)))score+=18;
 const learned=foodExperience(foodGrowthKey(offer));
 score+=(learned.liking||0)*.22;
 if(c.id==='yui'&&foodGrowthKey(offer)==='fried')score+=(state.growthTraits?.oilyPreference||0)*.18;
 score+=characterFoodModifier(c,offer).accept;
 if(c.id==='risa'&&(offer.tags.includes('sweet')||offer.tags.includes('bread')))score+=26;
 if(c.id==='emi'){
   const lv=stageNum();
   if(lv<=2){
     // Lv1〜2は「太るから我慢」ではない。抑止力の影響をほぼ消し、満腹感を強く効かせる。
     score+=state.restraint*.42;
     score-=Math.max(0,state.fullness-50)*1.15;
     if(state.fullness>=80)score=Math.min(score,8);
     if(state.fullness>=90)score=Math.min(score,2);
   }else{
     score-=state.restraint*.18;
   }
 }
 if(c.id==='yui'){score+=20;if(offer.isGift)score=96;else score=Math.max(score,70-state.fullness*0.18)}
 if(c.id==='erika'){const dep=state.growthTraits?.dependence||0;score-=state.restraint*0.28;score+=dep*.22;if(dep>=65)score+=6;}
 if(c.id==='rei')score+=(state.weight-state.startWeight)*2.2;
 return clamp(score,2,97)}
function resolveFoodOffer(offer,text){
 const c=CHARACTERS[activeId];if(!offer)return null;
 updateEvolution(c);
 const chance=foodAcceptanceChance(c,offer);let accepted=Math.random()*100<chance;
 if(c.id==='yui'&&offer.isGift)accepted=true;
 if(c.id==='yui'&&!offer.isGift&&state.restraint>=75&&state.fullness<92)accepted=Math.random()<0.82;
 if(c.id==='erika'&&state.restraint>=85&&state.affection<70&&(state.growthTraits?.dependence||0)<40)accepted=Math.random()<0.08;
 const before={fullness:state.fullness,hunger:state.hunger,restraint:state.restraint,weight:state.weight,weightInterest:state.weightInterest||0};
 let regret=0,weightGain=0,restraintDelta=0,fullnessDelta=0;
 if(accepted){
   state.dailyFoodLoad=(state.dailyFoodLoad||0)+(offer.fullness||0);
   state.dailyFoodCount=(state.dailyFoodCount||0)+1;
   state.dailyFoodNames=state.dailyFoodNames||[];state.dailyFoodNames.push(offer.name||'食事');
   fullnessDelta=Math.max(6,Math.round(offer.fullness*(100-state.fullness)/100+offer.fullness*.35));
   state.fullness=clamp(state.fullness+fullnessDelta);state.hunger=clamp(state.hunger-fullnessDelta);
   weightGain=offer.weight*gainFactor(c)*(0.85+Math.random()*.3);
   state.weight=Math.round((state.weight+weightGain)*10)/10;
   updateEvolution(c);
   restraintDelta=restraintGainAfterEating(c,offer,before);
   if(c.id==='yui'&&before.restraint>=65){
     regret=Math.round((before.restraint-55)*.9+8);
     state.mood=clamp(state.mood-Math.min(12,Math.round(regret/5)));
   }
   if(c.id==='erika'){
     const eg=erikaFoodGuilt(offer,before);
     regret=eg.guilt;
     state.erikaFoodGuiltToday=Math.max(state.erikaFoodGuiltToday||0,eg.guilt);
     restraintDelta+=eg.restraintBonus;
     state.mood=clamp(state.mood-eg.moodLoss);
   }
   if(c.id==='rei'){
     const d=weightGainAmount();
     state.weightInterest=Math.min(100,Math.max(state.weightInterest||0,Math.round(d*2.2+evolutionStage()*7)));
     if((state.weightInterest||0)>=50)restraintDelta=0;
     state.mood=clamp(state.mood+Math.min(8,Math.round(d*.7)));
   }
   if(c.id==='erika'&&restraintDelta>0)restraintDelta=erikaRestraintDelta(restraintDelta,'食後');
   state.restraint=clamp(state.restraint+restraintDelta);
 }else{
   // 断る＝我慢で消耗。ここは従来通り抑止力を下げる。
   restraintDelta=-Math.max(1,Math.round(2+state.restraint/40));
   if(c.id==='erika'){
     const lv=stageNum();
     // 高Lvほど、食べたいのに断る行為そのものが大きな我慢疲れになる。
     restraintDelta-=Math.max(1,lv+Math.max(0,lv-3));
   }
   if(c.id==='emi'){
     const lv=stageNum();
     if(lv<=2){
       // 満腹で断るだけなので「ダイエット成功」のように抑止力は上がらない。
       restraintDelta=-1;
     }else{
       // Lv3以降は断ること自体が我慢疲れになり、次の誘惑に弱くなる。
       restraintDelta-=Math.min(7,lv+1);
     }
   }
   state.restraint=clamp(state.restraint+restraintDelta);state.mood=clamp(state.mood-1);
   if(c.id==='emi'&&stageNum()<=2)capEmiLowStageRestraint('食事を断った後');
 }
 recordFoodGrowth(offer,accepted,offer.isGift?'食べ物プレゼント':'主人公からの食事提案');
 const result={accepted,food:offer.name,isGift:offer.isGift,chance:Math.round(chance),fullnessDelta,weightGain:Number(weightGain.toFixed(2)),restraintDelta,regret,before,after:{fullness:state.fullness,hunger:state.hunger,restraint:state.restraint,weight:state.weight,weightInterest:state.weightInterest||0},summary:accepted?`${c.name}は${offer.name}を食べた。満腹度 +${fullnessDelta}、体重 +${weightGain.toFixed(2)}kg相当、食後の罪悪感・自制で抑止力 ${restraintDelta>=0?'+':''}${restraintDelta}${c.id==='rei'&&restraintDelta===0?'（体重増加への興味が育ち、今回は上昇なし）':''}${regret?`、罪悪感 ${regret}`:''}`:`${c.name}は${offer.name}を断った。我慢で抑止力 ${restraintDelta}`,log:accepted?`${offer.name}を受け入れた（判定${Math.round(chance)}%）。満腹度 +${fullnessDelta} / 体重 +${weightGain.toFixed(2)}kg / 抑止力 ${restraintDelta>=0?'+':''}${restraintDelta}`:`${offer.name}を断った（判定${Math.round(chance)}%）。我慢で抑止力 ${restraintDelta}`};
 state.lastFoodResult=result;state.lastFoodWasRefused=!accepted;state.lastFoodTurnKey=currentTurnKey();log(result.log);save();render();return result;
}
function workIncome(){return Math.min(5000,1200+Math.floor((state.workCount||0)/3)*350)}
function doWork(){
 if(state&&state.pendingWeightEvent){addBubble('system','体重変化イベントの選択肢を先に選んでください。','イベント中');return}
 if(state&&state.pendingDate){addBubble('system','デート中イベントを終えてからバイトしてください。','デート中');return}
 state.money=state.money??2500;state.workCount=state.workCount||0;const income=workIncome();state.workCount++;state.money+=income;
 addBubble('system',`主人公はバイトで ¥${income.toLocaleString()} 稼ぎました。バイトをしたため時間が進みます。`,`主人公のバイト #${state.workCount}`);
 log(`主人公のバイト +¥${income}（通算${state.workCount}回）`);
 advance();
}
function applyGuaranteedFoodEffect(food,sourceLabel='食事'){
 const c=CHARACTERS[activeId];updateEvolution(c);
 const before={fullness:state.fullness,hunger:state.hunger,restraint:state.restraint,weight:state.weight,weightInterest:state.weightInterest||0};
 state.dailyFoodLoad=(state.dailyFoodLoad||0)+(food.fullness||0);
 state.dailyFoodCount=(state.dailyFoodCount||0)+1;
 state.dailyFoodNames=state.dailyFoodNames||[];state.dailyFoodNames.push(food.name||sourceLabel||'食事');
 const fullnessDelta=Math.max(5,Math.round(food.fullness*(100-state.fullness)/100+food.fullness*.35));
 state.fullness=clamp(state.fullness+fullnessDelta);state.hunger=clamp(state.hunger-fullnessDelta);
 const prevStage=evolutionStage();let weightGain=(food.weight||.1)*gainFactor(c)*(0.85+Math.random()*.3);
 state.weight=Math.round((state.weight+weightGain)*10)/10;updateEvolution(c);queueWeightEventIfNeeded(c,prevStage);
 let restraintDelta=restraintGainAfterEating(c,{...food,restraintHit:food.restraintHit||5},before),regret=0;
 if(c.id==='yui'&&before.restraint>=65){regret=Math.round((before.restraint-55)*.9+8);state.mood=clamp(state.mood-Math.min(12,Math.round(regret/5)))}
 if(c.id==='erika'){
   const eg=erikaFoodGuilt(food,before);
   regret=eg.guilt;
   state.erikaFoodGuiltToday=Math.max(state.erikaFoodGuiltToday||0,eg.guilt);
   restraintDelta+=eg.restraintBonus;
   state.mood=clamp(state.mood-eg.moodLoss);
 }
 if(c.id==='rei'){const d=weightGainAmount();state.weightInterest=Math.min(100,Math.max(state.weightInterest||0,Math.round(d*2.2+evolutionStage()*7)));if((state.weightInterest||0)>=50)restraintDelta=0}
 if(c.id==='erika'&&restraintDelta>0)restraintDelta=erikaRestraintDelta(restraintDelta,sourceLabel);
 state.restraint=clamp(state.restraint+restraintDelta);
 if(c.id==='emi'&&stageNum()<=2)capEmiLowStageRestraint(sourceLabel);
 recordFoodGrowth(food,true,sourceLabel);
 log(`${sourceLabel}: ${food.name}。満腹度+${fullnessDelta} / 体重+${weightGain.toFixed(2)}kg / 抑止力${restraintDelta>=0?'+':''}${restraintDelta}${regret?` / 罪悪感${regret}`:''}`);
 return {fullnessDelta,weightGain:Number(weightGain.toFixed(2)),restraintDelta,regret};
}
function giftPreferenceScore(c,g){const p=GIFT_PREFERENCES[c.id]||{};return (g.tags||[]).reduce((a,t)=>a+(p[t]||0),0)}
async function giveGift(){
 if(blockingEventType()){showBlockingNotice();return}
 markErikaAttention('プレゼント');
 if(state&&state.pendingWeightEvent){addBubble('system','体重変化イベントの選択肢を先に選んでください。','イベント中');return}
 const g=GIFTS[$('giftSelect').value],c=CHARACTERS[activeId];state.money=state.money??2500;if(!g)return;
 if(state.money<g.price){addBubble('system',`${g.name}を買うには ¥${g.price.toLocaleString()} 必要です。`,'所持金不足');return}
 const btn=$('giftBtn');if(btn){btn.disabled=true;btn.textContent='反応中…'}
 const pref=giftPreferenceScore(c,g);let chance=clamp(48+(state.affection-30)*.72+(state.mood-50)*.12+pref*8-state.restraint*.06+relationshipMechanicBonus()*.45,8,97);
 if(c.id==='yui')chance=99;if(c.id==='erika'){const dep=state.growthTraits?.dependence||0;chance-=Math.max(0,(state.restraint-50)*.35);if(state.affection<30)chance-=15;if(pref>=2)chance+=18;chance+=dep*.18;if(dep>=70)chance+=6}
 if(c.id==='emi'&&g.tags.includes('romantic')&&state.affection<55)chance-=18;
 const before={affection:state.affection,mood:state.mood,weight:state.weight,fullness:state.fullness,restraint:state.restraint,money:state.money};
 const accepted=Math.random()*100<chance;state.money-=g.price;let ag=0,mg=0,foodEffect=null;
 if(accepted){
  // プレゼントによる好感度上昇は、デートや会話より伸びすぎないよう抑制。
  // 好みに合うほど少し上乗せされるが、最大でも +8 に制限する。
  ag=Math.min(8,Math.max(1,Math.round(g.baseAffection*.5*(1+pref*.10))));
  mg=Math.max(1,Math.round(g.mood*(1+Math.max(0,pref)*.12)));
  state.affection=clamp(state.affection+ag);
  state.mood=clamp(state.mood+mg);
  if(g.food)foodEffect=applyGuaranteedFoodEffect(g.food,'食べ物プレゼント')
}
 addBubble('user',`${g.name}、プレゼント。`,`購入 ¥${g.price.toLocaleString()}`);

 const ctx=`プレゼントイベント。
プレゼント:${g.name}
ゲーム側の確定結果:${accepted?'受け取った':'断った'}
受取判定:${Math.round(chance)}%
所持金:¥${Math.round(before.money).toLocaleString()}→¥${Math.round(state.money).toLocaleString()}
${accepted?`好感度:${before.affection}→${state.affection}
機嫌:${before.mood}→${state.mood}
`:''}${foodEffect?`食べ物プレゼントなので、受け取ったあと実際に食べた。
満腹度:${before.fullness}→${state.fullness}
体重:${before.weight.toFixed(1)}kg→${state.weight.toFixed(1)}kg
抑止力:${before.restraint}→${state.restraint}
`:''}
この結果を絶対に変更しないこと。
${c.id==='erika'?erikaRequestConflict('プレゼント',accepted):''}
${accepted?'受け取った直後':'断る直前〜直後'}の自然な反応を返すこと。`;
 const aiOK=await showEventAI(`${g.name}、プレゼント。`,ctx,'プレゼント');
 if(!aiOK){addNarration(accepted?`${c.name}はプレゼントを受け取り、手元で眺めた。`:`${c.name}はプレゼントを見たあと、受け取りを断った。`,'プレゼント')}

 let txt=accepted?`${c.name}は${g.name}を受け取った。相性 ${pref>=0?'+':''}${pref}｜好感度 +${ag}｜機嫌 +${mg}`:`${c.name}は${g.name}を断った。受取確率 ${Math.round(chance)}%`;
 if(foodEffect)txt+=`\n食べ物なので食べた：満腹度 +${foodEffect.fullnessDelta}｜体重 +${foodEffect.weightGain.toFixed(2)}kg｜抑止力 ${foodEffect.restraintDelta>=0?'+':''}${foodEffect.restraintDelta}`;
 if(accepted)unlockCG(`gift:${activeId}:${g.name}`,`${c.name}へのプレゼント`,cgPath(c,'gift'));
 if(accepted)remember('gift',`${c.name}は主人公から「${g.name}」を受け取った`,3,['gift']);else if(g.baseAffection>=5)remember('gift',`${c.name}は主人公からの「${g.name}」を断った`,2,['gift']);
 addBubble('system',txt,'プレゼント判定');log(`${g.name}を購入。${accepted?'受取':'拒否'}${foodEffect?' / 食事効果':''}`);
 if(foodEffect)await maybeYuiOvereatHook('食べ物プレゼント');if(activeId==='emi'&&foodEffect)maybeEmiSpecialHook('食べ物プレゼントのあと');
 save();render();
 if(btn){btn.disabled=false;btn.textContent='プレゼントする'}
}
function dateAcceptance(c,key){const pref=(DATE_PREFERENCES[c.id]||{})[key]||0;let chance=35+state.affection*.62+(state.mood-50)*.16+pref*7+relationshipMechanicBonus();if(c.id==='erika'){const dep=state.growthTraits?.dependence||0;if(state.affection<35)chance-=18;chance+=dep*.20;if(dep>=70)chance+=5;}if(c.id==='yui'&&state.affection<45)chance-=8;if(c.id==='rei'&&state.affection<35)chance-=8;if(c.id==='risa')chance+=5;return {chance:clamp(chance,5,98),pref}}
async function doDate(){
 if(blockingEventType()){showBlockingNotice();return}
 markErikaAttention('デートの誘い');
 if(state&&state.pendingWeightEvent){addBubble('system','体重変化イベントの選択肢を先に選んでください。','イベント中');return}
 const key=$('dateSelect').value,d=DATES[key],c=CHARACTERS[activeId];if(!d)return;state.money=state.money??2500;
 if(state.pendingDate){addBubble('system','現在のデートイベントの選択肢を先に選んでください。','デート中');return}
 if(state.money<d.price){addBubble('system',`${d.name}デートには ¥${d.price.toLocaleString()} 必要です。`,'所持金不足');return}
 const btn=$('dateBtn');if(btn){btn.disabled=true;btn.textContent='反応中…'}
 const j=dateAcceptance(c,key),ok=Math.random()*100<j.chance;
 addBubble('user',`${d.name}に一緒に行かない？`,d.price?`予算 ¥${d.price.toLocaleString()}`:'予算 ¥0');

 if(!ok){
   state.mood=clamp(state.mood-1);
   const ctx=`デートへの誘い判定。
行き先:${d.name}
主人公が誘った。
ゲーム側の確定結果:${c.name}は断った。
成功率:${Math.round(j.chance)}%
機嫌が1下がった。
${c.id==='erika'?erikaRequestConflict('デートの誘い',false):''}
絶対にデートへ行く展開に変更しないこと。断る直前の仕草と、キャラらしい断り方を返すこと。`;
   const aiOK=await showEventAI(`${d.name}に一緒に行かない？`,ctx,'デート');
   if(!aiOK){addNarration(`${c.name}は少し考えたあと、今回は断る意思を示した。`,'デート');addBubble('assistant','今日はやめておく。','デート')}
   addBubble('system',`${c.name}は今回の誘いを断った。成功率 ${Math.round(j.chance)}%`,'デート判定');
   log(`${d.name}デートを断られた`);save();render();
   if(btn){btn.disabled=false;btn.textContent='デートに誘う'}return;
 }

 state.money-=d.price;
 const ag=1,mg=Math.max(1,Math.round(d.mood*(1+Math.max(0,j.pref)*.1)));
 state.affection=clamp(state.affection+ag);state.mood=clamp(state.mood+mg);
 state.pendingDate={key,name:d.name,pref:j.pref,affectionGained:ag};
 state.todayDateKey=key;state.todayDateName=d.name;
 if(c.id==='emi'){const dlv=stageNum(),dpath=memoryCGPath('date',key,dlv);unlockCG(`date:${activeId}:${key}:${dlv}`,`${c.name}と${d.name} Lv.${dlv}`,dpath);addCGMessage(`${c.name}と${d.name} Lv.${dlv}`,dpath,'デートCG');}
 const ev=getDateEvent(key);
 const ctx=`デートへの誘い判定。
行き先:${d.name}
ゲーム側の確定結果:${c.name}は誘いを受け入れ、デートが始まった。
好感度:+${ag}
機嫌:+${mg}
現在所持金:¥${Math.round(state.money).toLocaleString()}
${c.id==='erika'?erikaRequestConflict('デートの誘い',true):''}
このあとデート中イベント「${ev?.text||''}」が発生する。
まだイベント内の選択肢は主人公が選んでいない。
誘いを受け入れた直後から、現地でイベント状況に入るまでの自然な反応を返すこと。`;
 const aiOK=await showEventAI(`${d.name}に一緒に行かない？`,ctx,'デート開始');
 if(!aiOK){addNarration(`${c.name}は誘いを受け入れ、二人は${d.name}へ向かった。`,'デート開始')}
 addBubble('system',`${d.name}デート開始。好感度 +${ag}｜機嫌 +${mg}｜¥${d.price.toLocaleString()}消費。
※このデート全体の好感度上昇は最大+5。${ev?.auto?'\nこの体型Lvではデート中イベントは自動で進行します。':'\n下のデート中イベントから行動を選んでください。'}`,'デート開始');
 log(`${d.name}デート開始。好感度+${ag} / 機嫌+${mg}`);save();render();
 if(ev?.auto)await resolveDateChoice(0,true);else renderDateEvent();
 if(btn){btn.disabled=false;btn.textContent='デートに誘う'}
}
function renderDateEvent(){const panel=$('dateEventPanel'),text=$('dateEventText'),box=$('dateEventChoices');if(!panel||!text||!box)return;if(!state||!state.pendingDate){panel.classList.add('hidden');box.innerHTML='';return}const ev=getDateEvent(state.pendingDate.key);if(!ev||ev.auto){panel.classList.add('hidden');box.innerHTML='';return}panel.classList.remove('hidden');text.textContent=ev.text;box.innerHTML='';ev.choices.forEach((choice,i)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=choice.label+(choice.cost?`（¥${choice.cost.toLocaleString()}）`:'');b.addEventListener('click',()=>resolveDateChoice(i,false));box.appendChild(b)})}
async function resolveDateChoice(i,autoTriggered=false){
 if(state?.pendingWeightEvent){showBlockingNotice();render();return}
 if(state?.pendingInitiatedChoice){showBlockingNotice();render();return}
 if(!state.pendingDate)return;
 const c=CHARACTERS[activeId],dateName=state.pendingDate.name,ev=getDateEvent(state.pendingDate.key),choice=(ev&&ev.choices?ev.choices[i]:null);if(!choice)return;
 const cost=choice.cost||0;state.money=state.money??2500;
 if(state.money<cost){addBubble('system',`この選択には ¥${cost.toLocaleString()} 必要です。`,'所持金不足');return}
 const box=$('dateEventChoices');if(box)box.querySelectorAll('button').forEach(b=>b.disabled=true);

 const before={affection:state.affection,mood:state.mood,restraint:state.restraint,fullness:state.fullness,weight:state.weight,money:state.money};
 state.money-=cost;
 const rawAg=choice.affection||0,mg=choice.mood||0;
 const already=Math.max(0,state.pendingDate.affectionGained||1);
 const remaining=Math.max(0,5-already);
 const ag=rawAg>0?Math.min(rawAg,remaining):rawAg;
 state.pendingDate.affectionGained=already+Math.max(0,ag);
 state.affection=clamp(state.affection+ag);state.mood=clamp(state.mood+mg);
 if(choice.restraint)state.restraint=clamp(state.restraint+choice.restraint);
 if(choice.fullness)state.fullness=clamp(state.fullness+choice.fullness);
 let foodEffect=null;if(choice.food)foodEffect=applyGuaranteedFoodEffect(choice.food,'デート中の食事');

 let txt=`${choice.note||choice.label}\n好感度 ${ag>=0?'+':''}${ag}｜機嫌 ${mg>=0?'+':''}${mg}`;
 if(cost)txt+=`｜¥${cost.toLocaleString()}消費`;
 if(foodEffect)txt+=`\n食事効果：満腹度 +${foodEffect.fullnessDelta}｜体重 +${foodEffect.weightGain.toFixed(2)}kg｜抑止力 ${foodEffect.restraintDelta>=0?'+':''}${foodEffect.restraintDelta}${c.id==='erika'&&foodEffect.regret?`｜罪悪感 ${foodEffect.regret}`:''}`;

 let playerLine='';
 if(autoTriggered||choice.auto){addNarration(ev.text,'デート中イベント');}
 else{playerLine=await generatePlayerChoiceLine(choice.label,choice.note||choice.label);addBubble('user',playerLine,'デート中の選択');}

 const ctx=`デート中イベントの${autoTriggered||choice.auto?'自動進行後':'選択後'}。
デート先:${dateName}
イベント状況:${ev.text}
${autoTriggered||choice.auto?`このイベントは選択肢なしで自動進行。主人公が特定の発言・選択をしたことにしない。\n自動結果:${choice.note||choice.label}`:`主人公の選択方針:${choice.label}\n主人公の実際の発言:${playerLine}\n選択の意味:${choice.note||choice.label}`}
ゲーム側の確定結果:
好感度 ${before.affection}→${state.affection} (${ag>=0?'+':''}${ag})
機嫌 ${before.mood}→${state.mood} (${mg>=0?'+':''}${mg})
所持金 ¥${Math.round(before.money).toLocaleString()}→¥${Math.round(state.money).toLocaleString()}
${choice.restraint?`抑止力 ${before.restraint}→${state.restraint}\n`:''}${foodEffect?`食べたもの:${choice.food.name}
満腹度:${before.fullness}→${state.fullness}
体重:${before.weight.toFixed(1)}kg→${state.weight.toFixed(1)}kg
食事による抑止力変化:${foodEffect.restraintDelta>=0?'+':''}${foodEffect.restraintDelta}
`:''}
${c.id==='erika'&&choice.erikaDependency?`絵里香専用の依存反応: 現在依存度${state.growthTraits?.dependence||0}/100。主人公の反応やおすすめを強く意識している。体型への焦りがあっても「主人公がそう言うなら」と揺れる心理を自然に出す。`:''}
上記は確定結果。特に食事がある場合、食べた事実を否定したり別の料理に変更しないこと。
主人公の選択を受けた直後の情景描写とセリフを返すこと。`;

 const aiOK=await showEventAI(autoTriggered||choice.auto?'（デート中の出来事が自然に進行した）':playerLine,ctx,'デートイベント');
 if(!aiOK){addNarration(`${c.name}はその選択に合わせて行動し、こちらへ反応を返した。`,'デートイベント')}
 addBubble('system',txt,autoTriggered||choice.auto?'デート自動イベント結果':'デートイベント結果');
 if(foodEffect)await maybeYuiOvereatHook(`${dateName}デート`);
 if(activeId==='emi'&&state.pendingDate?.key==='park'&&stageNum()>=4&&state.emiTrackActive!==false&&Math.random()<0.10)maybeTriggerEmiInjury();
 const dateLv=stageNum(),dateKey=state.pendingDate.key;
 const datePath=memoryCGPath('date',dateKey,dateLv);
 unlockCG(`date:${activeId}:${dateKey}:${dateLv}`,`${c.name}と${dateName} Lv.${dateLv}`,datePath);
 if(activeId!=='emi')addCGMessage(`${c.name}と${dateName} Lv.${dateLv}`,datePath,'デートCG');
 if(dateKey==='shopping'&&activeId==='yui'){
   addBubble('system',`試着CG Lv.${dateLv} を思い出に登録しました。`,'試着イベント');
 }
 remember('date',`${c.name}と${dateName}へ行き、主人公は「${choice.label}」を選んだ${foodEffect?`。${choice.food.name}も食べた`:''}`,4,['date']);
 log(`${dateName}: ${choice.label}${foodEffect?` / 体重+${foodEffect.weightGain.toFixed(2)}kg`:''}`);
 state.pendingDate=null;save();render();renderDateEvent();advance();
}
function populateActionSelects(){const g=$('giftSelect'),d=$('dateSelect');if(g){g.innerHTML='';for(const[k,v]of Object.entries(GIFTS)){const o=document.createElement('option');o.value=k;o.textContent=`${v.name} ¥${v.price.toLocaleString()}`;g.appendChild(o)}}if(d){d.innerHTML='';for(const[k,v]of Object.entries(DATES)){const o=document.createElement('option');o.value=k;o.textContent=`${v.name} ¥${v.price.toLocaleString()}`;d.appendChild(o)}}}

function status(){const c=CHARACTERS[activeId];const hookInfo=activeId==='erika'?(()=>{const p=hookTriggerProfile('erika',stageNum(),state.fullness);return p.minFullness<999?`｜昼ホック条件 満腹${p.minFullness}+ / 発生率${Math.round(p.chance*100)}% / 判定${p.eligible?'可':'不可'}`:'';})():activeId==='yui'?(()=>{const p=hookTriggerProfile('yui',stageNum(),state.fullness);return p.minFullness<999?`｜食べすぎホック条件 満腹${p.minFullness}+ / 発生率${Math.round(p.chance*100)}% / 判定${p.eligible?'可':'不可'}`:'';})():'';addBubble('system',`DAY ${state.day} / ${turns[state.turn].label}
関係 ${relationshipLabel()}｜好感度 ${Math.round(state.affection)}｜機嫌 ${Math.round(state.mood)}｜空腹 ${Math.round(state.hunger)}｜満腹 ${Math.round(state.fullness)}｜抑止力 ${Math.round(state.restraint)}
${c.height}cm / ${state.weight.toFixed(1)}kg｜体型 ${bodyType()}｜開始時から ${(state.weight-state.startWeight).toFixed(1)}kg
所持金 ¥${Math.round(state.money??2500).toLocaleString()}｜バイト ${state.workCount||0}回｜次回収入 ¥${workIncome().toLocaleString()}｜食事Lv.${mealTier()+1}（${mealTierLabel()}）
体重変化: ${evolutionLabel()}${c.id==='rei'?`｜体重増加への興味 ${state.weightInterest||0}/100`:''}${c.id==='erika'?`｜依存度 ${state.growthTraits?.dependence||0}/100｜体型焦り ${state.growthTraits?.weightAnxiety||0}/100｜放置感 ${state.erikaNeglectTurns||0}｜本日罪悪感 ${state.erikaFoodGuiltToday||0}`:''}${c.id==='emi'?`
まかない依存度 ${Math.round(state.emiMessDependence||0)}/100｜競技コンディション ${Math.round(refreshEmiCondition()||0)}/100｜後輩との関係 ${Math.round(state.emiJuniorBond||0)}/100
陸上 ${state.emiTrackActive!==false?'継続中':'退部済み'}｜ダイエット ${state.emiDietMode?`進行中(${state.emiDietDaysLeft}日)`:state.emiDietLastResult==='success'?'直近成功':state.emiDietLastResult==='failure'?'直近失敗':'なし'}｜怪我 ${state.emiInjuryDaysLeft>0?`回復まで${state.emiInjuryDaysLeft}日`:'なし'}
美咲 ${state.misakiWeight.toFixed(1)}kg｜体型Lv.${misakiBodyLv()}｜コンディション ${Math.round(state.misakiCondition||0)}/100｜ライバル度 ${Math.round(state.misakiRivalry||0)}/100`:''}${hookInfo}`)}
function pressurePenalty(text){const c=CHARACTERS[activeId];const forceful=/お願い|頼む|いいから|食べてよ|食べなよ|絶対|もっと|無理やり|断らないで|せっかく/.test(text);let affLoss=forceful?6:3,moodLoss=forceful?5:2;if(c.id==='erika'){affLoss+=2;moodLoss+=1}if(c.id==='yui'&&state.affection<50)affLoss+=1;state.affection=clamp(state.affection-affLoss);state.mood=clamp(state.mood-moodLoss);const result={affectionDelta:-affLoss,moodDelta:-moodLoss,forceful,summary:`一度断った直後にさらに強く勧めたため、${c.name}は圧を感じた。好感度 -${affLoss}、機嫌 -${moodLoss}`,log:`断った直後の強引な再提案。好感度 -${affLoss} / 機嫌 -${moodLoss}`};log(result.log);return result}
function pressureDemoReply(){const c=CHARACTERS[activeId];if(c.id==='risa')return'もう、さっき断ったでしょ。しつこいのは嫌だよ。';if(c.id==='emi')return'もう、いらないって言ったでしょ。何度も言われると困るんだけど。';if(c.id==='yui')return'ごめんね、そんなに押されるとちょっと困っちゃう。';if(c.id==='erika')return'しつこいですわ。不愉快です。';return'……断ったのに。そういうの、少し嫌。'}
function demoReply(text,foodResult=null){const c=CHARACTERS[activeId];let aff=0,mood=0,reply='……うん。';if(foodResult){if(foodResult.accepted){if(c.id==='risa')reply=foodResult.food==='甘いもの'||foodResult.food==='パン'?'……それなら食べる。ちょっとだけね！':'うーん……まあ、今日はいいか。食べよ。';if(c.id==='emi')reply='……分かった、食べる。でもこれでタイムに響いたらちょっと嫌だからね。';if(c.id==='yui')reply=foodResult.regret>0?'……また食べちゃった。断ろうとは思ったんだけどな。あとで絶対後悔するやつ……。':'え、いいの？ ……じゃあ、少しだけもらおうかな。';if(c.id==='erika'){const dep=state.growthTraits?.dependence||0;reply=dep>=60?'……本当は控えるつもりでしたのよ？ でも、あなたがそこまで言うなら……今回だけですわ。':'べ、別にあなたに勧められたからではありませんわ。今回は特別ですの。';}if(c.id==='rei')reply='……食べる。こういうのも、悪くないかも。'}else{if(c.id==='risa')reply='今日はやめとく。ちょっと気にしてるし。';if(c.id==='emi')reply='今日はいいかな。今は陸上の方を優先したいし。';if(c.id==='yui')reply='ごめんね。今日はさすがにやめておく。';if(c.id==='erika')reply='結構ですわ。わたくし、今は要りませんの。';if(c.id==='rei')reply='……今日はいい。お腹、そこまで空いてない。'}return reply}if(c.id==='risa')reply='うんうん、それで？';if(c.id==='emi')reply=/太|体重/.test(text)?'え、ちょっと。まだそこまでじゃないでしょ。変なこと言わないでよ。':'うん、それで？';if(c.id==='yui')reply='ふふ、そうなんだ。';if(c.id==='erika')reply=state.affection<40?'べ、別にあなたと話したいわけではありませんわ。':'……少しくらいなら、お付き合いしてあげてもよろしくてよ。';if(c.id==='rei')reply=state.affection<50?'……そう。あなたって、やっぱり少し変わってるね。':'……あなたと話すの、前より好きかも。';if(/好き|可愛い|かわいい|会いた/.test(text)){aff+=2;mood+=2}state.affection=clamp(state.affection+aff);state.mood=clamp(state.mood+mood);return reply}

function moodBand(){
 const v=Math.round(state.mood);
 if(v<20)return {label:'かなり不機嫌',rule:'返答は短めで刺々しい。無理に会話を広げない。'};
 if(v<40)return {label:'少し不機嫌',rule:'反応は控えめで、冗談や踏み込んだ話に乗りにくい。'};
 if(v<65)return {label:'平常',rule:'普段のキャラクターらしい自然なテンション。'};
 if(v<85)return {label:'上機嫌',rule:'自分から一言足したり、表情・仕草が柔らかくなりやすい。'};
 return {label:'かなり上機嫌',rule:'いつもより饒舌で、好意的な冗談や自発的な話題が増える。'};
}
function restraintBand(){
 const v=Math.round(state.restraint);
 if(v<20)return {label:'ほぼ無警戒',rule:'食事や誘惑への自己制御がかなり弱い。体型を気にしていても「まあいいか」が出やすい。'};
 if(v<40)return {label:'緩んでいる',rule:'我慢する理由より、楽しさや食欲を優先しやすい。'};
 if(v<65)return {label:'揺れている',rule:'食べたい気持ちと控えたい気持ちが両方あり、迷いを自然に見せる。'};
 if(v<85)return {label:'強く自制',rule:'食事や体型の話に敏感で、控えようとする発言が増える。'};
 return {label:'かなり警戒',rule:'食事・体重への警戒が強く、軽い勧めにも慎重。押されるほど反発しやすい。'};
}
function weightMindBand(c=CHARACTERS[activeId]){
 const st=evolutionStage(),d=weightGainAmount();
 if(st===0)return `体型はほぼ開始時のまま（+${d.toFixed(1)}kg）。体型への発言は必要以上に増やさない。`;
 if(st===1)return `少し変化を自覚し始めた（+${d.toFixed(1)}kg）。服のフィット感など小さな違いを時々気にする。`;
 if(st===2)return `体型変化を実感している（+${d.toFixed(1)}kg）。鏡・服・食後の感覚に反応しやすい。`;
 if(st===3)return `かなり変化している（+${d.toFixed(1)}kg）。体型への意識が会話に自然に混ざる。`;
 if(st===4)return `大きく変化している（+${d.toFixed(1)}kg）。以前との違いを本人も否定しにくい。`;
 if(st===5)return `非常に大きく変化している（+${d.toFixed(1)}kg）。動作・服・疲れやすさなどにも変化を感じやすい。`;
 return `最大段階の変化（+${d.toFixed(1)}kg）。現在の身体を前提に自然に振る舞い、昔との比較が強い話題になる。`;
}
function psychologicalProfile(c=CHARACTERS[activeId]){
 const m=moodBand(),r=restraintBand();
 let extra='';
 if(c.id==='yui'){
   extra=state.restraint>=70?'体型への後悔や「明日は控えよう」が強い。':'気にはしているが、食欲や楽しさに流される自分を半ば自覚している。';
 }else if(c.id==='erika'){
   const dep=state.growthTraits?.dependence||0,anx=state.growthTraits?.weightAnxiety||0,neglect=state.erikaNeglectTurns||0;
   if(dep>=70)extra=`主人公への依存が非常に強い（${dep}/100）。体型への焦り${anx}/100が高くても主人公のお願いは断りづらい。主人公の予定や動向を気にし、自分が嫌われていないか頻繁に不安になる。構ってもらえない放置感${neglect}があると、寂しさを認めず不機嫌・高圧的に出す。`;
   else if(dep>=45)extra=`主人公への依存が高まりつつある（${dep}/100）。主人公の動向や反応を気にし、自分が嫌われていないか確かめたくなる。体型への焦り${anx}/100。`;
   else extra=state.mood<40?'強がりが特に強く、弱みを見せたくない。まだ依存は弱いが、主人公の評価は少し気にしている。':'機嫌が良い時ほどツンの裏から本音が漏れやすい。';
 }else if(c.id==='rei'){
   extra=(state.weightInterest||0)>=50?'体重変化を恐れるより、現象として面白がる傾向が強い。':'まだ体重変化を観察対象として見ている段階。';
 }else if(c.id==='emi'){
   extra=emiWeightMindsetGuide(stageNum())+' 抑止力は上がっても長続きせず、空腹・疲労・誘惑で崩れやすい。';
 }else if(c.id==='risa'){
   extra=evolutionStage()>=2?'主人公からどう見られるかを以前より強く意識する。':'明るさを基本にしつつ、主人公の評価を少し気にしている。';
 }
 return `心理状態: ${m.label} / 抑止力: ${r.label}
機嫌による話し方:${m.rule}
自制心による反応:${r.rule}
体型意識:${weightMindBand(c)}
キャラ固有:${extra}`;
}
function responseVariationCue(){
 const cues=[
  '返答の冒頭を相槌から始めず、仕草から入ってもよい。',
  '短い返答と少し長い返答を混ぜ、毎回同じ文量にしない。',
  '質問で返す場合と、自分の感想を先に言う場合を使い分ける。',
  '直前の返答と同じ言い回し・語尾・仕草を避ける。',
  '現在の機嫌が良ければ少し脱線して本人から話題を足してよい。',
  '現在の機嫌が悪ければ無理に会話を盛り上げず、短い本音を返してよい。'
 ];
 const idx=(state.day*3+state.turn+(state.history?.length||0))%cues.length;
 return cues[idx];
}
function systemPrompt(){
 const c=CHARACTERS[activeId];
 return `あなたは恋愛シミュレーションゲーム内の女性キャラクター「${c.name}」として会話します。
必ずキャラクター設定と現在のゲーム状態を守り、自然な日本語で返答してください。

【出力形式】
必ず次のJSONだけを返してください。Markdownコードブロックは不要です。
{"narration":"情景描写","dialogue":"キャラクターのセリフ","emotion":"normal|happy|embarrassed|angry|troubled|surprised"}

【情景描写ルール】
- narrationは1〜3文程度。
- キャラクター本人の表情、視線、姿勢、仕草、服装への反応、周囲の様子などを描写する。
- 主人公の未確定な行動・感情・発言を勝手に決めない。
- ゲーム側で確定していない食事、プレゼント、体重増減、デート結果を勝手に発生させない。
- 現在の体重・満腹度・抑止力・体型段階と矛盾しない。
- 毎回「顔を赤くした」だけに偏らず、キャラごとに仕草や反応を変える。
- narration内にセリフを書かない。セリフはdialogueのみ。
- emotionはその瞬間の主要表情を1つ選ぶ。通常=normal、笑顔=happy、照れ=embarrassed、怒り=angry、困惑・落ち込み=troubled、驚き=surprised。

【キャラクターごとの描写傾向】
- 梨沙: 表情豊か。視線を逸らす、制服や髪を整える、少し泣きそうになる等。
- 絵美: 20歳の大学生。勝気で活発だが、乱暴すぎる男言葉にはしない。少しむっとして頬を膨らませる、視線を逸らす、腰に手を当てる、照れて笑うなど、自然な大学生女性らしい仕草を混ぜる。大学陸上部の競技者らしい所作も自然に入れる。
- 結衣: 苦笑、服の腰回りを気にする、柔らかい仕草、少し自虐的な反応。
- 絵里香: 強がる、顎を上げる、視線を逸らす、動揺を隠そうとする。
- 怜: じっと観察する、服や身体の変化を淡々と確認する、静かな反応。

【基本プロフィール】
年齢:${c.age}歳
身長:${c.height}cm
性格:${c.personality}
話し方:${c.speech}
主人公との初期関係:${c.relationship}
現在の関係段階:${relationshipLabel()}（好感度${Math.round(state.affection)}）
現在の関係性ルール:${characterRelationshipGuidance(c)}
食欲:${c.appetite}
太りやすさ:${c.gainTendency}
運動習慣:${c.exercise}
体型・体重への考え:${c.bodyView}
現在の好きな食べ物:${state.favoriteFoods.length?state.favoriteFoods.join('、'):'特になし'}
その他の特徴:${c.features}

【絶対に守るキャラクタールール】
${c.rules}
${c.id==='emi'?`【絵美の年齢・生活設定】
絵美は20歳の大学生で、主人公とは大学の同級生。
大学陸上部のエースとして競技を続けている。
高校生、制服、高校のクラス、高校部活として描写しない。
日常は大学キャンパス、講義、空きコマ、大学陸上部の練習、競技場、アルバイト、私服などを基本にする。
体型Lv1では完全に本調子。体型・服・体重・走力・息切れ・身体の重さへの違和感や不安を一切出さない。陸上部のエースとして余裕と自信を持って振る舞う。
体型Lv2でも本人はまだ太ったことを自覚していない。明確な体型不安、ダイエット発言、走力低下の自覚は出さない。
体型変化や競技力低下を本人が明確に意識し始めるのはLv3以降。`:''}
${c.id==='erika'?`【絵里香の抑止力ルール】
体型Lv1〜2では、絵里香本人は自分が太ったとは認めていない。そのため「太ったから食事を控えよう」という心理は原則発生せず、体型や食事への焦りを理由に抑止力が上がる描写は禁止。
体型Lv3で初めて体重増加を認め、それ以降は服・鏡・食後の罪悪感などで抑止力が強く上昇することがある。
ただしLv3以降の抑止力は非常に不安定。空腹、食べ物の匂い、主人公からの勧め、気分、我慢疲れなど些細なきっかけですぐ下がる。高Lvほど上下動を激しく描く。`:''}

【体重増加による現在のキャラクター変化】
${characterEvolutionText(c)}

【長期記憶】
${memoryText()}
- 上記は過去に実際に起きた重要な出来事。必要な時だけ自然に参照する。
- 記憶にない過去の出来事を捏造しない。

【学習した嗜好・性格変化】
${growthText(c)}
- 食経験や主人公との積み重ねによる現在の変化として会話へ反映する。
- 数値をセリフで機械的に読み上げない。

【現在の心理プロファイル】
${psychologicalProfile(c)}
会話バリエーション指示:${responseVariationCue()}
- 心理状態を毎回そのまま説明せず、語尾・文量・表情・話題選びに反映する。
- 体型の話題を毎回必ず出す必要はない。文脈に合う時だけ自然に出す。
- 同じ反応、同じ仕草、同じ決まり文句を直近の会話から繰り返さない。
- 絵美の専用イベントでは、イベント事実・数値変化・CGだけをゲーム側の確定事項とし、情景描写とセリフは毎回新しく作る。固定フレーズの反復を避ける。

【現在のゲーム状態】
DAY ${state.day} / ${turns[state.turn].label}
体重:${state.weight.toFixed(1)}kg
開始時:${state.startWeight.toFixed(1)}kg
開始時から:${(state.weight-state.startWeight).toFixed(1)}kg
体型:${bodyType()}
体重変化段階:${evolutionStage()+1}/7（${evolutionLabel()}）
好感度:${Math.round(state.affection)}
機嫌:${Math.round(state.mood)}
空腹度:${Math.round(state.hunger)}
満腹度:${Math.round(state.fullness)}
抑止力:${Math.round(state.restraint)}
${c.id==='rei'?`体重増加への興味:${state.weightInterest||0}/100`:''}
${c.id==='erika'?`主人公への依存度:${state.growthTraits?.dependence||0}/100
体型への焦り:${state.growthTraits?.weightAnxiety||0}/100
累積嫉妬反応:${state.erikaJealousyCount||0}回
構ってもらえていない感覚:${state.erikaNeglectTurns||0}`:''}

【関係性の最重要ルール】
- 現在の関係段階「${relationshipLabel()}」を厳守する。
- 正式な告白イベントで交際成立するまでは、好感度が100でも「恋人」として扱わない。
- 告白はゲーム側が「正式な告白イベント」と明示した場合だけ行う。通常会話で勝手に告白しない。
- 関係段階を飛び越えた恋愛表現、過度な依存、恋人扱いをしない。
- キャラクター固有の関係性ルールは、一般的な好感度表現より優先する。
${c.id==='yui'&&!state.isLover?`- 結衣は主人公よりかなり年上。恋愛感情が育つほど年齢差を気にする場面を比較的多くし、「自分が相手でいいのか」「若い主人公の将来を邪魔しないか」という迷いを会話や自発イベントへ自然に織り込む。ただし毎回同じ言い方にはしない。
- 結衣は他キャラより交際開始まで慎重で、正式な告白イベント前に恋人のような確約をしない。`:''}

【会話の最重要ルール】
- 必ず「今回の主人公の発言」に直接返答する。直前の話題を無視して別の話を始めない。
- 質問されたら、まずその質問への答えをdialogueで返してから、必要なら補足する。
- 主人公が短い相槌をした場合も、その直前の話題を継続する。
- 過去の会話履歴は文脈理解のために使うが、今回の主人公の発言より優先しない。
- 情景描写は会話内容を補助するもので、セリフの代わりにしない。

【重要】
- 好感度が低い段階では、急に恋人のような言動をしない。
- ゲーム側で確定した判定結果は絶対に覆さない。
- キャラクター本人が知らない情報を勝手に知っていることにしない。
- dialogueはキャラクター本人の口調を守る。`;
}
