function RecentActionsFeed() {
  const { state, dispatch } = useApp();
  const today = todayKey();
  
  return (
    <div className="panel span-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <h2>Recent Actions</h2>
      <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>View today's history and undo mistakes.</p>
      <div className="list">
         {(!state.recentActions || state.recentActions.length === 0) ? <p className="muted">No actions recorded today.</p> : null}
         {state.recentActions?.map(action => {
            const isToday = format(new Date(action.timestamp), 'yyyy-MM-dd') === today;
            return (
              <div key={action.id} className="row" style={{ padding: '0.5rem', borderBottom: '1px solid var(--line)', background: action.canUndo ? 'var(--surface)' : 'var(--surface-2)', opacity: action.canUndo ? 1 : 0.6 }}>
                 <div style={{ flex: 1 }}>
                    <small style={{ color: 'var(--muted)', display: 'block' }}>{format(new Date(action.timestamp), 'h:mm a')} • {isToday ? 'Today' : 'Past'}</small>
                    <span style={{ fontSize: '0.9rem' }}>{action.description}</span>
                 </div>
                 {action.canUndo && isToday && (
                    <button className="soft-button danger" onClick={() => {
                        dispatch({ type: 'MARK_ACTION_UNDONE', id: action.id });
                        if (action.type === 'complete_task') dispatch({ type: 'UNDO_TASK', taskId: action.undoData.taskId, date: action.undoData.date });
                        if (action.type === 'delete_task') {
                            window.dispatchEvent(new CustomEvent('notify', { detail: 'Restore completely deleted tasks is not yet fully automated.' }));
                        }
                    }}>Undo</button>
                 )}
                 {!action.canUndo && <Check size={14} style={{ color: 'var(--muted)' }} />}
              </div>
            );
         })}
      </div>
    </div>
  );
}
