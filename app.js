(() => {
  const QUESTIONS = window.QUESTIONS || [];
  const TOTAL = QUESTIONS.length;
  const byId = new Map(QUESTIONS.map(q => [q.id, q]));
  const STORAGE_KEY = 'fortios76-trainer-101-v3';

  const els = {
    progressText: document.getElementById('progressText'), scoreText: document.getElementById('scoreText'),
    progressBar: document.getElementById('progressBar'), correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'), unansweredCount: document.getElementById('unansweredCount'),
    questionSearch: document.getElementById('questionSearch'), questionSelect: document.getElementById('questionSelect'),
    shuffleQuestions: document.getElementById('shuffleQuestions'), shuffleAnswers: document.getElementById('shuffleAnswers'),
    resetBtn: document.getElementById('resetBtn'), questionGrid: document.getElementById('questionGrid'), paletteCount: document.getElementById('paletteCount'),
    positionLabel: document.getElementById('positionLabel'), questionTitle: document.getElementById('questionTitle'),
    typeBadge: document.getElementById('typeBadge'), selectHint: document.getElementById('selectHint'), questionPrompt: document.getElementById('questionPrompt'),
    options: document.getElementById('options'), selectionStatus: document.getElementById('selectionStatus'), clearBtn: document.getElementById('clearBtn'),
    exhibitWrap: document.getElementById('exhibitWrap'), exhibitImage: document.getElementById('exhibitImage'), exhibitButton: document.getElementById('exhibitButton'), exhibitZoom: document.getElementById('exhibitZoom'), exhibitModal: document.getElementById('exhibitModal'), exhibitModalImage: document.getElementById('exhibitModalImage'), exhibitModalClose: document.getElementById('exhibitModalClose'), exhibitModalBackdrop: document.getElementById('exhibitModalBackdrop'), submitBtn: document.getElementById('submitBtn'), finishBtn: document.getElementById('finishBtn'), feedback: document.getElementById('feedback'),
    prevBtn: document.getElementById('prevBtn'), nextBtn: document.getElementById('nextBtn'), prevBtn2: document.getElementById('prevBtn2'), nextBtn2: document.getElementById('nextBtn2'),
    quizView: document.getElementById('quizView'), resultsView: document.getElementById('resultsView'),
    finalScore: document.getElementById('finalScore'), finalCorrect: document.getElementById('finalCorrect'), finalWrong: document.getElementById('finalWrong'), finalOpen: document.getElementById('finalOpen'),
    reviewSummary: document.getElementById('reviewSummary'), reviewWrongBtn: document.getElementById('reviewWrongBtn'), backToTestBtn: document.getElementById('backToTestBtn'), newTestBtn: document.getElementById('newTestBtn'),
    themeBtn: document.getElementById('themeBtn'), saveState: document.getElementById('saveState'), toast: document.getElementById('toast')
  };

  const state = {
    order: [],
    answerOrder: {},
    currentIndex: 0,
    selected: {},
    submitted: {},
    filter: '',
    mode: 'quiz',
    reviewIds: []
  };

  function randSort(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function freshOrder() { return els.shuffleQuestions.checked ? randSort(QUESTIONS.map(q => q.id)) : QUESTIONS.map(q => q.id); }
  function makeAnswerOrder() {
    state.answerOrder = {};
    QUESTIONS.forEach(q => {
      const ids = q.options.map(o => o.id);
      state.answerOrder[q.id] = els.shuffleAnswers.checked ? randSort(ids) : ids;
    });
  }
  function resetState(showToast = true) {
    state.order = freshOrder();
    makeAnswerOrder();
    state.currentIndex = 0;
    state.selected = {};
    state.submitted = {};
    state.filter = '';
    state.mode = 'quiz';
    state.reviewIds = [];
    els.questionSearch.value = '';
    showQuiz();
    save();
    if (showToast) toast('New 101-question test created.');
  }
  function currentId() { return state.order[state.currentIndex]; }
  function currentQuestion() { return byId.get(currentId()); }
  function getQStatus(id) {
    if (state.submitted[id]) return state.submitted[id].correct ? 'correct' : 'wrong';
    if (state.selected[id]?.length) return 'answered';
    return 'open';
  }
  function selectedIds(q) { return state.selected[q.id] || []; }
  function optionsFor(q) {
    const order = state.answerOrder[q.id] || q.options.map(o => o.id);
    return order.map(id => q.options.find(o => o.id === id)).filter(Boolean);
  }
  function isSameSet(a,b) { return a.length===b.length && a.every(x => b.includes(x)); }
  function isCorrect(q, selection) {
    if (!selection?.length) return false;
    if (q.type === 'order') return selection.length === q.correct.length && selection.every((x,i) => x === q.correct[i]);
    return isSameSet(selection, q.correct);
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version:2, order:state.order, answerOrder:state.answerOrder, currentIndex:state.currentIndex,
        selected:state.selected, submitted:state.submitted, shuffleQuestions:els.shuffleQuestions.checked, shuffleAnswers:els.shuffleAnswers.checked,
        theme:document.body.classList.contains('dark')
      }));
      els.saveState.textContent = 'Saved locally';
    } catch(e) { els.saveState.textContent = 'Local save unavailable'; }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return false;
      const s = JSON.parse(raw);
      if (!s || s.version !== 2 || !Array.isArray(s.order) || s.order.length !== TOTAL) return false;
      if (!s.order.every(id => byId.has(id))) return false;
      state.order=s.order; state.answerOrder=s.answerOrder||{}; state.currentIndex=Math.min(s.currentIndex||0,TOTAL-1); state.selected=s.selected||{}; state.submitted=s.submitted||{};
      if (typeof s.shuffleQuestions==='boolean') els.shuffleQuestions.checked=s.shuffleQuestions;
      if (typeof s.shuffleAnswers==='boolean') els.shuffleAnswers.checked=s.shuffleAnswers;
      if (s.theme) { document.body.classList.add('dark'); els.themeBtn.textContent='☀'; }
      els.saveState.textContent='Resumed';
      return true;
    } catch(e) { return false; }
  }
  function toast(msg) { els.toast.textContent=msg; els.toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>els.toast.classList.remove('show'),1800); }
  function showQuiz(){ state.mode='quiz'; els.quizView.classList.remove('hidden'); els.resultsView.classList.add('hidden'); renderAll(); }
  function showResults(){ state.mode='results'; els.quizView.classList.add('hidden'); els.resultsView.classList.remove('hidden'); renderResults(); }

  function renderAll() {
    renderStats(); renderPalette(); renderSelect(); renderQuestion();
  }
  function renderStats() {
    let correct=0, wrong=0, answered=0;
    for (const q of QUESTIONS) {
      if (state.submitted[q.id]) { answered++; if (state.submitted[q.id].correct) correct++; else wrong++; }
    }
    const pct = TOTAL ? Math.round((correct/TOTAL)*100) : 0;
    els.progressText.textContent=`${answered} / ${TOTAL}`;
    els.scoreText.textContent=`Score ${correct}/${TOTAL}`;
    els.progressBar.style.width=`${(answered/TOTAL)*100}%`;
    els.correctCount.textContent=correct; els.wrongCount.textContent=wrong; els.unansweredCount.textContent=TOTAL-answered;
  }
  function renderPalette() {
    const term=(state.filter||'').toLowerCase().trim();
    const ids=state.order.filter(id=>{const q=byId.get(id); return !term || String(q.id).includes(term) || q.prompt.toLowerCase().includes(term);});
    els.paletteCount.textContent = term ? `${ids.length}/${TOTAL}` : TOTAL;
    els.questionGrid.innerHTML='';
    ids.forEach(id=>{
      const b=document.createElement('button'); b.type='button'; b.className='q-btn'; b.textContent=id;
      if(id===currentId()) b.classList.add('current');
      b.classList.add(getQStatus(id));
      b.title=`Question #${id}`;
      b.addEventListener('click',()=>{const idx=state.order.indexOf(id); if(idx>=0){state.currentIndex=idx; showQuiz(); save();}});
      els.questionGrid.appendChild(b);
    });
  }
  function renderSelect() {
    els.questionSelect.innerHTML='';
    const frag=document.createDocumentFragment();
    state.order.forEach((id,idx)=>{const q=byId.get(id); const o=document.createElement('option'); o.value=String(id); o.textContent=`Question #${id}`; if(idx===state.currentIndex)o.selected=true; frag.appendChild(o);});
    els.questionSelect.appendChild(frag);
  }
  function renderQuestion() {
    const q=currentQuestion(); if(!q) return;
    const pos=state.currentIndex+1; const submitted=state.submitted[q.id]; const sel=selectedIds(q);
    els.positionLabel.textContent=`QUESTION ${pos} OF ${TOTAL}`; els.questionTitle.textContent=`Question #${q.id}`;
    els.typeBadge.textContent = q.type==='order' ? 'Order the steps' : (q.maxSelections>1 ? `Choose ${q.maxSelections}` : 'Single answer');
    els.selectHint.textContent=q.instruction; renderExhibit(q); els.questionPrompt.textContent=q.prompt;
    renderOptions(q,sel,submitted);
    renderSelectionStatus(q,sel,submitted);
    els.submitBtn.disabled=!!submitted || !canSubmit(q,sel);
    els.clearBtn.disabled=!!submitted;
    renderFeedback(q,submitted);
    const isFirst=state.currentIndex===0, isLast=state.currentIndex===TOTAL-1;
    [els.prevBtn,els.prevBtn2].forEach(b=>b.disabled=isFirst);
    els.nextBtn.textContent=isLast?'Next →':'Next →'; els.nextBtn2.textContent=isLast?'Next →':'Next →';
  }
  function renderExhibit(q){
    const src = Array.isArray(q.exhibits) && q.exhibits.length ? q.exhibits[0] : '';
    if (!src) {
      els.exhibitWrap.classList.add('hidden');
      els.exhibitImage.removeAttribute('src');
      return;
    }
    els.exhibitImage.src = src;
    els.exhibitImage.alt = `Exhibit for Question #${q.id}`;
    els.exhibitWrap.classList.remove('hidden');
  }
  function openExhibit(){
    const src=els.exhibitImage.getAttribute('src');
    if(!src) return;
    els.exhibitModalImage.src=src;
    els.exhibitModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }
  function closeExhibit(){
    els.exhibitModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
  function canSubmit(q,sel){
    if(q.type==='order') return sel.length===q.correct.length;
    return sel.length===q.maxSelections;
  }
  function renderOptions(q,sel,submitted){
    els.options.innerHTML='';
    if(q.type==='order') { renderOrder(q,sel,submitted); return; }
    optionsFor(q).forEach(o=>{
      const div=document.createElement('button'); div.type='button'; div.className=`option ${q.maxSelections>1?'multi':''}`; div.dataset.id=o.id;
      if(sel.includes(o.id)) div.classList.add('selected');
      if(submitted){div.disabled=true;div.classList.add('disabled');if(q.correct.includes(o.id))div.classList.add('correct');else if(sel.includes(o.id))div.classList.add('incorrect');}
      div.innerHTML='<span class="marker"></span><span class="option-text"></span>';
      div.querySelector('.option-text').textContent=o.text;
      if(!submitted) div.addEventListener('click',()=>toggleChoice(q,o.id));
      els.options.appendChild(div);
    });
  }
  function renderOrder(q,sel,submitted){
    const wrap=document.createElement('div'); wrap.className='order-area';
    const p=document.createElement('div'); p.className='order-prompt'; p.textContent='Click an answer to add it to the sequence. Click a selected step to remove it.'; wrap.appendChild(p);
    const slots=document.createElement('div'); slots.className='order-slots';
    if(!sel.length){const empty=document.createElement('span');empty.className='hint';empty.textContent='Your order will appear here';slots.appendChild(empty);}
    sel.forEach((id,i)=>{const o=q.options.find(x=>x.id===id);const chip=document.createElement('button');chip.type='button';chip.className='order-chip';chip.textContent=`${i+1}. ${o?.text||id}`;chip.disabled=!!submitted;if(!submitted)chip.addEventListener('click',()=>toggleChoice(q,id));slots.appendChild(chip);});
    wrap.appendChild(slots);
    const grid=document.createElement('div');grid.className='order-options';
    optionsFor(q).forEach(o=>{const b=document.createElement('button');b.type='button';b.className='order-option';b.textContent=o.text;if(sel.includes(o.id))b.classList.add('used');b.disabled=!!submitted||sel.includes(o.id);if(!submitted&&!sel.includes(o.id))b.addEventListener('click',()=>toggleChoice(q,o.id));grid.appendChild(b);});
    wrap.appendChild(grid); els.options.appendChild(wrap);
  }
  function toggleChoice(q,id){
    if(state.submitted[q.id]) return;
    let sel=[...(state.selected[q.id]||[])];
    if(q.type==='order') { sel=sel.includes(id)?sel.filter(x=>x!==id): (sel.length<q.maxSelections?[...sel,id]:sel); }
    else if(q.maxSelections===1) sel=[id];
    else { if(sel.includes(id)) sel=sel.filter(x=>x!==id); else if(sel.length<q.maxSelections) sel.push(id); else {toast(`Select exactly ${q.maxSelections} answers.`);return;} }
    state.selected[q.id]=sel; renderAll(); save();
  }
  function clearSelection(){const q=currentQuestion();if(state.submitted[q.id])return;delete state.selected[q.id];renderAll();save();}
  function renderSelectionStatus(q,sel,submitted){
    if(q.type==='order') els.selectionStatus.textContent=submitted ? `Submitted order: ${sel.length} step${sel.length===1?'':'s'}.` : `${sel.length} / ${q.maxSelections} steps selected`;
    else els.selectionStatus.textContent=submitted ? 'Answer submitted.' : `${sel.length} / ${q.maxSelections} answer${q.maxSelections===1?'':'s'} selected`;
  }
  function renderFeedback(q,submitted){
    els.feedback.innerHTML=''; els.feedback.className='feedback hidden'; if(!submitted)return;
    const ok=submitted.correct; els.feedback.classList.remove('hidden'); els.feedback.classList.add(ok?'correct':'incorrect');
    const title=document.createElement('div'); title.className='feedback-title'; title.textContent=ok?'✓ Correct':'✕ Incorrect'; els.feedback.appendChild(title);
    const p=document.createElement('div'); p.textContent=ok?'Well done.':'The correct answer is:'; els.feedback.appendChild(p);
    const ul=document.createElement('ul'); ul.className='answers-list';
    const ids=q.type==='order'?q.correct:[...q.correct]; ids.forEach(id=>{const o=q.options.find(x=>x.id===id);const li=document.createElement('li');li.textContent=o?o.text:id;ul.appendChild(li);}); els.feedback.appendChild(ul);
    if(q.votes?.length){
      const box=document.createElement('div');box.className='votes';const hd=document.createElement('strong');hd.textContent='Community vote distribution';box.appendChild(hd);
      q.votes.forEach(v=>{const row=document.createElement('div');row.className='vote-row';const label=document.createElement('div');label.className='vote-label';const texts=v.selection.map(letter=>q.options.find(o=>o.id===letter)?.text||letter);label.textContent=texts.join(' + ');const meter=document.createElement('div');meter.className='vote-meter';const fill=document.createElement('div');fill.className='vote-fill';fill.style.width=v.percent+'%';meter.appendChild(fill);const pct=document.createElement('div');pct.className='vote-pct';pct.textContent=v.percent+'%';const left=document.createElement('div');left.appendChild(label);left.appendChild(meter);row.appendChild(left);row.appendChild(pct);box.appendChild(row);});
      els.feedback.appendChild(box);
    }
  }
  function submitCurrent(){
    const q=currentQuestion(); const sel=selectedIds(q); if(!canSubmit(q,sel)) return;
    const ok=isCorrect(q,sel); state.submitted[q.id]={correct:ok,submittedAt:Date.now()}; renderAll(); save(); toast(ok?'Answer submitted: correct.':'Answer submitted: incorrect.');
  }
  function go(delta){state.currentIndex=Math.max(0,Math.min(TOTAL-1,state.currentIndex+delta));renderAll();save();window.scrollTo({top:0,behavior:'smooth'});}
  function jumpToId(id){const n=Number(id);const idx=state.order.indexOf(n);if(idx>=0){state.currentIndex=idx;renderAll();save();}}
  function renderResults(){
    let correct=0,wrong=0,open=0; const wrongIds=[];
    QUESTIONS.forEach(q=>{const s=state.submitted[q.id];if(!s)open++;else if(s.correct)correct++;else{wrong++;wrongIds.push(q.id);}});
    const score=Math.round((correct/TOTAL)*100); els.finalScore.textContent=score+'%';els.finalCorrect.textContent=correct;els.finalWrong.textContent=wrong;els.finalOpen.textContent=open;
    els.resultsTitle.textContent=score>=80?'Strong result.':score>=60?'Good progress.':'Keep practicing and review the missed questions.';
    state.reviewIds=wrongIds.concat(QUESTIONS.filter(q=>!state.submitted[q.id]).map(q=>q.id));
    els.reviewSummary.textContent=`Review queue: ${state.reviewIds.length} question${state.reviewIds.length===1?'':'s'} (${wrong} wrong, ${open} unanswered). You can return to the test at any time.`;
  }
  function reviewWrong(){
    if(!state.reviewIds.length){toast('There are no wrong or open questions to review.');return;}
    state.order=[...state.reviewIds,...state.order.filter(id=>!state.reviewIds.includes(id))]; state.currentIndex=0; showQuiz(); save(); toast('Review queue loaded.');
  }
  function finish(){
    const open=QUESTIONS.filter(q=>!state.submitted[q.id]);
    if(open.length && !confirm(`You still have ${open.length} unanswered question${open.length===1?'':'s'}. Finish anyway?`)) return;
    showResults();
  }
  function applyFilter(){state.filter=els.questionSearch.value||'';renderPalette();}
  function toggleTheme(){document.body.classList.toggle('dark');els.themeBtn.textContent=document.body.classList.contains('dark')?'☀':'☾';save();}
  function init(){
    els.paletteCount.textContent=TOTAL; els.shuffleQuestions.checked=true;els.shuffleAnswers.checked=true;
    const restored=restore();
    if(!restored) resetState(false); else renderAll();
    els.questionSearch.addEventListener('input',applyFilter);
    els.questionSelect.addEventListener('change',e=>jumpToId(e.target.value));
    els.shuffleQuestions.addEventListener('change',()=>{resetState();});
    els.shuffleAnswers.addEventListener('change',()=>{resetState();});
    els.resetBtn.addEventListener('click',()=>{if(confirm('Start a new 101-question test? Current progress will be cleared.')) resetState();});
    els.clearBtn.addEventListener('click',clearSelection);els.submitBtn.addEventListener('click',submitCurrent);els.finishBtn.addEventListener('click',finish);
    [els.prevBtn,els.prevBtn2].forEach(b=>b.addEventListener('click',()=>go(-1)));[els.nextBtn,els.nextBtn2].forEach(b=>b.addEventListener('click',()=>go(1)));
    els.themeBtn.addEventListener('click',toggleTheme); els.exhibitButton.addEventListener('click',openExhibit); els.exhibitZoom.addEventListener('click',openExhibit); els.exhibitModalClose.addEventListener('click',closeExhibit); els.exhibitModalBackdrop.addEventListener('click',closeExhibit); els.reviewWrongBtn.addEventListener('click',reviewWrong);els.backToTestBtn.addEventListener('click',showQuiz);els.newTestBtn.addEventListener('click',()=>{resetState();showQuiz();});
    document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,button'))return;if(state.mode!=='quiz')return;if(e.key==='Escape' && !els.exhibitModal.classList.contains('hidden')){closeExhibit();return;}if(e.key==='ArrowLeft')go(-1);if(e.key==='ArrowRight')go(1);});
  }
  init();
})();
