async function askAI(text,foodResult=null,pressureResult=null,extraContext=''){
 const gs=globalSettings();
 if(!gs.apiKey)return demoStructuredReply(text,foodResult,pressureResult,extraContext);

 let resolved='';
 if(foodResult){
   resolved+=`\n\n【ゲーム側の確定済み食事判定】
提案:${foodResult.food}
結果:${foodResult.accepted?'食べた':'断った'}
この結果は絶対に変更しないこと。
${activeId==='erika'?erikaRequestConflict('食事のお願い',foodResult.accepted):''}`;
   if(foodResult.accepted){
     resolved+=`
満腹度変化:+${foodResult.fullnessDelta}
体重変化:+${foodResult.weightGain.toFixed(2)}kg
抑止力変化:${foodResult.restraintDelta>=0?'+':''}${foodResult.restraintDelta}
${foodResult.regret?`後悔度:${foodResult.regret}`:''}`;
   }
 }
 if(pressureResult)resolved+=`\n\n【ゲーム側の確定済み対人反応】\n${pressureResult.summary}`;
 if(extraContext)resolved+=`\n\n【ゲーム側の確定済みイベント状況】\n${extraContext}`;

 // send()は今回の主人公発言をhistoryへ保存してからaskAI()を呼ぶため、
 // history末尾の同一発言を除外し、同じ発言が二重にAIへ渡らないようにする。
 let history=state.history.filter(x=>x.role==='user'||x.role==='assistant'||x.role==='narration');
 if(history.length&&history[history.length-1].role==='user'&&String(history[history.length-1].content).trim()===String(text).trim()){
   history=history.slice(0,-1);
 }
 history=history.slice(-14);

 // narration + assistant を同じAIターンとして読みやすくまとめる。
 const blocks=[];
 let pendingNarration='';
 history.forEach(x=>{
   if(x.role==='narration'){
     pendingNarration=x.content;
   }else if(x.role==='assistant'){
     blocks.push(`【${CHARACTERS[activeId].name}の前回の反応】\n${pendingNarration?`情景: ${pendingNarration}\n`:''}セリフ: ${x.content}`);
     pendingNarration='';
   }else if(x.role==='user'){
     if(pendingNarration){blocks.push(`【直前の情景】\n${pendingNarration}`);pendingNarration=''}
     blocks.push(`【主人公】\n${x.content}`);
   }
 });
 if(pendingNarration)blocks.push(`【直前の情景】\n${pendingNarration}`);

 const recent=blocks.join('\n\n');
 const input=`【過去の会話（古い→新しい）】
${recent||'まだ会話履歴なし'}

【今回の主人公の発言：これに必ず直接返答する】
${text}

${resolved}

【返答方針】
1. まず今回の主人公の発言の意味を取り違えずに受け取る。
2. その発言に対する自然な反応をnarrationで1〜3文。
3. dialogueでは、その発言への直接の返答をキャラクターの口調で返す。
4. 過去の話題へ勝手に戻らない。
5. 指定されたJSON形式だけを返す。`;

 const model=normalizeModel(gs.model);
 const body={
   model,
   instructions:systemPrompt(),
   input:input,
   max_output_tokens:800
 };
 // Keep GPT-5 nano cheap and leave enough visible-output budget.
 if(/^gpt-5/.test(model))body.reasoning={effort:'minimal'};

 let res;
 try{
   res=await aiFetch('https://api.openai.com/v1/responses',{
     method:'POST',
     headers:{
       'Content-Type':'application/json',
       'Authorization':'Bearer '+gs.apiKey
     },
     body:JSON.stringify(body)
   });
 }catch(networkErr){
   throw new Error('通信エラー: '+(networkErr.message||networkErr));
 }

 if(!res.ok){
   let detail='';
   try{
     const errBody=await res.json();
     detail=errBody&&errBody.error&&errBody.error.message?errBody.error.message:JSON.stringify(errBody);
   }catch(e){
     try{detail=await res.text()}catch(_){}
   }
   throw new Error(`HTTP ${res.status}${detail?'：'+detail:''}`);
 }

 const data=await res.json();
 const raw=extractResponseText(data);
 if(!raw){
   throw new Error('AI返答を取得できませんでした。'+responseDiagnostic(data));
 }
 return normalizeAIResult(raw);
}

async function generatePlayerChoiceLine(choiceLabel,eventContext=''){
 const fallback=String(choiceLabel||'').replace(/^「|」$/g,'').trim()||'……';
 const gs=globalSettings();
 if(!gs.apiKey)return fallback;
 const c=CHARACTERS[activeId];
 const instructions=`あなたは恋愛シミュレーションゲームの主人公の発言文だけを書く。
返答する相手は${c.name}。
選択肢の意味を絶対に変えず、自然な会話文として1〜2文に言い換える。
主人公の性格を勝手に極端化しない。説明文、情景描写、括弧、JSON、引用符は不要。
相手の返答まで書かない。主人公が実際に口にする日本語だけ返す。\n${c.id==='yui'?'【最重要】結衣は主人公よりかなり年上。主人公は結衣に対して礼儀正しい敬語を使う。告白成立前は「〜です」「〜ます」「〜ですか？」「〜しましょう」を基本とし、タメ口・命令口調・呼び捨ては避ける。また告白成立前は「好きです」「惚れています」「結衣さんだから特別です」「付き合いたいです」「ずっとそばにいたいです」など、主人公から恋愛感情を明確に伝える表現を禁止する。褒める場合は「似合っています」「素敵ですね」「大丈夫ですよ」「一緒にいると楽しいです」など、好意的だが恋愛確定ではない表現に留める。告白イベントで交際が成立した後からは明確な恋愛好意を表現してよい。恋人になった後も急にタメ口へ切り替えず、敬語をベースに親しさが少し増す程度にする。':''}`;
 const input=`選択肢:${choiceLabel}
選択肢の意図:${eventContext||choiceLabel}
現在の関係:${relationshipLabel()} / 好感度${Math.round(state.affection)}
現在の${c.name}の心理:${psychologicalProfile(c)}
この選択を主人公の自然な発言にしてください。`;
 const model=normalizeModel(gs.model);
 const body={model,instructions,input,max_output_tokens:120};
 if(/^gpt-5/.test(model))body.reasoning={effort:'minimal'};
 try{
   const res=await aiFetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+gs.apiKey},
    body:JSON.stringify(body)
   });
   if(!res.ok)return fallback;
   const data=await res.json(),raw=extractResponseText(data);
   if(!raw)return fallback;
   let line=String(raw).trim().replace(/^```[\s\S]*?\n?/,'').replace(/```$/,'').trim();
   line=line.replace(/^["「]|["」]$/g,'').trim();
   if(!line||line.length>120)return fallback;
   return line;
 }catch(e){return fallback}
}
async function showEventAI(playerAction,eventContext,meta='イベント'){
 try{
   const result=await askAI(playerAction,null,null,
`これは通常会話ではなくゲームイベントです。
以下のイベント内容とゲーム側で確定した結果を最優先し、絶対に変更しないこと。
選択肢を選んだ後なら、その選択に対するキャラクターの直後の反応を描写すること。
イベント開始時なら、提示された状況に初めて直面した瞬間の反応を描写すること。
【確定イベント】
${eventContext}`);
   addAIResponse(result,meta);
   return true;
 }catch(e){
   const msg=e&&e.message?e.message:String(e);
   addBubble('system','イベントAI接続エラー：'+msg,'API ERROR',false);
   log('イベントAPI接続エラー: '+msg);
   return false;
 }
}
function demoStructuredReply(text,foodResult=null,pressureResult=null,extraContext=''){
 const c=CHARACTERS[activeId];
 let narration='',dialogue='……うん。';
 if(foodResult){
   if(foodResult.accepted){
     if(c.id==='risa'){narration=`梨沙は一度だけ迷うように料理を見たあと、少し照れくさそうに箸を伸ばした。`;dialogue='……まあ、今日はいいか。食べよ。'}
     else if(c.id==='emi'){narration='絵美は少し眉を寄せたが、すぐに観念したように席へ座った。';dialogue='……分かった。食べる。'}
     else if(c.id==='yui'){narration=foodResult.regret>0?'結衣は食べ終えたあと、服の腰回りをそっと気にして苦笑した。':'結衣は少し迷ってから、柔らかく笑って手を伸ばした。';dialogue=foodResult.regret>0?'……また食べちゃった。あとで絶対後悔するやつだね。':'え、いいの？ じゃあ少しだけ。'}
     else if(c.id==='erika'){narration='絵里香は強がるように顎を上げながらも、料理から視線を外せずにいる。';dialogue='今回は特別ですわ。勘違いしないでくださいませ。'}
     else {narration='怜は料理をじっと見つめ、反応を確かめるように静かに一口食べた。';dialogue='……食べる。こういうのも、悪くない。'}
   }else{
     if(c.id==='risa'){narration='梨沙は名残惜しそうに料理を見たあと、首を横に振った。';dialogue='今日はやめとく。ちょっと気にしてるし。'}
     else if(c.id==='emi'){narration='絵美は腕を組み、きっぱりと視線を外した。';dialogue='いらない。今日は食べない。'}
     else if(c.id==='yui'){narration='結衣は少し困ったように笑いながら、そっと手を振った。';dialogue='ごめんね。今日はやめておく。'}
     else if(c.id==='erika'){narration='絵里香は料理を一瞥すると、何事もなかったように顔を背けた。';dialogue='結構ですわ。'}
     else {narration='怜は料理を見つめたまま、静かに首を横へ振った。';dialogue='……今はいらない。'}
   }
 }else{
   if(c.id==='risa'){narration='梨沙はポニーテールを軽く揺らしながら、こちらへ顔を向けた。';dialogue='うん、それで？'}
   else if(c.id==='emi'){narration='絵美は少し首を傾げ、こちらへ視線を向けた。';dialogue='うん、どうしたの？'}
   else if(c.id==='yui'){narration='結衣は柔らかく笑い、少し首を傾げた。';dialogue='うん。聞いてるよ。'}
   else if(c.id==='erika'){narration='絵里香は一度だけこちらを見て、すぐに視線を逸らした。';dialogue='……それで、何ですの？'}
   else {narration='怜はしばらく黙ってこちらを観察してから、小さく瞬きをした。';dialogue='……続けて。'}
 }
 return {narration,dialogue};
}

function conversationRewardKey(text){
 return String(text).toLowerCase().replace(/[！？!?,。、\s]/g,'').slice(0,24);
}
async function evaluateConversationAffinity(text,reply){
 const c=CHARACTERS[activeId];
 if(!text||text.length<2)return 0;
 if(detectFoodOffer(text))return 0;
 const key=conversationRewardKey(text);
 state.conversationRewards=state.conversationRewards||[];
 const recent=state.conversationRewards.slice(-10);
 const repeats=recent.filter(x=>x.key===key).length;
 let delta=0;
 // 普通に刺さる会話は+2を基準。より良い内容は+3。
 if(/ありがとう|楽しかった|大丈夫|無理しない|どう思う|どうだった|何が好き|教えて|心配|頑張|話してくれて|わかる|分かる/.test(text))delta+=2;
 if(/かわいい|可愛い|素敵|似合|一緒にいたい|会えてよかった|嬉しい/.test(text))delta+=2;
 if(/好き|大切|尊敬|応援してる/.test(text))delta+=relationshipIndex()>=2?2:1;
 if(/嫌い|うざ|黙れ|太ったな|デブ|キモ|どうでもいい/.test(text))delta-=3;
 // 短い普通の質問でも、相手に関心を向けていれば+1〜2。
 if(delta===0&&/[？?]/.test(text)&&text.length>=5)delta=2;
 // キャラ固有の距離感
 if(c.id==='erika'&&relationshipIndex()<=1&&/かわいい|可愛い|好き|会いたい|一緒にいたい/.test(text))delta=Math.min(delta,1);
 if(c.id==='rei'&&relationshipIndex()<=1&&/好き|愛して|付き合/.test(text))delta=Math.min(delta,0);
 // 同じ褒め方・文言の連打は無効。
 if(repeats)delta=Math.min(delta,0);
 delta=Math.max(-3,Math.min(3,delta));
 state.conversationRewards.push({key,day:state.day,delta});
 state.conversationRewards=state.conversationRewards.slice(-24);
 if(delta){state.affection=clamp(state.affection+delta);log(`会話による好感度 ${delta>0?'+':''}${delta}`)}
 return delta;
}
async function send(){if(blockingEventType()){showBlockingNotice();return}const text=$('message').value.trim();if(!text){addBubble('system','メッセージを入力してください。','',false);return}markErikaAttention('会話');$('message').value='';$('sendBtn').disabled=true;$('sendBtn').textContent='会話中…';addBubble('user',text);const jealousy=evaluateErikaJealousy(text);if(jealousy)addBubble('system',`絵里香は他の女子の話題を気にした。機嫌 -${jealousy.moodLoss}${jealousy.affectionLoss?`｜好感度 -${jealousy.affectionLoss}`:''}`,'嫉妬');const offer=detectFoodOffer(text);let foodResult=null,pressureResult=null;if(offer){state.money=state.money??2500;if(state.money<offer.price){addBubble('system',`${offer.name}を勧めるには ¥${offer.price.toLocaleString()} 必要です。所持金が足りません。`,'所持金不足')}else{state.money-=offer.price;if(state.lastFoodWasRefused&&state.lastFoodTurnKey===currentTurnKey()&&/お願い|頼む|いいから|食べてよ|食べなよ|絶対|もっと|断らないで/.test(text)){pressureResult=pressurePenalty(text);addBubble('system',pressureResult.summary,'強引な再提案')}foodResult=resolveFoodOffer(offer);addBubble('system',foodResult.summary,'判定結果');log(`${offer.name}を購入 ¥${offer.price}。${foodResult.accepted?'食べた':'断った'}`)}}try{const jealousyCtx=jealousy?`絵里香専用の嫉妬反応。主人公が他の女子に関する話題を出した。依存度${jealousy.dep}/100、反応段階:${jealousy.level}。ゲーム側で機嫌-${jealousy.moodLoss}${jealousy.affectionLoss?`、好感度-${jealousy.affectionLoss}`:''}が確定済み。ツンデレらしく、平静を装おうとしつつ依存度に応じて嫉妬や不安を出す。相手の女子を過度に侮辱しない。`:'';const reply=await askAI(text,foodResult,pressureResult,jealousyCtx);addAIResponse(reply,`${turns[state.turn].label} / DAY ${state.day}`);if(!foodResult&&!pressureResult){
 const d=await evaluateConversationAffinity(text,reply);
 const rd=evaluateRestraintConversation(text);
 if(d)addBubble('system',`会話が響いた：好感度 ${d>0?'+':''}${d}`,'会話評価');
 if(rd)addBubble('system',`会話で抑止力が変化：${rd>0?'+':''}${rd}`,'心理変化');
 log('会話しました')
}}catch(e){const errMsg=e&&e.message?e.message:String(e);addBubble('system','AI接続エラー：'+errMsg+'\nデモ会話に切り替えました。','API ERROR',false);const fallback=pressureResult?{narration:`${CHARACTERS[activeId].name}は少し困ったように反応した。`,dialogue:pressureDemoReply()}:demoStructuredReply(text,foodResult,pressureResult);addAIResponse(fallback,`${turns[state.turn].label} / DAY ${state.day}`);log('API接続エラー: '+errMsg)}finally{$('sendBtn').disabled=false;$('sendBtn').textContent='送信';save();render()}}
function debugAddWeight(){
 if(!activeId||!state)return;
 const c=CHARACTERS[activeId],before=state.weight,beforeStage=evolutionStage();
 state.weight=Math.round((state.weight+5)*10)/10;
 updateEvolution(c);queueWeightEventIfNeeded(c,beforeStage);
 const afterStage=evolutionStage();
 log(`【DEBUG】体重を +5.0kg（${before.toFixed(1)}kg → ${state.weight.toFixed(1)}kg）`);
 save();render();
 let msg=`【デバッグ】${c.name}の体重を +5.0kgしました。\n${before.toFixed(1)}kg → ${state.weight.toFixed(1)}kg\n体重変化: ${evolutionLabel()}`;
 if(afterStage!==beforeStage)msg+=`\n段階が Lv.${beforeStage+1} → Lv.${afterStage+1} に変化しました。`;
 if(c.id==='rei')msg+=`\n体重増加への興味: ${state.weightInterest||0}/100`;
 addBubble('system',msg,'DEBUG');
}
function resetCurrent(){if(!activeId)return;const c=CHARACTERS[activeId];if(confirm(`${c.name}の進行データを最初からやり直しますか？`)){try{localStorage.removeItem(stateKey(activeId))}catch(e){}state=defaultState(activeId);state.history=[{role:'narration',content:firstScene(c),meta:'☀ 朝 / DAY 1'},{role:'assistant',content:firstGreeting(c),meta:'☀ 朝 / DAY 1'}];save();render()}}
function backToSelect(){
  try{
    if(currentId && state){ saveState(); }
  }catch(e){}
  currentId = null;
  state = null;
  $('gameScreen').classList.add('hidden');
  $('selectScreen').classList.remove('hidden');
  renderSelect();
  window.scrollTo({top:0, behavior:'smooth'});
}

function bindUI(){
 const statusEl=$('runtimeStatus');
 if(statusEl){statusEl.textContent='JavaScript：正常に動作中 / '+APP_BUILD;statusEl.style.background='#d1e7dd';statusEl.style.color='#0f5132'}
 window.addEventListener('error',function(e){const st=$('runtimeStatus');if(st){st.textContent='JavaScriptエラー: '+(e.message||'不明');st.style.background='#f8d7da';st.style.color='#842029'}});
 const select=$('selectScreen'),game=$('gameScreen');if(select)select.classList.remove('hidden');if(game)game.classList.add('hidden');
 const bind=function(id,event,fn){const el=$(id);if(el)el.addEventListener(event,fn)};
 bind('saveGlobalSettings','click',saveGlobal);bind('testOpenAIConnection','click',testOpenAIConnection);bind('sendBtn','click',send);
 const msg=$('message');if(msg)msg.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
 bind('advanceBtn','click',advance);bind('eventBtn','click',foodEvent);bind('giftBtn','click',giveGift);bind('dateBtn','click',doDate);
 bind('workBtn','click',doWork);bind('statusBtn','click',status);bind('restraintBtn','click',startRestraintEvent);bind('debugWeightBtn','click',debugAddWeight);bind('characterSelectBtn','click',backToSelect);bind('resetBtn','click',resetCurrent);
 bind('albumBtn','click',openAlbum);bind('albumCloseBtn','click',closeAlbum);bind('cgViewerClose','click',closeCGViewer);
 const albumModal=$('albumModal');if(albumModal)albumModal.addEventListener('click',e=>{if(e.target===albumModal)closeAlbum()});
 const cgViewer=$('cgViewer');if(cgViewer)cgViewer.addEventListener('click',e=>{if(e.target===cgViewer)closeCGViewer()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCGViewer();closeAlbum()}});
 populateActionSelects();renderSelect();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindUI);else bindUI();
