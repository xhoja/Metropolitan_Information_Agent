import { useState, useEffect } from 'react'
import api from '../../api/axios'

const STATUS_STYLES = {
  settled: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  partial:  'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  pending:  'bg-rose-500/15 text-rose-300 border border-rose-500/30',
}

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function FinanceTab() {
  const [subTab, setSubTab] = useState('students')

  // major fees
  const [majorFees, setMajorFees]     = useState([])
  const [mfLoading, setMfLoading]     = useState(true)
  const [mfForm, setMfForm]           = useState({ major: '', annual_fee: '', academic_year: '2025-2026', installment_count: 2 })
  const [mfSaving, setMfSaving]       = useState(false)
  const [mfError, setMfError]         = useState('')
  const [mfEditId, setMfEditId]       = useState(null)

  // students
  const [students, setStudents]       = useState([])
  const [stLoading, setStLoading]     = useState(true)
  const [selected, setSelected]       = useState(null)   // { student_id, name, major, fee }
  const [detail, setDetail]           = useState(null)   // { fee, installments, transactions }
  const [detailLoading, setDetailLoading] = useState(false)

  // assign fee form
  const [assignForm, setAssignForm]   = useState({ academic_year: '2025-2026', agreed_amount: '' })
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState('')

  // installment form
  const [instForm, setInstForm]       = useState({ description: '', amount: '', due_date: '' })
  const [instSaving, setInstSaving]   = useState(false)
  const [instError, setInstError]     = useState('')

  // transaction form
  const [txForm, setTxForm]           = useState({ explanation: '', amount: '', doc_no: '', doc_type: 'INV' })
  const [txSaving, setTxSaving]       = useState(false)
  const [txError, setTxError]         = useState('')

  // scholarship form
  const [schForm, setSchForm]         = useState({ amount: '', reason: '' })
  const [schSaving, setSchSaving]     = useState(false)
  const [schError, setSchError]       = useState('')

  const loadMajorFees = () => {
    setMfLoading(true)
    api.get('/admin/finance/major-fees')
      .then(r => setMajorFees(r.data))
      .catch(() => {})
      .finally(() => setMfLoading(false))
  }

  const loadStudents = () => {
    setStLoading(true)
    api.get('/admin/finance/students')
      .then(r => setStudents(r.data))
      .catch(() => {})
      .finally(() => setStLoading(false))
  }

  const loadDetail = (feeId) => {
    setDetailLoading(true)
    api.get(`/admin/finance/student-fees/${feeId}`)
      .then(r => setDetail(r.data))
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  useEffect(() => { loadMajorFees(); loadStudents() }, [])

  const selectStudent = (s) => {
    setSelected(s)
    setDetail(null)
    setAssignError('')
    setInstError('')
    setTxError('')
    if (s.fee) loadDetail(s.fee.id)
  }

  const handleMfSave = async (e) => {
    e.preventDefault()
    setMfSaving(true); setMfError('')
    try {
      if (mfEditId) {
        await api.put(`/admin/finance/major-fees/${mfEditId}`, {
          annual_fee: Number(mfForm.annual_fee),
          academic_year: mfForm.academic_year,
          installment_count: Number(mfForm.installment_count),
        })
        setMfEditId(null)
      } else {
        await api.post('/admin/finance/major-fees', {
          major: mfForm.major,
          annual_fee: Number(mfForm.annual_fee),
          academic_year: mfForm.academic_year,
          installment_count: Number(mfForm.installment_count),
        })
      }
      setMfForm({ major: '', annual_fee: '', academic_year: '2025-2026', installment_count: 2 })
      loadMajorFees()
    } catch (err) {
      setMfError(err.response?.data?.detail || 'Failed to save.')
    } finally {
      setMfSaving(false)
    }
  }

  const deleteMajorFee = async (id) => {
    await api.delete(`/admin/finance/major-fees/${id}`).catch(() => {})
    loadMajorFees()
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    setAssignSaving(true); setAssignError('')
    try {
      await api.post('/admin/finance/student-fees', {
        student_id: selected.student_id,
        academic_year: assignForm.academic_year,
        agreed_amount: Number(assignForm.agreed_amount),
      })
      loadStudents()
      // refresh selected
      const updated = await api.get('/admin/finance/students')
      const s = updated.data.find(x => x.student_id === selected.student_id)
      if (s) { setSelected(s); if (s.fee) loadDetail(s.fee.id) }
    } catch (err) {
      setAssignError(err.response?.data?.detail || 'Failed to assign.')
    } finally {
      setAssignSaving(false)
    }
  }

  const handleAddInstallment = async (e) => {
    e.preventDefault()
    setInstSaving(true); setInstError('')
    try {
      await api.post(`/admin/finance/student-fees/${detail.fee.id}/installments`, {
        description: instForm.description,
        amount: Number(instForm.amount),
        due_date: instForm.due_date,
      })
      setInstForm({ description: '', amount: '', due_date: '' })
      loadDetail(detail.fee.id)
    } catch (err) {
      setInstError(err.response?.data?.detail || 'Failed to add.')
    } finally {
      setInstSaving(false)
    }
  }

  const toggleInstallmentPaid = async (inst) => {
    await api.put(`/admin/finance/installments/${inst.id}`, { paid: !inst.paid }).catch(() => {})
    loadDetail(detail.fee.id)
  }

  const deleteInstallment = async (id) => {
    await api.delete(`/admin/finance/installments/${id}`).catch(() => {})
    loadDetail(detail.fee.id)
  }

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    setTxSaving(true); setTxError('')
    try {
      await api.post(`/admin/finance/student-fees/${detail.fee.id}/transactions`, {
        explanation: txForm.explanation,
        amount: Number(txForm.amount),
        doc_no: txForm.doc_no || undefined,
        doc_type: txForm.doc_type,
      })
      setTxForm({ explanation: '', amount: '', doc_no: '', doc_type: 'INV' })
      loadDetail(detail.fee.id)
      loadStudents()
      const s = students.find(x => x.student_id === selected.student_id)
      if (s) setSelected({ ...s, fee: { ...s.fee } })
    } catch (err) {
      setTxError(err.response?.data?.detail || 'Failed to record.')
    } finally {
      setTxSaving(false)
    }
  }

  const deleteTransaction = async (id) => {
    await api.delete(`/admin/finance/transactions/${id}`).catch(() => {})
    loadDetail(detail.fee.id)
    loadStudents()
  }

  const handleApplyScholarship = async (e) => {
    e.preventDefault()
    setSchSaving(true); setSchError('')
    try {
      await api.post(`/admin/finance/student-fees/${detail.fee.id}/scholarship`, {
        amount: Number(schForm.amount),
        reason: schForm.reason || undefined,
      })
      setSchForm({ amount: '', reason: '' })
      loadDetail(detail.fee.id)
      loadStudents()
    } catch (err) {
      setSchError(err.response?.data?.detail || 'Failed to apply scholarship.')
    } finally {
      setSchSaving(false)
    }
  }

  const handleRemoveScholarship = async () => {
    if (!window.confirm('Remove scholarship? This restores the full fee and recalculates installments.')) return
    try {
      await api.delete(`/admin/finance/student-fees/${detail.fee.id}/scholarship`)
      loadDetail(detail.fee.id)
      loadStudents()
    } catch {
      alert('Failed to remove scholarship.')
    }
  }

  // ── Render student detail pane ─────────────────────────────────────────────
  if (selected) {
    const fee = detail?.fee
    const installments = detail?.installments || []
    const transactions = detail?.transactions || []
    const status = fee?.status || 'pending'

    return (
      <div>
        <button
          onClick={() => { setSelected(null); setDetail(null) }}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Finance
        </button>

        <div className="mb-8">
          <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Finance</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">{selected.name}</h1>
          <p className="text-slate-500 text-sm mt-1">{selected.major || '—'} · {selected.email}</p>
        </div>

        {/* Summary cards */}
        {fee && (() => {
          const scholarship = Number(fee.scholarship_amount || 0)
          const originalFee = Number(fee.agreed_amount) + scholarship
          return (
            <>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-5">
                  <p className="text-xs text-blue-300 uppercase tracking-widest mb-1">Total Fee</p>
                  <p className="text-2xl font-semibold text-white">{fmt(originalFee)}</p>
                  <p className="text-xs text-blue-400 mt-1">{fee.academic_year}</p>
                </div>
                <div className={`rounded-xl p-5 border ${scholarship > 0 ? 'bg-violet-600/20 border-violet-500/30' : 'bg-slate-700/30 border-slate-700'}`}>
                  <p className="text-xs text-violet-300 uppercase tracking-widest mb-1">Scholarship</p>
                  <p className="text-2xl font-semibold text-white">{scholarship > 0 ? `− ${fmt(scholarship)}` : '—'}</p>
                  {scholarship > 0 && fee.scholarship_reason && (
                    <p className="text-xs text-violet-400 mt-1 truncate">{fee.scholarship_reason}</p>
                  )}
                </div>
                <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-5">
                  <p className="text-xs text-emerald-300 uppercase tracking-widest mb-1">Paid</p>
                  <p className="text-2xl font-semibold text-white">{fmt(fee.paid_amount)}</p>
                  <p className="text-xs text-emerald-400 mt-1">{fmt(fee.agreed_amount - fee.paid_amount)} remaining</p>
                </div>
                <div className={`rounded-xl p-5 border ${status === 'settled' ? 'bg-emerald-600/20 border-emerald-500/30' : status === 'partial' ? 'bg-amber-600/20 border-amber-500/30' : 'bg-rose-600/20 border-rose-500/30'}`}>
                  <p className={`text-xs uppercase tracking-widest mb-1 ${status === 'settled' ? 'text-emerald-300' : status === 'partial' ? 'text-amber-300' : 'text-rose-300'}`}>Status</p>
                  <p className="text-2xl font-semibold text-white capitalize">{status}</p>
                </div>
              </div>

              {/* Scholarship panel */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Scholarship</h2>
                  {scholarship > 0 && (
                    <button onClick={handleRemoveScholarship} className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400/50 px-3 py-1.5 rounded-lg transition">
                      Remove scholarship
                    </button>
                  )}
                </div>
                {scholarship > 0 ? (
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="text-slate-400">Current:</span>
                    <span className="text-violet-300 font-semibold">− {fmt(scholarship)}</span>
                    {fee.scholarship_reason && <span className="text-slate-500">"{fee.scholarship_reason}"</span>}
                    <span className="text-slate-500">→ Net payable: <span className="text-white font-medium">{fmt(fee.agreed_amount)}</span></span>
                  </div>
                ) : null}
                <form onSubmit={handleApplyScholarship} className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Amount</label>
                    <input
                      required type="number" min="1" step="0.01"
                      value={schForm.amount}
                      onChange={e => setSchForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder={scholarship > 0 ? `Current: ${fmt(scholarship)}` : 'e.g. 500.00'}
                      className="fin-input w-40"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Reason (optional)</label>
                    <input
                      value={schForm.reason}
                      onChange={e => setSchForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Merit-based, financial aid…"
                      className="fin-input"
                    />
                  </div>
                  <button type="submit" disabled={schSaving} className="fin-btn-primary">
                    {schSaving ? 'Applying…' : scholarship > 0 ? 'Update Scholarship' : 'Apply Scholarship'}
                  </button>
                </form>
                {schError && <p className="text-rose-400 text-sm mt-2">{schError}</p>}
              </div>
            </>
          )
        })()}

        {/* Assign fee (if no fee yet) */}
        {!fee && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
            <h2 className="text-sm font-semibold text-white mb-4">Assign Fee</h2>
            <form onSubmit={handleAssign} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Academic Year</label>
                <input
                  value={assignForm.academic_year}
                  onChange={e => setAssignForm(f => ({ ...f, academic_year: e.target.value }))}
                  placeholder="2025-2026"
                  className="fin-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Agreed Amount</label>
                <input
                  type="number" min="0" step="0.01" required
                  value={assignForm.agreed_amount}
                  onChange={e => setAssignForm(f => ({ ...f, agreed_amount: e.target.value }))}
                  placeholder="e.g. 2500.00"
                  className="fin-input"
                />
              </div>
              <button type="submit" disabled={assignSaving} className="fin-btn-primary">
                {assignSaving ? 'Saving…' : 'Assign'}
              </button>
            </form>
            {assignError && <p className="text-rose-400 text-sm mt-2">{assignError}</p>}
          </div>
        )}

        {fee && detailLoading && <p className="text-slate-500 text-sm mb-6">Loading details…</p>}

        {fee && detail && (
          <>
            {/* Installments */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Installments</h2>
              </div>
              {installments.length === 0 ? (
                <div className="px-6 py-6 flex items-center justify-between">
                  <p className="text-slate-500 text-sm">No installments yet.</p>
                  <button
                    onClick={async () => {
                      await api.post(`/admin/finance/student-fees/${detail.fee.id}/generate-installments`).catch(() => {})
                      loadDetail(detail.fee.id)
                    }}
                    className="fin-btn-secondary text-xs"
                  >
                    Auto-generate from major fee
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {['Due Date', 'Description', 'Amount', 'Paid', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((inst, i) => (
                      <tr key={inst.id} className={`hover:bg-slate-900/50 transition-colors ${i < installments.length - 1 ? 'border-b border-slate-700/60' : ''}`}>
                        <td className="px-4 py-3 text-slate-300 text-xs font-mono">{inst.due_date}</td>
                        <td className="px-4 py-3 text-white">{inst.description}</td>
                        <td className="px-4 py-3 text-white font-medium">{fmt(inst.amount)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleInstallmentPaid(inst)}
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition ${inst.paid ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-emerald-500/40'}`}
                          >
                            {inst.paid ? 'Paid' : 'Unpaid'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteInstallment(inst.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700">
                      <td colSpan={2} className="px-4 py-3 text-slate-500 text-xs">Total</td>
                      <td className="px-4 py-3 text-white font-semibold">{fmt(installments.reduce((s, i) => s + Number(i.amount), 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              )}
              {/* Add installment form */}
              <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/40">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Add Installment</p>
                <form onSubmit={handleAddInstallment} className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Description</label>
                    <input required value={instForm.description} onChange={e => setInstForm(f => ({ ...f, description: e.target.value }))} placeholder="1st Installment" className="fin-input" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Amount</label>
                    <input required type="number" min="0" step="0.01" value={instForm.amount} onChange={e => setInstForm(f => ({ ...f, amount: e.target.value }))} placeholder="900.00" className="fin-input" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Due Date</label>
                    <input required type="date" value={instForm.due_date} onChange={e => setInstForm(f => ({ ...f, due_date: e.target.value }))} className="fin-input" />
                  </div>
                  <button type="submit" disabled={instSaving} className="fin-btn-secondary">
                    {instSaving ? 'Adding…' : '+ Add'}
                  </button>
                </form>
                {instError && <p className="text-rose-400 text-sm mt-2">{instError}</p>}
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-sm font-semibold text-white">Transactions</h2>
              </div>
              {transactions.length === 0 ? (
                <p className="px-6 py-6 text-slate-500 text-sm">No transactions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {['Issue Date', 'Doc Type', 'Doc No', 'Explanation', 'Amount', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={tx.id} className={`hover:bg-slate-900/50 transition-colors ${i < transactions.length - 1 ? 'border-b border-slate-700/60' : ''}`}>
                        <td className="px-4 py-3 text-slate-300 text-xs font-mono">{tx.issue_date}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">{tx.doc_type}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono">{tx.doc_no || '—'}</td>
                        <td className="px-4 py-3 text-slate-300">{tx.explanation || '—'}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">+{fmt(tx.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => deleteTransaction(tx.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-700">
                      <td colSpan={4} className="px-4 py-3 text-slate-500 text-xs">Total</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">+{fmt(transactions.reduce((s, t) => s + Number(t.amount), 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
              {/* Record payment form */}
              <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/40">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Record Payment</p>
                <form onSubmit={handleAddTransaction} className="flex flex-wrap gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Amount</label>
                    <input required type="number" min="0" step="0.01" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} placeholder="500.00" className="fin-input" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Explanation</label>
                    <input value={txForm.explanation} onChange={e => setTxForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Misc. Ait 202..." className="fin-input" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 text-xs">Doc No</label>
                    <input value={txForm.doc_no} onChange={e => setTxForm(f => ({ ...f, doc_no: e.target.value }))} placeholder="7190" className="fin-input w-24" />
                  </div>
                  <button type="submit" disabled={txSaving} className="fin-btn-secondary">
                    {txSaving ? 'Saving…' : '+ Record'}
                  </button>
                </form>
                {txError && <p className="text-rose-400 text-sm mt-2">{txError}</p>}
              </div>
            </div>
          </>
        )}

        <style>{finStyles}</style>
      </div>
    )
  }

  // ── Main Finance view ──────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <p className="text-blue-300 text-xs font-medium uppercase tracking-[0.2em] mb-1">Administration</p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Finance</h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-8 bg-slate-800/60 p-1 rounded-lg border border-slate-700 w-fit">
        {[{ id: 'students', label: 'Student Fees' }, { id: 'major-fees', label: 'Major Fees' }].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${subTab === t.id ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'students' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {stLoading ? (
            <div className="py-16 text-center text-slate-500 text-sm">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Student', 'Major', 'Academic Year', 'Agreed', 'Paid', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr
                    key={s.student_id}
                    className={`hover:bg-slate-900/50 transition-colors cursor-pointer ${i < students.length - 1 ? 'border-b border-slate-700/60' : ''}`}
                    onClick={() => selectStudent(s)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{s.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{s.major || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.fee?.academic_year || '—'}</td>
                    <td className="px-4 py-3 text-white font-medium">{s.fee ? fmt(s.fee.agreed_amount) : '—'}</td>
                    <td className="px-4 py-3 text-emerald-400">{s.fee ? fmt(s.fee.paid_amount) : '—'}</td>
                    <td className="px-4 py-3">
                      {s.fee ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-md capitalize ${STATUS_STYLES[s.fee.status] || ''}`}>
                          {s.fee.status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <svg className="w-4 h-4 text-slate-500 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subTab === 'major-fees' && (
        <div className="space-y-6">
          {/* Add / edit form */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">{mfEditId ? 'Edit Major Fee' : 'Add Major Fee'}</h2>
            <form onSubmit={handleMfSave} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Major</label>
                <input
                  required={!mfEditId}
                  disabled={!!mfEditId}
                  value={mfForm.major}
                  onChange={e => setMfForm(f => ({ ...f, major: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  className="fin-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Annual Fee</label>
                <input
                  required type="number" min="0" step="0.01"
                  value={mfForm.annual_fee}
                  onChange={e => setMfForm(f => ({ ...f, annual_fee: e.target.value }))}
                  placeholder="2500.00"
                  className="fin-input"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Academic Year</label>
                <input
                  required
                  value={mfForm.academic_year}
                  onChange={e => setMfForm(f => ({ ...f, academic_year: e.target.value }))}
                  placeholder="2025-2026"
                  className="fin-input w-32"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 text-xs uppercase tracking-wider">Installments</label>
                <select
                  value={mfForm.installment_count}
                  onChange={e => setMfForm(f => ({ ...f, installment_count: Number(e.target.value) }))}
                  className="fin-input w-24"
                >
                  <option value={2}>2 (Nov, Mar)</option>
                  <option value={4}>4 (Nov, Jan, Mar, May)</option>
                </select>
              </div>
              <button type="submit" disabled={mfSaving} className="fin-btn-primary">
                {mfSaving ? 'Saving…' : mfEditId ? 'Update' : '+ Add'}
              </button>
              {mfEditId && (
                <button
                  type="button"
                  onClick={() => { setMfEditId(null); setMfForm({ major: '', annual_fee: '', academic_year: '2025-2026' }) }}
                  className="fin-btn-cancel"
                >
                  Cancel
                </button>
              )}
            </form>
            {mfError && <p className="text-rose-400 text-sm mt-2">{mfError}</p>}
          </div>

          {/* List */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {mfLoading ? (
              <div className="py-12 text-center text-slate-500 text-sm">Loading…</div>
            ) : majorFees.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No major fees configured yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Major', 'Annual Fee', 'Academic Year', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {majorFees.map((mf, i) => (
                    <tr key={mf.id} className={`hover:bg-slate-900/50 transition-colors ${i < majorFees.length - 1 ? 'border-b border-slate-700/60' : ''}`}>
                      <td className="px-4 py-3 text-white font-medium">{mf.major}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(mf.annual_fee)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{mf.academic_year}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setMfEditId(mf.id); setMfForm({ major: mf.major, annual_fee: String(mf.annual_fee), academic_year: mf.academic_year, installment_count: mf.installment_count || 2 }) }}
                            className="text-slate-500 hover:text-blue-300 transition-colors p-1.5 rounded hover:bg-slate-700"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 013.182 3.182L6.75 19.963l-4.5 1.5 1.5-4.5L16.862 3.487z" />
                            </svg>
                          </button>
                          <button onClick={() => deleteMajorFee(mf.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-slate-700">
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

      <style>{finStyles}</style>
    </div>
  )
}

const finStyles = `
  .fin-input { background:rgb(15 23 42); border:1px solid rgb(51 65 85); border-radius:0.5rem; padding:0.5rem 0.75rem; color:white; font-size:0.875rem; outline:none; transition:border-color 0.15s; min-width:10rem; }
  .fin-input:focus { border-color:rgb(59 130 246); }
  .fin-input::placeholder { color:rgb(100 116 139); }
  .fin-input:disabled { opacity:0.5; cursor:not-allowed; }
  .fin-btn-primary { background:rgb(59 130 246); color:white; padding:0.5rem 1.25rem; border-radius:0.5rem; font-size:0.875rem; font-weight:500; transition:background 0.15s; }
  .fin-btn-primary:hover:not(:disabled) { background:rgb(96 165 250); }
  .fin-btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .fin-btn-secondary { background:rgb(51 65 85); color:rgb(203 213 225); padding:0.5rem 1.25rem; border-radius:0.5rem; font-size:0.875rem; font-weight:500; transition:background 0.15s; }
  .fin-btn-secondary:hover:not(:disabled) { background:rgb(71 85 105); }
  .fin-btn-secondary:disabled { opacity:0.5; cursor:not-allowed; }
  .fin-btn-cancel { background:transparent; color:rgb(100 116 139); padding:0.5rem 1rem; border-radius:0.5rem; font-size:0.875rem; transition:color 0.15s; }
  .fin-btn-cancel:hover { color:white; }
`
