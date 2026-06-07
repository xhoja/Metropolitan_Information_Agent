import { useState, useEffect } from 'react'
import api from '../../api/axios'

function toAlbanian(v) {
  if (v >= 95) return 10;
  if (v >= 85) return 9;
  if (v >= 75) return 8;
  if (v >= 65) return 7;
  if (v >= 55) return 6;
  if (v >= 45) return 5;
  return 4;
}
function gradeLabel(value) {
  const alb = toAlbanian(value)
  if (alb >= 10) return { label: 'A',  alb, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' }
  if (alb >= 9)  return { label: 'A−', alb, color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' }
  if (alb >= 8)  return { label: 'B+', alb, color: 'text-blue-300 bg-blue-300/15 border-blue-400/30' }
  if (alb >= 7)  return { label: 'B',  alb, color: 'text-blue-300 bg-blue-300/15 border-blue-400/30' }
  if (alb >= 6)  return { label: 'C',  alb, color: 'text-amber-300 bg-amber-500/15 border-amber-500/30' }
  if (alb >= 5)  return { label: 'D',  alb, color: 'text-orange-300 bg-orange-500/15 border-orange-500/30' }
  return { label: 'F', alb, color: 'text-rose-300 bg-rose-500/15 border-rose-500/30' }
}

export default function GradesTab() {
  const [grades, setGrades]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [semFilter, setSemFilter] = useState('')

  useEffect(() => {
    api.get('/admin/grades')
      .then(r => setGrades(r.data))
      .catch(() => setError('Endpoint not available yet.'))
      .finally(() => setLoading(false))
  }, [])

  const semesters = [...new Set(grades.map(g => g.semester).filter(Boolean))]

  const filtered = grades.filter(g => {
    const matchSearch =
      g.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      g.course_title?.toLowerCase().includes(search.toLowerCase())
    const matchSem = semFilter ? g.semester === semFilter : true
    return matchSearch && matchSem
  })

  const avg = grades.length
    ? (grades.reduce((s, g) => s + (g.value || 0), 0) / grades.length).toFixed(1)
    : '—'

  return (
    <div>
      <div className="mb-8">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Assessment</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Grades</h1>
      </div>

      {!loading && !error && grades.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-lg">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-semibold text-white">{grades.length}</p>
            <p className="text-slate-500 text-xs mt-0.5">Total records</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-semibold text-blue-300">{avg}</p>
            <p className="text-slate-500 text-xs mt-0.5">Class average</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-2xl font-semibold text-emerald-400">{grades.filter(g => g.value >= 45).length}</p>
            <p className="text-slate-500 text-xs mt-0.5">Passing (≥45 pts)</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student or course…"
          className="input-base w-full md:w-72"
        />
        {semesters.length > 0 && (
          <select
            value={semFilter}
            onChange={e => setSemFilter(e.target.value)}
            className="input-base w-auto"
          >
            <option value="">All semesters</option>
            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading…</div>
        ) : error ? (
          <PendingEndpoint endpoint="GET /admin/grades" />
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">No grades found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Student', 'Course', 'Semester', 'Points', 'Albanian', 'Grade'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => {
                const { label, alb, color } = gradeLabel(g.value)
                return (
                  <tr key={g.id || i} className={`hover:bg-slate-950/40 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                    <td className="px-6 py-4 font-medium text-white">{g.student_name || g.student_id}</td>
                    <td className="px-6 py-4 text-slate-400">{g.course_title || g.course_id}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{g.semester}</td>
                    <td className="px-6 py-4 text-white font-mono text-sm">{g.value}/100</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${alb >= 9 ? 'text-emerald-400' : alb >= 7 ? 'text-blue-400' : alb >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>{alb}/10</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${color}`}>{label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PendingEndpoint({ endpoint }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-slate-400 text-sm font-medium">Awaiting backend endpoint</p>
      <code className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded font-mono">{endpoint}</code>
    </div>
  )
}
