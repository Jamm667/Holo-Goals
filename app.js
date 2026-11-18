/* ============================================================
   HOLO//GOALS — 核心逻辑 v4
   三级结构 / 三态任务 / 加权进度 / 折叠进度 / 归档 / 计时复盘
   / 拖拽 / 统计 / 导入导出 / 中英日三语
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'holo_goals_v4';
  const ACCENTS = ['cyan', 'magenta', 'violet', 'lime', 'amber'];
  const ACCENT_HEX = { cyan:'#1fdbcf', magenta:'#e26bb0', violet:'#a98cf0', lime:'#8dff9e', amber:'#ffc75c' };
  const PALETTES = [
    { id:'holo',   key:'palette.holo',   bg:'#040607', accent:'#1fdbcf' },
    { id:'ember',  key:'palette.ember',  bg:'#080604', accent:'#ff9d5c' },
    { id:'orchid', key:'palette.orchid', bg:'#07050b', accent:'#c08cff' },
    { id:'matrix', key:'palette.matrix', bg:'#040704', accent:'#8dff9e' },
    { id:'frost',  key:'palette.frost',  bg:'#04070c', accent:'#74c6ff' },
    { id:'rose',   key:'palette.rose',   bg:'#0a0508', accent:'#ff84b8' }
  ];
  const STATUS = { todo:'○', doing:'◐', done:'✓' };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const clamp = (v,a,b) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2,'0');
  const esc = s => String(s??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dayKey = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fmtMin = m => m>=60 ? `${Math.floor(m/60)}h ${pad(Math.round(m%60))}m` : `${Math.round(m)}m`;
  const fmtClock = sec => `${pad(Math.floor(sec/60))}:${pad(Math.floor(sec%60))}`;

  /* ============================================================
     三语字典
     ============================================================ */
  const I18N = {
    zh: {
      'app.sub':'全息长期目标矩阵',
      'stat.today':'今日专注','stat.active':'活跃目标','stat.clock':'系统时钟',
      'nav.stats':'数据统计','nav.export':'导出备份','nav.import':'导入备份','nav.settings':'系统设置',
      'ov.overline':'SYSTEM OVERVIEW // 系统概览','ov.goals':'长期目标','ov.projects':'阶段项目','ov.tasks':'小目标','ov.day':'今日总进度',
      'tb.overline':'GOAL MATRIX // 目标矩阵','tb.hint':'拖动 ⠿ 排序 · 点击 ▾ 折叠 · 任务状态循环切换',
      'tb.expand':'全部展开','tb.collapse':'全部折叠','tb.add':'新建长期目标',
      'empty.title':'矩阵尚未初始化','empty.desc':'创建你的第一个长期目标，设定预估周期，开始构建属于你的目标星图。','empty.add':'创建长期目标',
      'status.storage':'本地存储已连接','status.hint':'HOLO//GOALS · 数据仅保存在本机，请定期导出备份','status.synced':'数据已同步','status.syncing':'同步中…',
      'goal.badge':'GOAL','goal.meta':'{p} 个阶段 · {d}/{t} 项任务完成','goal.ready':'可归档',
      'goal.days':'持续天数','goal.elapsed':'已进行','goal.remain':'剩余天数',
      'goal.effDone':'目标已达成 · 用时 {e}/{d} 天','goal.effDue':'已到预估期限 · 建议聚焦收尾或延长周期',
      'goal.effAhead':'领先节奏 {n}% · 按当前节奏可提前达成','goal.effOk':'节奏同步 · 剩余 {r} 天推进 {p}%',
      'goal.effLate':'落后 {n}% · 剩余 {r} 天需推进 {need}%（约 {per}%/天）',
      'goal.doneDates':'完成日记录 {n} 天','goal.recent':'最近','goal.created':'创建于',
      'goal.start':'开始计时','goal.perDay':'/日','goal.overall':'OVERALL // 总完成度',
      'goal.overallFoot':'由 {p} 个阶段 · {t} 项任务按任务量加权计算','goal.focus':'专注进度 {n}%',
      'goal.countdown':'倒计时','goal.stopwatch':'正计时','goal.daily':'每日','goal.min':'分','goal.overallShort':'总完成度',
      'act.edit':'编辑周期与天数','act.accent':'切换配色','act.stage':'添加阶段项目','act.del':'删除目标',
      'act.archive':'归档目标','act.archiveReady':'完成后可归档','act.due':'设置到期日','act.addTask':'添加小目标','act.delStage':'删除项目','act.delTask':'删除小目标',
      'st.stage':'阶段 {n}','st.auto':'↳ 由 {n} 项小目标按任务量加权自动汇总','st.manual':'← 拖动滑轨自评完成度 →',
      'st.addStagePh':'新增阶段项目，回车确认…','st.addStageBtn':'＋ 阶段项目','st.addTaskPh':'追加小目标，回车确认…','st.addTaskBtn':'＋ 小目标',
      'st.nameTip':'请先起个名字再添加','st.duePh':'到期日（YYYY-MM-DD），留空清除',
      'status.todo':'未开始','status.doing':'进行中','status.done':'已完成','status.cycle':'点击切换：未开始 → 进行中 → 已完成',
      'weight':'量','weightTip':'任务量权重（越大对上级进度影响越大）',
      'due.overdue':'逾期 {n}天','due.today':'今日截止','due.soon':'{n}天后',
      'modalGoal.overline':'NEW OBJECTIVE // 目标设置','modalGoal.createTitle':'创建长期目标','modalGoal.editTitle':'编辑目标周期',
      'modalGoal.name':'目标名称','modalGoal.required':'必填','modalGoal.namePh':'例如：掌握产品设计系统',
      'modalGoal.days':'预估持续天数','modalGoal.daysHint':'用于效率与剩余天数计算',
      'modalGoal.d30':'30 天','modalGoal.d90':'90 天','modalGoal.d180':'180 天','modalGoal.d365':'1 年','modalGoal.dayUnit':'天',
      'modalGoal.note':'开始日期将记录为今天；完成每个小目标时会自动记下日期，用于节奏与效率建议。',
      'modalGoal.cancel':'取消','modalGoal.create':'创建目标','modalGoal.update':'保存修改',
      'review.overline':'SESSION REVIEW // 专注复盘','review.title':'刚刚推进了哪些任务？',
      'review.lead':'本次专注 <b>{min}</b> · 目标「{goal}」。请花 10 秒评估推进结果：',
      'review.empty':'该目标还没有阶段项目，创建后即可在这里评估。','review.projEmpty':'该阶段还没有小目标',
      'review.later':'稍后再说','review.save':'保存评估',
      'stats.overline':'ANALYTICS // 数据分析','stats.title':'数据统计','stats.w7':'近 7 天','stats.w30':'近 30 天','stats.goals':'目标分布',
      'stats.total':'区间总时长','stats.avg':'日均专注','stats.records':'记录条目','stats.weekdays':'日,一,二,三,四,五,六',
      'set.overline':'CONFIG // 系统配置','set.title':'设置','set.language':'界面语言 / LANGUAGE','set.langLabel':'语言','set.langHint':'切换后界面与提示立即更新',
      'set.appearance':'外观 · 配色方案','set.interface':'界面 · POV 弧度 / HUD 拉伸','set.pov':'弧度强度','set.povHint':'取景器曲线，实时预览',
      'set.focus':'专注与提醒','set.remindTime':'每日提醒时间','set.remindHint':'未达成当日目标时提醒',
      'set.review':'计时结束后评估任务','set.reviewHint':'弹出面板，拖动或切换任务状态',
      'set.sound':'专注结束提示音','set.notify':'桌面通知','set.notifyHint':'需授权浏览器通知权限','set.defaultMin':'默认专注时长（分钟）',
      'set.data':'数据','set.clear':'清空所有数据','set.clearHint':'不可恢复，请先导出备份','set.clearBtn':'清空数据',
      'archive.title':'归档目标','archive.empty':'还没有归档的目标','archive.restore':'恢复归档','archive.del':'删除归档',
      'trash.title':'最近删除','trash.goal':'长期目标','trash.project':'阶段项目','trash.milestone':'小目标',
      'trash.restore':'还原','trash.purge':'永久删除','trash.restored':'已还原到原位置','trash.purged':'已永久删除',
      'trash.parentMissing':'原上级已不存在，无法还原','trash.date':'删除于',
      'trash.belongs':'归属','trash.sourceMissing':'找不到源大目标','trash.cannotRestore':'无法恢复',
      'trash.archivedSource':'源大目标已归档，恢复该目标后才可还原',
      'index.title':'目标索引','act.dragSort':'拖动排序',
      'act.clickEdit':'点击改名','act.clickEditDays':'点击编辑周期与天数',
      'confirm.eyebrow':'CONFIRM // 二次确认','confirm.title':'确认操作','confirm.cancel':'取消','confirm.ok':'确认删除',
      'toast.dupName':'同级名称已存在，请换一个名字',
      'toast.created':'长期目标已创建','toast.updated':'目标设置已更新','toast.deleted':'目标已删除','toast.stageAdded':'已添加阶段项目',
      'toast.archived':'目标已归档','toast.restored':'目标已恢复','toast.exported':'备份已导出为 JSON 文件','toast.imported':'数据导入成功',
      'toast.importFail':'导入失败：{e}','toast.cleared':'已清空全部数据','toast.needName':'请先给新条目起个名字','toast.noNotify':'未获得通知权限',
      'toast.focusStart':'专注开始：{g}','toast.focusEnded':'{m}，已记录 {t}','toast.tooShort':'时长过短，未记录','toast.alreadyFocus':'已有专注进行中，请先结束',
      'toast.palette':'配色已切换：{n}','toast.storageFail':'存储失败：{e}','toast.langChanged':'界面语言已切换',
      'toast.archiveTip':'完成全部任务后才可归档','toast.focusDone':'倒计时完成','toast.focusStop':'专注结束',
      'remind.daily':'⏰ 每日提醒：还有 {n} 个目标未达今日时长','remind.due':'⚠ 到期提醒：{n} 个项目到期或未完成',
      'confirm.delGoal':'删除长期目标「{t}」及其全部项目？','confirm.delStage':'删除项目「{t}」？','confirm.delTask':'删除小目标「{t}」？',
      'confirm.clear1':'确认清空全部数据？此操作不可恢复，建议先导出备份。','confirm.clear2':'再次确认：真的要清空所有目标和记录吗？',
      'confirm.import':'导入 {n} 个目标？当前数据将被覆盖。',
      'palette.holo':'深空全息','palette.ember':'熔金余烬','palette.orchid':'紫罗兰域','palette.matrix':'矩阵的绿','palette.frost':'极地霜蓝','palette.rose':'霓虹玫瑰'
    },
    en: {
      'app.sub':'Holographic long-term goal matrix',
      'stat.today':'Focus today','stat.active':'Active goals','stat.clock':'System clock',
      'nav.stats':'Statistics','nav.export':'Export backup','nav.import':'Import backup','nav.settings':'Settings',
      'ov.overline':'SYSTEM OVERVIEW','ov.goals':'Long-term goals','ov.projects':'Stage projects','ov.tasks':'Tasks','ov.day':'Today progress',
      'tb.overline':'GOAL MATRIX','tb.hint':'Drag ⠿ to reorder · ▾ to fold · click status to cycle',
      'tb.expand':'Expand all','tb.collapse':'Collapse all','tb.add':'New long-term goal',
      'empty.title':'Matrix not initialized','empty.desc':'Create your first long-term goal, set a timeline, and start building your goal constellation.','empty.add':'Create goal',
      'status.storage':'Local storage connected','status.hint':'HOLO//GOALS · Data stays on this device. Export backups regularly.','status.synced':'Synced','status.syncing':'Syncing…',
      'goal.badge':'GOAL','goal.meta':'{p} stages · {d}/{t} tasks done','goal.ready':'Ready to archive',
      'goal.days':'Duration','goal.elapsed':'Elapsed','goal.remain':'Days left',
      'goal.effDone':'Goal achieved · {e}/{d} days','goal.effDue':'Deadline reached · wrap up or extend the timeline',
      'goal.effAhead':'Ahead by {n}% · on track to finish early','goal.effOk':'On pace · {r} days left to complete {p}%',
      'goal.effLate':'Behind {n}% · {r} days left, need {need}% (about {per}%/day)',
      'goal.doneDates':'{n} days logged','goal.recent':'Recent','goal.created':'Created',
      'goal.start':'Start focus','goal.perDay':'/day','goal.overall':'OVERALL // Completion',
      'goal.overallFoot':'Weighted by {p} stages and {t} tasks','goal.focus':'Focus {n}%',
      'goal.countdown':'Countdown','goal.stopwatch':'Stopwatch','goal.daily':'Daily','goal.min':'min','goal.overallShort':'Overall',
      'act.edit':'Edit cycle & days','act.accent':'Switch color','act.stage':'Add stage project','act.del':'Delete goal',
      'act.archive':'Archive goal','act.archiveReady':'Available when complete','act.due':'Set due date','act.addTask':'Add task','act.delStage':'Delete stage','act.delTask':'Delete task',
      'st.stage':'STAGE {n}','st.auto':'↳ Weighted from {n} tasks','st.manual':'← Drag to self-assess →',
      'st.addStagePh':'New stage project, press Enter…','st.addStageBtn':'＋ Stage','st.addTaskPh':'Add a task, press Enter…','st.addTaskBtn':'＋ Task',
      'st.nameTip':'Please name it before adding','st.duePh':'Due date (YYYY-MM-DD), blank to clear',
      'status.todo':'To do','status.doing':'In progress','status.done':'Done','status.cycle':'Click to cycle: to do → in progress → done',
      'weight':'Wt','weightTip':'Task weight (higher = more impact on parent progress)',
      'due.overdue':'{n}d overdue','due.today':'Due today','due.soon':'in {n}d',
      'modalGoal.overline':'NEW OBJECTIVE // GOAL SETUP','modalGoal.createTitle':'Create long-term goal','modalGoal.editTitle':'Edit goal cycle',
      'modalGoal.name':'Goal name','modalGoal.required':'required','modalGoal.namePh':'e.g. Master product design systems',
      'modalGoal.days':'Estimated duration','modalGoal.daysHint':'Used for pace and remaining days',
      'modalGoal.d30':'30 days','modalGoal.d90':'90 days','modalGoal.d180':'180 days','modalGoal.d365':'1 year','modalGoal.dayUnit':'days',
      'modalGoal.note':'The start date is set to today. Completing a task records its date for pace suggestions.',
      'modalGoal.cancel':'Cancel','modalGoal.create':'Create goal','modalGoal.update':'Save changes',
      'review.overline':'SESSION REVIEW // FOCUS REVIEW','review.title':'What did you move forward?',
      'review.lead':'Focused <b>{min}</b> · Goal "{goal}". Take 10 seconds to review your progress:',
      'review.empty':'This goal has no stages yet. Create one to review here.','review.projEmpty':'No tasks in this stage yet',
      'review.later':'Later','review.save':'Save review',
      'stats.overline':'ANALYTICS // DATA','stats.title':'Statistics','stats.w7':'Last 7 days','stats.w30':'Last 30 days','stats.goals':'By goal',
      'stats.total':'Total time','stats.avg':'Daily average','stats.records':'Sessions','stats.weekdays':'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
      'set.overline':'CONFIG // PREFERENCES','set.title':'Settings','set.language':'LANGUAGE / 界面语言','set.langLabel':'Language','set.langHint':'UI and messages update instantly',
      'set.appearance':'Appearance · Color scheme','set.interface':'Interface · POV arc / HUD stretch','set.pov':'Arc intensity','set.povHint':'Viewfinder curve, live preview',
      'set.focus':'Focus & reminders','set.remindTime':'Daily reminder','set.remindHint':'Remind when the daily goal is unmet',
      'set.review':'Review after each session','set.reviewHint':'Open a panel to adjust progress and task states',
      'set.sound':'Session end sound','set.notify':'Desktop notifications','set.notifyHint':'Requires browser permission','set.defaultMin':'Default focus length (min)',
      'set.data':'Data','set.clear':'Clear all data','set.clearHint':'Irreversible. Export a backup first.','set.clearBtn':'Clear data',
      'archive.title':'Archived goals','archive.empty':'No archived goals yet','archive.restore':'Restore','archive.del':'Delete archive',
      'trash.title':'Recently deleted','trash.goal':'Long-term goal','trash.project':'Stage project','trash.milestone':'Task',
      'trash.restore':'Restore','trash.purge':'Delete forever','trash.restored':'Restored to original position','trash.purged':'Permanently deleted',
      'trash.parentMissing':'Original parent no longer exists','trash.date':'Deleted',
      'trash.belongs':'Belongs to','trash.sourceMissing':'Source goal not found','trash.cannotRestore':'Cannot restore',
      'trash.archivedSource':'Source goal is archived — restore that goal first',
      'index.title':'GOAL INDEX','act.dragSort':'Drag to reorder',
      'act.clickEdit':'Click to rename','act.clickEditDays':'Click to edit cycle & days',
      'confirm.eyebrow':'CONFIRM // CONFIRMATION','confirm.title':'Confirm action','confirm.cancel':'Cancel','confirm.ok':'Confirm delete',
      'toast.dupName':'A sibling with this name already exists',
      'toast.created':'Long-term goal created','toast.updated':'Goal settings updated','toast.deleted':'Goal deleted','toast.stageAdded':'Stage project added',
      'toast.archived':'Goal archived','toast.restored':'Goal restored','toast.exported':'Backup exported as JSON','toast.imported':'Data imported',
      'toast.importFail':'Import failed: {e}','toast.cleared':'All data cleared','toast.needName':'Please give it a name first','toast.noNotify':'Notification permission denied',
      'toast.focusStart':'Focus started: {g}','toast.focusEnded':'{m}, logged {t}','toast.tooShort':'Too short to log','toast.alreadyFocus':'A focus session is already running',
      'toast.palette':'Palette switched: {n}','toast.storageFail':'Storage failed: {e}','toast.langChanged':'Language switched',
      'toast.archiveTip':'Finish all tasks before archiving','toast.focusDone':'Countdown complete','toast.focusStop':'Focus stopped',
      'remind.daily':'⏰ Daily reminder: {n} goals short of today\'s target','remind.due':'⚠ Due reminder: {n} projects due or unfinished',
      'confirm.delGoal':'Delete goal "{t}" and all its projects?','confirm.delStage':'Delete project "{t}"?','confirm.delTask':'Delete task "{t}"?',
      'confirm.clear1':'Clear all data? This cannot be undone. Export a backup first.','confirm.clear2':'Are you sure? All goals and records will be deleted.',
      'confirm.import':'Import {n} goals? Current data will be overwritten.',
      'palette.holo':'Deep Holo','palette.ember':'Ember','palette.orchid':'Orchid','palette.matrix':'Matrix','palette.frost':'Frost','palette.rose':'Rose'
    },
    ja: {
      'app.sub':'ホログラフィック長期目標マトリクス',
      'stat.today':'今日の集中','stat.active':'アクティブ目標','stat.clock':'システム時刻',
      'nav.stats':'統計','nav.export':'バックアップ書き出し','nav.import':'バックアップ読み込み','nav.settings':'設定',
      'ov.overline':'SYSTEM OVERVIEW // システム概要','ov.goals':'長期目標','ov.projects':'ステージ','ov.tasks':'タスク','ov.day':'今日の進捗',
      'tb.overline':'GOAL MATRIX // 目標マトリクス','tb.hint':'⠿ で並べ替え · ▾ で折りたたみ · ステータスをクリックで切替',
      'tb.expand':'すべて展開','tb.collapse':'すべて折りたたむ','tb.add':'長期目標を追加',
      'empty.title':'マトリクス未初期化','empty.desc':'最初の長期目標を作成し、期間を設定して、目標の星図を描き始めましょう。','empty.add':'目標を作成',
      'status.storage':'ローカルストレージ接続済み','status.hint':'HOLO//GOALS · データはこの端末にのみ保存されます。定期的に書き出してください。','status.synced':'同期済み','status.syncing':'同期中…',
      'goal.badge':'GOAL','goal.meta':'ステージ {p} · タスク {d}/{t} 完了','goal.ready':'アーカイブ可能',
      'goal.days':'期間','goal.elapsed':'経過','goal.remain':'残り日数',
      'goal.effDone':'目標達成 · {e}/{d} 日','goal.effDue':'期限到達 · 仕上げまたは期間延長を',
      'goal.effAhead':'ペース先行 {n}% · 前倒し達成の見込み','goal.effOk':'ペース同期 · 残り {r} 日で {p}% を推進',
      'goal.effLate':'遅れ {n}% · 残り {r} 日で {need}% 必要（約 {per}%/日）',
      'goal.doneDates':'完了記録 {n} 日','goal.recent':'最近','goal.created':'作成日',
      'goal.start':'集中開始','goal.perDay':'/日','goal.overall':'OVERALL // 総合進捗',
      'goal.overallFoot':'{p} ステージ · {t} タスクを作業量で加重計算','goal.focus':'集中進捗 {n}%',
      'goal.countdown':'カウントダウン','goal.stopwatch':'ストップウォッチ','goal.daily':'毎日','goal.min':'分','goal.overallShort':'総合進捗',
      'act.edit':'期間と日数を編集','act.accent':'配色を切替','act.stage':'ステージを追加','act.del':'目標を削除',
      'act.archive':'目標をアーカイブ','act.archiveReady':'完了後に利用可能','act.due':'期限を設定','act.addTask':'タスクを追加','act.delStage':'ステージを削除','act.delTask':'タスクを削除',
      'st.stage':'ステージ {n}','st.auto':'↳ {n} 件のタスクから加重集計','st.manual':'← スライダーで自己評価 →',
      'st.addStagePh':'新しいステージ名を入力し Enter…','st.addStageBtn':'＋ ステージ','st.addTaskPh':'タスクを入力し Enter…','st.addTaskBtn':'＋ タスク',
      'st.nameTip':'先に名前を付けてください','st.duePh':'期限（YYYY-MM-DD）、空で解除',
      'status.todo':'未着手','status.doing':'進行中','status.done':'完了','status.cycle':'クリックで切替：未着手 → 進行中 → 完了',
      'weight':'量','weightTip':'作業量の重み（大きいほど上位の進捗への影響が大きい）',
      'due.overdue':'{n}日超過','due.today':'本日期限','due.soon':'あと {n} 日',
      'modalGoal.overline':'NEW OBJECTIVE // 目標設定','modalGoal.createTitle':'長期目標を作成','modalGoal.editTitle':'目標期間を編集',
      'modalGoal.name':'目標名','modalGoal.required':'必須','modalGoal.namePh':'例：プロダクトデザインシステムを習得',
      'modalGoal.days':'予定期間','modalGoal.daysHint':'ペースと残り日数の計算に使用',
      'modalGoal.d30':'30 日','modalGoal.d90':'90 日','modalGoal.d180':'180 日','modalGoal.d365':'1 年','modalGoal.dayUnit':'日',
      'modalGoal.note':'開始日は今日として記録されます。タスク完了時に日付を記録し、ペース提案に使用します。',
      'modalGoal.cancel':'キャンセル','modalGoal.create':'目標を作成','modalGoal.update':'変更を保存',
      'review.overline':'SESSION REVIEW // 集中レビュー','review.title':'何を進めましたか？',
      'review.lead':'集中 <b>{min}</b> · 目標「{goal}」。10 秒で進捗を評価してください：',
      'review.empty':'この目標にはまだステージがありません。作成するとここで評価できます。','review.projEmpty':'このステージにはまだタスクがありません',
      'review.later':'後で','review.save':'評価を保存',
      'stats.overline':'ANALYTICS // データ分析','stats.title':'統計','stats.w7':'過去 7 日','stats.w30':'過去 30 日','stats.goals':'目標別',
      'stats.total':'合計時間','stats.avg':'1 日平均','stats.records':'記録数','stats.weekdays':'日,月,火,水,木,金,土',
      'set.overline':'CONFIG // システム設定','set.title':'設定','set.language':'言語 / LANGUAGE','set.langLabel':'言語','set.langHint':'切替後すぐに反映されます',
      'set.appearance':'外観 · 配色','set.interface':'インターフェース · POV 弧 / HUD 伸縮','set.pov':'弧の強度','set.povHint':'ビューファインダー曲線、リアルタイムプレビュー',
      'set.focus':'集中とリマインダー','set.remindTime':'毎日のリマインド時刻','set.remindHint':'当日の目標に達していない場合に通知',
      'set.review':'集中後にタスクを評価','set.reviewHint':'パネルで進捗と状態を調整','set.sound':'終了時の通知音','set.notify':'デスクトップ通知','set.notifyHint':'ブラウザの許可が必要です','set.defaultMin':'既定の集中時間（分）',
      'set.data':'データ','set.clear':'全データを消去','set.clearHint':'復元不可。先にバックアップを書き出してください。','set.clearBtn':'データを消去',
      'archive.title':'アーカイブ済み目標','archive.empty':'アーカイブされた目標はありません','archive.restore':'復元','archive.del':'アーカイブを削除',
      'trash.title':'最近削除した項目','trash.goal':'長期目標','trash.project':'ステージ','trash.milestone':'タスク',
      'trash.restore':'復元','trash.purge':'完全に削除','trash.restored':'元の位置に復元しました','trash.purged':'完全に削除しました',
      'trash.parentMissing':'元の上位項目が存在しないため復元できません','trash.date':'削除日時',
      'trash.belongs':'所属','trash.sourceMissing':'元の大目標が見つかりません','trash.cannotRestore':'復元できません',
      'trash.archivedSource':'元の大目標がアーカイブ済みです。先にその目標を復元してください',
      'index.title':'目標インデックス','act.dragSort':'ドラッグで並べ替え',
      'act.clickEdit':'クリックで名前を編集','act.clickEditDays':'クリックで期間と日数を編集',
      'confirm.eyebrow':'CONFIRM // 最終確認','confirm.title':'操作の確認','confirm.cancel':'キャンセル','confirm.ok':'削除を確定',
      'toast.dupName':'同じ名前の項目が既にあります',
      'toast.created':'長期目標を作成しました','toast.updated':'目標設定を更新しました','toast.deleted':'目標を削除しました','toast.stageAdded':'ステージを追加しました',
      'toast.archived':'目標をアーカイブしました','toast.restored':'目標を復元しました','toast.exported':'JSON バックアップを書き出しました','toast.imported':'データを読み込みました',
      'toast.importFail':'読み込み失敗：{e}','toast.cleared':'全データを消去しました','toast.needName':'先に名前を付けてください','toast.noNotify':'通知が許可されていません',
      'toast.focusStart':'集中開始：{g}','toast.focusEnded':'{m} を記録しました：{t}','toast.tooShort':'時間が短すぎるため記録しませんでした','toast.alreadyFocus':'集中中です。先に終了してください',
      'toast.palette':'配色を切替：{n}','toast.storageFail':'保存失敗：{e}','toast.langChanged':'言語を切り替えました',
      'toast.archiveTip':'すべてのタスクを完了するとアーカイブできます','toast.focusDone':'カウントダウン完了','toast.focusStop':'集中を終了しました',
      'remind.daily':'⏰ 每日リマインド：{n} 件の目標が今日の目標時間に達していません','remind.due':'⚠ 期限リマインド：{n} 件のステージが期限切れまたは未完了です',
      'confirm.delGoal':'目標「{t}」とすべてのステージを削除しますか？','confirm.delStage':'プロジェクト「{t}」を削除しますか？','confirm.delTask':'タスク「{t}」を削除しますか？',
      'confirm.clear1':'全データを消去しますか？復元できません。先にバックアップを書き出してください。','confirm.clear2':'本当に消去しますか？すべての目標と記録が削除されます。',
      'confirm.import':'{n} 件の目標を読み込みますか？現在のデータは上書きされます。',
      'palette.holo':'ディープホロ','palette.ember':'エンバー','palette.orchid':'オーキッド','palette.matrix':'マトリクス','palette.frost':'フロスト','palette.rose':'ローズ'
    }
  };

  let LANG = 'zh';
  function t(key, vars){
    let s = (I18N[LANG] && I18N[LANG][key]) || I18N.zh[key] || key;
    if(vars) Object.keys(vars).forEach(k => { s = s.split('{'+k+'}').join(vars[k]); });
    return s;
  }
  function applyI18n(){
    document.documentElement.lang = LANG==='zh' ? 'zh-CN' : (LANG==='ja' ? 'ja' : 'en');
    document.title = 'HOLO//GOALS · ' + t('app.sub');
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $$('[data-tip-i18n]').forEach(el => {
      const v = t(el.dataset.tipI18n); el.dataset.tip = v; el.setAttribute('aria-label', v);
    });
  }

  /* ============================================================
     数据层
     ============================================================ */
  const defaultState = () => ({
    v:4, goals:[], sessions:[], trash:[],
    settings:{ lang:'zh', palette:'holo', pov:40, review:true, reminder:'21:00', sound:true, notify:false, defaultMin:25, remindDaily:true }
  });
  let S = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return seed(defaultState());
      return normalize(JSON.parse(raw));
    }catch(e){ console.warn('加载失败，使用空数据', e); return seed(defaultState()); }
  }
  function normalize(d){
    d.settings = Object.assign(defaultState().settings, d.settings||{});
    if(!['zh','en','ja'].includes(d.settings.lang)) d.settings.lang='zh';
    d.settings.pov = clamp(+d.settings.pov||0,0,100);
    d.settings.palette = PALETTES.some(p=>p.id===d.settings.palette)?d.settings.palette:'holo';
    d.goals = Array.isArray(d.goals)?d.goals:[];
    d.sessions = Array.isArray(d.sessions)?d.sessions:[];
    d.trash = Array.isArray(d.trash)?d.trash:[];
    d.goals.forEach(g=>{
      g.id=g.id||uid(); g.title=g.title||'未命名目标';
      g.dailyTarget=+g.dailyTarget||120;
      g.accent=ACCENTS.includes(g.accent)?g.accent:'cyan';
      g.collapsed=!!g.collapsed; g.archived=!!g.archived;
      g.durationDays=clamp(+g.durationDays||90,1,3650);
      g.createdAt=g.createdAt||new Date().toISOString();
      g.doneDates=Array.isArray(g.doneDates)?g.doneDates:[];
      g.projects=Array.isArray(g.projects)?g.projects:[];
      g.projects.forEach(p=>{
        p.id=p.id||uid(); p.title=p.title||'未命名项目';
        p.progress=clamp(+p.progress||0,0,100); p.due=p.due||''; p.collapsed=!!p.collapsed;
        p.milestones=Array.isArray(p.milestones)?p.milestones:[];
        p.milestones.forEach(m=>{
          m.id=m.id||uid(); m.title=m.title||'未命名小目标';
          m.progress=clamp(+m.progress||0,0,100); m.weight=clamp(+m.weight||1,1,20);
          m.status = m.done ? 'done' : (['todo','doing','done'].includes(m.status)?m.status:'todo');
          m.done = m.status==='done';
        });
      });
    });
    return d;
  }
  function seed(d){
    d.goals.push({
      id:uid(), title:'掌握一门核心技术', dailyTarget:120, accent:'cyan', collapsed:false, archived:false,
      durationDays:90, createdAt:new Date().toISOString(), doneDates:[],
      projects:[{
        id:uid(), title:'阶段一 · 基础夯实', progress:0, due:'', collapsed:false,
        milestones:[
          {id:uid(), title:'完成核心概念梳理', progress:100, done:true, status:'done', weight:2},
          {id:uid(), title:'刷完基础练习题', progress:40, done:false, status:'doing', weight:3}
        ]
      }]
    });
    return d;
  }
  let saveTimer=null;
  function save(instant){
    const el=$('#saveStatus'); if(el){el.textContent=t('status.syncing'); el.classList.add('blink');}
    clearTimeout(saveTimer);
    const doSave=()=>{
      try{ localStorage.setItem(KEY, JSON.stringify(S)); }
      catch(e){ toast(t('toast.storageFail',{e:e.message}),'danger'); }
      if(el){el.textContent=t('status.synced'); el.classList.remove('blink');}
    };
    instant?doSave():saveTimer=setTimeout(doSave,250);
  }

  /* ============================================================
     查询与计算
     ============================================================ */
  const activeGoals = () => S.goals.filter(g=>!g.archived);
  const archivedGoals = () => S.goals.filter(g=>g.archived);
  function goalMinutes(goalId, date){
    return S.sessions.filter(s=>s.goalId===goalId && s.date===date).reduce((a,s)=>a+s.min,0);
  }
  const todayMinutes = id => goalMinutes(id, dayKey());
  const allToday = () => S.sessions.filter(s=>s.date===dayKey()).reduce((a,s)=>a+s.min,0);

  const mileEff = m => m.status==='done' ? 100 : clamp(+m.progress||0,0,100);
  const mileWeight = m => clamp(+m.weight||1,1,20);
  function projectProgress(p){
    if(!p.milestones.length) return clamp(Math.round(p.progress),0,100);
    const tw=p.milestones.reduce((a,m)=>a+mileWeight(m),0);
    return tw ? Math.round(p.milestones.reduce((a,m)=>a+mileEff(m)*mileWeight(m),0)/tw) : 0;
  }
  const projectWeight = p => p.milestones.length ? p.milestones.reduce((a,m)=>a+mileWeight(m),0) : 1;
  function goalProgress(g){
    if(!g.projects.length) return 0;
    const tw=g.projects.reduce((a,p)=>a+projectWeight(p),0);
    return tw ? Math.round(g.projects.reduce((a,p)=>a+projectProgress(p)*projectWeight(p),0)/tw) : 0;
  }
  function elapsedDays(g){
    const s=new Date(g.createdAt||Date.now()); s.setHours(0,0,0,0);
    const n=new Date(); n.setHours(0,0,0,0);
    return clamp(Math.round((n-s)/86400000)+1,1,99999);
  }
  const remainingDays = g => Math.max(0, clamp(g.durationDays,1,3650) - elapsedDays(g));
  function efficiency(g){
    const prog=goalProgress(g), elapsed=elapsedDays(g), dur=clamp(g.durationDays,1,3650), remain=remainingDays(g);
    if(prog>=100) return {cls:'is-ahead', text:t('goal.effDone',{e:elapsed,d:dur})};
    const expect=clamp(elapsed/dur*100,0,100), delta=prog-expect;
    if(remain===0) return {cls:'is-late', text:t('goal.effDue')};
    if(delta>=6) return {cls:'is-ahead', text:t('goal.effAhead',{n:Math.round(delta)})};
    if(delta>=-6) return {cls:'is-ok', text:t('goal.effOk',{r:remain,p:100-prog})};
    const need=100-prog;
    return {cls:'is-late', text:t('goal.effLate',{n:Math.round(-delta),r:remain,need:need,per:Math.max(1,Math.ceil(need/remain))})};
  }
  function addDoneDate(g){ const k=dayKey(); if(!g.doneDates.includes(k)) g.doneDates.push(k); }
  // 完成判定：每个阶段要么其小目标全部完成，要么无小目标时自评进度已满
  function goalComplete(g){
    if(!g.projects.length) return false;
    return g.projects.every(p=>p.milestones.length
      ? p.milestones.every(m=>m.status==='done')
      : clamp(Math.round(p.progress),0,100)>=100);
  }

  /* ============================================================
     渲染
     ============================================================ */
  function render(){ renderOverview(); renderGoals(); renderTrash(); renderGoalIndex(); updateFocusHUD(); }
  function renderOverview(){
    const ag=activeGoals();
    $('#metricGoals').textContent=ag.length;
    $('#metricProjects').textContent=ag.reduce((a,g)=>a+g.projects.length,0);
    $('#metricTasks').textContent=ag.reduce((a,g)=>a+g.projects.reduce((b,p)=>b+p.milestones.length,0),0);
    const target=ag.reduce((a,g)=>a+g.dailyTarget,0), today=allToday();
    $('#metricDayBar').style.width=(target?clamp(today/target*100,0,100):0)+'%';
    $('#metricDayText').textContent=`${Math.round(today)} / ${target} ${t('goal.min')}`;
    $('#statToday').textContent=fmtClock(Math.round(today*60));
    $('#statActive').textContent=ag.length;
    const d=new Date();
    const wd=t('stats.weekdays').split(',')[d.getDay()];
    $('#overviewDate').textContent=`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} // ${wd}`;
  }
  function renderGoals(){
    const list=$('#goalList'), empty=$('#emptyState');
    const ag=activeGoals(), ar=archivedGoals();
    if(!ag.length){ list.innerHTML=''; empty.hidden=false; }
    else { empty.hidden=true; list.innerHTML=ag.map(goalHTML).join(''); }
    // 归档区
    const sec=$('#archiveSection'), box=$('#archiveList');
    $('#archiveCount').textContent=ar.length;
    if(ar.length){
      sec.hidden=false;
      box.innerHTML=ar.map(archiveHTML).join('');
    } else { sec.hidden=true; box.hidden=true; box.innerHTML=''; }
  }
  /* 最近删除 */
  function renderTrash(){
    const sec=$('#trashSection'), box=$('#trashList');
    $('#trashCount').textContent=S.trash.length;
    if(!S.trash.length){ sec.hidden=true; box.hidden=true; box.innerHTML=''; return; }
    sec.hidden=false;
    const loc = LANG==='zh'?'zh-CN':(LANG==='ja'?'ja-JP':'en-GB');
    box.innerHTML=S.trash.map(item=>{
      const when=new Date(item.deletedAt).toLocaleString(loc,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      const st=trashSourceState(item), ok=st.ok;
      const srcHint = !ok
        ? (st.reason==='archived' ? t('trash.archivedSource') : `${t('trash.sourceMissing')}${item.parentTitle?` · ${esc(item.parentTitle)}`:''}`)
        : '';
      const belongs = item.type!=='goal'
        ? `<span class="trash-card__owner ${ok?'':'is-missing'}">${ok
            ? `${t('trash.belongs')} ${esc(item.parentTitle||'—')}`
            : `⚠ ${srcHint}`}</span>`
        : '';
      return `
      <article class="trash-card" data-trash="${item.id}">
        <span class="trash-card__type">${t('trash.'+item.type)}</span>
        <span class="trash-card__main">
          <span class="trash-card__name">${esc(item.data?.title||'—')}</span>
          ${belongs}
        </span>
        <span class="trash-card__when">${when}</span>
        ${ok
          ? `<button class="trash-card__btn" data-act="restore-trash" aria-label="${t('trash.restore')}">↩ ${t('trash.restore')}</button>`
          : `<button class="trash-card__btn trash-card__btn--disabled" disabled title="${srcHint||t('trash.cannotRestore')}" aria-label="${t('trash.cannotRestore')}">↩ ${t('trash.cannotRestore')}</button>`}
        <button class="trash-card__btn trash-card__btn--danger" data-act="purge-trash" title="${t('trash.purge')}" aria-label="${t('trash.purge')}">✕</button>
      </article>`;
    }).join('');
  }

  /* 左侧 Word 式索引 */
  function renderGoalIndex(){
    const nav=$('#goalIndex'), ag=activeGoals(), ul=$('#goalIndexList');
    if(ag.length<2){ nav.hidden=true; return; }
    nav.hidden=false;
    ul.innerHTML=ag.map((g,i)=>`
      <li><button type="button" data-index-goal="${g.id}" title="${esc(g.title)}">
        <span class="goal-index__num">${pad(i+1)}</span><span class="goal-index__label">${esc(g.title)}</span>
      </button></li>`).join('');
  }

  function archiveHTML(g){
    const gp=goalProgress(g), pc=g.projects.length, mc=g.projects.reduce((a,p)=>a+p.milestones.length,0);
    return `
    <article class="archive-card" data-goal="${g.id}">
      <div class="archive-card__main">
        <div class="archive-card__title">${esc(g.title)}</div>
        <div class="archive-card__meta">${t('goal.meta',{p:pc,d:mc,t:mc})} · ${gp}%</div>
      </div>
      <div class="archive-card__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${gp}">
        <i style="width:${gp}%"></i>
      </div>
      <div class="archive-card__tools">
        <button class="mini-btn" data-act="restore-goal" title="${t('archive.restore')}" aria-label="${t('archive.restore')}">↩</button>
        <button class="mini-btn mini-btn--del" data-act="del-goal" title="${t('archive.del')}" aria-label="${t('archive.del')}">✕</button>
      </div>
    </article>`;
  }

  function goalHTML(g){
    const used=todayMinutes(g.id), pct=clamp(used/g.dailyTarget*100,0,100);
    const gp=goalProgress(g), elapsed=elapsedDays(g), remain=remainingDays(g), eff=efficiency(g);
    const projCount=g.projects.length;
    const taskCount=g.projects.reduce((a,p)=>a+p.milestones.length,0);
    const doneCount=g.projects.reduce((a,p)=>a+p.milestones.filter(m=>m.status==='done').length,0);
    const recent=g.doneDates.slice(-3).map(d=>d.slice(5)).join(' · ');
    const ready=goalComplete(g);
    return `
    <article class="goal-card ${g.collapsed?'is-collapsed':''}" data-accent="${g.accent}" data-goal="${g.id}" draggable="true">
      <div class="goal-card__head">
        <span class="drag-handle" data-drag title="${t('act.dragSort')}" aria-label="${t('act.dragSort')}">⠿</span>
        <button class="fold-btn" data-act="fold-goal" aria-label="${g.collapsed?'▸':'▾'}" aria-expanded="${!g.collapsed}"><span class="chev">▾</span></button>
        <div class="goal-card__title-wrap">
          <h2 class="goal-card__title" data-edit="goal" data-act="edit-goal-title" title="${t('act.clickEdit')}" tabindex="0">${esc(g.title)}</h2>
          <div class="goal-card__meta">
            <span class="goal-card__badge">GOAL // ${g.accent.toUpperCase()}</span>
            ${ready?`<span class="goal-card__badge goal-card__badge--ready">${t('goal.ready')}</span>`:''}
            ${t('goal.meta',{p:projCount,d:doneCount,t:taskCount})}
          </div>
        </div>
        <div class="goal-card__tools">
          <button class="mini-btn" data-act="edit-goal-meta" title="${t('act.edit')}" aria-label="${t('act.edit')}">⚙</button>
          <button class="mini-btn" data-act="cycle-accent" title="${t('act.accent')}" aria-label="${t('act.accent')}">◈</button>
          <button class="mini-btn mini-btn--del" data-act="del-goal" title="${t('act.del')}" aria-label="${t('act.del')}">✕</button>
        </div>
      </div>

      <!-- 折叠时显示总进度 -->
      <div class="goal-card__collapsed" aria-hidden="${!g.collapsed}">
        <span class="goal-card__collapsed-label">${t('goal.overallShort')}</span>
        <div class="goal-card__collapsed-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${gp}"><i style="width:${gp}%"></i></div>
        <b class="goal-card__collapsed-pct">${gp}%</b>
        <span class="goal-card__collapsed-meta">${doneCount}/${taskCount} · ${fmtMin(used)}/${fmtMin(g.dailyTarget)}</span>
        <button class="archive-btn archive-btn--compact ${ready?'':'is-locked'}" data-act="archive-goal"
                title="${ready?t('act.archive'):t('act.archiveReady')}" aria-label="${t('act.archive')}">
          <span class="archive-btn__icon">▣</span><span>${t('act.archive')}</span>
        </button>
      </div>

      <!-- 可折叠主体：天数 / 计时 / 进度 / 阶段（Grid 平滑过渡） -->
      <div class="collapsible"><div class="collapsible__inner">
      <div class="goal-hero">
        <div class="goal-hero__left">
          <div class="day-stats" data-act="edit-goal-meta" title="${t('act.clickEditDays')}" role="button" tabindex="0">
            <div class="day-stat"><b>${g.durationDays}</b><span>${t('goal.days')}</span></div>
            <div class="day-stat"><b>${elapsed}</b><span>${t('goal.elapsed')}</span></div>
            <div class="day-stat day-stat--key"><b>${remain}</b><span>${t('goal.remain')}</span></div>
          </div>
          <div class="goal-efficiency ${eff.cls}"><span class="goal-efficiency__dot"></span>${eff.text}</div>
          <div class="goal-dates">${t('goal.doneDates',{n:g.doneDates.length})}${recent?` · ${t('goal.recent')} ${recent}`:''} · ${t('goal.created')} ${g.createdAt.slice(0,10)}</div>
        </div>
        <div class="goal-hero__actions">
          <button class="focus-btn focus-btn--hero" data-act="focus" aria-label="${t('goal.start')}">
            <span class="focus-btn__icon">▶</span><span class="focus-btn__text">${t('goal.start')}</span>
            <small>${fmtMin(g.dailyTarget)}${t('goal.perDay')}</small>
          </button>
          <button class="archive-btn ${ready?'':'is-locked'}" data-act="archive-goal"
                  title="${ready?t('act.archive'):t('act.archiveReady')}" aria-label="${t('act.archive')}">
            <span class="archive-btn__icon">▣</span><span>${t('act.archive')}</span>
          </button>
        </div>
      </div>

      <!-- 总进度 -->
      <div class="goal-progress">
        <div class="goal-progress__head">
          <span class="overline">${t('goal.overall')}</span>
          <span class="goal-progress__pct">${gp}<small>%</small></span>
        </div>
        <div class="progress-track progress-track--big" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${gp}" aria-label="${t('goal.overallShort')}">
          <div class="progress-fill" style="width:${gp}%"></div>
        </div>
        <div class="goal-progress__foot">${t('goal.overallFoot',{p:projCount,t:taskCount})}</div>
      </div>

      <!-- 每日专注 -->
      <div class="goal-timer">
        <div class="timer-readout">${t('stat.today')} <b>${fmtMin(used)}</b> <small>/ ${fmtMin(g.dailyTarget)}</small></div>
        <div class="timer-bar">
          <span class="timer-bar__label">${t('goal.focus',{n:Math.round(pct)})}</span>
          <div class="progress-line" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="${t('goal.focus',{n:Math.round(pct)})}">
            <div class="progress-line__fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="timer-controls">
          <div class="mode-seg" data-goal="${g.id}" role="group" aria-label="${t('act.edit')}">
            <button data-act="mode" data-mode="countdown" class="${g._mode==='stopwatch'?'':'is-active'}" aria-pressed="${g._mode!=='stopwatch'}">${t('goal.countdown')}</button>
            <button data-act="mode" data-mode="stopwatch" class="${g._mode==='stopwatch'?'is-active':''}" aria-pressed="${g._mode==='stopwatch'}">${t('goal.stopwatch')}</button>
          </div>
          <label class="target-input"><span>${t('goal.daily')}</span>
            <input type="number" class="holo-input" data-act="daily-target" value="${g.dailyTarget}" min="5" max="960" aria-label="${t('goal.daily')}">
            <span>${t('goal.min')}</span>
          </label>
        </div>
      </div>

      <div class="projects">
        ${g.projects.map((p,i)=>projectHTML(p,g,i)).join('')}
        <div class="add-row">
          <input class="add-input" placeholder="${t('st.addStagePh')}" data-i18n-ph="st.addStagePh" data-enter="add-project" data-goal="${g.id}" aria-label="${t('act.stage')}">
          <button class="add-btn" data-act="add-project-submit" data-goal="${g.id}">${t('st.addStageBtn')}</button>
        </div>
      </div>
      </div></div>
    </article>`;
  }

  function projectHTML(p,g,idx){
    const pr=projectProgress(p), auto=p.milestones.length>0;
    return `
    <section class="project-card ${p.collapsed?'is-collapsed':''}" data-project="${p.id}" draggable="true" style="--accent:${ACCENT_HEX[g.accent]}">
      <div class="project-card__head">
        <span class="drag-handle" data-drag title="${t('act.dragSort')}" aria-label="${t('act.dragSort')}">⠿</span>
        <button class="fold-btn" data-act="fold-project" aria-label="▾" aria-expanded="${!p.collapsed}"><span class="chev">▾</span></button>
        <div class="project-card__title">
          <span class="level-tag">${t('st.stage',{n:pad(idx+1)})}</span>
          <span data-edit="project" title="双击重命名" tabindex="0">${esc(p.title)}</span>
          ${dueTag(p.due)}
        </div>
        <span class="progress-num">${pr}%</span>
        <div class="project-card__tools">
          <button class="mini-btn" data-act="set-due" title="${t('act.due')}" aria-label="${t('act.due')}">◷</button>
          <button class="mini-btn" data-act="add-milestone" title="${t('act.addTask')}" aria-label="${t('act.addTask')}">＋</button>
          <button class="mini-btn mini-btn--del" data-act="del-project" title="${t('act.delStage')}" aria-label="${t('act.delStage')}">✕</button>
        </div>
      </div>
      <div class="project-progress">
        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pr}" aria-label="${t('goal.overallShort')}">
          <div class="progress-fill" style="width:${pr}%"></div>
          ${auto?'':`<input type="range" class="range" min="0" max="100" value="${pr}" data-act="proj-progress" style="position:absolute;inset:-4px 0;width:100%;height:16px;opacity:0;cursor:ew-resize" aria-label="${t('st.manual')}">`}
        </div>
        <div class="progress-hint">${auto?t('st.auto',{n:p.milestones.length}):t('st.manual')}</div>
      </div>
      <div class="collapsible"><div class="collapsible__inner">
        <div class="milestones">
          ${p.milestones.map((m,i)=>milestoneHTML(m,i)).join('')}
          <div class="add-row">
            <input class="add-input" placeholder="${t('st.addTaskPh')}" data-i18n-ph="st.addTaskPh" data-enter="add-milestone" data-project="${p.id}" aria-label="${t('act.addTask')}">
            <button class="add-btn" data-act="add-milestone-submit" data-project="${p.id}">${t('st.addTaskBtn')}</button>
          </div>
        </div>
      </div></div>
    </section>`;
  }

  function milestoneHTML(m,idx){
    const label=t('status.'+m.status);
    return `
    <div class="milestone status-${m.status}" data-milestone="${m.id}" draggable="true">
      <span class="task-idx" data-drag title="${t('act.dragSort')}" aria-label="${t('act.dragSort')}">${pad(idx+1)}</span>
      <button class="state-btn" data-act="cycle-status" title="${t('status.cycle')}" aria-label="${label}" aria-pressed="${m.status==='done'}">
        <span class="state-btn__sym">${STATUS[m.status]}</span><span class="state-btn__label">${label}</span>
      </button>
      <span class="milestone__title" data-edit="milestone" title="双击重命名" tabindex="0">${esc(m.title)}</span>
      <input type="range" class="range" min="0" max="100" value="${m.progress}" data-act="mile-progress" style="--pct:${m.progress}%" aria-label="${t('goal.overallShort')}">
      <span class="milestone__pct">${m.progress}%</span>
      <button class="mini-btn mini-btn--del milestone__del" data-act="del-milestone" title="${t('act.delTask')}" aria-label="${t('act.delTask')}">✕</button>
    </div>`;
  }
  function dueTag(due){
    if(!due) return '';
    const diff=Math.round((new Date(due)-new Date(dayKey()))/86400000);
    if(diff<0) return `<span class="due-tag is-overdue">${t('due.overdue',{n:-diff})}</span>`;
    if(diff===0) return `<span class="due-tag is-soon">${t('due.today')}</span>`;
    if(diff<=3) return `<span class="due-tag is-soon">${t('due.soon',{n:diff})}</span>`;
    return `<span class="due-tag">${esc(due)}</span>`;
  }

  /* ============================================================
     查找 / 状态
     ============================================================ */
  const findGoal = id => S.goals.find(g=>g.id===id);
  function findProject(id){ for(const g of S.goals){const p=g.projects.find(p=>p.id===id); if(p) return {g,p};} return null; }
  function findMilestone(id){ for(const g of S.goals) for(const p of g.projects){const m=p.milestones.find(m=>m.id===id); if(m) return {g,p,m};} return null; }
  const ORDER=['todo','doing','done'];
  function setStatus(m,g,status){
    m.status=status; m.done=status==='done';
    if(status==='done'){ m.progress=100; addDoneDate(g); }
    else if(status==='doing'){ if(m.progress<=0) m.progress=25; }
    else { m.progress=0; }
  }
  const newMilestone = () => ({id:uid(), title:'新小目标', progress:0, weight:1, status:'todo', done:false});

  /* ============================================================
     交互
     ============================================================ */
  const goalList=$('#goalList');

  // 删除进入回收站，记录原类型/数据/位置/上级，供还原
  function trashPush(type,data,index,parentId,parentTitle){
    S.trash.unshift({id:uid(),type,data:JSON.parse(JSON.stringify(data)),index:index??0,
      parentId:parentId||null, parentTitle:parentTitle||'', deletedAt:Date.now()});
  }
  // 源状态：ok=可还原 / missing=源大目标已删除 / archived=源大目标已归档（需先恢复该目标）
  function trashSourceState(item){
    if(item.type==='goal') return {ok:true};
    const g = item.type==='project'
      ? findGoal(item.parentId)
      : (()=>{ const r=findProject(item.parentId); return r?findGoal(r.g.id):null; })();
    if(!g) return {ok:false, reason:'missing'};
    if(g.archived) return {ok:false, reason:'archived'};
    return {ok:true};
  }
  function trashSourceOK(item){ return trashSourceState(item).ok; }
  // 折叠：只切换 class 与 aria，不重建 DOM —— 保留元素才能让 CSS 过渡实际运行
  function foldCard(card, model){
    if(!card || !model) return;
    model.collapsed=!model.collapsed;
    card.classList.toggle('is-collapsed', model.collapsed);
    const fb=$('.fold-btn',card);
    if(fb){
      fb.setAttribute('aria-expanded', String(!model.collapsed));
      fb.setAttribute('aria-label', model.collapsed?'▸':'▾');
    }
    const cp=$('.goal-card__collapsed',card);
    if(cp) cp.setAttribute('aria-hidden', String(!model.collapsed));
    save();
  }

  function restoreTrash(item){
    if(!trashSourceOK(item)) return false;
    if(item.type==='goal'){
      S.goals.splice(Math.min(item.index,S.goals.length),0,item.data);
    } else if(item.type==='project'){
      const g=findGoal(item.parentId); if(!g) return false;
      g.projects.splice(Math.min(item.index,g.projects.length),0,item.data);
    } else {
      const r=findProject(item.parentId); if(!r) return false;
      r.p.milestones.splice(Math.min(item.index,r.p.milestones.length),0,item.data);
    }
    return true;
  }

  function handleListClick(e){
    const btn=e.target.closest('[data-act]'); if(!btn) return;
    const act=btn.dataset.act;
    const gid=btn.closest('[data-goal]')?.dataset.goal;
    const pid=btn.closest('[data-project]')?.dataset.project;
    const mid=btn.closest('[data-milestone]')?.dataset.milestone;
    const g=findGoal(gid), pr=pid?findProject(pid):null, m=mid?findMilestone(mid):null;
    switch(act){
      case 'fold-goal': if(g) foldCard(btn.closest('.goal-card'), g); break;
      case 'fold-project': if(pr) foldCard(btn.closest('.project-card'), pr.p); break;
      case 'cycle-accent': if(g){g.accent=ACCENTS[(ACCENTS.indexOf(g.accent)+1)%ACCENTS.length]; renderGoals();} break;
      case 'del-goal': if(g) askConfirm(t('confirm.delGoal',{t:g.title})).then(ok=>{
        if(!ok || !findGoal(g.id)) return;
        trashPush('goal',g,S.goals.indexOf(g));S.goals=S.goals.filter(x=>x.id!==g.id); save(); render(); toast(t('toast.deleted'));
      }); break;
      case 'archive-goal': if(g){
        if(!goalComplete(g)){ toast(t('toast.archiveTip'),'warn'); return; }
        g.archived=true; g.collapsed=true; save(); render(); toast(t('toast.archived'));
      } break;
      case 'restore-goal': if(g){g.archived=false;g.collapsed=false;save();render();toast(t('toast.restored'));} break;
      case 'edit-goal-meta': if(g) openGoalModal(g); break;
      case 'edit-goal-title': if(!g || btn.isContentEditable) break; {
        const titleEl=btn; // h2 本身带 data-act
        titleEl.contentEditable='true'; titleEl.focus();
        const rg=document.createRange(); rg.selectNodeContents(titleEl);
        const sel=getSelection(); sel.removeAllRanges(); sel.addRange(rg);
        break;
      }
      case 'add-project': if(g){ const inp=$('.add-input[data-enter="add-project"]',btn.closest('.goal-card')); const v=nameOrTip(inp,'project',siblingNames(g.projects)); if(v) addProject(g,v); } break;
      case 'add-project-submit': if(g){ const inp=$('.add-input[data-enter="add-project"]',btn.closest('.projects')); const v=nameOrTip(inp,'project',siblingNames(g.projects)); if(v) addProject(g,v); } break;
      case 'del-project': if(pr) askConfirm(t('confirm.delStage',{t:pr.p.title})).then(ok=>{
        if(!ok || !findProject(pr.p.id)) return;
        trashPush('project',pr.p,pr.g.projects.indexOf(pr.p),pr.g.id,pr.g.title);pr.g.projects=pr.g.projects.filter(p=>p.id!==pr.p.id); save(); render();
      }); break;
      case 'set-due': if(pr){const v=prompt(t('st.duePh'),pr.p.due||''); if(v!==null){pr.p.due=/^\d{4}-\d{2}-\d{2}$/.test(v.trim())?v.trim():''; save(); render();}} break;
      case 'add-milestone': if(pr){pr.p.milestones.push(newMilestone()); save(); renderGoals();} break;
      case 'add-milestone-submit': if(pr){ const inp=$('.add-input[data-enter="add-milestone"]',btn.closest('.milestones')); const v=nameOrTip(inp,'task',siblingNames(pr.p.milestones)); if(v){const mm=newMilestone(); mm.title=v; pr.p.milestones.push(mm); save(); renderGoals();} } break;
      case 'del-milestone': if(m) askConfirm(t('confirm.delTask',{t:m.m.title}),{title:t('confirm.title')}).then(ok=>{
        if(!ok || !findMilestone(m.m.id)) return;
        trashPush('milestone',m.m,m.p.milestones.indexOf(m.m),m.p.id,m.g.title);m.p.milestones=m.p.milestones.filter(x=>x.id!==m.m.id); save(); render();
      }); break;
      case 'cycle-status': if(m){setStatus(m.m,m.g,ORDER[(ORDER.indexOf(m.m.status)+1)%3]); save(); renderGoals();} break;
      case 'mode': {const gg=findGoal(btn.closest('.mode-seg').dataset.goal); if(gg){gg._mode=btn.dataset.mode; renderGoals();}} break;
      case 'focus': startFocus(gid); break;
    }
  }
  goalList.addEventListener('click', handleListClick);
  $('#archiveList').addEventListener('click', handleListClick);

  // 起名提示：空名 / 同级重名时抖动输入框并 toast，禁止创建
  function nameOrTip(inp,kind,siblings){
    if(!inp) return '';
    const ph=kind==='project'?'st.addStagePh':'st.addTaskPh';
    const invalidate=(msg)=>{
      inp.classList.remove('is-hint'); void inp.offsetWidth; inp.classList.add('is-hint');
      inp.placeholder=msg; inp.focus(); toast(msg,'warn');
      setTimeout(()=>{ inp.classList.remove('is-hint'); inp.placeholder=t(ph); },2400);
      return '';
    };
    const v=inp.value.trim();
    if(!v) return invalidate(t('st.nameTip'));
    if(Array.isArray(siblings) && siblings.some(x=>x===v)) return invalidate(t('toast.dupName'));
    return v;
  }
  const siblingNames = (list)=> (list||[]).map(x=>x.title);
  function addProject(g,title){
    g.projects.push({id:uid(),title,progress:0,due:'',collapsed:false,milestones:[]});
    g.collapsed=false; save(); render(); toast(t('toast.stageAdded'));
  }

  goalList.addEventListener('keydown', e=>{
    if(e.key!=='Enter') return;
    const inp=e.target.closest('[data-enter]'); if(!inp) return;
    const kind=inp.dataset.enter==='add-project'?'project':'task';
    let sib=[];
    if(kind==='project'){const g=findGoal(inp.dataset.goal); if(g) sib=siblingNames(g.projects);}
    else {const r=findProject(inp.dataset.project); if(r) sib=siblingNames(r.p.milestones);}
    const v=nameOrTip(inp,kind,sib); if(!v) return;
    if(kind==='project'){const g=findGoal(inp.dataset.goal); if(g) addProject(g,v);}
    else {const r=findProject(inp.dataset.project); if(r){const mm=newMilestone(); mm.title=v; r.p.milestones.push(mm); save(); renderGoals();}}
  });

  goalList.addEventListener('input', e=>{
    const el=e.target, act=el.dataset.act;
    if(act==='proj-progress'){
      const r=findProject(el.closest('[data-project]').dataset.project); if(!r) return;
      r.p.progress=+el.value; refreshUpperBars(el); save();
    }
    if(act==='mile-progress'){
      const r=findMilestone(el.closest('[data-milestone]').dataset.milestone); if(!r) return;
      const v=+el.value; r.m.progress=v;
      setStatus(r.m,r.g, v>=100?'done' : v>0?'doing':'todo');
      el.style.setProperty('--pct',v+'%');
      $('.milestone__pct',el.closest('.milestone')).textContent=v+'%';
      refreshUpperBars(el); save();
    }
    if(act==='daily-target'){
      const g=findGoal(el.closest('[data-goal]').dataset.goal);
      if(g&&+el.value>0){g.dailyTarget=+el.value; save(); renderOverview();}
    }
  });
  function refreshUpperBars(el){
    const card=el.closest('.project-card'); if(!card) return;
    const r=findProject(card.dataset.project); if(!r) return;
    const pr=projectProgress(r.p), num=$('.progress-num',card), track=$('.progress-track',card);
    if(num) num.textContent=pr+'%';
    if(track){ $('.progress-fill',track).style.width=pr+'%'; track.setAttribute('aria-valuenow',pr); }
    const gc=el.closest('.goal-card'), g=findGoal(gc?.dataset.goal); if(!g) return;
    const gp=goalProgress(g), pctEl=$('.goal-progress__pct',gc), gt=$('.goal-progress .progress-track',gc);
    if(pctEl) pctEl.innerHTML=gp+'<small>%</small>';
    if(gt){ $('.progress-fill',gt).style.width=gp+'%'; gt.setAttribute('aria-valuenow',gp); }
    const cp=$('.goal-card__collapsed',gc);
    if(cp){ $('.goal-card__collapsed-track i',cp).style.width=gp+'%';
      $('.goal-card__collapsed-pct',cp).textContent=gp+'%';
      cp.querySelector('.goal-card__collapsed-track').setAttribute('aria-valuenow',gp); }
  }
  goalList.addEventListener('change', e=>{ if(['proj-progress','daily-target'].includes(e.target.dataset.act)) renderGoals(); });

  // 天数区键盘可达（Enter/Space 打开编辑）
  goalList.addEventListener('keydown', e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    const days=e.target.closest('.day-stats[data-act="edit-goal-meta"]'); if(!days) return;
    e.preventDefault();
    const g=findGoal(days.closest('[data-goal]')?.dataset.goal); if(g) openGoalModal(g);
  });

  goalList.addEventListener('dblclick', e=>{
    const el=e.target.closest('[data-edit]'); if(!el || el.isContentEditable) return;
    el.contentEditable='true'; el.focus();
    const rg=document.createRange(); rg.selectNodeContents(el);
    const sel=getSelection(); sel.removeAllRanges(); sel.addRange(rg);
  });
  goalList.addEventListener('focusout', e=>{
    const el=e.target.closest('[data-edit]'); if(!el||el.contentEditable!=='true') return;
    el.contentEditable='false';
    const txt=el.textContent.trim(), kind=el.dataset.edit;
    const gid=el.closest('[data-goal]')?.dataset.goal, pid=el.closest('[data-project]')?.dataset.project, mid=el.closest('[data-milestone]')?.dataset.milestone;
    if(kind==='goal'){const g=findGoal(gid); if(g&&txt) g.title=txt;}
    if(kind==='project'){const r=findProject(pid); if(r&&txt) r.p.title=txt;}
    if(kind==='milestone'){const r=findMilestone(mid); if(r&&txt) r.m.title=txt;}
    save(); render();
  });

  /* ---------- 拖拽排序：三级 + deadzone 快速换位 + FLIP 动画预览 ---------- */
  let dragEl=null, dragKind=null, dragContainer=null, dragArmedEl=null;
  const DZ=64; // 触发快速换位的边缘热区高度(px)

  // 嵌套 draggable 时，dragstart 的 target 会是最外层可拖拽祖先（大目标卡片），
  // 而非实际按下拖柄的层级。因此在 pointerdown 记录拖柄元素，dragstart 时以它推断真实层级。
  document.addEventListener('pointerdown', e=>{
    dragArmedEl = e.target.closest?.('[data-drag]') || null;
  }, true);
  goalList.addEventListener('dragstart', e=>{
    const handle = dragArmedEl || (e.target.closest?.('[data-drag]') || null);
    if(!handle){ e.preventDefault(); return; }
    const el=handle.closest('.goal-card, .project-card, .milestone');
    if(!el){ e.preventDefault(); return; }
    dragEl=el;
    dragKind = el.classList.contains('goal-card')?'goal' : el.classList.contains('project-card')?'project':'milestone';
    // 限定在各自父容器内排序，避免跨父级造成数据错位
    dragContainer = dragKind==='goal' ? goalList
                  : dragKind==='project' ? el.closest('.projects')
                  : el.closest('.milestones');
    e.dataTransfer.effectAllowed='move';
    e.dataTransfer.setData('text/plain', el.dataset.goal||el.dataset.project||el.dataset.milestone);
    setTimeout(()=>dragEl?.classList.add('dragging'),0);
  });

  const kindSelector = k => k==='goal'?'.goal-card':k==='project'?'.project-card':'.milestone';

  function clearDZ(){ $$('.dz-top,.dz-bottom',goalList).forEach(x=>x.classList.remove('dz-top','dz-bottom')); }

  // FLIP：记录位置 → DOM 移动 → 反算位移并动画归零
  function flipReorder(container, ref, after){
    if(!dragEl || !container || ref===dragEl) return;
    const sel=kindSelector(dragKind);
    const sibs=$$(sel,container);
    const before=new Map(); sibs.forEach(s=>before.set(s,s.getBoundingClientRect().top));
    container.insertBefore(dragEl, after?ref.nextSibling:ref);
    sibs.forEach(s=>{
      const oldTop=before.get(s), newTop=s.getBoundingClientRect().top;
      const dy=oldTop-newTop;
      if(Math.abs(dy)<1) return;
      s.style.transition='none';
      s.style.transform=`translateY(${dy}px)`;
      requestAnimationFrame(()=>{
        s.style.transition='transform .34s cubic-bezier(.32,.72,0,1)';
        s.style.transform='';
        setTimeout(()=>{ s.style.transition=''; },360);
      });
    });
    dragEl.classList.add('preview-move');
    clearTimeout(flipReorder._t);
    flipReorder._t=setTimeout(()=>dragEl?.classList.remove('preview-move'),380);
  }

  goalList.addEventListener('dragover', e=>{
    if(!dragEl || !dragContainer) return;
    e.preventDefault();
    const sel=kindSelector(dragKind);
    const items=$$(sel,dragContainer).filter(x=>x!==dragEl);
    if(!items.length) return;
    const box=dragContainer.getBoundingClientRect();
    clearDZ();

    // 上下 deadzone：到达边缘即快速换位到首/尾，并自动滚动列表
    if(e.clientY < box.top+DZ){
      dragContainer.classList.add('dz-top');
      if(dragContainer===goalList) goalList.scrollTop-=18;
      if(items[0]!==dragEl.nextElementSibling) flipReorder(dragContainer, items[0], false);
      return;
    }
    if(e.clientY > box.bottom-DZ){
      dragContainer.classList.add('dz-bottom');
      if(dragContainer===goalList) goalList.scrollTop+=18;
      const last=items[items.length-1];
      if(dragEl!==last && dragEl.nextElementSibling!==null) flipReorder(dragContainer, last, true);
      return;
    }

    // 常规：找最近目标，按上下半区决定插入方向
    let nearest=null, min=Infinity;
    items.forEach(it=>{
      const b=it.getBoundingClientRect();
      const d=Math.abs(e.clientY-(b.top+b.height/2));
      if(d<min){min=d;nearest=it;}
    });
    if(!nearest) return;
    const b=nearest.getBoundingClientRect();
    const after=e.clientY>b.top+b.height/2;
    if(after ? nearest.nextSibling===dragEl : nearest.previousSibling===dragEl) return;
    flipReorder(dragContainer, nearest, after);
  });

  // dragend 时按 DOM 顺序写回数据
  goalList.addEventListener('dragend', ()=>{
    clearDZ();
    if(dragEl){
      dragEl.classList.remove('dragging','preview-move');
      if(dragKind==='goal'){
        const order=$$('.goal-card',goalList).map(c=>c.dataset.goal);
        S.goals.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
      } else if(dragKind==='project'){
        $$('.goal-card',goalList).forEach(gc=>{
          const g=findGoal(gc.dataset.goal); if(!g) return;
          const order=$$('.project-card',gc).map(c=>c.dataset.project);
          g.projects.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
        });
      } else {
        $$('.project-card',goalList).forEach(pc=>{
          const r=findProject(pc.dataset.project); if(!r) return;
          const order=$$('.milestone',pc).map(c=>c.dataset.milestone);
          r.p.milestones.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
        });
      }
      save();
    }
    dragEl=null; dragKind=null; dragContainer=null; dragArmedEl=null;
    render();
  });

  /* ---------- 归档区 / 回收站折叠 ---------- */
  $('#archiveToggle').addEventListener('click', ()=>{
    const box=$('#archiveList'), btn=$('#archiveToggle');
    box.hidden=!box.hidden; btn.setAttribute('aria-expanded',String(!box.hidden));
  });
  $('#trashToggle').addEventListener('click', ()=>{
    const box=$('#trashList'), btn=$('#trashToggle');
    box.hidden=!box.hidden; btn.setAttribute('aria-expanded',String(!box.hidden));
  });
  $('#trashList').addEventListener('click', e=>{
    const btn=e.target.closest('[data-act]'); if(!btn) return;
    const id=btn.closest('[data-trash]')?.dataset.trash;
    const item=S.trash.find(x=>x.id===id); if(!item) return;
    if(btn.dataset.act==='restore-trash'){
      if(!restoreTrash(item)){ toast(t('trash.parentMissing'),'warn'); return; }
      S.trash=S.trash.filter(x=>x.id!==id); save(); render(); toast(t('trash.restored'));
    } else if(btn.dataset.act==='purge-trash'){
      S.trash=S.trash.filter(x=>x.id!==id); save(); render(); toast(t('trash.purged'),'danger');
    }
  });

  /* ---------- 左侧索引点击定位 ---------- */
  $('#goalIndexList').addEventListener('click', e=>{
    const b=e.target.closest('[data-index-goal]'); if(!b) return;
    const card=$(`.goal-card[data-goal="${b.dataset.indexGoal}"]`);
    if(!card) return;
    card.scrollIntoView({behavior:'smooth',block:'center'});
    card.classList.add('is-targeted');
    setTimeout(()=>card.classList.remove('is-targeted'),1500);
    $$('#goalIndexList button').forEach(x=>x.classList.toggle('is-current',x===b));
    b.blur(); // 点击后释放焦点，让索引浮层收起，避免遮挡卡片左侧操作区
  });

  /* ============================================================
     目标创建/编辑弹窗
     ============================================================ */
  let editingGoalId=null;
  function openGoalModal(g){
    LANG=S.settings.lang;
    editingGoalId=g?.id||null;
    $('#goalModalTitle').textContent=g?t('modalGoal.editTitle'):t('modalGoal.createTitle');
    $('#btnGoalSave').querySelector('span').textContent=g?t('modalGoal.update'):t('modalGoal.create');
    $('#goalTitleInput').value=g?.title||'';
    $('#goalDaysInput').value=g?.durationDays||90;
    syncDayChips();
    $('#goalModal').hidden=false;
    setTimeout(()=>$('#goalTitleInput').focus(),60);
  }
  function syncDayChips(){ const v=+$('#goalDaysInput').value; $$('#dayChips button').forEach(b=>b.classList.toggle('is-active',+b.dataset.days===v)); }
  $('#dayChips').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; $('#goalDaysInput').value=b.dataset.days; syncDayChips();});
  $('#goalDaysInput').addEventListener('input',syncDayChips);
  $('#btnGoalSave').addEventListener('click',()=>{
    const title=$('#goalTitleInput').value.trim();
    const days=clamp(+$('#goalDaysInput').value||90,1,3650);
    if(!title){ toast(t('toast.needName'),'warn'); $('#goalTitleInput').focus(); return; }
    if(S.goals.some(g=>g.title===title && g.id!==editingGoalId)){
      toast(t('toast.dupName'),'warn'); $('#goalTitleInput').focus(); return;
    }
    if(editingGoalId){ const g=findGoal(editingGoalId); if(g){g.title=title;g.durationDays=days;} }
    else { S.goals.unshift({id:uid(),title,dailyTarget:120,accent:ACCENTS[S.goals.length%ACCENTS.length],
      collapsed:false,archived:false,durationDays:days,createdAt:new Date().toISOString(),doneDates:[],projects:[]}); }
    $('#goalModal').hidden=true; save(); render(); toast(editingGoalId?t('toast.updated'):t('toast.created'));
  });
  $('#btnAddGoal').addEventListener('click',()=>openGoalModal(null));
  $('#btnEmptyAdd').addEventListener('click',()=>openGoalModal(null));

  /* ============================================================
     计时与复盘
     ============================================================ */
  let F={active:false,goalId:null,mode:'countdown',total:0,remain:0,elapsed:0,paused:false,tick:null};
  let audioCtx=null;
  function beep(){
    if(!S.settings.sound) return;
    try{
      audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
      [0,.18,.36].forEach((tt,i)=>{
        const o=audioCtx.createOscillator(), g=audioCtx.createGain();
        o.type='sine'; o.frequency.value=[660,880,1180][i];
        g.gain.setValueAtTime(.0001,audioCtx.currentTime+tt);
        g.gain.exponentialRampToValueAtTime(.16,audioCtx.currentTime+tt+.02);
        g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+tt+.16);
        o.connect(g).connect(audioCtx.destination); o.start(audioCtx.currentTime+tt); o.stop(audioCtx.currentTime+tt+.18);
      });
    }catch(e){}
  }
  function startFocus(id){
    if(F.active){toast(t('toast.alreadyFocus'),'warn');return;}
    const g=findGoal(id); if(!g) return;
    Object.assign(F,{active:true,goalId:id,mode:g._mode||'countdown',paused:false,
      total:(S.settings.defaultMin||25)*60,remain:(S.settings.defaultMin||25)*60,elapsed:0});
    $('#focusHud').hidden=false;
    $('.hud-arc')?.classList.add('is-active');
    $('#focusLabel').textContent=F.mode==='countdown'?t('goal.countdown'):t('goal.stopwatch');
    $('#focusGoal').textContent=g.title; $('#btnFocusPause').textContent='⏸';
    F.tick=setInterval(()=>{
      if(F.paused) return;
      if(F.mode==='countdown'){ F.remain--; if(F.remain<=0){finishFocus(F.total/60,t('toast.focusDone'));return;} }
      else F.elapsed++;
      updateFocusHUD();
    },1000);
    updateFocusHUD(); toast(t('toast.focusStart',{g:esc(g.title)}));
  }
  function updateFocusHUD(){
    if(!F.active) return;
    const sec=F.mode==='countdown'?F.remain:F.elapsed, g=findGoal(F.goalId);
    $('#focusTime').textContent=fmtClock(sec);
    const denom=F.mode==='countdown'?F.total:Math.max((g?.dailyTarget||120)*60,1);
    $('#focusRing').style.strokeDashoffset=String(276.46*(1-clamp(sec/denom,0,1)));
    $('#focusRing').style.stroke=F.mode==='countdown'?'var(--cyan)':'var(--magenta)';
  }
  function stopFocusInterval(){clearInterval(F.tick);F.tick=null;F.active=false;$('#focusHud').hidden=true;$('.hud-arc')?.classList.remove('is-active');}
  function finishFocus(min,msg){
    const g=findGoal(F.goalId);
    if(g&&min>0){ S.sessions.push({id:uid(),goalId:g.id,date:dayKey(),min:Math.round(min*100)/100,mode:F.mode,ts:Date.now()}); save(); }
    stopFocusInterval(); render(); beep();
    toast(t('toast.focusEnded',{m:msg,t:fmtMin(min)}));
    if(S.settings.notify) notify('HOLO//GOALS',`${g?.title||'目标'} · ${fmtMin(min)}`);
    if(S.settings.review && g) openReview(g,min);
  }
  $('#btnFocusPause').addEventListener('click',()=>{
    if(!F.active) return; F.paused=!F.paused;
    $('#btnFocusPause').textContent=F.paused?'▶':'⏸';
    $('#focusLabel').textContent=F.paused?t('status.doing'):(F.mode==='countdown'?t('goal.countdown'):t('goal.stopwatch'));
  });
  $('#btnFocusStop').addEventListener('click',()=>{
    if(!F.active) return;
    const min=F.mode==='countdown'?(F.total-F.remain)/60:F.elapsed/60;
    if(min<.05){stopFocusInterval();toast(t('toast.tooShort'),'warn');return;}
    finishFocus(min,t('toast.focusStop'));
  });

  function openReview(g,min){
    const body=$('#reviewBody');
    const projects=g.projects.map(p=>{
      const pr=projectProgress(p);
      return `
      <div class="review-project" data-project="${p.id}">
        <div class="review-project__head"><span class="review-project__title">${esc(p.title)}</span><span class="review-project__val">${pr}%</span></div>
        <input type="range" class="range range--wide" min="0" max="100" value="${pr}" data-act="review-proj" style="--pct:${pr}%" aria-label="${t('goal.overallShort')}">
        <div class="review-mile-list">
          ${p.milestones.map(m=>`
          <div class="review-mile" data-milestone="${m.id}">
            <span class="review-mile__title">${esc(m.title)}</span>
            <div class="state-seg" role="group" aria-label="${t('status.cycle')}">
              ${['todo','doing','done'].map(s=>`<button type="button" data-act="review-state" data-state="${s}" class="${m.status===s?'is-active':''}" aria-pressed="${m.status===s}">${t('status.'+s)}</button>`).join('')}
            </div>
          </div>`).join('') || `<div class="review-mile review-mile--empty">${t('review.projEmpty')}</div>`}
        </div>
      </div>`;
    }).join('');
    body.innerHTML=`<p class="review-lead">${t('review.lead',{min:'<b>'+fmtMin(min)+'</b>',goal:esc(g.title)})}</p>
      ${projects||`<p class="review-empty">${t('review.empty')}</p>`}`;
    $('#reviewModal').hidden=false;
  }
  $('#reviewBody').addEventListener('click',e=>{
    const b=e.target.closest('[data-act="review-state"]'); if(!b) return;
    const mileEl=b.closest('.review-mile'), m=findMilestone(mileEl?.dataset.milestone);
    if(!m) return;
    setStatus(m.m,m.g,b.dataset.state); save();
    $$('[data-act="review-state"]',mileEl).forEach(x=>{const on=x===b;x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',on);});
    const projEl=b.closest('.review-project'), r=findProject(projEl.dataset.project);
    const pr=r?projectProgress(r.p):0;
    $('.review-project__val',projEl).textContent=pr+'%';
    const range=$('[data-act="review-proj"]',projEl); if(range){range.value=pr;range.style.setProperty('--pct',pr+'%');}
    render();
  });
  $('#reviewBody').addEventListener('input',e=>{
    if(e.target.dataset.act!=='review-proj') return;
    const v=+e.target.value, projEl=e.target.closest('.review-project');
    const r=findProject(projEl.dataset.project); if(!r) return;
    r.p.progress=v; e.target.style.setProperty('--pct',v+'%');
    $('.review-project__val',projEl).textContent=v+'%'; save(); render();
  });

  /* ============================================================
     主题 / 配色 / POV
     ============================================================ */
  function applyAppearance(){
    document.body.dataset.palette=S.settings.palette;
    document.body.style.setProperty('--pov',(clamp(S.settings.pov,0,100)/100).toFixed(2));
    $('#povValue').textContent=S.settings.pov+'%';
    $$('#paletteGrid button').forEach(b=>b.classList.toggle('is-active',b.dataset.palette===S.settings.palette));
  }
  function renderPalettes(){
    $('#paletteGrid').innerHTML=PALETTES.map(p=>`
      <button type="button" data-palette="${p.id}" class="palette-btn ${p.id===S.settings.palette?'is-active':''}" aria-label="${t(p.key)}" aria-pressed="${p.id===S.settings.palette}">
        <span class="palette-btn__swatch" style="--sw-bg:${p.bg};--sw-ac:${p.accent}"></span>
        <span class="palette-btn__name">${t(p.key)}</span>
      </button>`).join('');
  }
  $('#paletteGrid').addEventListener('click',e=>{
    const b=e.target.closest('[data-palette]'); if(!b) return;
    S.settings.palette=b.dataset.palette; applyAppearance(); save();
    if(!$('#statsModal').hidden) drawStats();
    toast(t('toast.palette',{n:'<b>'+t(PALETTES.find(p=>p.id===b.dataset.palette).key)+'</b>'}));
  });
  $('#setPov').addEventListener('input',e=>{
    S.settings.pov=+e.target.value;
    document.body.style.setProperty('--pov',(S.settings.pov/100).toFixed(2));
    $('#povValue').textContent=S.settings.pov+'%';
  });
  $('#setPov').addEventListener('change',()=>save());

  /* ============================================================
     Toast / 提醒 / 通知
     ============================================================ */
  function toast(html,type=''){
    const el=document.createElement('div');
    el.className='toast'+(type?' toast--'+type:''); el.innerHTML=html;
    $('#toastContainer').appendChild(el);
    setTimeout(()=>{el.classList.add('is-out'); setTimeout(()=>el.remove(),320);},3200);
  }
  function notify(title,body){
    if(!('Notification' in window)||Notification.permission!=='granted') return;
    new Notification(title,{body});
  }

  // 风格化二次确认（Promise）——替换原生 confirm
  let confirmResolve=null;
  function askConfirm(message, opts={}){
    const modal=$('#confirmModal');
    $('#confirmEyebrow').textContent=t('confirm.eyebrow');
    $('#confirmTitle').textContent=opts.title||t('confirm.title');
    $('#confirmMessage').textContent=message;
    $('#confirmOk').textContent=opts.okText||t('confirm.ok');
    $('#confirmOk').classList.toggle('danger-btn',opts.danger!==false);
    modal.hidden=false;
    setTimeout(()=>$('#confirmCancel').focus(),40);
    return new Promise(resolve=>{ confirmResolve=resolve; });
  }
  function closeConfirm(result){
    $('#confirmModal').hidden=true;
    const r=confirmResolve; confirmResolve=null; if(r) r(result);
  }
  $('#confirmCancel').addEventListener('click',()=>closeConfirm(false));
  $('#confirmOk').addEventListener('click',()=>closeConfirm(true));
  $('#confirmModal').addEventListener('click',e=>{ if(e.target===$('#confirmModal')) closeConfirm(false); });
  let lastRemind={};
  function checkReminders(){
    const now=new Date(), k=dayKey(), hm=`${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if(S.settings.remindDaily && hm>=S.settings.reminder && lastRemind.daily!==k){
      const pending=activeGoals().filter(g=>todayMinutes(g.id)<g.dailyTarget);
      if(pending.length){ lastRemind.daily=k;
        toast(t('remind.daily',{n:'<b>'+pending.length+'</b>'}),'warn');
        if(S.settings.notify) notify('HOLO//GOALS',t('remind.daily',{n:pending.length})); }
    }
    if(lastRemind.due!==k){
      const overdue=[]; activeGoals().forEach(g=>g.projects.forEach(p=>{
        if(p.due&&p.due<=k&&projectProgress(p)<100) overdue.push(p.title); }));
      if(overdue.length){ lastRemind.due=k;
        toast(t('remind.due',{n:'<b>'+overdue.length+'</b>'}),'danger');
        if(S.settings.notify) notify('HOLO//GOALS',t('remind.due',{n:overdue.length})); }
    }
  }

  /* ============================================================
     统计图表
     ============================================================ */
  let statTab='week';
  function drawStats(){
    const cv=$('#statsChart'), ctx=cv.getContext('2d'), W=cv.width,H=cv.height;
    const accent=getComputedStyle(document.body).getPropertyValue('--cyan').trim()||'#1fdbcf';
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(120,150,160,.07)';ctx.lineWidth=1;
    for(let x=0;x<=W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<=H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    let labels=[],values=[],colors=[];
    const wd=t('stats.weekdays').split(',');
    if(statTab==='week'||statTab==='month'){
      const n=statTab==='week'?7:30;
      for(let i=n-1;i>=0;i--){
        const d=new Date();d.setDate(d.getDate()-i);const k=dayKey(d);
        labels.push(statTab==='week'?wd[d.getDay()]:`${d.getMonth()+1}/${d.getDate()}`);
        values.push(S.sessions.filter(s=>s.date===k).reduce((a,s)=>a+s.min,0)); colors.push(accent);
      }
    } else {
      activeGoals().forEach(g=>{
        labels.push(g.title.length>8?g.title.slice(0,8)+'…':g.title);
        values.push(S.sessions.filter(s=>s.goalId===g.id).reduce((a,s)=>a+s.min,0));
        colors.push(ACCENT_HEX[g.accent]);
      });
    }
    const max=Math.max(...values,60), padL=52,padB=38,padT=20,padR=20;
    const cw=(W-padL-padR)/Math.max(values.length,1), bh=H-padT-padB, barW=Math.min(cw*.6,42);
    ctx.font='11px monospace';ctx.textAlign='right';ctx.textBaseline='middle';
    for(let i=0;i<=4;i++){const v=max*i/4,y=H-padB-bh*i/4;ctx.fillStyle='rgba(150,170,180,.75)';ctx.fillText(Math.round(v)+'m',padL-10,y);}
    values.forEach((v,i)=>{
      const x=padL+cw*i+(cw-barW)/2,h=bh*v/max,y=H-padB-h;
      const grad=ctx.createLinearGradient(0,y,0,H-padB);
      grad.addColorStop(0,colors[i%colors.length]);grad.addColorStop(1,'rgba(120,150,160,.05)');
      ctx.fillStyle=grad;ctx.shadowColor=colors[i%colors.length];ctx.shadowBlur=12;
      ctx.fillRect(x,y,barW,h);ctx.shadowBlur=0;
      ctx.fillStyle=accent;ctx.fillRect(x,y,barW,2);
      ctx.fillStyle='rgba(230,240,242,.9)';ctx.font='10px monospace';ctx.textAlign='center';
      ctx.fillText(Math.round(v)+'',x+barW/2,y-8);
      ctx.fillStyle='rgba(150,170,180,.8)';ctx.textBaseline='top';
      ctx.fillText(labels[i],x+barW/2,H-padB+10);ctx.textBaseline='middle';
    });
    const total=values.reduce((a,b)=>a+b,0),avg=values.length?total/values.length:0;
    const records=statTab==='goals'?activeGoals().length:S.sessions.filter(s=>{const d=new Date();d.setDate(d.getDate()-(statTab==='week'?6:29));return s.date>=dayKey(d);}).length;
    $('#statsSummary').innerHTML=`
      <div class="summary-chip"><span>${t('stats.total')}</span><b>${fmtMin(total)}</b></div>
      <div class="summary-chip"><span>${t('stats.avg')}</span><b>${fmtMin(avg)}</b></div>
      <div class="summary-chip"><span>${t('stats.records')}</span><b>${records}</b></div>`;
  }

  /* ============================================================
     顶栏 / 设置
     ============================================================ */
  $('#btnStats').addEventListener('click',()=>{$('#statsModal').hidden=false;drawStats();});
  $('#btnExport').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`holo-goals-${dayKey()}.json`; a.click(); URL.revokeObjectURL(a.href);
    toast(t('toast.exported'));
  });
  $('#btnImport').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async ()=>{
      try{
        const data=JSON.parse(reader.result);
        if(!data||!Array.isArray(data.goals)) throw new Error('format');
        const ok=await askConfirm(t('confirm.import',{n:data.goals.length}),{danger:false});
        if(!ok) return;
        S=normalize(data); LANG=S.settings.lang; applyAppearance(); applyI18n();
        $('#setLang').value=LANG; save(true); render(); toast(t('toast.imported'));
      }catch(err){toast(t('toast.importFail',{e:err.message}),'danger');}
      e.target.value='';
    };
    reader.readAsText(file);
  });

  function openSettings(){
    $('#setLang').value=S.settings.lang;
    $('#setReminderTime').value=S.settings.reminder;
    $('#setSound').checked=S.settings.sound;
    $('#setNotify').checked=S.settings.notify;
    $('#setReview').checked=S.settings.review;
    $('#setDefaultMinutes').value=S.settings.defaultMin;
    $('#setPov').value=S.settings.pov;
    renderPalettes(); applyAppearance();
    $('#settingsModal').hidden=false;
  }
  $('#btnSettings').addEventListener('click',openSettings);
  $('#setLang').addEventListener('change',e=>{
    LANG=e.target.value; S.settings.lang=LANG;
    applyI18n(); renderPalettes(); render(); save(); toast(t('toast.langChanged'));
    if(!$('#statsModal').hidden) drawStats();
  });
  $('#setReminderTime').addEventListener('change',e=>{S.settings.reminder=e.target.value;save();});
  $('#setSound').addEventListener('change',e=>{S.settings.sound=e.target.checked;save();});
  $('#setReview').addEventListener('change',e=>{S.settings.review=e.target.checked;save();});
  $('#setNotify').addEventListener('change',async e=>{
    if(e.target.checked&&'Notification' in window){
      const p=await Notification.requestPermission();
      if(p!=='granted'){e.target.checked=false;toast(t('toast.noNotify'),'warn');}
    }
    S.settings.notify=e.target.checked;save();
  });
  $('#setDefaultMinutes').addEventListener('change',e=>{S.settings.defaultMin=clamp(+e.target.value||25,1,180);save();});
  $('#btnClearAll').addEventListener('click',async ()=>{
    if(!await askConfirm(t('confirm.clear1'))) return;
    if(!await askConfirm(t('confirm.clear2'))) return;
    S=defaultState(); LANG=S.settings.lang; applyAppearance(); applyI18n();
    $('#setLang').value=LANG; save(true); render(); $('#settingsModal').hidden=true; toast(t('toast.cleared'),'danger');
  });
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>{$('#'+b.dataset.close).hidden=true;}));
  $$('.modal-overlay').forEach(o=>{
    if(o.id==='confirmModal') return; // 由 closeConfirm 专门处理，保证 Promise 落定
    o.addEventListener('click',e=>{if(e.target===o)o.hidden=true;});
  });
  $$('.stats-tab').forEach(tb=>tb.addEventListener('click',()=>{
    $$('.stats-tab').forEach(x=>{x.classList.remove('is-active');x.setAttribute('aria-selected','false');});
    tb.classList.add('is-active');tb.setAttribute('aria-selected','true');statTab=tb.dataset.tab;drawStats();
  }));
  function setAllCollapsed(collapsed){
    S.goals.forEach(g=>{ g.collapsed=collapsed; g.projects.forEach(p=>p.collapsed=collapsed); });
    $$('.goal-card, .project-card',goalList).forEach(card=>{
      card.classList.toggle('is-collapsed', collapsed);
      const fb=$('.fold-btn',card);
      if(fb){ fb.setAttribute('aria-expanded',String(!collapsed)); fb.setAttribute('aria-label',collapsed?'▸':'▾'); }
      const cp=$('.goal-card__collapsed',card);
      if(cp) cp.setAttribute('aria-hidden',String(!collapsed));
    });
    save();
  }
  $('#btnExpandAll').addEventListener('click',()=>setAllCollapsed(false));
  $('#btnCollapseAll').addEventListener('click',()=>setAllCollapsed(true));
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape') return;
    if(document.activeElement?.isContentEditable){ document.activeElement.blur(); return; }
    if(!$('#confirmModal').hidden){ closeConfirm(false); return; }
    $$('.modal-overlay').forEach(o=>o.hidden=true);
  });

  /* ============================================================
     时钟 / 循环 / 启动
     ============================================================ */
  function tickClock(){
    const loc = LANG==='zh'?'zh-CN':(LANG==='ja'?'ja-JP':'en-GB');
    $('#statClock').textContent=new Date().toLocaleTimeString(loc,{hour12:false});
  }
  setInterval(tickClock,1000);
  setInterval(checkReminders,30000); setTimeout(checkReminders,3000);
  let curDay=dayKey();
  setInterval(()=>{if(dayKey()!==curDay){curDay=dayKey();render();}},60000);

  LANG=S.settings.lang;
  applyI18n(); renderPalettes(); applyAppearance(); render(); tickClock();
  console.log('%cHOLO//GOALS v4 已启动 · '+LANG,'color:#1fdbcf;font-size:14px');
})();
