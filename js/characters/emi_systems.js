function emiRestraintPhase(){
 if(activeId!=='emi'||!state)return 'normal';
 return stageNum()<=2?'unaware':'aware';
}
function capEmiLowStageRestraint(reason=''){
 if(activeId!=='emi'||!state||stageNum()>2)return;
 const before=state.restraint;
 state.restraint=Math.min(30,Math.max(12,state.restraint));
 if(reason&&before!==state.restraint)log(`絵美のLv1〜2抑止力補正 ${Math.round(before)}→${Math.round(state.restraint)}（${reason}）`);
}
function erodeEmiRestraint(reason='時間経過'){
 if(activeId!=='emi'||!state)return 0;
 const lv=stageNum();
 if(lv<=2){
   // まだ太ったと思っていないので、高い自制心を維持しない。
   const target=22;
   const drop=Math.max(0,Math.min(6,Math.round(state.restraint-target)));
   if(drop>0)state.restraint=clamp(state.restraint-drop);
   capEmiLowStageRestraint(reason);
   if(drop>0)log(`絵美は体型を気にしていないため抑止力 -${drop}（${reason}）`);
   return drop;
 }
 // Lv3以降は一度上がっても、ちょっとした時間経過で崩れる。
 const base=[0,0,5,7,9,11,13][lv-1]||5;
 const fatigue=state.hunger>=65?2:0;
 const temptation=(state.emiMessDependence||0)>=45?2:0;
 const jitter=Math.floor(Math.random()*4); // 0〜3
 const drop=Math.min(18,base+fatigue+temptation+jitter);
 state.restraint=clamp(state.restraint-drop);
 log(`絵美の自制が揺らぐ：抑止力 -${drop}（${reason} / Lv.${lv}）`);
 return drop;
}
function emiFoodInterest(){return clamp(Number(state?.emiFoodInterest||0))}
function changeEmiFoodInterest(delta,reason='食体験'){
 if(activeId!=='emi'||!state)return 0;
 const before=emiFoodInterest();state.emiFoodInterest=clamp(before+(Number(delta)||0));
 const d=Math.round((state.emiFoodInterest-before)*10)/10;
 if(d)log(`食への興味 ${d>0?'+':''}${d}（${reason}）`);return d;
}
function emiApplyEventEffects(kind){
 if(activeId!=='emi'||!state)return;
 const lv=stageNum(),M={
  morning_run:{weight:-(lv<=2?.16:lv<=4?.13:.10),hunger:10,fullness:-4,mood:2,condition:lv<=3?3:-2},
  morning_yoga:{weight:-(lv<=3?.06:.04),hunger:4,mood:2,condition:lv<=3?2:0},
  morning_clothes:{mood:lv>=3?-3:0,restraint:lv>=3?3:0},
  morning_scale:{mood:lv>=3?-4:0,restraint:lv>=3?5:0},
  day_lecture:{hunger:5},
  day_practice:{weight:-(lv<=2?.22:lv<=4?.18:.12),hunger:12,fullness:-6,condition:lv<=3?3:-3},
  day_junior_talk:{mood:lv>=4?-2:2},
  day_clothes_accident:{mood:lv>=4?-(6+lv):-6,restraint:lv>=3?4:0},
  night_stretch:{weight:-.03,hunger:3,mood:1,condition:1},
  night_snack:{weight:.22+lv*.025,fullness:20+lv*2,hunger:-(18+lv*2),foodInterest:3+(lv>=4?1:0),restraint:lv>=3?-4:0},
  night_convenience:{weight:.18+lv*.02,fullness:16+lv*2,hunger:-(14+lv),foodInterest:4,restraint:lv>=3?-4:0},
  night_bath_mirror:{mood:lv>=4?-(3+lv):-4,restraint:lv>=3?4:0},
  night_old_record:{mood:lv>=5?-(2+lv):-3,restraint:lv>=4?3:0},
  night_spikes:{mood:lv>=5?-(3+lv):-5},night_track_video:{mood:lv>=5?-(2+lv):-4},
  izakaya_work:{hunger:10,mood:-1,condition:-1}
 };
 const e=M[kind]||{},shown=[];
 for(const [k,v] of Object.entries(e)){
  if(!v)continue;
  if(k==='weight')state.weight=Math.round(Math.max(40,state.weight+v)*100)/100;
  else if(k==='fullness')state.fullness=clamp(state.fullness+v);
  else if(k==='hunger')state.hunger=clamp(state.hunger+v);
  else if(k==='mood')state.mood=clamp(state.mood+v);
  else if(k==='restraint')state.restraint=clamp(state.restraint+v);
  else if(k==='condition')state.emiCondition=clamp((state.emiCondition||70)+v);
  else if(k==='foodInterest')changeEmiFoodInterest(v,kind);
  const L={weight:'体重',fullness:'満腹度',hunger:'空腹度',mood:'機嫌',restraint:'抑止力',condition:'競技コンディション',foodInterest:'食への興味'}[k]||k;
  shown.push(`${L} ${v>0?'+':''}${Number.isInteger(v)?v:v.toFixed(2)}`);
 }
 if(shown.length)addBubble('system',shown.join('｜'),'ステータス変化');
}
function emiFrustrationGuide(){
 const lv=stageNum(),m=Math.round(state.mood||50),cond=Math.round(state.emiCondition||70);
 const food=emiFoodInterest(),diet=!!state.emiDietMode,track=state.emiTrackActive!==false;
 const struggling=(m<45)||(cond<48)||(diet&&food>=55);
 const crisis=(m<28)||(lv>=5&&cond<38)||(lv>=6&&!track);
 const base=[
  '',
  '陸上一筋で大きな挫折経験がほぼなく、自分の身体は努力すれば思い通りになると疑っていない。体型への不安を先回りして語らない。',
  '身体の重さなどに違和感があっても「疲れてるだけ」「走ればすぐ戻る」と本気で処理する。まだ深刻な焦りはない。',
  '増量を否定できなくなり、初めて対処不能感が出る。「食べる量を減らして走れば戻る」と自分に何度も言い聞かせる。平静を装うほど内心は焦っている。',
  '努力しているのに戻らないことが初めての本格的な挫折になる。「ちゃんとやってるのに、なんで」と混乱する。失敗後は機嫌を崩しやすく、同じ言葉を自分に言い聞かせて平静を保とうとする。',
  '余裕がかなり減る。体型や食事を指摘されると「分かってるって。私が一番分かってるから」と苛立ちやすい。「今日からちゃんとやる」「まだ何とかなる」と強く言い聞かせる一方、誘惑に負けた直後は自己嫌悪する。',
  '退部という大きな挫折で「陸上ができる自分」という軸まで揺らいでいる。怒り一辺倒ではなく、後悔・混乱・喪失感が増える。「あの時止めてれば」と過去を振り返る。',
  '昔の記録や写真との落差が辛い。食への興味は残っているため、食べたい気持ちと「こんなはずじゃなかった」という深い後悔が同居する。諦めきってはおらず、自分を立て直そうとする言葉も時折出る。'
 ][lv]||'';
 const pressure=crisis
  ?'現在は心理的余裕がほぼない。問いかけを増やさず、短い独り言、苛立ち、言葉に詰まる反応、投げやりになりかける反応を自然に混ぜる。ただし毎回同じ表現にしない。'
  :struggling
   ?'最近うまくいっていないため余裕が減っている。自分への言い聞かせが増え、失敗や誘惑の直後は普段より機嫌が悪くなる。主人公に八つ当たりしすぎず、まず自分自身への苛立ちとして出す。'
   :'まだ心理的余裕がある。強がりや自信を保ち、必要以上に暗くしない。';
 return `【絵美の挫折・余裕モデル】${base} ${pressure} 現在: 機嫌${m}/100、競技コンディション${cond}/100、食への興味${Math.round(food)}/100、ダイエット${diet?'中':'外'}、陸上${track?'継続':'退部'}。`;
}
function emiWeightMindsetGuide(lv=stageNum()){
 if(lv<=1)return '本調子。体型や走力に違和感はなく、自分が崩れる想像もしていない。';
 if(lv===2)return 'ごく小さな変化はあるが、本人はまだ太ったとは認識しない。「たまたま」「気のせい」くらいに流す。';
 if(lv===3)return '初めて増量を自覚。「こんなはずじゃない」「まだ今なら戻せる」という焦りと強い立て直し意識。';
 if(lv===4)return '思ったより戻らない現実に苛立ち、「こんなはずじゃなかった」「まだ間に合うはず」と以前より強く否定・焦燥する。';
 if(lv===5)return '競技への影響も大きく、「ここまでになるはずじゃなかった」「まだ何とかしないと」と切迫感が強い。';
 if(lv===6)return '退部まで至ったことへの後悔が中心。「もっと早く止めていれば」「あの時ちゃんと戻していれば」と過去を悔やむ。';
 return '後悔が最も強い段階。以前の自分との落差を直視し、「こんなふうになるつもりじゃなかった」という喪失感と自責がある。';
}
function misakiWeightGain(){return Math.max(0,(state?.misakiWeight||MISAKI.startWeight)-(state?.misakiStartWeight||MISAKI.startWeight))}
function misakiBodyLv(){const d=misakiWeightGain();if(d<3)return 1;if(d<8)return 2;if(d<15)return 3;if(d<25)return 4;if(d<40)return 5;if(d<60)return 6;return 7}
function emiStoryCG(kind,lv=stageNum()){const s=String(Math.max(1,Math.min(7,lv))).padStart(2,'0');return `assets/emi/memories/${kind}_${s}.webp?v=${APP_BUILD}`}
function showEmiMemoryCG(kind,lv,title,meta='絵美イベントCG'){
 if(activeId!=='emi'||!state)return '';
 const path=emiStoryCG(kind,lv);
 const id=`emi_memory:${kind}:${String(lv).padStart(2,'0')}`;
 unlockCG(id,title,path);
 addCGMessage(title,path,meta);
 return path;
}
const EMI_ROUTINE_EVENT_DEFS={
 morning_run:{title:'早朝ランニング',min:1,max:5,text:lv=>lv===1?'早朝、絵美は大学周辺を軽快に走る。フォームも呼吸も安定しており、大学陸上部のエースらしく完全に本調子だ。':lv===2?'早朝、絵美はいつも通り軽快に走っている。まだ余裕は十分で、本人は体型や走力の変化をまったく気にしていない。':lv===3?'早朝ランニング中、絵美は以前より身体が重い感覚に眉を寄せる。':lv===4?'早朝ランニングの途中、絵美は息が上がってペースを落とした。':'予定していた距離を走り切れず、絵美は悔しそうに立ち止まった。'},
 morning_change:{title:'朝の着替え',min:1,max:7,text:lv=>lv===1?'自室でいつもの服へ手早く着替える絵美。サイズ感にも動きにも何の違和感もなく、鏡を軽く確認してそのまま出かける準備を進めている。':lv===2?'自室で着替える絵美。まだ本人は何も気にしておらず、いつも通り自然に服を整えている。':`自室で着替えながら、絵美はウエストや腹部、太腿まわりの窮屈さを確かめている。`},
 morning_scale:{title:'朝の体重測定',min:2,max:7,text:lv=>lv===2?'体重計の数字を見ても、絵美はまだ「誤差でしょ」と気にしないふりをする。':'体重計の数字を見た絵美は、以前との差を無視できず表情を曇らせた。'},
 morning_mirror:{title:'朝の鏡チェック',min:3,max:7,text:lv=>'鏡の前で、絵美は腹部や腰、脚のラインを確認し、以前との違いを気にしている。'},
 morning_breakfast_conflict:{title:'朝食との葛藤',min:3,max:7,text:lv=>'朝食を前に、絵美は空腹とダイエット意識の間で迷っている。'},
 morning_oversleep:{title:'二度寝',min:6,max:7,text:lv=>'退部後の朝。以前なら走っていた時間に、絵美はもう一度布団へ潜り込んだ。'},
 day_lecture:{title:'大学の講義',min:1,max:7,text:lv=>lv===1?'大学の講義中。朝の練習を終えた絵美は姿勢よく席に座り、いつも通り集中して講義を受けている。':lv===2?'大学の講義中。絵美は普段通りに過ごしており、体型や身体の重さを気にする様子はない。':'大学の講義中、絵美はその日の疲れや空腹、身体の重さを意識しながら席に座っている。'},
 day_practice:{title:'陸上部の練習',min:1,max:5,text:lv=>lv===1?'トラックでの練習。絵美はエースらしい鋭いスタートと安定したフォームでメニューをこなし、余裕を残して後輩を引っ張っている。':lv===2?'トラックでの練習。絵美はまだ普段通りの走りを見せており、本人はコンディションに違和感を持っていない。':lv===3?'練習中、絵美は自分の走りが鈍くなった感覚をはっきり意識する。':lv===4?'練習中、息切れが増え、絵美は焦りを隠せない。':'練習についていけず、絵美は後輩より先に休憩へ入った。'},
 day_junior_talk:{title:'後輩との会話',min:1,max:5,text:lv=>lv===1?'練習後、後輩たちはエースの絵美へフォームや練習について相談している。絵美も余裕のある様子で先輩らしく応じている。':lv===2?'後輩はいつも通り絵美を頼って話しかけてくる。絵美自身もまだ自分の変化を意識していない。':lv===3?'後輩から「最近疲れてませんか」と心配され、絵美は強がって返す。':lv===4?'後輩の成長を感じながら、絵美は自分の余裕が減っていることを意識する。':'後輩から本気で体調を心配され、絵美は笑って誤魔化した。'},
 day_record_check:{title:'記録確認',min:2,max:5,text:lv=>'ストップウォッチや記録表を確認した絵美は、以前より落ちている数字を睨むように見つめた。'},
 day_cafeteria:{title:'大学の学食',min:1,max:7,text:lv=>lv===1?'大学の学食。絵美は競技者として必要な栄養を意識しつつ、迷いなくいつもの食事を選んでいる。':lv===2?'大学の学食。少し食欲はあるものの、本人は体型を気にせず普通に食事を楽しんでいる。':lv<6?'大学の学食で、絵美は食欲と体型への焦りの間でメニューを迷っている。':'退部後の学食。練習を理由に食事量を抑える必要がなくなり、絵美の選択も少し変わってきた。'},
 day_stairs:{title:'階段で息切れ',min:4,max:7,text:lv=>'大学構内の階段を上った絵美は、以前より早く息が上がり、踊り場で一度足を止めた。'},
 day_trainingwear_rip:{title:'練習着が裂ける',min:4,max:5,text:lv=>lv===4?'練習中の動作で、絵美の練習着の縫い目が小さく裂けた。':'深くしゃがんだ瞬間、練習着がはっきり裂け、絵美は慌ててジャージで隠した。'},
 day_former_junior:{title:'元後輩と遭遇',min:6,max:7,text:lv=>'キャンパスで元後輩と偶然会い、絵美は平気そうに振る舞いながらも気まずさを隠せない。'},
 day_see_track:{title:'遠くから陸上部を見る',min:6,max:7,text:lv=>'フェンス越しに元チームの練習を眺め、絵美はしばらくその場を離れられなかった。'},
 night_stretch:{title:'夜のストレッチ',min:1,max:7,text:lv=>lv===1?'自室でのストレッチ。絵美は競技者らしい柔らかさと安定した姿勢で、いつものメニューを余裕を持ってこなしている。':lv===2?'自室でのストレッチ。絵美はまだ普段通りの動きで身体をほぐしており、特に違和感はない。':'自室でストレッチするが、以前より姿勢を取りづらく、絵美は苛立っている。'},
 night_snack:{title:'夜食',min:1,max:7,text:lv=>lv===1?'夜、練習と大学生活を終えた絵美は、回復のための軽い夜食を少しだけ口にする。食べることへの罪悪感や体型への不安はない。':lv===2?'夜、絵美は軽い夜食を少しだけ口にする。まだ本人は体型変化を意識していない。':'夜、控えようと思いながらも絵美は食べ物に手を伸ばした。'},
 night_convenience:{title:'バイト後のコンビニ',min:3,max:7,text:lv=>'夜のコンビニ。疲れと空腹で、絵美の目は甘い物や揚げ物へ向かう。'},
 night_bath_mirror:{title:'入浴後の鏡',min:3,max:7,text:lv=>'風呂上がり、鏡の前で絵美は腹部や腰回りを見つめ、以前との違いを確認している。'},
 night_old_record:{title:'昔の記録を見る',min:4,max:7,text:lv=>'夜、絵美は昔の自己ベストや記録を見返し、現在との差に複雑な表情を浮かべる。'},
 night_spikes:{title:'スパイクを見る',min:6,max:7,text:lv=>'退部後の夜。自室で使い込んだスパイクを見つめ、絵美は競技者だった頃を思い返す。'},
 night_track_video:{title:'陸上動画を見る',min:6,max:7,text:lv=>'スマホで陸上のレース動画を眺めながら、絵美は懐かしさと悔しさを噛みしめている。'}
};
function emiRoutineCandidates(){
 if(activeId!=='emi'||!state)return [];
 const lv=stageNum(),t=state.turn;let keys=[];
 if(t===0)keys=['morning_run','morning_change','morning_scale','morning_mirror','morning_breakfast_conflict','morning_oversleep'];
 if(t===1)keys=['day_lecture','day_practice','day_junior_talk','day_record_check','day_cafeteria','day_stairs','day_trainingwear_rip','day_former_junior','day_see_track'];
 if(t===2)keys=['night_stretch','night_snack','night_convenience','night_bath_mirror','night_old_record','night_spikes','night_track_video'];
 const available=keys.filter(k=>{const d=EMI_ROUTINE_EVENT_DEFS[k];if(!d||lv<d.min||lv>d.max)return false;if((k==='morning_run'||k==='day_practice'||k==='day_junior_talk'||k==='day_record_check'||k==='day_trainingwear_rip')&&state.emiTrackActive===false)return false;if(state.emiInjuryDaysLeft>0&&(k==='morning_run'||k==='day_practice'))return false;return true});
 if(t===0&&available.includes('morning_run'))return [...available,'morning_run','morning_run','morning_run'];
 return available;
}
function emitEmiAIEvent(meta,facts,fallbackNarration='',fallbackDialogue='……。',extraRules=''){
 if(activeId!=='emi'||!state)return Promise.resolve(false);
 const recent=(state.history||[]).filter(x=>x.role==='assistant'||x.role==='narration').slice(-8).map(x=>String(x.content||'')).join(' / ');
 const lv=stageNum();
 const ctx=`絵美専用イベント。これはゲーム側ですでに発生・結果確定済みの出来事であり、結果を変更しないこと。
イベント名:${meta}
確定した出来事:${facts}
現在:体型Lv.${lv} / ${state.weight.toFixed(1)}kg / 機嫌${Math.round(state.mood)} / 満腹度${Math.round(state.fullness)} / 抑止力${Math.round(state.restraint)} / 競技コンディション${Math.round(refreshEmiCondition())} / まかない依存度${Math.round(state.emiMessDependence||0)} / 食への興味${Math.round(state.emiFoodInterest||0)}\n${emiFrustrationGuide()}
陸上:${state.emiTrackActive!==false?'継続中':'退部済み'} / 怪我:${state.emiInjuryDaysLeft>0?'療養中':'なし'} / ダイエット:${state.emiDietMode?'進行中':'通常'}
体型変化への現在の心理:${emiFrustrationGuide()} ${emiWeightMindsetGuide(lv)}
${lv===1?'Lv1なので完全に本調子。体型・走力・服・息切れへの違和感や不安を一切出さない。抑止力は低めで、食事を断るなら「満腹だから」「今はお腹が空いていないから」など身体的満腹感を理由にする。':''}
${lv===2?'Lv2では本人はまだ太ったことを自覚していない。明確な体型不安やダイエット発言はしない。抑止力はまだ低めで、満腹時の拒否をダイエット意識として描写しない。':''}
${lv>=3?'Lv3以降は体重増加を自覚しており、焦って抑止力を上げようとする。ただし自制は非常に不安定で、疲労・空腹・時間経過・誘惑など些細なことで簡単に崩れる。高い抑止力を「強い意志が長期間続いている」と描写しない。':''}
【生成指示】
- narrationとdialogueを毎回新しく生成する。ゲーム側の固定文を言い換えるだけにしない。
- 直近の文章と同じ冒頭、語尾、仕草、比喩、決まり文句を避ける。
- narrationは1〜3文。表情・視線・手の動き・姿勢・周囲の状況から、その回に合うものを選び、毎回変える。
- dialogueは1〜3文。基本は女の子らしい自然なタメ口。勝気さは残すが、男っぽい粗暴語を連発しない。
- 「もう」「最悪」「〜じゃん」「〜でしょ」など同じ語を連続イベントで使い回さない。
- Lv3〜5では「こんなはずじゃない／まだ戻せる」に相当する感情を段階的に強める。ただし毎回その同じ文言をそのまま言わせず、表現を変える。
- Lv6〜7では否認より後悔を中心にし、「もっと早く何とかすればよかった」系の悔いを自然に混ぜる。
- 主人公がその場にいないイベントでは、主人公へ直接話しかけない。
- イベント名に「独り言」とある場合は主人公をその場に存在させず、dialogueは絵美の独り言・心の声だけにする。
- 確定していない食事、体重変化、怪我、退部、恋愛進展を追加しない。
${extraRules}
直近のイベント文章（重複回避用）:${recent||'なし'}`;
 return askAI('（絵美の専用イベント。主人公の発言ではなく、確定済みイベントへの反応を生成する）',null,null,ctx)
  .then(r=>{addAIResponse(r,meta);save();return true;})
  .catch(()=>{if(fallbackNarration)addNarration(fallbackNarration,meta);addBubble('assistant',fallbackDialogue,meta);save();return false;});
}
function maybeEmiDaypartEvent(force=false){
 if(activeId!=='emi'||!state||blockingEventType())return false;
 const key=`${state.day}:${state.turn}`;
 state.emiRoutineSeen=state.emiRoutineSeen||{};
 if(state.emiRoutineSeen[key])return false;
 const hadToday=Object.keys(state.emiRoutineSeen).some(k=>k.startsWith(state.day+':'));
 if(!force&&hadToday&&Math.random()>.65)return false;
 const candidates=emiRoutineCandidates();if(!candidates.length)return false;
 const kind=candidates[Math.floor(Math.random()*candidates.length)],d=EMI_ROUTINE_EVENT_DEFS[kind],lv=stageNum();
 state.emiRoutineSeen[key]=kind;
 showEmiMemoryCG(kind,lv,`絵美 Lv.${lv}：${d.title}`,'絵美の日常CG');
 let facts=d.text(lv),extra='';
 const effectKinds=new Set(['morning_run','morning_yoga','morning_clothes','morning_scale','day_lecture','day_practice','day_junior_talk','day_clothes_accident','night_stretch','night_snack','night_convenience','night_bath_mirror','night_old_record','night_spikes','night_track_video']);
 if(effectKinds.has(kind))emiApplyEventEffects(kind);
 const privateMonologue=(state.turn===0||state.turn===2);
 if(privateMonologue){
   extra+=` 【朝・夜イベントの最重要ルール】これは主人公不在の一人きりの私生活イベント。居酒屋バイトが同じ夜に発生していても別時間帯の出来事として両立してよい。絵美は一人で考え、迷い、小声で独り言を言う。主人公の姿・視線・返事・行動・台詞を絶対に登場させない。「ねえ」「見て」「どう思う？」など主人公へ呼びかける会話形式も禁止。dialogueは独り言または心の声として書く。`;
 }
 if(kind==='day_junior_talk'){emiJuniorBondDelta(lv>=4?-1:2,'後輩との会話');extra+=' 後輩もその場にいる。絵美は先輩としてのプライドを保ちつつ、現在Lvに応じた余裕または焦りを出す。';}
 if(kind==='morning_scale'&&lv===2)extra+=' 体重計の数字に深刻な意味を見出さず、誤差程度に受け止める。';
 if(kind==='night_snack')extra+=' 今回は夜食を実際に食べた結果が確定している。Lv3以降なら食後の後悔も描く。';
 if(kind==='night_spikes'||kind==='night_track_video'||kind==='day_see_track')extra+=' 退部後の未練や昔との比較を自然に描くが、同じ懐古表現を繰り返さない。';
 emitEmiAIEvent(privateMonologue?`${d.title}（独り言）`:d.title,facts,d.text(lv),lv===1?'うん、今日も調子いい。':'……ちょっと気になるかも。',extra);
 log(`絵美の日常イベント: ${d.title}`);
 save();
 return true;
}
function maybeEmiSpecialHook(source='食後'){
 if(activeId!=='emi'||!state)return false;const lv=stageNum();
 const mins={4:85,5:75,6:65,7:55};const chances={4:.30,5:.42,6:.58,7:.72};
 if(!mins[lv]||state.fullness<mins[lv]||Math.random()>=chances[lv])return false;
 const title=`絵美 Lv.${lv}：満腹でホックが弾ける`;
 showEmiMemoryCG('special_hook_pop',lv,title,'特殊イベントCG');
 state.mood=clamp(state.mood-5);state.restraint=clamp(state.restraint+4);
 emitEmiAIEvent('ホック事故',`${source}、満腹で張った腹部に押されてズボンのホックが外れた。絵美は反射的に腹部を押さえた。ホックが外れた事実は確定。`,`ホックが外れ、絵美は反射的に腹部を押さえた。`,'……え、待って。ちょっと見ないで。', '驚き・恥ずかしさ・苛立ちの比率を毎回変える。無理に同じ「閉め直す」動作を繰り返さない。');
 log('絵美の満腹ホック事故が発生');
 return true;
}
function refreshEmiCondition(){
 if(activeId!=='emi'||!state)return 0;
 const lv=stageNum();
 let cond=92;
 cond-=[0,2,8,15,24,35,48][lv-1]||0;
 cond-=Math.max(0,Math.round((state.fullness-45)*0.35));
 cond-=Math.max(0,Math.round(((state.emiMessDependence||0)-35)*0.18));
 if(state.emiDietMode)cond+=4;
 if(state.emiInjuryDaysLeft>0)cond-=24;
 if(state.growthTraits?.emiQuitTrack||state.emiTrackActive===false)cond-=12;
 cond+=Math.max(-6,Math.min(6,Math.round((state.mood-50)*0.08)));
 state.emiCondition=clamp(Math.round(cond));
 return state.emiCondition;
}
function updateMisakiProgress(){
 if(activeId!=='emi'||!state)return;
 const emiLv=stageNum();
 const chance=Math.min(.52,.08+Math.max(0,emiLv-2)*.07+(state.day>=8?.05:0));
 if(Math.random()<chance){state.misakiWeight=Math.round((state.misakiWeight+(0.15+Math.random()*.45))*10)/10;}
 const lv=misakiBodyLv();
 let cond=90-([0,1,4,9,17,27,38][lv-1]||0)-Math.max(0,Math.round((state.misakiWeight-(state.misakiStartWeight||MISAKI.startWeight))*0.7));
 state.misakiCondition=clamp(Math.round(cond));
 state.misakiRivalry=clamp(Math.round(78+Math.max(0,emiLv-2)*3-Math.max(0,lv-3)*4));
}
function emiJuniorBondDelta(base=0,reason=''){
 if(activeId!=='emi'||!state)return;
 if(!Number.isFinite(Number(base))||!base)return;
 state.emiJuniorBond=clamp(Math.round((state.emiJuniorBond||0)+base));
 if(reason)log(`絵美の後輩との関係 ${base>=0?'+':''}${base}（${reason}）`);
}
function maybeStartEmiDiet(reason='体重増加を気にした'){
 if(activeId!=='emi'||!state)return false;
 if(stageNum()<3||state.emiDietMode||state.emiInjuryDaysLeft>0||state.emiTrackActive===false)return false;
 state.emiDietMode=true;
 state.emiDietDaysLeft=3;
 state.emiDietStartWeight=state.weight;
 state.emiDietStartDay=state.day;
 state.emiDietLastResult=null;
 state.restraint=clamp(Math.max(state.restraint,52)+6);
 addBubble('system',`絵美は${reason}ため、短期ダイエットモードに入った。抑止力は一時的に上がるが、空腹や疲労、時間経過ですぐ揺らぎやすい。`,'ダイエットモード');
 showEmiMemoryCG('diet_start',3,'絵美 Lv.3：ダイエット開始','ダイエット開始CG');
 emitEmiAIEvent('ダイエット開始',`${reason}ことをきっかけに、絵美は3日間の短期ダイエットを始めると決めた。開始時体重は${state.weight.toFixed(1)}kg。`,'絵美は体重や最近の走りを思い返し、短期的に食事と運動を見直すことを決めた。','……よし。3日だけでもちゃんとやってみる。','決意は強いが、絵美らしい強がりや焦りの出し方は毎回変える。');
 log('絵美がダイエットモードに入った');
 return true;
}
function resolveEmiDietCycle(){
 if(activeId!=='emi'||!state||!state.emiDietMode)return;
 state.restraint=clamp(state.restraint+5);
 state.mood=clamp(state.mood-1);
 state.emiDietDaysLeft=Math.max(0,(state.emiDietDaysLeft||0)-1);
 if(state.emiDietDaysLeft>0){const dlv=Math.min(5,Math.max(3,stageNum()));showEmiMemoryCG('diet_progress',dlv,`絵美 Lv.${dlv}：ダイエット継続中`,'ダイエット進行CG');return;}
 const lost=Number(((state.emiDietStartWeight||state.weight)-state.weight).toFixed(1));
 const success=lost>=1.2;
 state.emiDietLastResult=success?'success':'failure';
 state.emiDietMode=false;
 if(success){
   state.mood=clamp(state.mood+7); state.restraint=clamp(state.restraint+5); emiJuniorBondDelta(4,'ダイエット成功');
   const title=`絵美 Lv.${stageNum()}：ダイエット成功`;
   showEmiMemoryCG('diet_success',Math.min(5,Math.max(3,stageNum())),title,'ダイエット結果CG');
   emitEmiAIEvent('ダイエット成功',`3日間のダイエットが終了。開始時から${lost.toFixed(1)}kg減り、成功判定になった。機嫌と抑止力も上がった。`,`数日間の調整が終わり、体重計の数字は開始時より下がっていた。`,'……ちゃんと減ってる。よかった。','成功への安堵・自信・まだ不足と感じる気持ちの配分を毎回変える。');
   log(`絵美のダイエット成功（-${lost.toFixed(1)}kg）`);
 }else{
   state.mood=clamp(state.mood-8); state.restraint=clamp(state.restraint-10); emiJuniorBondDelta(-3,'ダイエット失敗');
   const title=`絵美 Lv.${stageNum()}：ダイエット失敗`;
   showEmiMemoryCG('diet_fail',Math.min(5,Math.max(3,stageNum())),title,'ダイエット結果CG');
   emitEmiAIEvent('ダイエット失敗',`3日間のダイエットが終了。開始時からの減少は${lost.toFixed(1)}kgで、成功基準に届かず失敗判定になった。機嫌と抑止力が下がった。`,`絵美は体重計の結果を確認し、期待したほど減っていないことを知った。`,'……思ったより全然落ちてない。','悔しさ・焦り・自己嫌悪を毎回同じ語彙にせず、強さも現在の機嫌に合わせる。');
   log(`絵美のダイエット失敗（変化 ${lost.toFixed(1)}kg）`);
 }
}
function maybeTriggerEmiInjury(){
 if(activeId!=='emi'||!state||state.emiTrackActive===false||state.emiInjuryDaysLeft>0)return false;
 const lv=stageNum(); if(lv<4)return false;
 const cond=refreshEmiCondition();
 const chance=Math.min(.38,.04+Math.max(0,lv-3)*.05+Math.max(0,(60-cond))*0.004);
 if(Math.random()>=chance)return false;
 state.emiInjuryDaysLeft=2+Math.floor(Math.random()*2);
 state.mood=clamp(state.mood-7);
 emiJuniorBondDelta(-2,'怪我で練習を休む');
 const title=`絵美 Lv.${lv}：怪我で走れない`;
 showEmiMemoryCG('injury_event',Math.min(5,Math.max(3,lv)),title,'怪我イベントCG');
 emitEmiAIEvent('怪我イベント',`練習中に脚を痛めた。重症ではないが、回復まで${state.emiInjuryDaysLeft}日間は全力で走れないことが確定した。`,'練習中、絵美は脚に痛みを感じて動きを止めた。','……痛っ。これ、しばらく走れないかも。','痛みよりも「走れないこと」への苛立ちや不安を中心にするが、毎回同じ反応にしない。');
 log(`絵美が怪我。回復まで${state.emiInjuryDaysLeft}日`);
 return true;
}
function tickEmiInjuryRecovery(){
 if(activeId!=='emi'||!state||state.emiInjuryDaysLeft<=0)return;
 state.emiInjuryDaysLeft=Math.max(0,state.emiInjuryDaysLeft-1);
 if(state.emiInjuryDaysLeft===0){
   showEmiMemoryCG('injury_return',Math.min(5,Math.max(3,stageNum())),`絵美 Lv.${Math.min(5,Math.max(3,stageNum()))}：怪我から復帰`,'怪我復帰CG');
   emitEmiAIEvent('怪我回復',`怪我が回復し、久しぶりに軽く走った。休養前より走りづらく感じる。現在体型Lv.${stageNum()}。${stageNum()>=4?'休養中の増量もあり、本人が体重増加と走力低下の関連を意識する。':'まだ大きな体型変化とは結びつけすぎない。'}`,'怪我が回復し、絵美は久しぶりに軽く走って感覚を確かめた。',stageNum()>=4?'……あれ、こんなに重かったっけ。':'……ちょっと感覚戻さないと。','「あれ？」という自覚の瞬間を新しい仕草や言葉で表現する。');
   log('絵美の怪我が回復した');
 }
}
function maybeEmiRivalEncounter(force=false){
 if(activeId!=='emi'||!state||blockingEventType())return false;
 if(!force&&state.emiLastRivalDay===state.day)return false;
 const lv=stageNum(),mlv=misakiBodyLv();
 const chance=force?1:Math.min(.48,.14+Math.max(0,lv-1)*.05+(mlv>=4?.06:0));
 if(Math.random()>=chance)return false;
 state.emiLastRivalDay=state.day; state.misakiLastSceneDay=state.day;
 const title=`絵美 Lv.${lv}：ライバル・美咲イベント`;
 showEmiMemoryCG('rival_event',lv,title,'ライバルイベントCG');
 let misakiLine='',emiLine='',intro='';
 if(lv===1&&mlv<=2){misakiLine='今日も調子良さそうじゃん。けど、次は絶対あたしが勝つから。';emiLine='はいはい。言うだけなら簡単でしょ。次も負けないから。';intro='練習前、ライバルの美咲が絵美へいつものように挑発的な笑みを向けた。今は純粋に競技で張り合うライバル同士だ。';}
 else if(mlv<=2&&lv===2){misakiLine='あれ、絵美。ちょっと丸くなった？ まあ、気のせいかもね。';emiLine='もう、適当なこと言わないでよ。いつもと変わんないって。';intro='練習前、美咲が冗談めかして絵美をからかった。絵美本人はまだ体型変化をまったく自覚していない。';}
 else if(mlv<=3&&lv<=4){misakiLine='最近タイム落ちてるって聞いたけど、その身体じゃ仕方ないか。エースも大変だね。';emiLine='……言いたいことあるならハッキリ言えば。';intro='競技場の脇で、美咲は記録表を見ながらわざとらしく肩をすくめた。';}
 else if(mlv>=4&&lv>=4){misakiLine='……何その目。別にあたしは太ってないし。ちょっとコンディションが悪いだけだから。';emiLine='へえ。前にあたしに言ってたこと、そのまま返すけど。';intro='久々に顔を合わせた美咲は、以前よりウェアの余裕がなくなっている。';}
 else {misakiLine='その顔、余裕ないね。大会で泣かないでよ？';emiLine='そっちこそ、最近ちょっと余裕なくない？';intro='美咲は軽口を叩くが、どこか自分自身にも焦りを抱えているようだ。';}
 addBubble('misaki',misakiLine,'美咲');
 emitEmiAIEvent('ライバルイベント',`${intro} 美咲は「${misakiLine}」と発言した。絵美はその場で美咲に返す。`,intro,emiLine,'美咲への返答をdialogueにする。主人公への返答ではない。美咲の挑発への受け方を毎回変え、同じ反論を繰り返さない。');
 openRoutineFollowup({charId:'emi',kind:'emi_rival_followup',title:`美咲とのやり取りのあと`,intro:'ライバルに煽られて少し苛立っている絵美へ、どう声をかける？',hint:'返答次第で絵美の機嫌や後輩との関係も少し動く。',openingDialogue:emiLine,situation:intro+' 美咲の発言: '+misakiLine,choices:[{label:'「気にしすぎなくていい。まず自分のペースを戻そう」',affection:4,mood:3,restraintDelta:2,tone:'ライバルの挑発を受け流し、立て直しを促す。'}, {label:'「悔しいなら結果で黙らせよう」',affection:3,mood:1,restraintDelta:1,tone:'闘争心を刺激し、競技で見返す方向へ気持ちを向ける。'}, {label:'「美咲も余裕なさそうだった」',affection:2,mood:2,tone:'相手も完璧ではないと伝え、少し安心させる。'}]});
 log('絵美のライバルイベントが発生');
 return true;
}
function runEmiTournament(){
 if(activeId!=='emi'||!state||state.emiTrackActive===false||blockingEventType())return false;
 if(state.emiLastTournamentDay===state.day)return false;
 state.emiLastTournamentDay=state.day;
 refreshEmiCondition(); updateMisakiProgress();
 const lv=stageNum(),mlv=misakiBodyLv();
 const emiScore=(state.emiCondition||0)+(state.emiJuniorBond||0)*0.10+(Math.random()*16-8)-(state.emiInjuryDaysLeft>0?18:0);
 const misakiScore=(state.misakiCondition||0)+(Math.random()*16-8);
 let result='';
 if(emiScore>=misakiScore+10)result='勝利';
 else if(emiScore>=misakiScore-4)result='接戦';
 else if(emiScore>=misakiScore-16)result='苦戦';
 else result='惨敗';
 const title=`絵美 Lv.${lv}：大会結果`;
 showEmiMemoryCG('tournament_result',lv,title,'大会結果CG');
 let misakiLine='';
 if(result==='勝利'){state.mood=clamp(state.mood+8); changeAffection(3,'絵美イベント'); state.restraint=clamp(state.restraint+5); emiJuniorBondDelta(5,'大会で良い結果'); misakiLine='ちっ……今回はあんたの勝ち。でも次は絶対負けない。';}
 else if(result==='接戦'){state.mood=clamp(state.mood+1); state.restraint=clamp(state.restraint+2); emiJuniorBondDelta(2,'大会で善戦'); misakiLine='ふーん、今日はちょっとだけやるじゃん。';}
 else if(result==='苦戦'){state.mood=clamp(state.mood-6); state.restraint=clamp(state.restraint+4); emiJuniorBondDelta(-3,'大会で苦戦'); misakiLine='その程度？ らしくないね。'; maybeStartEmiDiet('大会結果に焦った');}
 else {state.mood=clamp(state.mood-12); state.restraint=clamp(state.restraint+6); emiJuniorBondDelta(-6,'大会で惨敗'); misakiLine='本気でそのまま続けるつもり？ 見てるこっちがつらいんだけど。'; maybeStartEmiDiet('大敗して危機感が強まった');}
 addBubble('misaki',misakiLine,'美咲');
 emitEmiAIEvent('大会結果',`大学の記録会で絵美の結果は「${result}」。美咲は体型Lv.${mlv}相当で、「${misakiLine}」と言った。大会結果は確定済み。`, `大学の記録会が終わり、絵美は結果を確認した。`, result==='勝利'?'……よし。今日はちゃんと走れた。':result==='接戦'?'……悪くはないけど、まだいける。':result==='苦戦'?'……悔しい。こんなはずじゃないのに。':'……これは、さすがにきつい。', '結果に応じて喜び・悔しさ・焦りを表現する。美咲への意識も自然に入れてよいが、毎回同じ勝ち負け台詞にしない。');
 log(`絵美の大会結果: ${result} / 美咲Lv.${mlv}`);
 return true;
}
function emiCalendarWeek(){return Math.floor((Math.max(1,state?.day||1)-1)/7)+1}
function ensureEmiIzakayaSchedule(){
 if(activeId!=='emi'||!state)return [];
 const week=emiCalendarWeek();
 if(state.emiIzakayaScheduleWeek===week&&Array.isArray(state.emiIzakayaWorkDays)&&state.emiIzakayaWorkDays.length)return state.emiIzakayaWorkDays;
 const count=Math.random()<.4?3:4;
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const chosen=new Set([pick([1,2]),pick([3,4]),pick([5,6,7])]);
 if(count===4){
   const rest=[1,2,3,4,5,6,7].filter(d=>!chosen.has(d));
   chosen.add(pick(rest));
 }
 state.emiIzakayaScheduleWeek=week;
 state.emiIzakayaWorkDays=[...chosen].sort((a,b)=>a-b);
 save();
 return state.emiIzakayaWorkDays;
}
function isEmiIzakayaWorkDay(){
 if(activeId!=='emi'||!state)return false;
 const weeklyDay=((state.day-1)%7)+1;
 return ensureEmiIzakayaSchedule().includes(weeklyDay);
}
function maybeEmiIzakayaShift(){
 if(activeId!=='emi'||!state||state.turn!==2||aiGenerationBusy)return false;
 if(state.emiLastIzakayaShiftDay===state.day)return false;
 if(!isEmiIzakayaWorkDay())return false;
 state.emiLastIzakayaShiftDay=state.day;
 const lv=stageNum(),dep=state.emiMessDependence||0;
 showEmiMemoryCG('night_izakaya_work',lv,`絵美 Lv.${lv}：居酒屋バイト`,'居酒屋バイトCG');
 emiApplyEventEffects('izakaya_work');
 let eatChance;
 if(lv<=2){
   // 痩せていた頃は「回復のためのまかない」として自然に食べる。満腹時だけ断りやすい。
   eatChance=state.fullness>=88?5:state.fullness>=78?28:clamp(82+state.hunger*.12,78,95);
 }else{
   // 増量を自覚後は毎回まず我慢しようとする。ただし抑止力が低いほど食欲に負ける。
   eatChance=58+dep*.24+emiFoodInterest()*.72+state.hunger*.34-state.fullness*.46-state.restraint*.72+(lv-3)*3;
   if(state.emiDietMode)eatChance-=12;
   eatChance=clamp(eatChance,6,94);
 }
 const eat=Math.random()*100<eatChance;
 if(eat){
   showEmiMemoryCG('night_staff_meal',lv,`絵美 Lv.${lv}：バイト後のまかない`,'まかないCG');
   const eff=applyGuaranteedFoodEffect({name:'高カロリーなまかない',fullness:28+lv*4,weight:.12+lv*.03,restraintHit:6+lv,tags:['oily','rice']},'居酒屋バイトのまかない');
   const depUp=7+lv*2;state.emiMessDependence=clamp((state.emiMessDependence||0)+depUp);state.mood=clamp(state.mood+3);
   addBubble('system',`まかない依存度 +${depUp}｜満腹度 +${eff.fullnessDelta}｜体重 +${eff.weightGain.toFixed(2)}kg｜抑止力 ${eff.restraintDelta>=0?'+':''}${eff.restraintDelta}`,'まかない効果');
   emitEmiAIEvent('居酒屋バイト・まかない',`夜の居酒屋バイトを終え、疲労と空腹がある。今日は高カロリーなまかないを食べた。満腹度+${eff.fullnessDelta}、体重+${eff.weightGain.toFixed(2)}kg、まかない依存度+${depUp}。この食事結果は確定。`,'忙しい居酒屋のシフトを終えた絵美は、仕事終わりにまかないを口にした。','……今日は食べちゃった。',lv<=2
     ?'Lv1〜2は競技者として「回復のために食べる」感覚が自然。体型への罪悪感は出さない。'
     :`Lv3以降。食べる前に一度「今日は我慢しよう」と考えたが、現在の抑止力${Math.round(state.restraint)}では誘惑に負けて食べた。自制しようとした事実と、食べてしまった後の「こんなはずじゃない」感を現在Lvに応じて反映する。`);
   log(`絵美の居酒屋シフト。まかないを食べた / 依存度+${depUp}`);
   maybeEmiSpecialHook('まかないを食べ終えたあと');
 }else{
   state.emiMessDependence=clamp((state.emiMessDependence||0)+2);state.restraint=clamp(state.restraint+(lv<=2?0:-2));
   addBubble('system',lv<=2?'まかない依存度 +2｜満腹・食欲の都合で見送った':'まかない依存度 +2｜今回は我慢したが、我慢疲れで抑止力 -2','まかない効果');
   emitEmiAIEvent('居酒屋バイト・まかないを我慢',`夜の居酒屋バイトを終え、疲労と空腹はあるが、今日はまかないを食べずに我慢した。抑止力${lv<=2?'±0':'-2'}、まかない依存度+2。この結果は確定。`,'忙しい居酒屋のシフトを終えた絵美は、まかないを前に少し迷った末、今日は手をつけなかった。','……今日はやめとく。',lv<=2
     ?'Lv1〜2で断った場合は、体型不安ではなく満腹・翌日の練習・今は食欲がない等の自然な理由にする。'
     :`Lv3以降。食べたい気持ちはあるが、現在の抑止力${Math.round(state.restraint)}で今回は踏みとどまれた。安心しつつも、自制が長続きする自信までは持たせない。`);
   log('絵美の居酒屋シフト。まかないを我慢した');
 }
 save();
 return true;
}
function maybeEmiSystemTurnEvent(){
 if(activeId!=='emi'||!state||blockingEventType())return false;
 ensureEmiTrackFlag();
 const key=currentTurnKey(); if(state.emiLastSystemTurnKey===key)return false;
 state.emiLastSystemTurnKey=key;
 refreshEmiCondition();
 if(state.turn===0 && state.day>1){
   if(state.day%5===0 && state.emiTrackActive!==false && state.emiInjuryDaysLeft<=0){ if(runEmiTournament()) return true; }
   if(state.emiInjuryDaysLeft>0){
     const ilv=Math.min(5,Math.max(3,stageNum()));
     showEmiMemoryCG('injury_rest',ilv,`絵美 Lv.${ilv}：怪我療養中`,'怪我療養CG');
     emitEmiAIEvent('怪我療養',`怪我のため今日は走らず脚を休めている。回復まであと${state.emiInjuryDaysLeft}日。走れないことは確定。`,`怪我のため、絵美は今日は走らず脚を休めている。`,'……今日は休むしかないか。','療養中の苛立ち、退屈、不安、焦りのどれを強く出すか毎回変える。');
     return true;
   }
 }
 if(state.turn===1 && state.emiInjuryDaysLeft>0){
   const ilv=Math.min(5,Math.max(3,stageNum()));
   showEmiMemoryCG('injury_rehab',ilv,`絵美 Lv.${ilv}：怪我後のリハビリ`,'怪我リハビリCG');
   emitEmiAIEvent('怪我リハビリ','大学の空き時間に、無理のない範囲で脚を動かす軽いリハビリをしている。全力練習はまだ禁止。','大学の空き時間、絵美は脚の状態を確かめながら軽いリハビリを続けている。','……焦っても仕方ないし、今はこれで戻す。','焦り一辺倒にせず、慎重さ、苛立ち、前向きさを回ごとに変える。');
   return true;
 }
 if(state.turn===1){ if(maybeEmiRivalEncounter(false)) return true; }
 return maybeEmiDaypartEvent(false);
}
function ensureEmiTrackFlag(){ if(activeId!=='emi'||!state)return; if(state.growthTraits?.emiQuitTrack||stageNum()>=6)state.emiTrackActive=false; }
function applyEmiDailySystems(){
 if(activeId!=='emi'||!state)return;
 ensureEmiTrackFlag();
 updateMisakiProgress();
 refreshEmiCondition();
 if(state.emiTrackActive!==false){
   if(stageNum()<=2 && state.emiCondition>=80) emiJuniorBondDelta(1,'安定したコンディション');
   if(stageNum()>=4) emiJuniorBondDelta(-1,'練習で余裕を失う');
 }
 if(stageNum()>=3 && !state.emiDietMode && Math.random()<.42) maybeStartEmiDiet('体型やタイムの低下を気にした');
 resolveEmiDietCycle();
 tickEmiInjuryRecovery();
 maybeTriggerEmiInjury();
}
