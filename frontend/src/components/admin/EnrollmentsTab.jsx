import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState([])
  const [students, setStudents]       = useState([])
  const [courses, setCourses]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')

  const [form, setForm]         = useState({ student_id: '', course_id: '', semester: '' })
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError]   = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/admin/enrollments')
      .then(r => setEnrollments(r.data))
      .catch(() => setError('Failed to load enrollments.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/admin/students').then(r => setStudents(r.data)).catch(() => {})
    api.get('/admin/courses').then(r => setCourses(r.data)).catch(() => {})
  }, [])

  const handleEnroll = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    setFormSuccess('')
    try {
      await api.post('/admin/enrollments', form)
      setFormSuccess('Student enrolled successfully.')
      setForm({ student_id: '', course_id: '', semester: '' })
      load()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to enroll student.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = enrollments.filter(e =>
    e.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.course_title?.toLowerCase().includes(search.toLowerCase()) ||
    e.course_code?.toLowerCase().includes(search.toLowerCase())
  )

  // Group by student
  const byStudent = filtered.reduce((acc, e) => {
    const key = e.student_id || e.student_name
    if (!acc[key]) acc[key] = { name: e.student_name || e.student_id, enrollments: [] }
    acc[key].enrollments.push(e)
    return acc
  }, {})
  const studentGroups = Object.values(byStudent).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <div className="mb-8">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Registry</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Enrollments</h1>
        {!loading && !error && (
          <p className="text-slate-500 text-sm mt-1">{enrollments.length} enrollment{enrollments.length !== 1 ? 's' : ''} total</p>
        )}
      </div>

      <div className="max-w-md mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Enroll Student</h2>
          <form onSubmit={handleEnroll} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Student</label>
              <select
                required
                value={form.student_id}
                onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                className="input-base"
              >
                <option value="">— select student —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Course</label>
              <select
                required
                value={form.course_id}
                onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                className="input-base"
              >
                <option value="">— select course —</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Semester</label>
              <input
                required
                value={form.semester}
                onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                placeholder="e.g. Fall 2025"
                className="input-base"
              />
            </div>
            {formError   && <p className="text-rose-400 text-sm">{formError}</p>}
            {formSuccess && <p className="text-emerald-400 text-sm">{formSuccess}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              {saving ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </form>
        </div>
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student name or course…"
          className="input-base w-full md:w-80"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading…</div>
        ) : error ? (
          <div className="flex items-center justify-center py-24 text-rose-400 text-sm">{error}</div>
        ) : studentGroups.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            {search ? 'No enrollments match your search.' : 'No enrollments yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Student', 'Enrolled Courses'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentGroups.map((g, i) => (
                <tr key={g.name} className={`hover:bg-slate-950/40 transition-colors align-top ${i < studentGroups.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{g.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {g.enrollments.map(e => (
                        <div key={e.id} className="flex items-center gap-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5">
                          {e.course_code && (
                            <span className="text-xs font-mono text-amber-400">{e.course_code}</span>
                          )}
                          <span className="text-xs text-slate-300">{e.course_title || e.course_id}</span>
                          {e.created_at && (
                            <span className="text-xs text-slate-500 ml-1">
                              {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              if (!window.confirm(`Remove ${e.student_name} from ${e.course_title}?`)) return
                              api.delete(`/admin/enrollments/${e.id}`).then(load).catch(() => {})
                            }}
                            className="ml-1 text-slate-500 hover:text-rose-400 transition text-xs leading-none"
                            title="Remove enrollment"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
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
