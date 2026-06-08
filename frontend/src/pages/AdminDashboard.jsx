import { useState, useEffect } from 'react'
import DashboardNav from '../components/DashboardNav'
import api from '../api/axios'
import StudentsTab   from '../components/admin/StudentsTab'
import ProfessorsTab from '../components/admin/ProfessorsTab'
import CoursesTab    from '../components/admin/CoursesTab'
import EnrollmentsTab from '../components/admin/EnrollmentsTab'
import AttendanceTab from '../components/admin/AttendanceTab'
import GradesTab     from '../components/admin/GradesTab'
import FinanceTab    from '../components/admin/FinanceTab'

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'users',        label: 'Users' },
  { id: 'students',     label: 'Students' },
  { id: 'professors',   label: 'Professors' },
  { id: 'courses',      label: 'Courses' },
  { id: 'enrollments',  label: 'Enrollments' },
  { id: 'attendance',   label: 'Attendance' },
  { id: 'grades',       label: 'Grades' },
  { id: 'roles',        label: 'Role Assignment' },
  { id: 'finance',      label: 'Finance' },
]

const ROLE_STYLES = {
  admin:     'bg-rose-500/15 text-rose-300 border border-rose-500/30',
  professor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  student:   'bg-blue-300/15 text-blue-300 border border-blue-400/30',
}

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student', major: '', department: '', title: '' }

export default function AdminDashboard() {
  const [tab, setTab]               = useState('overview')
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [modal, setModal]           = useState(null)
  const [showPass, setShowPass]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formError, setFormError]   = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [rolesFilter, setRolesFilter] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const students   = users.filter(u => u.role === 'student')
  const professors = users.filter(u => u.role === 'professor')
  const admins     = users.filter(u => u.role === 'admin')

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(''); setModal('create') }
  const openEdit   = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      major: user.major || '',
      department: user.department || '',
      title: user.title || '',
    })
    setFormError('')
    setModal(user)
  }
  const closeModal = () => setModal(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (modal === 'create') {
        await api.post('/admin/users', form)
      } else {
        await api.put(`/admin/users/${modal.id}`, form)
      }
      await fetchUsers()
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`)
      setUsers(u => u.filter(x => x.id !== deleteTarget.id))
    } catch {
      setError('Delete failed.')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');`}</style>

      <DashboardNav role="admin" tabs={TABS} activeTab={tab} onTabChange={setTab} />

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div>
            <div className="mb-10">
              <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Welcome back</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                {localStorage.getItem('name') || 'Admin'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Here's a snapshot of the system.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Total Users',  value: users.length,       color: 'text-white' },
                { label: 'Students',     value: students.length,    color: 'text-blue-300' },
                { label: 'Professors',   value: professors.length,  color: 'text-amber-400' },
                { label: 'Admins',       value: admins.length,      color: 'text-rose-400' },
              ].map(s => (
                <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <p className={`text-4xl font-semibold ${s.color} mb-1`}>{s.value}</p>
                  <p className="text-slate-500 text-sm">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent users */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Recent Users</h2>
                <button onClick={() => setTab('users')} className="text-blue-300 hover:text-blue-300 text-xs transition">
                  View all →
                </button>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {loading ? (
                    <tr><td className="px-6 py-8 text-slate-500 text-center" colSpan={3}>Loading…</td></tr>
                  ) : (
                    [...users].slice(-5).reverse().map((user, i, arr) => (
                      <tr key={user.id} className={`hover:bg-slate-950/40 transition-colors ${i < arr.length - 1 ? 'border-b border-slate-800/60' : ''}`}>
                        <td className="px-6 py-3.5 font-medium text-white">{user.name}</td>
                        <td className="px-6 py-3.5 text-slate-400 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{user.email}</td>
                        <td className="px-6 py-3.5">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${ROLE_STYLES[user.role] || ''}`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">System Control</p>
                <h1 className="text-3xl font-semibold text-white tracking-tight">User Management</h1>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-blue-400 hover:bg-blue-300 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-lg shadow-blue-900/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {['', 'admin', 'professor', 'student'].map(r => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition border capitalize ${userRoleFilter === r ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >{r === '' ? 'All' : r}</button>
              ))}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading users…</div>
              ) : error ? (
                <div className="flex items-center justify-center py-24 text-red-400 text-sm">{error}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Name', 'Email', 'Role', 'Joined', ''].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(userRoleFilter ? users.filter(u => u.role === userRoleFilter) : users).map((user, i, arr) => (
                      <tr key={user.id} className={`border-b border-slate-800/60 hover:bg-slate-950/40 transition-colors ${i === arr.length - 1 ? 'border-b-0' : ''}`}>
                        <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${ROLE_STYLES[user.role] || ''}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(user)} className="text-slate-500 hover:text-blue-300 transition-colors p-1.5 rounded hover:bg-slate-800">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L6.75 19.963l-4.5 1.5 1.5-4.5L16.862 3.487z" />
                              </svg>
                            </button>
                            <button onClick={() => setDeleteTarget(user)} className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-slate-800">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {/* ROLES TAB */}
        {tab === 'roles' && (
          <div>
            <div className="mb-8">
              <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Permissions</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Role Assignment</h1>
            </div>
            <div className="flex gap-2 mb-4">
              {['', 'admin', 'professor', 'student'].map(r => (
                <button
                  key={r}
                  onClick={() => setRolesFilter(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition border capitalize ${rolesFilter === r ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                >{r === '' ? 'All' : r}</button>
              ))}
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Name', 'Email', 'Current Role', 'Change Role'].map(h => (
                      <th key={h} className="text-left px-6 py-4 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(rolesFilter ? users.filter(u => u.role === rolesFilter) : users).map((user, i, arr) => (
                    <RoleRow
                      key={user.id}
                      user={user}
                      isLast={i === arr.length - 1}
                      onRoleChange={async (newRole) => {
                        await api.put(`/admin/users/${user.id}`, { ...user, role: newRole })
                        await fetchUsers()
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'students'    && <StudentsTab   users={users} onRemove={setDeleteTarget} onEdit={openEdit} />}
        {tab === 'professors'  && <ProfessorsTab users={users} onRemove={setDeleteTarget} onEdit={openEdit} />}
        {tab === 'courses'     && <CoursesTab />}
        {tab === 'enrollments' && <EnrollmentsTab />}
        {tab === 'attendance'  && <AttendanceTab />}
        {tab === 'grades'      && <GradesTab />}
        {tab === 'finance'     && <FinanceTab />}

        {/* SYSTEM TAB */}

      </main>

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">
                {modal === 'create' ? 'Add New User' : `Edit — ${modal.name}`}
              </h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
              <Field label="Full Name">
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Smith" className="input-base" />
              </Field>
              <Field label="Email">
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@umt.edu.al" className="input-base" />
              </Field>
              <Field label={modal === 'create' ? 'Password' : 'New Password (leave blank to keep)'}>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={modal === 'create' ? 'Min 6 characters' : '••••••••'} required={modal === 'create'} className="input-base pr-10 w-full" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </Field>
              <Field label="Role">
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input-base">
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              {form.role === 'student' && (
                <Field label="Major">
                  <input value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} placeholder="e.g. Computer Science" className="input-base" />
                </Field>
              )}
              {form.role === 'professor' && (
                <>
                  <Field label="Department">
                    <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Engineering" className="input-base" />
                  </Field>
                  <Field label="Title">
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Dr. / Prof." className="input-base" />
                  </Field>
                </>
              )}
              {formError && <p className="text-rose-400 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-400 hover:bg-blue-300 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition">
                  {saving ? 'Saving…' : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="w-10 h-10 bg-rose-500/15 border border-rose-500/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-1">Delete user?</h3>
            <p className="text-slate-400 text-sm mb-6"><span className="text-white">{deleteTarget.name}</span> will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium py-2.5 rounded-lg transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-base { width:100%; background:rgb(15 23 42); border:1px solid rgb(51 65 85); border-radius:0.5rem; padding:0.625rem 0.875rem; color:white; font-size:0.875rem; outline:none; transition:border-color 0.15s; font-family:inherit; }
        .input-base:focus { border-color:rgb(59 130 246); }
        .input-base::placeholder { color:rgb(100 116 139); }
        .input-base option { background:rgb(15 23 42); }
      `}</style>
    </div>
  )
}

function RoleRow({ user, isLast, onRoleChange }) {
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState(user.role)

  const handleChange = async (newRole) => {
    setRole(newRole)
    setSaving(true)
    await onRoleChange(newRole)
    setSaving(false)
  }

  return (
    <tr className={`border-b border-slate-800/60 hover:bg-slate-950/40 transition-colors ${isLast ? 'border-b-0' : ''}`}>
      <td className="px-6 py-4 font-medium text-white">{user.name}</td>
      <td className="px-6 py-4 text-slate-400 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>{user.email}</td>
      <td className="px-6 py-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${ROLE_STYLES[user.role] || ''}`}>{user.role}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={e => handleChange(e.target.value)}
            disabled={saving}
            className="input-base w-auto py-1.5 text-xs"
          >
            <option value="student">Student</option>
            <option value="professor">Professor</option>
            <option value="admin">Admin</option>
          </select>
          {saving && <span className="text-slate-500 text-xs">Saving…</span>}
        </div>
      </td>
    </tr>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}
