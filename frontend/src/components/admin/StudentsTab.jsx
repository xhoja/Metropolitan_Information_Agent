import { useState } from 'react'

export default function StudentsTab({ users, onRemove }) {
  const [search, setSearch] = useState('')
  const students = users.filter(u => u.role === 'student')
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Registry</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Students</h1>
          <p className="text-slate-500 text-sm mt-1">{students.length} enrolled student{students.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input-base w-full md:w-80"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            {search ? 'No students match your search.' : 'No students yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Name', 'Email', 'Joined', ''].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`hover:bg-slate-950/40 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                  <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{s.email}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {onRemove && (
                      <button
                        onClick={() => onRemove(s)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-slate-700 text-base leading-none"
                        title="Remove student"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
