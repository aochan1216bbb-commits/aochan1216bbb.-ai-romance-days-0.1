const APP_BUILD='20260821-ui-popup-v38';
const MISAKI={id:'misaki',name:'美咲',age:20,relationship:'絵美のライバル',personality:'自信家、負けず嫌い、口が悪い',speech:'強気、煽り気味、タメ口',startWeight:51,startCondition:88,baseRivalry:78,features:'絵美の大学陸上関連ストーリーに登場するライバル。序盤は絵美を容赦なく煽るが、後半は自分自身の体型変化にも直面する。'};

const CHARACTER_MODULES=window.CHARACTER_MODULES||{};
const CHARACTERS=Object.fromEntries(
 Object.entries(CHARACTER_MODULES).map(([id,module])=>[id,module.profile])
);
const turns=[{label:'☀ 朝',key:'morning'},{label:'☁ 昼',key:'noon'},{label:'🌙 夜',key:'night'}];
let activeId=null,state=null,aiGenerationBusy=false;
const $=id=>document.getElementById(id); const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
function setAIGenerationBusy(busy){
 aiGenerationBusy=!!busy;
 syncEventLockUI();
 const s=$('runtimeStatus');
 if(s&&busy){
   s.textContent='AI生成中… 他の操作は一時停止中';
   s.style.background='#cff4fc';s.style.color='#055160';
 }
}
async function aiFetch(url,options){
 if(aiGenerationBusy)throw new Error('AI生成中です。完了までお待ちください。');
 setAIGenerationBusy(true);
 try{return await fetch(url,options)}
 finally{
   setAIGenerationBusy(false);
   const s=$('runtimeStatus');
   if(s){s.textContent=`BUILD ${APP_BUILD}`;s.style.background='#f3f0f1';s.style.color='#74656c';}
 }
}
function safeGet(k,fallback){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fallback}catch(e){return fallback}}
function safeSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function normalizeModel(model){return model==='gpt-5-mini'?'gpt-5-mini':'gpt-5-nano'}
function globalSettings(){const g=safeGet('aiRomanceGlobalSettings',{apiKey:'',model:'gpt-5-nano'});return {apiKey:g.apiKey||'',model:normalizeModel(g.model)}}
function setApiStatus(text,type='neutral'){
 const el=$('apiConnectionStatus');if(!el)return;
 el.textContent=text;
 const styles={ok:['#d1e7dd','#0f5132'],error:['#f8d7da','#842029'],working:['#cff4fc','#055160'],neutral:['#f3f0f1','#74656c']};
 const st=styles[type]||styles.neutral;el.style.background=st[0];el.style.color=st[1];
}
function saveGlobal(){
 const apiKey=($('globalApiKey')?.value||'').trim(),model=normalizeModel($('globalModel')?.value);
 safeSet('aiRomanceGlobalSettings',{apiKey,model});
 setApiStatus(apiKey?`API設定を保存しました（${model}）`:'APIキー未入力：デモ会話モード','ok');
}
function extractResponseText(data){
 if(!data)return '';
 // Raw REST responses normally contain output[].content[].text.
 const parts=[];
 if(Array.isArray(data.output)){
   data.output.forEach(item=>{
     if(item&&Array.isArray(item.content)){
       item.content.forEach(c=>{
         if(c&&c.type==='output_text'&&typeof c.text==='string')parts.push(c.text);
       });
     }
   });
 }
 // Defensive fallback for environments/wrappers that expose output_text.
 if(!parts.length&&typeof data.output_text==='string')parts.push(data.output_text);
 return parts.join('\n').trim();
}
function responseDiagnostic(data){
 const status=data?.status||'unknown';
 const reason=data?.incomplete_details?.reason||data?.error?.message||'なし';
 const usage=data?.usage||{};
 const reasoning=usage?.output_tokens_details?.reasoning_tokens;
 const out=usage?.output_tokens;
 return `status=${status} / reason=${reason} / output_tokens=${out??'不明'} / reasoning_tokens=${reasoning??'不明'}`;
}
async function testOpenAIConnection(){
 const key=($('globalApiKey')?.value||'').trim(),model=normalizeModel($('globalModel')?.value);
 if(!key){setApiStatus('API接続：APIキーを入力してください','error');return}
 const btn=$('testOpenAIConnection');if(btn){btn.disabled=true;btn.textContent='接続中…'}
 setApiStatus(`API接続：${model} へ接続中…`,'working');
 try{
  const body={
    model,
    input:'Reply with exactly: OK',
    max_output_tokens:300
  };
  if(/^gpt-5/.test(model))body.reasoning={effort:'minimal'};
  const res=await aiFetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
    body:JSON.stringify(body)
  });
  if(!res.ok){
    let detail='';
    try{const e=await res.json();detail=e?.error?.message||JSON.stringify(e)}catch(e){try{detail=await res.text()}catch(_){}}
    throw new Error(`HTTP ${res.status}${detail?'：'+detail:''}`);
  }
  const data=await res.json();
  const testText=extractResponseText(data);
  if(!testText)throw new Error('返答テキストが空です。'+responseDiagnostic(data));
  safeSet('aiRomanceGlobalSettings',{apiKey:key,model});
  setApiStatus(`✓ OpenAI API 接続成功（${model} / 会話文脈強化版）`,'ok');
 }catch(err){setApiStatus(`API接続失敗：${err.message||err}`,'error')}
 finally{if(btn){btn.disabled=false;btn.textContent='接続テスト'}}
}
function defaultState(id){const c=CHARACTERS[id];return {characterId:id,day:1,turn:0,affection:c.affection,mood:c.mood,fullness:20,hunger:40,restraint:c.restraint,weight:c.startWeight,startWeight:c.startWeight,history:[],gameLog:[],favoriteFoods:[...c.favoriteFoods],lastFoodResult:null,foodOfferTurnKey:null,foodPressureCount:0,money:2500,workCount:0,lastFoodTurnKey:null,lastFoodWasRefused:false,weightInterest:0,weightStage:0,pendingDate:null,seenWeightEvents:[],pendingWeightEvent:null,memories:[],foodExperience:{},growthTraits:{},memorySeq:0,lastInitiatedTurnKey:null,initiatedEventCount:0,lastRelationshipStage:null,pendingInitiatedChoice:null,lastEmotion:'normal',conversationRewards:[],cgGallery:[],selfFoodCount:0,yuiSpecialFlags:{},pendingRestraintEvent:null,restraintTalkRewards:[],lastNightEventDay:0,pendingNightChoice:null,nightEventHistory:[],seenNightEventIds:[],seenNightEventStage:1,dailyFoodLoad:0,dailyFoodCount:0,dailyFoodNames:[],todayDateKey:null,todayDateName:null,isLover:false,confessionCompleted:false,confessionDeferredUntilDay:0,ageGapTalkCount:0,lastYuiInitiatedDay:0,yuiWeightEventSchemaVersion:2,forceYuiWeightEventMigration:false,lastErikaAttentionTurnKey:null,lastErikaAttentionDay:0,erikaNeglectTurns:0,erikaJealousyCount:0,lastErikaJealousyDay:0,pendingErikaRoutine:null,erikaRoutineHistory:[],lastErikaRoutineKey:null,erikaDayHungerStrain:false,erikaFoodGuiltToday:0,erikaRoutineCoverage:{morning:{},night:{}},erikaRestraintModelVersion:2,emiMessDependence:5,emiCondition:88,emiJuniorBond:62,emiTrackActive:true,emiDietMode:false,emiDietDaysLeft:0,emiDietStartWeight:0,emiDietStartDay:0,emiDietLastResult:null,emiInjuryDaysLeft:0,emiLastTournamentDay:0,emiLastRivalDay:0,emiLastSystemTurnKey:null,misakiWeight:51,misakiStartWeight:51,misakiCondition:88,misakiRivalry:78,misakiLastSceneDay:0,emiIzakayaScheduleWeek:0,emiIzakayaWorkDays:[],emiLastIzakayaShiftDay:0,emiRestraintModelVersion:3,lastEmiInitiatedDay:0}}
function stateKey(id){return 'aiRomanceState_v3_'+id} function loadState(id){const base=defaultState(id),saved=safeGet(stateKey(id),{});const merged={...base,...saved};if(!Array.isArray(merged.history))merged.history=[];if(!Array.isArray(merged.gameLog))merged.gameLog=[];if(!Array.isArray(merged.favoriteFoods))merged.favoriteFoods=[...CHARACTERS[id].favoriteFoods];if(!Array.isArray(merged.seenWeightEvents))merged.seenWeightEvents=[];
if(!Number.isFinite(Number(merged.yuiWeightEventSchemaVersion)))merged.yuiWeightEventSchemaVersion=0;
if(id==='yui'&&Number(merged.yuiWeightEventSchemaVersion)<2){
  // 旧版で「発生済み」扱いになっていた結衣の体型変化イベントを、新しいCG同期版へ移行。
  merged.seenWeightEvents=merged.seenWeightEvents.filter(k=>!String(k).startsWith('yui:'));
  merged.yuiWeightEventSchemaVersion=2;
  merged.forceYuiWeightEventMigration=true;
}
if(!('pendingWeightEvent' in merged))merged.pendingWeightEvent=null;if(!Array.isArray(merged.memories))merged.memories=[];if(!merged.foodExperience||typeof merged.foodExperience!=='object')merged.foodExperience={};if(!merged.growthTraits||typeof merged.growthTraits!=='object')merged.growthTraits={};merged.memorySeq=merged.memorySeq||0;if(!('lastInitiatedTurnKey' in merged))merged.lastInitiatedTurnKey=null;merged.initiatedEventCount=merged.initiatedEventCount||0;if(!('lastRelationshipStage' in merged))merged.lastRelationshipStage=null;
if(!('pendingInitiatedChoice' in merged))merged.pendingInitiatedChoice=null;
if(!('lastYuiInitiatedDay' in merged))merged.lastYuiInitiatedDay=0;
if(!('lastEmotion' in merged))merged.lastEmotion='normal';
if(!Array.isArray(merged.conversationRewards))merged.conversationRewards=[];
if(!Array.isArray(merged.cgGallery))merged.cgGallery=[];
merged.selfFoodCount=merged.selfFoodCount||0;
if(!('pendingRestraintEvent' in merged))merged.pendingRestraintEvent=null;
if(!Array.isArray(merged.restraintTalkRewards))merged.restraintTalkRewards=[];
merged.lastNightEventDay=merged.lastNightEventDay||0;
if(!('pendingNightChoice' in merged))merged.pendingNightChoice=null;
if(!Array.isArray(merged.nightEventHistory))merged.nightEventHistory=[];
if(!Array.isArray(merged.seenNightEventIds))merged.seenNightEventIds=[];
{
 const gain=Math.max(0,Number(merged.weight||0)-Number(merged.startWeight||0));
 const currentNightStage=gain<3?1:gain<8?2:gain<15?3:gain<25?4:gain<40?5:gain<60?6:7;
 if(!Number.isFinite(Number(merged.seenNightEventStage)))merged.seenNightEventStage=currentNightStage;
 if(Number(merged.seenNightEventStage)!==currentNightStage){
   merged.seenNightEventIds=[];
   merged.seenNightEventStage=currentNightStage;
 }
}
merged.dailyFoodLoad=Number(merged.dailyFoodLoad||0);
merged.dailyFoodCount=Number(merged.dailyFoodCount||0);
if(!Array.isArray(merged.dailyFoodNames))merged.dailyFoodNames=[];
if(!('todayDateKey' in merged))merged.todayDateKey=null;
if(!('todayDateName' in merged))merged.todayDateName=null;
if(!('isLover' in merged))merged.isLover=false;
if(!('confessionCompleted' in merged))merged.confessionCompleted=false;
if(!('confessionDeferredUntilDay' in merged))merged.confessionDeferredUntilDay=0;
if(!('ageGapTalkCount' in merged))merged.ageGapTalkCount=0;
if(!('lastErikaAttentionTurnKey' in merged))merged.lastErikaAttentionTurnKey=null;
merged.lastErikaAttentionDay=Math.max(0,Number(merged.lastErikaAttentionDay||0));
merged.erikaNeglectTurns=Math.max(0,Number(merged.erikaNeglectTurns||0));
if(!('pendingErikaRoutine' in merged))merged.pendingErikaRoutine=null;
if(!Array.isArray(merged.erikaRoutineHistory))merged.erikaRoutineHistory=[];
if(!('lastErikaRoutineKey' in merged))merged.lastErikaRoutineKey=null;
merged.erikaDayHungerStrain=!!merged.erikaDayHungerStrain;
merged.erikaFoodGuiltToday=Math.max(0,Number(merged.erikaFoodGuiltToday||0));
if(!('erikaRestraintModelVersion' in merged))merged.erikaRestraintModelVersion=0;
if(id==='erika'&&merged.erikaRestraintModelVersion<2){
 const gain=Math.max(0,Number(merged.weight||c.startWeight)-c.startWeight);
 const lv=gain<3?1:gain<8?2:gain<15?3:gain<25?4:gain<40?5:gain<60?6:7;
 if(lv<3)merged.restraint=Math.min(Number(merged.restraint||35),35);
 merged.erikaRestraintModelVersion=2;
}
if(!merged.erikaRoutineCoverage||typeof merged.erikaRoutineCoverage!=='object')merged.erikaRoutineCoverage={morning:{},night:{}};
if(!merged.erikaRoutineCoverage.morning||typeof merged.erikaRoutineCoverage.morning!=='object')merged.erikaRoutineCoverage.morning={};
if(!merged.erikaRoutineCoverage.night||typeof merged.erikaRoutineCoverage.night!=='object')merged.erikaRoutineCoverage.night={};
merged.erikaJealousyCount=Math.max(0,Number(merged.erikaJealousyCount||0));
merged.lastErikaJealousyDay=Math.max(0,Number(merged.lastErikaJealousyDay||0));

if(id==='emi'){
 merged.emiMessDependence=Math.max(0,Number(merged.emiMessDependence||5));
 merged.emiCondition=Math.max(0,Number(merged.emiCondition||88));
 merged.emiJuniorBond=Math.max(0,Number(merged.emiJuniorBond||62));
 if(!('emiTrackActive' in merged))merged.emiTrackActive=true;
 merged.emiDietMode=!!merged.emiDietMode;
 merged.emiDietDaysLeft=Math.max(0,Number(merged.emiDietDaysLeft||0));
 merged.emiDietStartWeight=Number(merged.emiDietStartWeight||merged.weight||CHARACTERS[id].startWeight);
 merged.emiDietStartDay=Math.max(0,Number(merged.emiDietStartDay||0));
 if(!('emiDietLastResult' in merged))merged.emiDietLastResult=null;
 merged.emiInjuryDaysLeft=Math.max(0,Number(merged.emiInjuryDaysLeft||0));
 merged.emiLastTournamentDay=Math.max(0,Number(merged.emiLastTournamentDay||0));
 merged.emiLastRivalDay=Math.max(0,Number(merged.emiLastRivalDay||0));
 if(!('emiLastSystemTurnKey' in merged))merged.emiLastSystemTurnKey=null;
 merged.misakiStartWeight=Number(merged.misakiStartWeight||MISAKI.startWeight);
 merged.misakiWeight=Number(merged.misakiWeight||merged.misakiStartWeight||MISAKI.startWeight);
 merged.misakiCondition=Math.max(0,Number(merged.misakiCondition||MISAKI.startCondition));
 merged.misakiRivalry=Math.max(0,Number(merged.misakiRivalry||MISAKI.baseRivalry));
 merged.misakiLastSceneDay=Math.max(0,Number(merged.misakiLastSceneDay||0));
 merged.emiIzakayaScheduleWeek=Math.max(0,Number(merged.emiIzakayaScheduleWeek||0));
 if(!Array.isArray(merged.emiIzakayaWorkDays))merged.emiIzakayaWorkDays=[];
 merged.emiLastIzakayaShiftDay=Math.max(0,Number(merged.emiLastIzakayaShiftDay||0));
 merged.lastEmiInitiatedDay=Math.max(0,Number(merged.lastEmiInitiatedDay||0));
 if(!Number.isFinite(Number(merged.emiRestraintModelVersion)))merged.emiRestraintModelVersion=0;
 {
   const gain=Math.max(0,Number(merged.weight||CHARACTERS[id].startWeight)-CHARACTERS[id].startWeight);
   const lv=gain<3?1:gain<8?2:gain<15?3:gain<25?4:gain<40?5:gain<60?6:7;
   // v33 migration: Lv1〜2は「ダイエット自制」ではなく、満腹感で断るキャラへ。
   if(merged.emiRestraintModelVersion<3){
     if(lv<=2)merged.restraint=Math.min(28,Number(merged.restraint||24));
     else merged.restraint=Math.min(72,Number(merged.restraint||48));
     merged.emiRestraintModelVersion=3;
   }
   // 旧セーブでLv1〜2の抑止力が再び高止まりしていても補正する。
   if(lv<=2)merged.restraint=Math.min(30,Number(merged.restraint||24));
 }
 if(!merged.emiRoutineSeen||typeof merged.emiRoutineSeen!=='object')merged.emiRoutineSeen={};
 if(merged.growthTraits?.emiQuitTrack)merged.emiTrackActive=false;
}

return merged} function save(){if(activeId&&state)safeSet(stateKey(activeId),state)}


const RELATIONSHIP_STAGES=[
 {min:0,max:19,label:'警戒',desc:'まだ距離があり、個人的な誘いや踏み込んだ話には慎重。'},
 {min:20,max:39,label:'知人',desc:'普通に会話はするが、恋愛的な距離感ではない。'},
 {min:40,max:59,label:'親しい',desc:'かなり心を開いており、個人的な話や誘いにも応じやすい。'},
 {min:60,max:79,label:'好意',desc:'主人公を明確に特別視し始めているが、キャラらしい照れや慎重さは残る。'},
 {min:80,max:94,label:'恋愛',desc:'主人公への恋愛感情を自覚しているが、まだ交際は始まっていない。'},
 {min:95,max:100,label:'深い好意',desc:'主人公を非常に大切に思っているが、正式な告白イベントを経るまでは恋人ではない。'}
];
const RELATIONSHIP_LOVER_STAGE={label:'恋人',desc:'正式な告白を経て交際中。恋人として自然な親密さを見せる。'};
function relationshipStage(){
 if(state?.isLover)return RELATIONSHIP_LOVER_STAGE;
 const a=Math.round(state?.affection||0);
 return RELATIONSHIP_STAGES.find(x=>a>=x.min&&a<=x.max)||RELATIONSHIP_STAGES[0];
}
function relationshipIndex(){return state?.isLover?6:RELATIONSHIP_STAGES.indexOf(relationshipStage())}
function relationshipLabel(){return relationshipStage().label}
function characterRelationshipGuidance(c){
 const i=relationshipIndex(),base=relationshipStage().desc;
 if(c.id==='erika'){
   const dep=state.growthTraits?.dependence||0,neglect=state.erikaNeglectTurns||0;
   if(i<=1)return base+' 絵里香はツンの比率が非常に高く、好意を認めない。主人公を気にしていても素直には認めない。';
   if(i===2)return base+` 絵里香はツンを保つが、主人公の予定や反応を無意識に気にし始める。依存傾向${dep}/100。`;
   if(i===3)return base+` 絵里香はデレが増え、主人公への執着・依存が表に出始める。嫌われていないかを気にし、構ってもらえないと不機嫌になりやすい。依存傾向${dep}/100 / 放置感${neglect}。`;
   return base+` 絵里香はツンを残しながらも主人公への依存がかなり強い。体型を気にしていても主人公からのお願いは断りづらく、主人公の動向・自分が嫌われていないか・構ってもらえているかを強く気にする。依存傾向${dep}/100 / 放置感${neglect}。`;
 }
 if(c.id==='rei'){
   if(i<=1)return base+' 怜は主人公に人として興味があるだけで、恋愛感情はない。恋愛的な発言は禁止。';
   if(i===2)return base+' 怜はかなり心を開いているが、まだ恋愛感情を明確には自覚していない。';
   if(i===3)return base+' 怜は主人公を特別視し始め、恋愛感情の芽を自覚しつつある。';
   return base+' 怜は主人公への恋愛感情を明確に認めている。';
 }
 if(c.id==='yui'&&!state.isLover){
   if(i<=2)return base+' 主人公よりかなり年上であることを強く意識している。好意があっても「自分が相手でいいのか」「若い相手の未来を邪魔しないか」と考え、誘いや恋愛的な距離の詰め方には慎重さを残す。';
   return base+' 主人公よりかなり年上であることが恋愛上の大きな迷いになっている。好意が強くても、年齢差への不安を何度も自然に考え、正式な告白イベントまでは恋人として振る舞わない。';
 }
 if(c.id==='risa'&&i>=3)return base+' 梨沙は明るさを保ちながら、主人公の評価や視線を以前より強く意識する。';
 if(c.id==='emi'&&i>=3)return base+' 絵美はぶっきらぼうさを残すが、主人公だけには弱い部分を見せることが増える。';
 return base;
}
function relationshipMechanicBonus(){
 return [-12,-5,0,5,10,15,18][relationshipIndex()]||0;
}
function trackRelationshipStage(){
 if(!state)return;
 const label=relationshipLabel();
 if(state.lastRelationshipStage===null){state.lastRelationshipStage=label;return}
 if(state.lastRelationshipStage!==label){
   const old=state.lastRelationshipStage;
   state.lastRelationshipStage=label;
   remember('relationship',`${cnameSafe()}との関係が「${old}」から「${label}」へ変化した`,5,['relationship']);
   log(`関係段階: ${old} → ${label}`);
 }
}
const FOOD_MEMORY_TAGS={japanese:'和食',ramen:'ラーメン',fried:'揚げ物',dessert:'デザート'};
function remember(type,text,importance=2,tags=[]){
 if(!state)return;
 if(!Array.isArray(state.memories))state.memories=[];
 state.memorySeq=(state.memorySeq||0)+1;
 const key=type+'|'+text;
 const old=state.memories.find(m=>m.key===key);
 if(old){old.day=state.day;old.turn=state.turn;old.importance=Math.max(old.importance||1,importance);old.count=(old.count||1)+1}
 else state.memories.push({id:state.memorySeq,key,type,text,importance,day:state.day,turn:state.turn,count:1,tags});
 state.memories=state.memories.sort((a,b)=>(b.importance-a.importance)||(b.day-a.day)||(b.id-a.id)).slice(0,30);
}
function memoryText(){
 if(!state.memories?.length)return 'まだ長期記憶はない。';
 return state.memories.slice().sort((a,b)=>(b.importance-a.importance)||(b.day-a.day)).slice(0,12)
   .map(m=>`DAY ${m.day}: ${m.text}${m.count>1?`（累計${m.count}回）`:''}`).join('\n');
}
function foodGrowthKey(food){
 if(!food)return 'other';
 if(food.category)return food.category;
 const n=food.name||'';
 if(/ラーメン|麺|チャーシュー/.test(n))return'ramen';
 if(/揚げ|唐揚げ|フライ|とんかつ/.test(n))return'fried';
 if(/ケーキ|パフェ|アイス|甘|チョコ/.test(n))return'dessert';
 if(/和食|定食|魚|寿司|ご飯|御膳|丼/.test(n))return'japanese';
 return'other';
}
function foodExperience(key){
 state.foodExperience=state.foodExperience||{};
 return state.foodExperience[key]||{offered:0,eaten:0,refused:0,liking:0};
}
function recordFoodGrowth(food,accepted,source='食事'){
 const c=CHARACTERS[activeId],key=foodGrowthKey(food),label=FOOD_MEMORY_TAGS[key]||food.name||'食事';
 state.foodExperience=state.foodExperience||{};
 const ex=state.foodExperience[key]||{offered:0,eaten:0,refused:0,liking:0};
 ex.offered++; accepted?ex.eaten++:ex.refused++;
 let likingDelta=accepted?3:-1;
 // 主人公の誘いによって好物が増えるキャラ
 if((c.id==='erika'||c.id==='rei')&&accepted)likingDelta+=4;
 // 結衣は体重増加につれて油物嗜好が強まる
 if(c.id==='yui'&&key==='fried'&&accepted)likingDelta+=2+evolutionStage()*2;
 // 梨沙は甘い物への慣れが少し速い
 if(c.id==='risa'&&key==='dessert'&&accepted)likingDelta+=2;
 ex.liking=clamp((ex.liking||0)+likingDelta);
 state.foodExperience[key]=ex;
 if(ex.eaten===1)remember('food',`${c.name}は${source}で${label}を食べた`,2,['food',key]);
 if(ex.eaten===3)remember('food',`${c.name}は${label}を何度も食べ、以前より馴染みが出てきた`,3,['food',key]);
 if(ex.eaten>=3&&ex.liking>=18&&!state.favoriteFoods.includes(label)){
   state.favoriteFoods.push(label);
   remember('preference',`${c.name}は主人公との経験を通じて「${label}」が好きになった`,5,['preference',key]);
 }
 updateGrowthTraits(c);
}
function updateGrowthTraits(c){
 state.growthTraits=state.growthTraits||{};
 const g=state.growthTraits,st=evolutionStage(),gain=weightGainAmount();
 if(c.id==='yui'){
   const fried=foodExperience('fried');
   g.oilyPreference=clamp(Math.round(st*12+fried.eaten*7+fried.liking*.35));
 }
 if(c.id==='erika'){
   g.dependence=clamp(Math.round(Math.max(0,state.affection-45)*1.35));
   g.weightAnxiety=clamp(Math.round(st*14+Math.max(0,gain)*1.4));
 }
 if(c.id==='rei'){
   g.weightCuriosity=clamp(state.weightInterest||0);
 }
 if(c.id==='risa')g.bodyConcern=clamp(Math.round(st*11+Math.max(0,gain)*1.2));
 if(c.id==='emi'){g.weightAlarm=clamp(Math.round(st*16+Math.max(0,gain)*1.5));g.makanaiDependence=clamp(Math.round(state.emiMessDependence||0));g.competitionCondition=clamp(Math.round(state.emiCondition||0));g.juniorBond=clamp(Math.round(state.emiJuniorBond||0));g.misakiBodyLv=misakiBodyLv();}
}
function growthText(c){
 updateGrowthTraits(c);
 const lines=[];
 Object.entries(state.foodExperience||{}).forEach(([k,v])=>{
   if(v.offered)lines.push(`${FOOD_MEMORY_TAGS[k]||k}: 提案${v.offered}回 / 食べた${v.eaten}回 / 断った${v.refused}回 / 嗜好${Math.round(v.liking||0)}/100`);
 });
 const g=state.growthTraits||{};
 if(c.id==='yui')lines.push(`油物嗜好:${g.oilyPreference||0}/100（体重増加と揚げ物経験で上昇）`);
 if(c.id==='erika')lines.push(`主人公への依存傾向:${g.dependence||0}/100 / 体重増加への焦り:${g.weightAnxiety||0}/100`);
 if(c.id==='rei')lines.push(`体重増加への好奇心:${g.weightCuriosity||0}/100`);
 if(c.id==='risa')lines.push(`体型への意識:${g.bodyConcern||0}/100`);
 if(c.id==='emi')lines.push(`体重増加への危機感:${g.weightAlarm||0}/100｜まかない依存度:${g.makanaiDependence||0}/100｜競技コンディション:${g.competitionCondition||0}/100｜後輩との関係:${g.juniorBond||0}/100｜美咲体型Lv:${g.misakiBodyLv||1}`);
 return lines.length?lines.join('\n'):'まだ大きな嗜好変化はない。';
}
function bodyType(){const c=CHARACTERS[activeId],bmi=state.weight/((c.height/100)**2);if(bmi<18.5)return'Slim';if(bmi<23)return'Average';if(bmi<27)return'Curvy';if(bmi<32)return'Chubby';return'Very Chubby'}
