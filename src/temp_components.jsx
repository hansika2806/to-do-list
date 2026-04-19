function BucketListView() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  
  const items = state.bucketList.filter(item => {
    if (filter === 'incomplete') return !item.completed;
    if (filter === 'high' || filter === 'medium' || filter === 'low') return item.priority === filter;
    if (filter !== 'all') return item.category.toLowerCase() === filter.toLowerCase();
    return true;
  });

  return (
    <section className="view-grid">
      <div className="panel span-2">
        <h2>Bucket List & Projects</h2>
        <div className="row" style={{marginBottom: '1rem', background: 'var(--surface-2)'}}>
           <input placeholder="New Project / Goal" value={title} onChange={(e) => setTitle(e.target.value)} style={{flex: 1}}/>
           <input placeholder="Category (e.g. Tech, Academic)" value={category} onChange={(e) => setCategory(e.target.value)} style={{width: '150px'}}/>
           <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
           </select>
           <button className="primary-button" onClick={() => {
              if (!title) return;
              dispatch({ type: 'ADD_BUCKET_ITEM', item: { id: uid('bucket'), title, category, priority, notes, completed: false, created: new Date().toISOString() } });
              setTitle(''); setNotes('');
           }}>Add</button>
        </div>
        <textarea placeholder="Optional notes, sub-tasks, prerequisites..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{width: '100%', marginBottom: '1rem', background: 'var(--surface)'}} />
        
        <div className="filters" style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
           <button className={`soft-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
           <button className={`soft-button ${filter === 'incomplete' ? 'active' : ''}`} onClick={() => setFilter('incomplete')}>Incomplete</button>
           <button className={`soft-button ${filter === 'high' ? 'active' : ''}`} onClick={() => setFilter('high')}>🔴 High</button>
           {Array.from(new Set(state.bucketList.map(i => i.category))).filter(Boolean).map(c => 
              <button key={c} className={`soft-button ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
           )}
        </div>

        <div className="list">
          {items.length === 0 ? <p className="muted">No items found.</p> : items.map(item => (
            <div key={item.id} className="row" style={{ alignItems: 'flex-start', opacity: item.completed ? 0.6 : 1, padding: '1rem', border: '1px solid var(--line)', borderRadius: '8px' }}>
               <button className="icon-button" onClick={() => dispatch({ type: 'TOGGLE_BUCKET_ITEM', id: item.id })}>
                 {item.completed ? <Check size={18} /> : <div style={{width: 18, height: 18, border: '1px solid var(--line)', borderRadius: 3}}/>}
               </button>
               <div style={{ flex: 1, marginLeft: '0.5rem' }}>
                  <strong>{item.title}</strong>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    <span className="badge">{item.priority === 'high' ? '🔴 High' : item.priority === 'low' ? '⚪ Low' : '🟡 Med'}</span>
                    {item.category && <span className="badge">{item.category}</span>}
                    <span className="badge" style={{opacity: 0.7}}>Added {item.created.split('T')[0]}</span>
                  </div>
                  {item.notes && <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{item.notes}</p>}
               </div>
               <button className="soft-button danger" onClick={() => dispatch({ type: 'DELETE_BUCKET_ITEM', id: item.id })}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JournalView() {
  const { state, dispatch, todayTasks } = useApp();
  const [content, setContent] = useState('');
  const [linkedTask, setLinkedTask] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
     const handler = () => document.getElementById('journal-input')?.focus();
     window.addEventListener('open-journal', handler);
     return () => window.removeEventListener('open-journal', handler);
  }, []);

  const entries = state.journalEntries.filter(e => {
     if (filter === 'linked') return !!e.linkedTaskId;
     if (filter === 'standalone') return !e.linkedTaskId;
     return true;
  });

  return (
    <section className="view-grid">
      <div className="panel span-2">
        <h2>Mental Peace Journal</h2>
        <p className="muted">Dump your overwhelming thoughts here to clear your workspace.</p>
        <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          <textarea id="journal-input" placeholder="What's making your day difficult?" value={content} onChange={(e) => setContent(e.target.value)} style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem', background: 'var(--surface)' }} />
          <div className="row">
            <select value={linkedTask} onChange={(e) => setLinkedTask(e.target.value)} style={{ flex: 1 }}>
               <option value="">No task linked (Standalone entry)</option>
               {todayTasks.map(t => <option key={t.task_id} value={t.task_id}>📌 {t.title}</option>)}
            </select>
            <button className="primary-button" onClick={() => {
               if (!content.trim()) return;
               const taskName = linkedTask ? todayTasks.find(t => t.task_id === linkedTask)?.title : null;
               dispatch({ type: 'ADD_JOURNAL_ENTRY', entry: { id: uid('journal'), date: new Date().toISOString(), content, linkedTaskId: linkedTask, linkedTaskName: taskName } });
               setContent(''); setLinkedTask('');
            }}>Save Entry</button>
          </div>
        </div>

        <div className="filters" style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem'}}>
           <button className={`soft-button ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Entries</button>
           <button className={`soft-button ${filter === 'linked' ? 'active' : ''}`} onClick={() => setFilter('linked')}>Task-Linked</button>
           <button className={`soft-button ${filter === 'standalone' ? 'active' : ''}`} onClick={() => setFilter('standalone')}>Standalone</button>
        </div>

        <div className="list">
          {entries.length === 0 ? <p className="muted">No entries yet.</p> : entries.map(entry => (
             <div key={entry.id} className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="row" style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                   <span>{format(new Date(entry.date), 'MMM d, p')}</span>
                   {entry.linkedTaskName && <span>📌 {entry.linkedTaskName}</span>}
                   <button className="icon-button" style={{ marginLeft: 'auto' }} onClick={() => dispatch({ type: 'DELETE_JOURNAL_ENTRY', id: entry.id })}><Trash2 size={14} /></button>
                </div>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
}
