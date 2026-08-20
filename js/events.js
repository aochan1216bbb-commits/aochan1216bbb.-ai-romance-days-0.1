function stageNum(){return evolutionStage()+1}
function memoryCGPath(kind,key='',stage=stageNum()){
 const lv=String(Math.max(1,Math.min(7,stage))).padStart(2,'0');
 if(kind==='date')return `assets/${activeId}/memories/date_${key}_${lv}.webp?v=${APP_BUILD}`;
 if(kind==='special')return `assets/${activeId}/memories/special_${key}_${lv}.webp?v=${APP_BUILD}`;
 if(kind==='shopping')return `assets/${activeId}/memories/date_shopping_${lv}.webp?v=${APP_BUILD}`;
 if(kind==='night'){
   return `assets/${activeId}/memories/night_thought_${lv}.webp?v=${APP_BUILD}`;
 }
 return `assets/${activeId}/memories/${kind}_${key}_${lv}.webp?v=${APP_BUILD}`;
}
function cgPath(c,type,stage){
 if(type==='weight')return `assets/${c.id}/event_stage_${String(stage+1).padStart(2,'0')}.webp?v=${APP_BUILD}`;
 if(type.startsWith('date_'))return memoryCGPath('date',type.slice(5),stageNum());
 if(type.startsWith('food_'))return `assets/${c.id}/cg_${type}.webp?v=${APP_BUILD}`;
 return `assets/${c.id}/cg_${type}.webp?v=${APP_BUILD}`;
}
function hookEventSeenCount(charId,lv){
 if(charId==='erika')return (state.erikaRoutineHistory||[]).filter(e=>e.kind==='noon_hook'&&e.lv===lv).length;
 if(charId==='yui')return (state.cgGallery||[]).filter(x=>x.id===`special:yui:overeat_hook:${lv}`).length;
 return 0;
}
function hookTriggerProfile(charId,lv,fullness){
 const profiles={
  erika:{3:{minFullness:70,baseChance:0.48},4:{minFullness:68,baseChance:0.55},5:{minFullness:65,baseChance:0.70},6:{minFullness:60,baseChance:0.80},7:{minFullness:55,baseChance:0.90}},
  yui:{4:{minFullness:88,baseChance:0.46},5:{minFullness:84,baseChance:0.60},6:{minFullness:80,baseChance:0.76},7:{minFullness:74,baseChance:0.88}}
 };
 const profile=(profiles[charId]||{})[lv]||null;
 if(!profile)return {eligible:false,minFullness:999,chance:0,seenCount:0};
 let chance=profile.baseChance;
 if(charId==='erika'&&fullness>=90&&lv>=4)chance=Math.max(chance,0.98);
 if(charId==='yui'&&fullness>=95&&lv>=5)chance=Math.max(chance,0.96);
 const seenCount=hookEventSeenCount(charId,lv);
 if(seenCount>0){const decay=charId==='erika'?0.15:0.12;chance=Math.max(0.22,chance-(decay*Math.min(seenCount,2)));}
 return {eligible:fullness>=profile.minFullness,minFullness:profile.minFullness,chance,seenCount};
}
function hookDebugSummary(){
 if(!activeId||!state)return '';
 const lines=[];const fullness=Math.round(state.fullness),lv=stageNum();
 if(activeId==='erika'){
  const p=hookTriggerProfile('erika',lv,state.fullness);
  lines.push('対象: 絵里香 / 昼のホック事故');
  lines.push(`現在Lv.${lv} / 満腹度 ${fullness}`);
  if(p.minFullness>=999)lines.push('このLvではホック事故なし');
  else{lines.push(`発生条件: 満腹度 ${p.minFullness}以上`);lines.push(`現在の発生率: ${Math.round(p.chance*100)}%`);lines.push(`条件達成: ${p.eligible?'はい':'いいえ'}`);lines.push(`同Lv既出回数: ${p.seenCount}回`);}
 }else if(activeId==='yui'){
  const p=hookTriggerProfile('yui',lv,state.fullness);
  lines.push('対象: 結衣 / 食べすぎホック事件');
  lines.push(`現在Lv.${lv} / 満腹度 ${fullness}`);
  if(p.minFullness>=999)lines.push('このLvではホックイベントなし');
  else{lines.push(`発生条件: 満腹度 ${p.minFullness}以上`);lines.push(`現在の発生率: ${Math.round(p.chance*100)}%`);lines.push(`条件達成: ${p.eligible?'はい':'いいえ'}`);lines.push(`同Lv既出回数: ${p.seenCount}回`);}
 }
 return lines.join('<br>');
}
function renderHookDebugPanel(){
 const panel=$('hookDebugPanel'),box=$('hookDebugText');
 if(!panel||!box)return;
 if(!['erika','yui'].includes(activeId||'')){panel.classList.add('hidden');box.innerHTML='';return;}
 panel.classList.remove('hidden');
 box.innerHTML=hookDebugSummary()||'表示できるデータがありません。';
}
function yuiSpecialEvent(kind,title,detail){
 if(activeId!=='yui')return false;
 const lv=stageNum(),id=`special:yui:${kind}:${lv}`;
 if((state.cgGallery||[]).some(x=>x.id===id))return false;
 const path=memoryCGPath('special',kind,lv);
 unlockCG(id,title,path);
 addNarration(detail,'思い出CG');
 addCGMessage(title,path,'特殊CG');
 addBubble('system',`思い出CG「${title}」を解放しました。`,'CG解放');
 remember('cg',`${CHARACTERS[activeId].name}の特殊イベント「${title}」が起きた`,4,['cg','special',kind]);
 return true;
}
async function maybeYuiOvereatHook(source='食事'){
 const lv=stageNum();
 const profile=hookTriggerProfile('yui',lv,state.fullness);
 if(activeId!=='yui'||!profile.eligible||Math.random()>=profile.chance)return false;
 const fired=yuiSpecialEvent('overeat_hook','食べすぎてホックが弾ける',`${source}のあと、結衣は苦しそうにウエストへ手を添えた。次の瞬間、張りつめていたホックが外れ、本人は思わず固まった。`);
 if(!fired)return false;
 const ctx=`結衣専用の食べすぎ特殊イベント直後。
直前に起きたこと:${source}で食事を終えたあと、満腹で張ったお腹に押されてズボンのホックが外れた。
現在体型:Lv.${lv} / ${state.weight.toFixed(1)}kg
満腹度:${Math.round(state.fullness)}
好感度:${Math.round(state.affection)}
抑止力:${Math.round(state.restraint)}
この瞬間、結衣本人はホックが外れた事実をはっきり認識している。
主人公はその場にいる。
ホックが外れたことへの恥ずかしさ、驚き、食べすぎへの後悔を中心に、現在の関係性と体型Lvに合った自然な反応を返す。
体型Lvが高いほど「また太ったかも」「さすがに食べすぎた」などの自覚を少し強めてよい。
dialogueは1〜2文。narrationは1〜2文。食事前の話には戻らず、必ずホックが外れた直後のコメントにする。`;
 try{const r=await askAI('（食後、ズボンのホックが外れた）',null,null,ctx);addAIResponse(r,'食べすぎ特殊イベント');}
 catch(e){addNarration('結衣は外れたホックを見下ろし、慌ててウエストを押さえた。','食べすぎ特殊イベント');addBubble('assistant','……うそ。さすがに食べすぎたかな……ちょっと恥ずかしい。','食べすぎ特殊イベント');}
 openYuiHookFollowup(lv,source);
 return true;
}
function maybeYuiBellyGrab(force=false){
 if(activeId!=='yui'||stageNum()<5)return false;
 const key=`bellyGrabChecked:${state.day}:${state.turn}`;
 if(state.yuiSpecialFlags?.[key])return false;
 state.yuiSpecialFlags=state.yuiSpecialFlags||{};state.yuiSpecialFlags[key]=true;
 if(!force&&Math.random()>.24)return false;
 return yuiSpecialEvent('belly_grab','お腹の肉を掴んで実感',
   `鏡の前で、結衣は増えたお腹に両手を添え、柔らかくなった肉をそっと掴んだ。以前との違いを改めて実感している。`);
}

function openRoutineFollowup(config){
 state.pendingErikaRoutine={kind:config.kind||'routine_followup',title:config.title||'イベントへの返答',intro:config.intro||'',hint:config.hint||'',openingDialogue:config.openingDialogue||'',situation:config.situation||'',choices:(config.choices||[]).map(ch=>({label:ch.label,affection:ch.affection||0,mood:ch.mood||0,restraintDelta:ch.restraintDelta||0,tone:ch.tone||ch.label,charId:config.charId||activeId}))};
 save();render();
}
function renderRoutineChoices(){
 const panel=$('routineChoicePanel'),title=$('routineChoiceTitle'),text=$('routineChoiceText'),hint=$('routineChoiceHint'),box=$('routineChoices');
 if(!panel||!title||!text||!hint||!box)return;
 const p=state?.pendingErikaRoutine;
 if(!p){panel.classList.add('hidden');box.innerHTML='';return}
 panel.classList.remove('hidden');title.textContent=p.title||'イベントへの返答';text.textContent=p.intro||'';hint.textContent=p.hint||'';box.innerHTML='';
 const selectedType=blockingEventType();
 (p.choices||[]).forEach((ch,i)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=ch.label;b.disabled=selectedType!=='erikaRoutine';b.addEventListener('click',()=>resolveRoutineChoice(i));box.appendChild(b);});
}
async function resolveRoutineChoice(i){
 if(blockingEventType()!=='erikaRoutine'){showBlockingNotice();return}
 const p=state?.pendingErikaRoutine,ch=p?.choices?.[i];if(!p||!ch)return;
 const box=$('routineChoices');if(box)box.querySelectorAll('button').forEach(b=>b.disabled=true);
 const charId=ch.charId||activeId;const c=CHARACTERS[charId]||CHARACTERS[activeId];
 const beforeAff=state.affection,beforeMood=state.mood,beforeRes=state.restraint;
 changeAffection((ch.affection||0),'イベント');state.mood=clamp(state.mood+(ch.mood||0));if(ch.restraintDelta)state.restraint=clamp(state.restraint+ch.restraintDelta);
 const playerLine=await generatePlayerChoiceLine(ch.label,`特殊イベント後の返答 / キャラクター:${c.name} / 状況:${p.situation||p.intro||''} / 返答意図:${ch.tone}`);
 addBubble('user',playerLine,'特殊イベントへの返答');
 const ctx=`特殊イベント直後の会話分岐。
キャラクター:${c.name}
イベント種別:${p.kind}
イベント状況:${p.situation||p.intro||''}
直前のキャラクター発言:${p.openingDialogue||''}
主人公の選択肢:${ch.label}
主人公の実際の発言:${playerLine}
返答意図:${ch.tone}
確定数値変化: 好感度 ${beforeAff}→${state.affection} (${(ch.affection||0)>=0?'+':''}${ch.affection||0}) / 機嫌 ${beforeMood}→${state.mood} (${(ch.mood||0)>=0?'+':''}${ch.mood||0})${ch.restraintDelta?` / 抑止力 ${beforeRes}→${state.restraint} (${ch.restraintDelta>=0?'+':''}${ch.restraintDelta})`:''}
この数値変化は確定。イベント直後の気まずさ、恥ずかしさ、安堵、後悔などを反映した自然な反応を返すこと。
${charId==='yui'?'結衣は主人公より年上。主人公の台詞は敬語で、交際前は明確な恋愛告白にしない。':''}`;
 try{const r=await askAI(playerLine,null,null,ctx);addAIResponse(r,'特殊イベント後の返答');}
 catch(e){addAIResponse({narration:`${c.name}は主人公の言葉を聞き、少しだけ表情を緩めた。`,dialogue:charId==='yui'?'……ありがとうございます。ちょっと、恥ずかしかったです。':'……べ、別に助かったわけではありませんけれど……その、少し落ち着きましたわ。',emotion:'embarrassed'},'特殊イベント後の返答');}
 addBubble('system',`好感度 ${(ch.affection||0)>=0?'+':''}${ch.affection||0}｜機嫌 ${(ch.mood||0)>=0?'+':''}${ch.mood||0}${ch.restraintDelta?`｜抑止力 ${ch.restraintDelta>=0?'+':''}${ch.restraintDelta}`:''}`,'選択結果');
 remember('routine_followup',`${c.name}の特殊イベント後に「${ch.label}」と返した`,ch.affection>=4?4:2,['routine','followup',p.kind||'hook']);
 state.pendingErikaRoutine=null;save();render();
}
function openErikaHookFollowup(lv){openRoutineFollowup({charId:'erika',kind:'noon_hook_followup',title:`絵里香 Lv.${lv}：ホック事故のあと`,intro:'昼の事故で気まずそうにしている絵里香へ、どう声をかける？',hint:'事故後の専用会話分岐です。返答後、絵里香の反応も生成されます。',openingDialogue:lv>=6?'……っ、見ないでくださいまし……こんなの、最悪ですわ。':'……い、今のは見なかったことになさい。まったく、ありえませんわ……。',situation:erikaHookScene(lv),choices:[{label:'「大丈夫か。いったん落ち着こう」',affection:3,mood:4,tone:'落ち着かせ、まず本人の動揺を和らげる。'},{label:'「人目が気になるなら、隠せるようにしよう」',affection:4,mood:3,tone:'周囲の視線への不安を減らすよう具体的に助ける。'},{label:'「今日は無理せず、少し休んだ方がいい」',affection:2,mood:2,restraintDelta:1,tone:'体調や恥ずかしさを気遣い、無理をしないよう促す。'}]});}
function openYuiHookFollowup(lv,source){openRoutineFollowup({charId:'yui',kind:'yui_overeat_hook_followup',title:`結衣 Lv.${lv}：食べすぎてホックが外れたあと`,intro:`${source}のあと、結衣さんは外れたホックを押さえてかなり気まずそうにしています。どう声をかけますか？`,hint:'結衣向けの専用会話分岐です。主人公の返答は敬語寄りで処理されます。',openingDialogue:lv>=6?'……すみません、さすがに食べすぎました。こんなところ、見せたくなかったのに……。':'……あの、今のはちょっと恥ずかしいです。食べすぎちゃいましたね……。',situation:`${source}のあと、満腹で張ったお腹に押されてズボンのホックが外れた。`,choices:[{label:'「大丈夫ですか。いったん落ち着きましょう」',affection:3,mood:4,tone:'動揺を責めず、まず安心させる。'},{label:'「見えないように整えましょうか」',affection:4,mood:3,tone:'人目や服の乱れを気遣って助ける。'},{label:'「今日はもう無理なさらないでください」',affection:2,mood:2,restraintDelta:1,tone:'食べすぎた後悔に寄り添い、休むよう勧める。'}]});}
function blockingEventType(){
 if(aiGenerationBusy)return 'ai';
 if(state?.pendingWeightEvent)return 'weight';
 if(state?.pendingDateEvent)return 'date';
 if(state?.pendingInitiatedChoice)return 'initiative';
 if(state?.pendingErikaRoutine)return 'erikaRoutine';
 if(state?.pendingNightChoice)return 'night';
 if(state?.pendingRestraintEvent)return 'restraint';
 return null;
}
function blockingEventLabel(type=blockingEventType()){
 return {ai:'AI生成',weight:'体型変化イベント',date:'デート中イベント',initiative:'相手からの問いかけ',erikaRoutine:'特殊イベント後の返答',night:'夜の独白イベント',restraint:'抑止力イベント'}[type]||'イベント';
}
function showBlockingNotice(){
 const type=blockingEventType();if(!type)return;
 addBubble('system',`${blockingEventLabel(type)}の選択肢を先に選んでください。`,'選択待ち',false);
}
function setMainControlsLocked(locked){
 const ids=['sendBtn','eventBtn','giftBtn','dateBtn','advanceBtn','workBtn','debugWeightBtn','characterSelectBtn','restraintBtn'];
 ids.forEach(id=>{const el=$(id);if(el)el.disabled=!!locked});
 const msg=$('message');if(msg)msg.disabled=!!locked;
 const meal=$('mealSelect');if(meal)meal.disabled=!!locked;
 const gift=$('giftSelect');if(gift)gift.disabled=!!locked;
 const date=$('dateSelect');if(date)date.disabled=!!locked;
}
function syncEventLockUI(){
 const active=blockingEventType();
 setMainControlsLocked(!!active);
 const w=$('weightEventChoices'),d=$('dateEventChoices'),i=$('initiativeChoices'),r=$('restraintEventChoices'),n=$('nightChoiceChoices'),ru=$('routineChoices');
 if(w)w.classList.toggle('eventLocked',!!active&&active!=='weight');
 if(d)d.classList.toggle('eventLocked',!!active&&active!=='date');
 if(i)i.classList.toggle('eventLocked',!!active&&active!=='initiative');
 if(r)r.classList.toggle('eventLocked',!!active&&active!=='restraint');
 if(n)n.classList.toggle('eventLocked',!!active&&active!=='night');
 if(ru)ru.classList.toggle('eventLocked',!!active&&active!=='erikaRoutine');
 const dp=$('dateEventPanel'),ip=$('initiativeChoicePanel'),rp=$('restraintEventPanel'),np=$('nightChoicePanel'),rup=$('routineChoicePanel');
 if(dp&&active!=='date')dp.classList.add('hidden');
 if(ip&&active!=='initiative')ip.classList.add('hidden');
 if(rp&&active!=='restraint')rp.classList.add('hidden');
 if(np&&active!=='night')np.classList.add('hidden');
 if(rup&&active!=='erikaRoutine')rup.classList.add('hidden');
if(typeof syncChoiceModalState==='function')syncChoiceModalState();}
function openCGViewer(path,title='思い出CG'){
 const modal=$('cgViewer'),img=$('cgViewerImage');if(!modal||!img)return;
 img.src=path;img.onerror=()=>{img.alt='画像を読み込めませんでした';};
 $('cgViewerTitle').textContent=title;
 modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
}
function closeCGViewer(){
 const modal=$('cgViewer');if(!modal)return;
 modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');
}
function addCGMessage(title,path,meta='思い出CG',persist=true){
 if(!path)return;
 const chat=$('chat');if(!chat)return;
 const wrap=document.createElement('div');wrap.className='cgInline';
 const img=document.createElement('img');img.src=path;img.alt=title;img.loading='lazy';
 img.onerror=()=>{wrap.style.display='none'};
 img.addEventListener('click',()=>openCGViewer(path,title));
 const cap=document.createElement('div');cap.className='cgCaption';cap.textContent=`${meta}｜${title}（タップで拡大）`;
 wrap.appendChild(img);wrap.appendChild(cap);chat.appendChild(wrap);chat.scrollTop=chat.scrollHeight;
 if(persist){
   state.history.push({role:'cg',title,path,meta});
   if(state.history.length>90)state.history=state.history.slice(-90);
   save();
 }
}
function openAlbum(){
 renderCGGallery();
 const m=$('albumModal');if(!m)return;
 m.classList.remove('hidden');m.setAttribute('aria-hidden','false');
}
function closeAlbum(){
 const m=$('albumModal');if(!m)return;
 m.classList.add('hidden');m.setAttribute('aria-hidden','true');
}
function unlockCG(id,title,path){
 state.cgGallery=state.cgGallery||[];
 if(state.cgGallery.some(x=>x.id===id))return;
 state.cgGallery.push({id,title,path,day:state.day});
 remember('cg',`思い出CG「${title}」を解放した`,4,['cg']);
}
function renderCGGallery(){
 const el=$('albumGrid');if(!el)return;
 const list=state?.cgGallery||[];
 const count=$('albumCount');if(count)count.textContent=`${list.length}枚解放`;
 if(!list.length){el.innerHTML='<div class="small">まだ思い出CGは解放されていません。</div>';return}
 el.innerHTML='';
 list.slice().reverse().forEach(x=>{
   const card=document.createElement('button');card.type='button';card.className='albumCard';
   const img=document.createElement('img');img.src=x.path;img.alt=x.title;img.loading='lazy';
   img.onerror=()=>{img.style.opacity='.18'};
   const txt=document.createElement('div');txt.className='albumText';txt.innerHTML=`<b>${escapeHtml(x.title)}</b><br>DAY ${x.day}`;
   card.appendChild(img);card.appendChild(txt);
   card.addEventListener('click',()=>openCGViewer(x.path,x.title));
   el.appendChild(card);
 });
}

const YUI_WEIGHT_EVENT_TITLES=[
 '',
 'お腹が出てきたことを認知',
 'ズボンのウエストがきつい',
 'ズボンのホックが外れる',
 '昔着ていたドレスが入らない',
 'シャツが破れ、お腹が溢れる',
 'ホックが全く閉まらず太ったことを再確認'
];
const YUI_WEIGHT_STAGE_SCENES={
 1:{
   title:'お腹が出てきたことを認知',
   text:'結衣はふと鏡の前で立ち止まり、以前より下腹部が少し前に出ていることに気づく。服の上からそっとお腹へ手を添え、自分でも分かる程度の変化に戸惑っている。',
   fallbackDialogue:'……あれ。前より少し、お腹出てきてるよね。気のせいじゃないかも。'
 },
 2:{
   title:'ズボンのウエストがきつい',
   text:'結衣はいつものズボンを履こうとするが、ウエストが以前より明らかにきつい。腰回りを整えながら何度か位置を直し、サイズ感の変化を認識する。',
   fallbackDialogue:'……これ、こんなにきつかったっけ。前はもう少し普通に履けたはずなんだけど。'
 },
 3:{
   title:'ズボンのホックが外れる',
   text:'結衣がきつくなったズボンを気にしながら動いた瞬間、張っていたウエストのホックが外れる。結衣は驚いて動きを止め、外れた部分と自分のお腹を交互に見ている。',
   fallbackDialogue:'えっ……今、外れた？ うそ……さすがにこれは、ちょっとショックかも。'
 },
 4:{
   title:'昔着ていたドレスが入らない',
   text:'結衣は昔よく着ていたドレスを久しぶりに試すが、身体に引っかかって最後まで着られない。何度か整えようとしたあと、以前とのサイズ差をはっきり実感する。',
   fallbackDialogue:'……これ、昔は普通に着てたのに。まさか、ここまで入らなくなってるなんて。'
 },
 5:{
   title:'シャツが破れ、お腹が溢れる',
   text:'結衣がきつくなったシャツを無理に整えようとした拍子に、生地の一部が裂ける。裾から柔らかな腹部が押し出され、結衣は慌ててそこを隠そうとして強く赤面している。',
   fallbackDialogue:'ちょ、ちょっと待って……破れた？ もう……こんなの、恥ずかしすぎるよ。'
 },
 6:{
   title:'ホックが全く閉まらず太ったことを再確認',
   text:'結衣はズボンの左右を力を入れて引き寄せるが、ホック同士の距離は大きく開いたままで全く届かない。何度試しても閉まらず、以前よりかなり太ったことを改めて認めざるを得ない。',
   fallbackDialogue:'……全然届かない。前は閉まってたのに……私、本当にずいぶん太ったんだね。'
 }
};
function yuiWeightStageEvent(stage){
 const spec=YUI_WEIGHT_STAGE_SCENES[stage];
 if(!spec)return null;
 const lv=String(stage+1).padStart(2,'0');
 const commonChoices=[
   {label:'気持ちを受け止めて安心させる',affection:4,mood:3,restraint:1,reply:'「……ありがとう。そう言ってもらえると、少し落ち着く。」'},
   {label:'本人がどう感じているか聞く',affection:4,mood:1,restraint:3,reply:'「どう感じてるか、か……うん。ちゃんと考えないとね。」'},
   {label:'変化を率直に認めつつ今後を気遣う',affection:1,mood:-2,restraint:6,reply:'「……やっぱり分かるよね。自分でも、もう誤魔化せないかな。」'}
 ];
 return {title:spec.title,text:spec.text,image:`assets/yui/event_stage_${lv}.webp`,choices:commonChoices,sceneSpec:spec};
}
const WEIGHT_STAGE_EVENTS={
  risa:{
    1:{title:'制服が少しきつい…？',text:'朝、制服に着替えた梨沙はスカートのウエストにいつもと違う窮屈さを感じた。鏡の前で何度か位置を直しながら、少しだけ表情を曇らせている。',image:'assets/risa/event_stage_02.webp',choices:[
      {label:'「少しきつそう？」と優しく聞く',affection:3,mood:-1,restraint:4,reply:'「……やっぱ分かる？ ちょっとだけ、ほんとにちょっとだけだからね。」'},
      {label:'何も言わず普段通り接する',affection:2,mood:2,restraint:1,reply:'「……何も言わないんだ。まあ、その方が助かるけど。」'},
      {label:'「少し太ったんじゃない？」と指摘する',affection:-3,mood:-5,restraint:7,reply:'「分かってるってば！ そんなはっきり言わなくてもいいじゃん……。」'}
    ]}
  },
  emi:{
    1:{title:'練習着の違和感',text:'絵美は大学陸上部の練習前、いつもの練習着のウエストと太腿まわりが少しきついことに気づく。まだ大きな異変とは思いたくないが、身体に残る窮屈さに小さく眉をひそめている。',image:'assets/emi/event_stage_02.webp',fallbackDialogue:'……あれ。なんか今日、練習着きつくない？ いや、気のせいだと思うけど。',choices:[
      {label:'体調を気遣って声をかける',affection:3,mood:2,restraint:2,reply:'「体調は悪くない。……でも、ちょっとだけ引っかかるんだよね。」'},
      {label:'練習の負荷が高かったのか聞く',affection:2,mood:0,restraint:4,reply:'「最近走り込んでるし、そのせいかも。……たぶん。」'},
      {label:'サイズが変わったのかもと率直に言う',affection:-4,mood:-5,restraint:7,reply:'「は？ そこまで言う？ ……まだそんな段階じゃないし。」'}
    ]},
    2:{title:'タイムが落ちる',text:'絵美はいつもの短距離メニューをこなしたあと、自己基準より明らかに遅いタイムに言葉を失う。何本か走り直しても感覚が戻らず、苛立ちと焦りを隠せずにいる。',image:'assets/emi/event_stage_03.webp',fallbackDialogue:'……嘘でしょ。このタイム、全然よくない。今日の調子だけってことにしたいんだけど。',choices:[
      {label:'無理をせず一度落ち着こうと勧める',affection:4,mood:2,restraint:3,reply:'「……そうだね。今イラついても余計ダメか。」'},
      {label:'最近どこが重いのか具体的に聞く',affection:4,mood:1,restraint:5,reply:'「スタートも中盤も鈍い感じ。前みたいに身体が前へ出ない。」'},
      {label:'体型の影響かもしれないと指摘する',affection:-3,mood:-5,restraint:8,reply:'「分かってるよ、そんなの……でも、まだ認めたくない。」'}
    ]},
    3:{title:'スタートで身体が重い',text:'スターティングブロックを蹴り出した瞬間、絵美は以前より身体が前に出ない重さをはっきり感じる。練習後にはユニフォームのウエストを引っ張って確かめ、自分の腹部や腰まわりを気にしている。',image:'assets/emi/event_stage_04.webp',fallbackDialogue:'……出遅れたっていうか、身体が重い。なんかもう、ごまかしにくくなってきた。',choices:[
      {label:'責めずに気持ちへ寄り添う',affection:5,mood:3,restraint:3,reply:'「ありがと。今はそういう言い方の方が助かる。」'},
      {label:'何が一番つらいのか静かに聞く',affection:4,mood:1,restraint:5,reply:'「走れないこともだけど、自分の身体が思い通りじゃないのが一番きつい。」'},
      {label:'はっきり変化を認めるよう促す',affection:-3,mood:-5,restraint:9,reply:'「……簡単に言うなって。分かってるけど、そう割り切れない。」'}
    ]},
    4:{title:'練習についていけない',text:'チーム練習の途中、絵美は後半のメニューについていけず、膝に手をついて大きく息を整える。後輩から心配されるほど消耗しており、エースだった自分との差を痛感している。',image:'assets/emi/event_stage_05.webp',fallbackDialogue:'……最悪。後輩に心配されるとか、ほんと笑えないんだけど。',choices:[
      {label:'頑張ってきた分だけ今は休もうと伝える',affection:5,mood:3,restraint:3,reply:'「……そうだね。意地だけじゃどうにもならないか。」'},
      {label:'一人で抱え込んでいないか尋ねる',affection:5,mood:2,restraint:4,reply:'「抱え込んでるつもりはないけど……ちょっと、きつい。」'},
      {label:'このままでは厳しいと現実を突きつける',affection:-4,mood:-6,restraint:10,reply:'「分かってるよ！ だから余計に腹立つんじゃん……。」'}
    ]},
    5:{title:'大会で大敗し、退部を決意',text:'公式レースで振るわなかった絵美は、ゴール後もしばらく息が整わず、その場に座り込む。記録を見つめたあと、人の少ない場所で大会の結果と今の自分の身体を受け止めきれず、ついに大学陸上部を辞める決意を固める。',image:'assets/emi/event_stage_06.webp',fallbackDialogue:'……もう無理かも。今のあたしで続けても、みっともないだけだよね。部、やめる。',choices:[
      {label:'決断を否定せず、気持ちを支える',affection:7,mood:4,restraint:2,reply:'「……否定しないでくれて助かる。今はそれだけで十分。」'},
      {label:'本心なのか、少しだけ確認する',affection:5,mood:1,restraint:5,reply:'「悔しいよ。悔しいけど……今のまま続ける方が、もっとつらい。」'},
      {label:'まだ辞めない方がいいと強く引き止める',affection:-3,mood:-6,restraint:8,reply:'「そんな簡単に言わないで。決めるまで、どれだけしんどかったと思ってるの。」'}
    ]},
    6:{title:'スパイクを前に、元陸上部の自分を見つめる',text:'退部後の夜、絵美は部屋で使い込んだスパイクや昔の記録を前に座り込み、競技をしていた頃の自分と今の自分を静かに見比べる。もう元の生活には戻れていない現実が、表情にも滲んでいる。',image:'assets/emi/event_stage_07.webp',fallbackDialogue:'……ほんと、別人みたい。前のあたしなら、こんなん絶対許せなかったのに。',choices:[
      {label:'昔の頑張りも今の絵美も否定しない',affection:6,mood:3,restraint:2,reply:'「……そう言われると、ちょっと救われる。」'},
      {label:'今いちばんつらいことを聞く',affection:5,mood:1,restraint:4,reply:'「走れないこともだけど、もう前の自分じゃないって認めるのがきつい。」'},
      {label:'切り替えて前を向こうと急かす',affection:-3,mood:-4,restraint:6,reply:'「そんなすぐ切り替えられたら苦労しないっての……。」'}
    ]}
  },
  yui:{},
  erika:{
    1:{title:'あり得ませんわ…',text:'絵里香は鏡の前で、いつもの服がわずかにきつくなっていることに気づいた。本人はかなり動揺している。',image:'assets/erika/event_stage_02.webp',fallbackDialogue:'……少しだけ服がきつい気がしますけれど、気のせいですわよね？ わたくしが太るなんて、あり得ませんもの。',choices:[
      {label:'何も変わらないとフォローする',affection:3,mood:2,restraint:3,reply:'「と、当然ですわ！ わたくしが太るなどあり得ませんもの。」'},
      {label:'サイズを変えるのもありと提案する',affection:0,mood:-2,restraint:7,reply:'「サイズを変える！？ 失礼ですわね！」'},
      {label:'少し太ったと指摘する',affection:-5,mood:-7,restraint:10,reply:'「な、何をおっしゃってますの！？ あり得ませんわ！」'}
    ]},
    2:{title:'見られましたの…？',text:'絵里香はトップスの上から少し増えたお腹の肉を指先でつまみ、信じられないものを見るように確かめている。その姿を主人公に見られたことに気づき、慌てて手を離して顔を赤くする。',image:'assets/erika/event_stage_03.webp',fallbackDialogue:'い、今のは見なかったことになさい！ ただ少し、気になっただけですわ！',choices:[
      {label:'見なかったことにして安心させる',affection:4,mood:3,restraint:2,reply:'「……本当に？ なら、余計なことは言わないでくださいまし。」'},
      {label:'気になっているのか優しく聞く',affection:4,mood:1,restraint:4,reply:'「べ、別に気にしてなど……少しだけですわ。」'},
      {label:'少し増えたように見えると伝える',affection:-3,mood:-5,restraint:8,reply:'「あなたまでそんなことを言うんですの！？」'}
    ]},
    3:{title:'ホックが弾けましたわ…！',text:'絵里香がきつくなったスカートを気にしながら動いた瞬間、ウエストのホックが弾けて外れる。スカートの隙間からお腹が露わになり、絵里香は驚きと羞恥で真っ赤になって慌てて隠そうとする。',image:'assets/erika/event_stage_04.webp',fallbackDialogue:'なっ……！ い、今のは事故ですわ！ 見ないでくださいます！？',choices:[
      {label:'視線を外して落ち着かせる',affection:5,mood:3,restraint:3,reply:'「……その、助かりますわ。今は見ないでくださいまし。」'},
      {label:'大丈夫かと声をかける',affection:4,mood:1,restraint:5,reply:'「大丈夫ですわ！ ……大丈夫、ですけれど……。」'},
      {label:'サイズが合っていないと率直に言う',affection:-4,mood:-6,restraint:10,reply:'「分かっていますわよ！ 今それを言いますの！？」'}
    ]},
    4:{title:'息が上がるなんて…',text:'絵里香は少し歩いただけなのに以前より早く息が上がり、額にうっすら汗を浮かべている。本人も最近こうしたことが増えたと気づいており、体力のせいだと言い聞かせながらも体型変化との関係を気にしている。',image:'assets/erika/event_stage_05.webp',fallbackDialogue:'この程度で息が上がるなんて……最近、妙に汗もかきますの。べ、別に体重のせいとは限りませんわよね？',choices:[
      {label:'無理せず休もうと気遣う',affection:5,mood:3,restraint:3,reply:'「……仕方ありませんわね。少しだけ休みますわ。」'},
      {label:'最近いつから気になるのか聞く',affection:4,mood:1,restraint:5,reply:'「ここ最近ですわ。以前はこんなこと、ありませんでしたのに……。」'},
      {label:'体重の影響もありそうだと伝える',affection:-2,mood:-4,restraint:9,reply:'「そ、それくらい自分でも考えていますわ！」'}
    ]},
    5:{title:'ブラウスのボタンが…！',text:'絵里香がきつくなったお気に入りのブラウスを整えようとした瞬間、上のボタンが張力に耐えきれず弾け飛ぶ。本人は一瞬固まったあと、胸元からお腹周りを押さえながら強い羞恥と焦りを隠せずにいる。',image:'assets/erika/event_stage_06.webp',fallbackDialogue:'う、嘘でしょう……ブラウスのボタンまで……。こんなの、絶対に誰にも言わないでくださいまし！',choices:[
      {label:'誰にも言わないと約束する',affection:6,mood:4,restraint:3,reply:'「……約束ですわよ。絶対ですからね。」'},
      {label:'怪我がないか確認する',affection:5,mood:2,restraint:4,reply:'「怪我はありませんわ。……それより、今のを見られた方が問題ですの。」'},
      {label:'もう少し余裕のある服にした方がいいと言う',affection:-2,mood:-4,restraint:10,reply:'「それは……分かっていますけれど、認めたくありませんの！」'}
    ]},
    6:{title:'認めたくありませんでしたのに',text:'絵里香は鏡の前で現在の自分の身体を見つめ、もう一時的な変化ではないと悟る。これまで意地でも否定してきたが、とうとう自分が太ったことを認め、悔しさと恥ずかしさから目に涙を浮かべている。',image:'assets/erika/event_stage_07.webp',fallbackDialogue:'……太りましたわ。もう、誤魔化せませんもの。こんなはずではなかったのに……悔しいですわ……。',choices:[
      {label:'そばにいて気持ちを受け止める',affection:7,mood:4,restraint:2,reply:'「……今だけは、何も言わずそばにいてくださる？」'},
      {label:'今どうしたいのか静かに聞く',affection:5,mood:1,restraint:5,reply:'「どうしたいかなんて……まだ分かりませんわ。でも、このままは嫌ですの。」'},
      {label:'以前より太ったのは事実だと認める',affection:-3,mood:-6,restraint:10,reply:'「分かっていますわよ……だから悔しいんですの！」'}
    ]}
  },
  rei:{
    1:{title:'服の感触が違う',text:'怜は着替えながら、以前より服が身体に沿う感覚に気づいた。驚くというより、興味深そうに確認している。',image:'assets/rei/event_stage_02.webp',choices:[
      {label:'どう感じるか聞く',affection:3,mood:2,restraint:1,reply:'「……ちょっと違う。こういう変化、面白いね。」'},
      {label:'気にしなくていいと言う',affection:2,mood:2,restraint:0,reply:'「うん。別に嫌ではない。」'},
      {label:'体重を測ってみる？と聞く',affection:2,mood:1,restraint:2,reply:'「……測ってみようかな。」'}
    ]}
  }
};
function genericWeightEvent(c,stage){
 const labels=['','少し変化','変化を実感','かなり変化','大きく変化','非常に大きな変化','最大段階'];
 return {title:`体重変化 Lv.${stage+1}`,text:`${c.name}は、以前よりはっきりした体型の変化に気づいた。現在は「${labels[stage]}」の段階。`,image:`assets/${c.id}/event_stage_${String(stage+1).padStart(2,'0')}.webp`,choices:[
   {label:'優しく声をかける',affection:3,mood:2,restraint:2,reply:'……うん。自分でも変わったのは分かってる。'},
   {label:'本人の気持ちを聞く',affection:4,mood:1,restraint:1,reply:'どう感じてるか、か。……ちょっと考える。'},
   {label:'変化を率直に指摘する',affection:-2,mood:-3,restraint:5,reply:'そこまではっきり言われると、さすがに気になる。'}
 ]};
}
function getWeightStageEvent(c,stage){
 if(c.id==='yui'){
   const yui=yuiWeightStageEvent(stage);
   if(yui)return yui;
 }
 const own=WEIGHT_STAGE_EVENTS[c.id]&&WEIGHT_STAGE_EVENTS[c.id][stage];
 return own||genericWeightEvent(c,stage);
}
function weightGainAmount(){return Math.max(0,state.weight-state.startWeight)}
function evolutionStage(){const d=weightGainAmount();if(d<3)return 0;if(d<8)return 1;if(d<15)return 2;if(d<25)return 3;if(d<40)return 4;if(d<60)return 5;return 6}
function imageStage(){return evolutionStage()+1}
function imagePath(c){return `assets/${c.id}/standing_${String(imageStage()).padStart(2,'0')}.webp?v=${APP_BUILD}`}
function evolutionLabel(){return ['変化前','少し変化','変化を実感','かなり変化','大きく変化','非常に大きな変化','最大段階'][evolutionStage()]}

function queueWeightEventIfNeeded(c,previousStage){
 const now=evolutionStage();
 if(now<=previousStage)return;
 if(!Array.isArray(state.seenWeightEvents))state.seenWeightEvents=[];
 for(let stage=previousStage+1;stage<=now;stage++){
   if(stage<1)continue;
   const key=`${c.id}:${stage}`;
   if(!state.seenWeightEvents.includes(key)){
     state.pendingWeightEvent={stage,key,aiIntroShown:false,aiGenerating:false,aiSituation:'',aiDialogue:'',aiEmotion:'normal',aiChoices:null};
     const ev=getWeightStageEvent(c,stage);
     const cgTitle=c.id==='yui'?(YUI_WEIGHT_EVENT_TITLES[stage]||ev.title):ev.title;
     const cgImage=c.id==='yui'?cgPath(c,'weight',stage):(ev.image+`?v=${APP_BUILD}`);
     unlockCG(`weight:${c.id}:${stage}`,cgTitle,cgImage);
     save();
     renderWeightEvent();
     generateWeightEventOpeningAI().catch(()=>{});
     return;
   }
 }
}
async function generateWeightEventOpeningAI(){
 if(!state?.pendingWeightEvent||state.pendingWeightEvent.aiGenerating||state.pendingWeightEvent.aiIntroShown)return false;
 const p=state.pendingWeightEvent,c=CHARACTERS[activeId],stage=p.stage,ev=getWeightStageEvent(c,stage),gs=globalSettings();
 p.aiGenerating=true;save();renderWeightEvent();
 const yuiSpec=c.id==='yui'?YUI_WEIGHT_STAGE_SCENES[stage]:null;
 const fallbackDialogue=ev.fallbackDialogue||yuiSpec?.fallbackDialogue||(c.id==='emi'?'……なんか前より動きにくい。ちょっと気になるんだけど。':c.id==='erika'?'……少しだけ、服の感触が違う気がしますわ。気のせいですわよね？':c.id==='rei'?'……前と感触が違う。こういう変化、ちょっと気になる。':'……前より少し変わったよね。自分でも分かる。');
 const fallback={situation:ev.text,dialogue:fallbackDialogue,emotion:'troubled',choices:(ev.choices||[]).map(x=>x.label).slice(0,3)};
 if(!gs.apiKey){Object.assign(p,{aiGenerating:false,aiIntroShown:true,aiSituation:fallback.situation,aiDialogue:fallback.dialogue,aiEmotion:fallback.emotion,aiChoices:fallback.choices});save();renderWeightEvent();return true}
 const choiceIntents=(ev.choices||[]).slice(0,3).map((x,i)=>`${i+1}. ${x.label}（好感度効果:${(x.affection||0)>=0?'+':''}${x.affection||0} / 機嫌効果:${(x.mood||0)>=0?'+':''}${x.mood||0} / 元の返答:${x.reply||''}）`).join('\n');
 const instructions=`恋愛シミュレーションゲームの体型変化イベント開始文を生成する。JSONのみ返す。
形式:{"situation":"状況説明1〜3文","dialogue":"キャラクター本人の発言1〜2文","emotion":"normal|happy|embarrassed|angry|troubled|surprised","choices":["主人公の返答1","主人公の返答2","主人公の返答3"]}
状況説明と発言は明確に分離する。主人公の行動や発言を勝手に確定しない。choicesは必ず3件で、下記の3つの元選択肢と同じ意味・順番を保ちながら、直前のキャラクター発言へ自然に返せる主人公の短い発言にする。体型を侮辱せず、現在Lvとキャラクター設定を守る。
【結衣への主人公の話し方】相手が結衣の場合、主人公はかなり年下なので、告白成立前は敬語で礼儀正しく返す。ポジティブな声かけ・励まし・気遣い・節度ある褒め言葉は使ってよいが、「好きです」「惚れています」「結衣さんだから特別です」「付き合いたいです」など、主人公から明確な恋愛感情を伝える表現は禁止。恋愛感情を明言してよいのは告白イベントで交際を受け入れた後だけ。恋人後も敬語ベースを維持する。
【最重要】イベントに「CG対応シーン」が指定されている場合、CGで起きている出来事を変更・追加・省略しない。状況説明とキャラクター発言は必ずそのCGの瞬間から自然につなげる。別の服、別の事故、別の場所へ勝手に置き換えない。`;
 const input=`キャラクター:${c.name} / ${c.age}歳
体型Lv:${stage+1}/7 / 現在体重:${state.weight.toFixed(1)}kg
イベント:${ev.title}
元の状況:${ev.text}
${c.id==='yui'&&yuiSpec?`CG対応シーン（厳守）: Lv${stage}→Lv${stage+1}。${yuiSpec.text}
CGファイル: assets/yui/event_stage_${String(stage+1).padStart(2,'0')}.webp
このCGの出来事を会話の起点にすること。`:''}
現在の関係:${relationshipLabel()} / 好感度:${Math.round(state.affection)}
心理:${psychologicalProfile(c)}
キャラクター設定:${c.personality} / ${c.speech}
元の3択:
${choiceIntents}
${c.id==='yui'?'結衣は30歳で主人公よりかなり年上。体型変化に加え、恋愛関係が進んでいる場合は年齢差への遠慮が自然に混ざってもよい。':''}`;
 const model=normalizeModel(gs.model),body={model,instructions,input,max_output_tokens:500};if(/^gpt-5/.test(model))body.reasoning={effort:'minimal'};
 try{
  const res=await aiFetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+gs.apiKey},body:JSON.stringify(body)});
  if(!res.ok)throw new Error('HTTP '+res.status);
  const data=await res.json(),raw=extractResponseText(data);if(!raw)throw new Error('empty');
  let txt=String(raw).trim().replace(/^```(?:json)?\s*/i,'').replace(/```$/,'').trim(),obj=JSON.parse(txt);
  const choices=Array.isArray(obj.choices)?obj.choices.map(x=>String(x||'').trim()).filter(Boolean).slice(0,3):[];
  if(choices.length!==3)throw new Error('choices');
  Object.assign(p,{aiGenerating:false,aiIntroShown:true,aiSituation:String(obj.situation||fallback.situation),aiDialogue:String(obj.dialogue||fallback.dialogue),aiEmotion:normalizeEmotion(obj.emotion),aiChoices:choices});
 }catch(e){Object.assign(p,{aiGenerating:false,aiIntroShown:true,aiSituation:fallback.situation,aiDialogue:fallback.dialogue,aiEmotion:fallback.emotion,aiChoices:fallback.choices})}
 save();renderWeightEvent();return true;
}
async function announceWeightEventAI(){return generateWeightEventOpeningAI()}
function renderWeightEvent(){
 const modal=$('weightEventModal');
 if(!modal)return;
 if(!state||!state.pendingWeightEvent){modal.classList.add('hidden');return}
 const c=CHARACTERS[activeId],stage=state.pendingWeightEvent.stage,ev=getWeightStageEvent(c,stage);
 modal.classList.remove('hidden');
 $('weightEventTitle').textContent=`${c.name}｜${ev.title}`;
 const p=state.pendingWeightEvent;
 const situation=p.aiSituation||ev.text,dialogue=p.aiDialogue||'';
 $('weightEventText').textContent=dialogue?`【状況】\n${situation}\n\n【${c.name}の発言】\n「${dialogue}」`:`【状況】\n${situation}`;
 if(!p.aiIntroShown&&!p.aiGenerating)generateWeightEventOpeningAI().catch(()=>{});
 const img=$('weightEventImage');img.dataset.fallback='';img.src=ev.image+`?v=${APP_BUILD}`;img.onerror=()=>placeholder(img,c.name+' EVENT');
 const box=$('weightEventChoices');box.innerHTML='';
 ev.choices.forEach((choice,i)=>{
   const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=(p.aiChoices&&p.aiChoices[i])||choice.label;b.disabled=!!p.aiGenerating||!p.aiIntroShown;
   b.addEventListener('click',()=>resolveWeightEventChoice(i));box.appendChild(b);
 });
}
async function resolveWeightEventChoice(index){
 if(!state||!state.pendingWeightEvent)return;
 const c=CHARACTERS[activeId],stage=state.pendingWeightEvent.stage,ev=getWeightStageEvent(c,stage),choice=ev.choices[index],generatedLabel=(state.pendingWeightEvent.aiChoices&&state.pendingWeightEvent.aiChoices[index])||choice?.label;
 if(!choice)return;
 const btnBox=$('weightEventChoices');if(btnBox)btnBox.querySelectorAll('button').forEach(b=>b.disabled=true);

 const before={affection:state.affection,mood:state.mood,restraint:state.restraint,weight:state.weight};
 changeAffection((choice.affection||0),'イベント');
 state.mood=clamp(state.mood+(choice.mood||0));
 {
   let rd=choice.restraint||0;
   if(c.id==='erika'&&rd>0)rd=erikaRestraintDelta(rd,'体型変化イベント');
   state.restraint=clamp(state.restraint+rd);
 }
 if(!Array.isArray(state.seenWeightEvents))state.seenWeightEvents=[];
 state.seenWeightEvents.push(state.pendingWeightEvent.key);

 const playerLine=await generatePlayerChoiceLine(generatedLabel,`直前の${c.name}の発言:${state.pendingWeightEvent.aiDialogue||''} / 元の選択意図:${choice.label} / ${choice.reply||choice.label}`);
 addBubble('user',playerLine,'体重変化イベント');
 const yuiCgContext=c.id==='yui'&&YUI_WEIGHT_STAGE_SCENES[stage]?`CG対応シーン（変更禁止）: Lv${stage}→Lv${stage+1} / ${YUI_WEIGHT_STAGE_SCENES[stage].text}`:'';
 const ctx=`体重変化イベントの選択後。
イベント:${ev.title}
${yuiCgContext}
元の状況:${state.pendingWeightEvent.aiSituation||ev.text}
イベント開始時の${c.name}の発言:${state.pendingWeightEvent.aiDialogue||''}
主人公が選んだ行動:${generatedLabel}\n主人公の実際の発言:${playerLine}
ゲーム側の確定結果:
好感度 ${before.affection}→${state.affection} (${choice.affection>=0?'+':''}${choice.affection||0})
機嫌 ${before.mood}→${state.mood} (${choice.mood>=0?'+':''}${choice.mood||0})
抑止力 ${before.restraint}→${state.restraint} (${choice.restraint>=0?'+':''}${choice.restraint||0})
現在体重:${state.weight.toFixed(1)}kg
${c.id==='yui'?'CGで起きた出来事をなかったことにしたり別シーンへ移動したりせず、その場の直後として反応を続けること。':''}
この選択直後の${c.name}の反応を、設定と現在ステータスに合わせて返すこと。
既定文「${choice.reply||''}」は参考にしてよいが、会話文脈に自然になるよう言い換えてよい。`;
 const ok=await showEventAI(playerLine,ctx,'体重変化イベント');
 if(!ok){
   addNarration(`${c.name}はその言葉を受け、服や身体の変化を確かめるように視線を落とした。`,'体重変化イベント');
   addBubble('assistant',choice.reply||'……。','体重変化イベント');
 }
 if(c.id==='emi'&&stage>=5){
   state.growthTraits=state.growthTraits||{};
   state.growthTraits.emiQuitTrack=true;
 }
 remember('weight',`${c.name}の「${ev.title}」で主人公は「${generatedLabel}」と対応した`,5,['weight','event']);
 log(`体重変化Lv.${stage+1}イベント完了：${generatedLabel}`);
 state.pendingWeightEvent=null;save();render();renderWeightEvent();
 queueWeightEventIfNeeded(c,stage);
}
function updateEvolution(c){
 const d=weightGainAmount(),stage=evolutionStage();
 if(c.id==='yui'&&Number(state.seenNightEventStage)!==stage+1){
   state.seenNightEventIds=[];
   state.seenNightEventStage=stage+1;
 }
 state.weightStage=stage;
 if(c.id==='rei'){
   // 怜は増加を重ねるほど「増えること」への興味が育つ。興味50以上で食後の抑止力上昇を停止。
   const target=Math.min(100,Math.round(d*2.2 + stage*7));
   state.weightInterest=Math.max(state.weightInterest||0,target);
 }
 // 結衣：増えるほど油物への嗜好が育つ
 if(c.id==='yui'&&d>=8&&!state.favoriteFoods.includes('揚げ物'))state.favoriteFoods.push('揚げ物');
}

function erikaRestraintDelta(delta,reason=''){
 if(activeId!=='erika' || !state)return delta;
 const lv=stageNum();
 // Lv1〜2: 本人が「太った」と認めていないため、体型・食事由来の自制心は増えない。
 if(delta>0 && lv<3){
   if(reason)log(`絵里香はまだ太ったと認めていないため抑止力上昇なし（${reason}）`);
   return 0;
 }
 return delta;
}
function erikaVolatileDrop(base=1,reason=''){
 if(activeId!=='erika'||!state||stageNum()<3)return 0;
 const lv=stageNum();
 // Lv3以降は些細な刺激でも崩れやすい。高Lvほど落ち幅が増える。
 const bonus=[0,0,1,2,4,6,8][lv-1];
 const drop=Math.max(1,Math.round(base+bonus));
 state.restraint=clamp(state.restraint-drop);
 if(reason)log(`絵里香の抑止力が揺らぐ：-${drop}（${reason} / Lv.${lv}）`);
 return drop;
}
function characterFoodModifier(c,offer){
 const key=foodGrowthKey(offer),g=state.growthTraits||{},st=evolutionStage();
 let accept=0,restraintMult=1,weightMult=1,fullnessMult=1;
 if(c.id==='yui'){
   if(key==='fried'){accept+=(g.oilyPreference||0)*.24+st*3;restraintMult=Math.max(.45,1-(g.oilyPreference||0)/180);weightMult=1+st*.035}
 }
 if(c.id==='erika'){
   const ex=foodExperience(key),dep=g.dependence||0,anxiety=g.weightAnxiety||0;
   accept+=(ex.liking||0)*.28;
   if(state.restraint>=65)accept-=12;
   accept-=anxiety*.08;
   accept+=dep*.38;
   if(dep>=70)accept+=8;
   // 初期は食後の焦りで自制しやすいが、体型Lvが上がるほど
   // 食欲・習慣化が勝ち、同じ罪悪感でも抑止力へ戻りにくい。
   restraintMult=Math.max(.48,1.02-st*.09);
 }
 if(c.id==='rei'){
   const wi=state.weightInterest||0;accept+=wi*.16;restraintMult=wi>=50?0:Math.max(.2,1-wi/80);
   weightMult=1+Math.min(.12,wi/700);
 }
 if(c.id==='risa'){
   if(key==='dessert')accept+=(foodExperience(key).liking||0)*.18;
   restraintMult=1+st*.05;
 }
 if(c.id==='emi'){
   accept-=st*2.5;restraintMult=1.15+st*.04;
 }
 return {accept,restraintMult,weightMult,fullnessMult};
}
function erikaFoodGuilt(food,before){
 if(activeId!=='erika'||!state)return {guilt:0,moodLoss:0,restraintBonus:0};
 const lv=stageNum();
 const lvBase=[3,7,12,18,25,33,42][Math.max(0,Math.min(6,lv-1))];
 const amount=Math.round((food?.restraintHit||5)*.75 + (food?.fullness||0)*.08 + (food?.weight||0)*10);
 const alreadyFull=Math.max(0,Math.round(((before?.fullness||0)-55)*.10));
 const guilt=Math.max(1,Math.min(70,lvBase+amount+alreadyFull));
 const moodLoss=Math.max(0,Math.min(9,Math.round(guilt/10)));
 // 罪悪感そのものは体型Lvとともに強くなるが、
 // 体型Lvが上がるほど「後悔しても次の自制に結びつきにくい」。
 const conversion=[0,0,1.00,.90,.80,.70,.60][Math.max(0,Math.min(6,lv-1))];
 const restraintBonus=lv<3?0:Math.max(1,Math.min(7,Math.round((guilt/12)*conversion)));
 return {guilt,moodLoss,restraintBonus};
}
function restraintGainAfterEating(c,offer,before){
 if(c.id==='erika'&&stageNum()<3)return 0;
 if(c.id==='emi'&&stageNum()<=2)return 0;
 let base={risa:5,emi:7,yui:7,erika:10,rei:5}[c.id]||6;
 base+=Math.round(offer.restraintHit*.45);
 base+=Math.floor(evolutionStage()/2);
 if(c.id==='emi'&&stageNum()>=3)base+=Math.min(6,stageNum());
 // Lv3以降の絵里香は食後に一気に焦って自制心が上がる。ただし長続きはしない。
 if(c.id==='erika')base+=2+Math.round(Math.random()*5);
 // 結衣は高い抑止力で食べた時ほど後悔が強く、抑止力も戻りやすい。
 if(c.id==='yui'&&before.restraint>=65)base+=5;
 // 怜は体重増加への興味が育つほど罪悪感が弱くなる。興味50以上なら上昇しない。
 if(c.id==='rei'){
   const interest=state.weightInterest||0;
   if(interest>=50)return 0;
   base=Math.max(0,Math.round(base*(1-interest/55)));
 }
 return Math.max(0,Math.round(base*characterFoodModifier(c,offer).restraintMult));
}
function characterEvolutionText(c){
 const d=weightGainAmount(),st=evolutionStage(),interest=state.weightInterest||0;
 const common=`開始時から+${d.toFixed(1)}kg。体重変化段階${st+1}/7（${evolutionLabel()}）。`;
 if(c.id==='risa')return common+(st>=2?'以前より体型への意識が強く、食べた後は罪悪感から自制しようとする。':'まだ大きな変化ではないが、食べ過ぎには気をつけようとしている。');
 if(c.id==='emi'){
   return common+emiWeightMindsetGuide(st+1);
 }
 if(c.id==='yui')return common+`油物嗜好${state.growthTraits?.oilyPreference||0}/100。`+(st>=2?'体型を気にする発言が増え、体重増加と経験に伴って油物を好みやすくなっている。':'体型を気にしつつも、勧められると断り切れないことがある。');
 if(c.id==='erika'){
   const lv=st+1;
   if(lv<3)return common+'本人はまだ「太った」と認めておらず、体型や食事を理由に抑止力が上がらない。食事制限を始める段階ではない。';
   return common+`Lv.${lv}で初めて体重増加を認めて焦っている。食後・鏡・服のきつさなどで抑止力は一気に上がるが、非常に不安定で、空腹・誘惑・主人公の一言・時間経過など些細なきっかけですぐ下がる。高Lvほど上下動が激しい。好感度が高いほど主人公へのデレ・依存も増える。`;
 }
 return common+`体重増加への興味 ${interest}/100。`+(interest>=50?'増えること自体に明確な興味・快感を覚え始めており、食後も罪悪感による抑止力上昇が起こらない。':interest>=25?'体重が増える現象そのものを面白いと感じ始めている。':'まだ体重増加を特別に好んではいない。');
}
function placeholder(el,name){if(el.dataset.fallback==='1')return;el.dataset.fallback='1';const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="100%" height="100%" fill="#f1e2e8"/><text x="50%" y="48%" text-anchor="middle" font-family="sans-serif" font-size="72" fill="#7d5365">${name}</text><text x="50%" y="56%" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#9f7b8a">立ち絵を assets に追加</text></svg>`;el.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg)}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
