import { useState, useEffect } from 'react'
import api from '../../api/axios'

const STATUS_STYLES = {
  present: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  absent:  'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  late:    'bg-amber-500/15 text-amber-300 border border-amber-500/30',
}

function RateBar({ rate }) {
  const color = rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
  const textColor = rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-rose-400'
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, rate)}%` }} />
      </div>
      <span className={`text-sm font-semibold w-12 text-right ${textColor}`}>{rate.toFixed(1)}%</span>
    </div>
  )
}

export default function AttendanceTab() {
  const [records, setRecords]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState('overview') // 'overview' | 'sessions'

  useEffect(() => {
    api.get('/admin/attendance')
      .then(r => setRecords(r.data))
      .catch(() => setError('Endpoint not available yet.'))
      .finally(() => setLoading(false))
  }, [])

  const counts = {
    present: records.filter(r => r.status === 'present').length,
    absent:  records.filter(r => r.status === 'absent').length,
    late:    records.filter(r => r.status === 'late').length,
  }

  // Per-student-per-course attendance rates
  const studentCourseMap = {}
  records.forEach(r => {
    // use IDs when available, fall back to names to prevent false merges
    const sKey = r.student_id || r.student_name || 'unknown'
    const cKey = r.course_id  || r.course_title  || 'unknown'
    const key = `${sKey}|||${cKey}`
    if (!studentCourseMap[key]) studentCourseMap[key] = {
      student: r.student_name || r.student_id || '—',
      email: r.student_email || '',
      course: r.course_title || r.course_id || '—',
      code: r.course_code || '',
      hours: 0,
      weeks: new Set(),
    }
    studentCourseMap[key].hours += r.hours_present || 0
    if (r.week_number) studentCourseMap[key].weeks.add(r.week_number)
  })
  const studentRates = Object.values(studentCourseMap)
    .filter(s => s.weeks.size > 0)
    .map(s => ({ ...s, rate: (s.hours / (s.weeks.size * 4)) * 100 }))
    .sort((a, b) => {
      const name = a.student.localeCompare(b.student)
      return name !== 0 ? name : a.course.localeCompare(b.course)
    })
  const failed = studentRates.filter(s => s.rate < 75)  // already alpha-sorted
  const passing = studentRates.filter(s => s.rate >= 75)

  // Filtered sessions view
  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.student_name?.toLowerCase().includes(q) ||
      r.course_title?.toLowerCase().includes(q)
    const matchStatus = statusFilter ? r.status === statusFilter : true
    return matchSearch && matchStatus
  })
  const grouped = filtered.reduce((acc, r) => {
    const key = `${r.course_title || r.course_id}|||${r.date}`
    if (!acc[key]) acc[key] = { course: r.course_title || r.course_id, code: r.course_code || '', date: r.date, rows: [] }
    acc[key].rows.push(r)
    return acc
  }, {})
  const sessions = Object.values(grouped).sort((a, b) =>
    a.course !== b.course ? a.course.localeCompare(b.course) : a.date.localeCompare(b.date)
  )

  return (
    <div>
      <div className="mb-8">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Tracking</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Attendance</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-slate-500 text-sm">Loading…</div>
      ) : error ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center py-24 text-slate-500 text-sm">{error}</div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Present',  value: counts.present,  color: 'text-emerald-400', sub: 'sessions' },
              { label: 'Absent',   value: counts.absent,   color: 'text-rose-400',    sub: 'sessions' },
              { label: 'Late',     value: counts.late,     color: 'text-amber-400',   sub: 'sessions' },
              { label: 'At Risk',  value: failed.length,   color: 'text-rose-400',    sub: 'students <75%' },
            ].map(s => (
              <div key={s.label} className={`bg-slate-800 border rounded-xl p-5 ${s.label === 'At Risk' && failed.length > 0 ? 'border-rose-500/40' : 'border-slate-700'}`}>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white text-sm font-medium mt-1">{s.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Failure panel */}
          {failed.length > 0 && (
            <div className="mb-8 bg-rose-500/5 border border-rose-500/30 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-rose-500/20 flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-rose-300 font-semibold text-sm">{failed.length} student{failed.length !== 1 ? 's' : ''} failed due to attendance — must retake</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rose-500/10">
                    {['Student', 'Course', 'Attendance'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-rose-400/50 font-medium text-xs uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {failed.map((s, i) => (
                    <tr key={i} className={i < failed.length - 1 ? 'border-b border-rose-500/10' : ''}>
                      <td className="px-6 py-3">
                        <p className="text-white font-medium">{s.student}</p>
                        <p className="text-slate-500 text-xs">{s.email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded mr-2">{s.code}</span>
                        <span className="text-slate-300 text-sm">{s.course}</span>
                      </td>
                      <td className="px-6 py-3"><RateBar rate={s.rate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* View toggle */}
          <div className="flex gap-2 mb-6">
            {[['overview', 'Student Overview'], ['sessions', 'Session Log']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${view === v ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
              >{label}</button>
            ))}
          </div>

          {view === 'overview' ? (
            /* Student overview — one row per student+course */
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Student', 'Course', 'Sessions', 'Attendance', 'Status'].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentRates.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No records yet.</td></tr>
                  ) : studentRates.map((s, i) => (
                    <tr key={i} className={`hover:bg-slate-950/40 transition-colors ${i < studentRates.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{s.student}</p>
                        <p className="text-slate-500 text-xs">{s.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded mr-2">{s.code}</span>
                        <span className="text-slate-300">{s.course}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{s.weeks.size} weeks</td>
                      <td className="px-6 py-4"><RateBar rate={s.rate} /></td>
                      <td className="px-6 py-4">
                        {s.rate >= 75
                          ? <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Passing</span>
                          : <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30">Failed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Session log */
            <>
              <div className="flex flex-wrap gap-3 mb-5">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by student or course…"
                  className="input-base w-full md:w-72"
                />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base w-auto">
                  <option value="">All statuses</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center py-16 text-slate-500 text-sm">No records found.</div>
                ) : sessions.map(session => {
                  const sc = {
                    present: session.rows.filter(r => r.status === 'present').length,
                    absent:  session.rows.filter(r => r.status === 'absent').length,
                    late:    session.rows.filter(r => r.status === 'late').length,
                  }
                  return (
                    <div key={`${session.course}|||${session.date}`} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800/80">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{session.code}</span>
                          <span className="text-white font-medium text-sm">{session.course}</span>
                          <span className="text-slate-500 text-xs">{session.date}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {sc.present > 0 && <span className="text-emerald-400">{sc.present} present</span>}
                          {sc.absent  > 0 && <span className="text-rose-400">{sc.absent} absent</span>}
                          {sc.late    > 0 && <span className="text-amber-400">{sc.late} late</span>}
                          <span className="text-slate-600">{session.rows.length} students</span>
                        </div>
                      </div>
                      <table className="w-full text-sm">
                        <tbody>
                          {session.rows.map((r, i) => (
                            <tr key={r.id || i} className={`hover:bg-slate-950/40 transition-colors ${i < session.rows.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                              <td className="px-6 py-3 font-medium text-white">{r.student_name || r.student_id}</td>
                              <td className="px-6 py-3 text-right">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      <style>{`
        .input-base { width:100%; background:rgb(15 23 42); border:1px solid rgb(51 65 85); border-radius:0.5rem; padding:0.625rem 0.875rem; color:white; font-size:0.875rem; outline:none; transition:border-color 0.15s; font-family:inherit; }
        .input-base:focus { border-color:rgb(217 119 6); }
      `}</style>
    </div>
  )
}
