import { useState, useEffect } from 'react'
import api from '../../api/axios'

const STATUS_STYLES = {
  present: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  absent:  'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  late:    'bg-amber-500/15 text-amber-300 border border-amber-500/30',
}

export default function AttendanceTab() {
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    api.get('/admin/attendance')
      .then(r => setRecords(r.data))
      .catch(() => setError('Endpoint not available yet.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = records.filter(r => {
    const matchSearch =
      r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.course_title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter ? r.status === statusFilter : true
    return matchSearch && matchStatus
  })

  const counts = {
    present: records.filter(r => r.status === 'present').length,
    absent:  records.filter(r => r.status === 'absent').length,
    late:    records.filter(r => r.status === 'late').length,
  }

  // Group filtered records by course → date
  const grouped = filtered.reduce((acc, r) => {
    const course = r.course_title || r.course_id || 'Unknown Course'
    const date   = r.date || 'Unknown Date'
    const key    = `${course}|||${date}`
    if (!acc[key]) acc[key] = { course, date, rows: [] }
    acc[key].rows.push(r)
    return acc
  }, {})

  const sessions = Object.values(grouped).sort((a, b) => {
    if (a.course < b.course) return -1
    if (a.course > b.course) return 1
    return a.date < b.date ? -1 : 1
  })

  return (
    <div>
      <div className="mb-8">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Tracking</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Attendance</h1>
      </div>

      {!loading && !error && records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
          {[
            { label: 'Present', value: counts.present, color: 'text-emerald-400' },
            { label: 'Absent',  value: counts.absent,  color: 'text-rose-400' },
            { label: 'Late',    value: counts.late,    color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student or course…"
          className="input-base w-full md:w-72"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">All statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center py-24 text-slate-500 text-sm">Loading…</div>
        ) : error ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl"><PendingEndpoint endpoint="GET /admin/attendance" /></div>
        ) : sessions.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center py-24 text-slate-500 text-sm">No records found.</div>
        ) : (
          sessions.map(session => {
            const sessionCounts = {
              present: session.rows.filter(r => r.status === 'present').length,
              absent:  session.rows.filter(r => r.status === 'absent').length,
              late:    session.rows.filter(r => r.status === 'late').length,
            }
            return (
              <div key={`${session.course}|||${session.date}`} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {/* Session header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium text-sm">{session.course}</span>
                    <span className="text-slate-500 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{session.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {sessionCounts.present > 0 && <span className="text-emerald-400">{sessionCounts.present} present</span>}
                    {sessionCounts.absent  > 0 && <span className="text-rose-400">{sessionCounts.absent} absent</span>}
                    {sessionCounts.late    > 0 && <span className="text-amber-400">{sessionCounts.late} late</span>}
                    <span className="text-slate-500">{session.rows.length} students</span>
                  </div>
                </div>
                {/* Student rows */}
                <table className="w-full text-sm">
                  <tbody>
                    {session.rows.map((r, i) => (
                      <tr key={r.id || i} className={`hover:bg-slate-950/40 transition-colors ${i < session.rows.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                        <td className="px-6 py-3 font-medium text-white">{r.student_name || r.student_id}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${STATUS_STYLES[r.status] || ''}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })
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
