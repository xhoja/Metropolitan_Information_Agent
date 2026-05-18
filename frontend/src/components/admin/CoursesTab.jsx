import { useState, useEffect } from 'react'
import api from '../../api/axios'

const EMPTY_FORM = { code: '', title: '', credits: 3, department: '', description: '', professor_id: '' }

export default function CoursesTab() {
  const [courses, setCourses]     = useState([])
  const [professors, setProfessors] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [search, setSearch]       = useState('')

  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/admin/courses')
      .then(r => setCourses(r.data))
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/admin/professors').then(r => setProfessors(r.data)).catch(() => {})
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    setFormSuccess('')
    try {
      await api.post('/admin/courses', { ...form, credits: Number(form.credits), professor_id: form.professor_id || null })
      setFormSuccess('Course created successfully.')
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create course.')
    } finally {
      setSaving(false)
    }
  }

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-8">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Curriculum</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Courses</h1>
        {!loading && !error && (
          <p className="text-slate-500 text-sm mt-1">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
        )}
      </div>

      <div className="max-w-md mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Create Course</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Code</label>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CS101" className="input-base" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Credits</label>
                <input required type="number" min="1" max="12" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: e.target.value }))} className="input-base" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Title</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Programming" className="input-base" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Department</label>
              <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Computer Science" className="input-base" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Professor</label>
              <select value={form.professor_id} onChange={e => setForm(f => ({ ...f, professor_id: e.target.value }))} className="input-base">
                <option value="">— assign later —</option>
                {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short course description…" rows={2} className="input-base resize-none" />
            </div>
            {formError   && <p className="text-rose-400 text-sm">{formError}</p>}
            {formSuccess && <p className="text-emerald-400 text-sm">{formSuccess}</p>}
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition">
              {saving ? 'Creating…' : 'Create Course'}
            </button>
          </form>
        </div>
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, code, or department…"
          className="input-base w-full md:w-80"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading…</div>
        ) : error ? (
          <PendingEndpoint endpoint="GET /admin/courses" />
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            {search ? 'No courses match your search.' : 'No courses yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Code', 'Title', 'Department', 'Professor', 'Credits', 'Students'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`hover:bg-slate-950/40 transition-colors ${i < filtered.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{c.code}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{c.title}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{c.department || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{c.professor_name || '—'}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{c.credits}</td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{c.enrollment_count ?? '—'}</td>
                </tr>
              ))}
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
