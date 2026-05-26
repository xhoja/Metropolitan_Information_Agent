import { useState, useEffect } from "react";
import DashboardNav from "../components/DashboardNav";
import { studentService, miaService } from "../api/studentService";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "My Courses" },
  { id: "grades", label: "Grades & GPA" },
  { id: "attendance", label: "Attendance" },
  { id: "assignments", label: "Assignments" },
  { id: "materials", label: "Course Materials" },
  { id: "transcript", label: "Transcript" },
  { id: "finance", label: "Finance" },
  { id: "mia", label: "M.I.A Chat" },
];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedMaterialsCourse, setSelectedMaterialsCourse] = useState(null);
  const [courseMaterials, setCourseMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [selectedGradeCourse, setSelectedGradeCourse] = useState(null);

  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendStatusFilter, setAttendStatusFilter] = useState('');
  const [attendSelectedCourse, setAttendSelectedCourse] = useState('');

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(true);

  const [finance, setFinance] = useState(null);
  const [financeLoading, setFinanceLoading] = useState(true);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionPreviews, setSessionPreviews] = useState({});


  useEffect(() => {
    studentService
      .getCourses()
      .then((res) => setCourses(res.data))
      .catch((err) => console.error("Courses error:", err))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    studentService
      .getGrades()
      .then((res) => setGrades(res.data))
      .catch((err) => console.error("Grades error:", err))
      .finally(() => setGradesLoading(false));
  }, []);

  useEffect(() => {
    studentService
      .getAttendance()
      .then((res) => setAttendance(res.data))
      .catch((err) => console.error("Attendance error:", err))
      .finally(() => setAttendanceLoading(false));
  }, []);

  useEffect(() => {
    studentService
      .getAssignments()
      .then((res) => setAssignments(res.data))
      .catch((err) => console.error("Assignments error:", err))
      .finally(() => setAssignmentsLoading(false));
  }, []);

  useEffect(() => {
    studentService
      .getTranscript()
      .then((res) => setTranscript(res.data))
      .catch((err) => console.error("Transcript error:", err))
      .finally(() => setTranscriptLoading(false));
  }, []);

  useEffect(() => {
    studentService
      .getFinance()
      .then((res) => setFinance(res.data))
      .catch((err) => console.error("Finance error:", err))
      .finally(() => setFinanceLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === "mia") loadSessions();
  }, [activeTab]);


  const loadSessions = () => {
    setSessionsLoading(true);
    miaService
      .getSessions()
      .then((res) => {
        const sessionList = res.data;
        setSessions(sessionList);
        Promise.all(
          sessionList.map((s) =>
            miaService
              .getSessionMessages(s.id)
              .then((r) => {
                const first = r.data.find((m) => m.role === "user");
                return [s.id, first ? first.content : null];
              })
              .catch(() => [s.id, null])
          )
        ).then((entries) => {
          setSessionPreviews(Object.fromEntries(entries));
        });
      })
      .catch((err) => console.error("Sessions error:", err))
      .finally(() => setSessionsLoading(false));
  };

  const loadSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    setChatError("");
    miaService
      .getSessionMessages(sessionId)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Session messages error:", err));
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setSelectedSessionId(null);
    setMessages([]);
    setChatError("");
  };

  const deleteSession = (e, sessionId) => {
    e.stopPropagation();
    miaService
      .deleteSession(sessionId)
      .then(() => {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setSessionPreviews((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
        if (selectedSessionId === sessionId) startNewChat();
      })
      .catch((err) => console.error("Delete session error:", err));
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;

    setChatLoading(true);
    setChatError("");
    miaService
      .chat(chatInput, currentSessionId)
      .then((res) => {
        if (!currentSessionId && res.data.session_id !== "temporary") {
          const newId = res.data.session_id;
          setCurrentSessionId(newId);
          setSelectedSessionId(newId);
          setSessionPreviews((prev) => ({ ...prev, [newId]: chatInput }));
          loadSessions();
        }
        setMessages((prev) => [
          ...prev,
          { role: "user", content: chatInput },
          { role: "assistant", content: res.data.response },
        ]);
        setChatInput("");
      })
      .catch((err) => {
        console.error("Chat error:", err);
        setChatError(err.response?.data?.detail || "Failed to reach M.I.A. Check that the backend is running.");
      })
      .finally(() => setChatLoading(false));
  };

  const submitAssignment = (assignmentId, data) => {
    studentService
      .submitAssignment(assignmentId, data)
      .then((res) => {
        console.log("Assignment submitted:", res);
        // Refresh assignments list
        setAssignmentsLoading(true);
        studentService
          .getAssignments()
          .then((res) => setAssignments(res.data))
          .finally(() => setAssignmentsLoading(false));
      })
      .catch((err) => console.error("Submission error:", err));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div className="mb-10">
              <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">
                Welcome back
              </p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                {localStorage.getItem("name") || "Student"}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Here's your academic snapshot.
              </p>
            </div>

            {coursesLoading ||
            gradesLoading ||
            attendanceLoading ||
            assignmentsLoading ? (
              <p className="text-slate-500 text-sm">Loading overview…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <StatCard
                    label="Enrolled Courses"
                    value={courses.length}
                    color="text-amber-400"
                  />
                  <StatCard
                    label="Current GPA"
                    value={
                      grades.length > 0
                        ? (
                            grades.reduce((sum, g) => sum + g.value, 0) /
                            grades.length
                          ).toFixed(2)
                        : "N/A"
                    }
                    color="text-blue-300"
                  />
                  <StatCard
                    label="Assignments"
                    value={assignments.length}
                    color="text-emerald-400"
                  />
                  <StatCard
                    label="Attendance Rate"
                    color="text-purple-400"
                    {...(() => {
                      if (attendance.length === 0) return { value: "N/A", subtitle: "No sessions recorded yet" };

                      const courseGroups = attendance.reduce((acc, record) => {
                        const courseId = record.course_id;
                        if (!acc[courseId]) acc[courseId] = [];
                        acc[courseId].push(record);
                        return acc;
                      }, {});

                      let totalHoursPresent = 0;
                      let totalHoursScheduled = 0;

                      Object.values(courseGroups).forEach((records) => {
                        const hoursPresent = records.reduce((sum, r) => sum + r.hours_present, 0);
                        const weeksRecorded = new Set(records.map((r) => r.week_number)).size;
                        totalHoursPresent += hoursPresent;
                        totalHoursScheduled += weeksRecorded * 4;
                      });

                      const rate = totalHoursScheduled > 0
                        ? (totalHoursPresent / totalHoursScheduled) * 100
                        : 0;

                      const recordedCourses = Object.keys(courseGroups).length;
                      const totalCourses = courses.length;

                      return {
                        value: Math.round(rate) + "%",
                        subtitle: `${recordedCourses} of ${totalCourses} courses recorded`,
                      };
                    })()}
                  />
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                      My Courses
                    </h2>
                    <button
                      onClick={() => setActiveTab("courses")}
                      className="text-amber-400 hover:text-amber-300 text-xs font-medium transition"
                    >
                      View all →
                    </button>
                  </div>
                  {courses.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                      No courses enrolled yet.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {courses.slice(0, 3).map((enrollment, i) => (
                          <tr
                            key={enrollment.id}
                            className={`hover:bg-slate-950/40 transition-colors ${i < courses.slice(0, 3).length - 1 ? "border-b border-slate-800/60" : ""}`}
                          >
                            <td className="px-6 py-4 font-medium text-white">
                              {enrollment.courses?.title}
                            </td>
                            <td
                              className="px-6 py-4 text-slate-400 text-xs font-medium"
                              style={{ fontFamily: "'DM Mono', monospace" }}
                            >
                              {enrollment.courses?.code}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {enrollment.courses?.department || "—"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {enrollment.courses?.credits} cr
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h2 className="text-sm font-semibold text-white">
                      Recent Assignments
                    </h2>
                    <button
                      onClick={() => setActiveTab("assignments")}
                      className="text-amber-400 hover:text-amber-300 text-xs transition"
                    >
                      View all →
                    </button>
                  </div>
                  {assignments.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">
                      No assignments found.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {assignments.slice(0, 3).map((assignment, i) => (
                          <tr
                            key={assignment.id}
                            className={`hover:bg-slate-950/40 transition-colors ${i < assignments.slice(0, 3).length - 1 ? "border-b border-slate-800/60" : ""}`}
                          >
                            <td className="px-6 py-3.5">
                              <div className="font-medium text-white">{assignment.title}</div>
                              {assignment.course_name && (
                                <div className="text-xs text-slate-400 mt-0.5">{assignment.course_name}</div>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-slate-400 text-xs">
                              Due:{" "}
                              {new Date(
                                assignment.due_date,
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {new Date(assignment.due_date) > new Date()
                                  ? "Upcoming"
                                  : "Overdue"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case "courses":
        if (selectedCourse) {
          const courseAttendance = attendance.filter(
            (r) => r.course_id === selectedCourse.courses?.id
          );
          const courseGrades = grades.filter(
            (g) => g.course_id === selectedCourse.courses?.id
          );
          const totalSessions = courseAttendance.length;
          const presentCount = courseAttendance.filter(
            (r) => r.status === "present"
          ).length;
          const attendancePct =
            totalSessions > 0
              ? Math.round((presentCount / totalSessions) * 100)
              : null;
          const professorName =
            selectedCourse.courses?.professors?.users?.name || null;

          return (
            <div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to My Courses
              </button>

              <div className="mb-8">
                <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">
                  Course Detail
                </p>
                <h1 className="text-3xl font-semibold text-white tracking-tight">
                  {selectedCourse.courses?.title || "Unknown Course"}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {selectedCourse.courses?.code || "—"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedCourse.courses?.credits || 0} credits
                  </span>
                  {selectedCourse.courses?.department && (
                    <span className="text-xs text-slate-500">
                      {selectedCourse.courses.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Professor</p>
                  {professorName ? (
                    <p className="text-white font-semibold">{professorName}</p>
                  ) : (
                    <p className="text-slate-500 text-sm">Not assigned</p>
                  )}
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Attendance</p>
                  {attendancePct !== null ? (
                    <>
                      <p className="text-4xl font-semibold text-white mb-1">{attendancePct}%</p>
                      <p className="text-xs text-slate-500">{presentCount} / {totalSessions} sessions</p>
                    </>
                  ) : (
                    <p className="text-slate-500 text-sm">No records</p>
                  )}
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Grades</p>
                  {courseGrades.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {courseGrades.map((g) => (
                        <div key={g.id} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{g.grade_type || "Assessment"}</span>
                          <span className={`text-sm font-semibold ${g.value >= 90 ? "text-emerald-400" : g.value >= 70 ? "text-blue-400" : g.value >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                            {g.value ?? "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm mt-1">No grades recorded</p>
                  )}
                </div>
              </div>

            </div>
          );
        }

        return (
          <div>
            <div className="mb-8">
              <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">
                Academic
              </p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                My Courses
              </h1>
            </div>
            {coursesLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
                Loading courses…
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 bg-slate-800 border border-slate-700 rounded-xl">
                <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.25v6m0 0l4.5-4.5M12 12.25l-4.5-4.5"
                    />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">
                  No courses enrolled yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    onClick={() => setSelectedCourse(enrollment)}
                    className="bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl p-6 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {enrollment.courses?.code || "Unknown Code"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {enrollment.courses?.credits || 0} credits
                      </span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">
                      {enrollment.courses?.title || "Unknown Course"}
                    </h3>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Enrolled{" "}
                      {enrollment.enrolled_at
                        ? new Date(enrollment.enrolled_at).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "grades": {
        const enrolledIds = new Set(courses.map(e => e.course_id));
        const currentGrades = grades.filter(g => enrolledIds.has(g.course_id));
        const gradesByCourse = {};
        currentGrades.forEach(g => {
          if (!gradesByCourse[g.course_id]) gradesByCourse[g.course_id] = [];
          gradesByCourse[g.course_id].push(g);
        });
        const courseEntries = courses.map(e => ({
          courseId: e.course_id,
          title: e.courses?.title || "—",
          code: e.courses?.code || "—",
          credits: e.courses?.credits || 0,
          grades: gradesByCourse[e.course_id] || [],
        }));
        const gpa = currentGrades.length > 0
          ? (currentGrades.reduce((s, g) => s + g.value, 0) / currentGrades.length).toFixed(2)
          : null;
        const detail = selectedGradeCourse ? courseEntries.find(c => c.courseId === selectedGradeCourse) : null;

        return (
          <div>
            <div className="mb-8">
              <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">Academic</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Grades & GPA</h1>
            </div>

            {gradesLoading || coursesLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading grades…</div>
            ) : detail ? (
              /* ── Course detail view ── */
              <div>
                <button
                  onClick={() => setSelectedGradeCourse(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Back to courses
                </button>
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mb-6">
                  <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono text-amber-400 mb-1">{detail.code}</p>
                      <h2 className="text-lg font-semibold text-white">{detail.title}</h2>
                    </div>
                    {detail.grades.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Course Avg</p>
                        <p className={`text-2xl font-bold ${
                          (detail.grades.reduce((s,g) => s+g.value,0)/detail.grades.length) >= 90 ? "text-emerald-400"
                          : (detail.grades.reduce((s,g) => s+g.value,0)/detail.grades.length) >= 70 ? "text-amber-400"
                          : "text-rose-400"
                        }`}>
                          {(detail.grades.reduce((s,g) => s+g.value,0)/detail.grades.length).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                  {detail.grades.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">No grades recorded for this course yet.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {["Type", "Grade", "Weight", "Weighted Points"].map(h => (
                            <th key={h} className="text-left px-6 py-3 text-slate-500 font-medium text-xs uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.grades.map((g, i) => {
                          const weighted = g.weight ? ((g.value * g.weight) / 100).toFixed(1) : "—";
                          return (
                            <tr key={g.id || i} className={`${i < detail.grades.length - 1 ? "border-b border-slate-700/60" : ""}`}>
                              <td className="px-6 py-4">
                                <span className="text-xs font-medium px-2 py-0.5 rounded capitalize bg-blue-300/15 text-blue-300 border border-blue-400/30">{g.grade_type || "—"}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-semibold ${g.value >= 90 ? "text-emerald-400" : g.value >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                                  {g.value}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-sm">{g.weight != null ? `${g.weight}%` : "—"}</td>
                              <td className="px-6 py-4 text-slate-300 text-sm font-medium">{weighted !== "—" ? `${weighted} pts` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              /* ── Course list view ── */
              <>
                {/* GPA card */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Current GPA</h3>
                      {gpa ? (
                        <>
                          <p className="text-5xl font-bold text-amber-400">{gpa}</p>
                          <p className="text-sm text-slate-500 mt-1">Based on {currentGrades.length} grade{currentGrades.length !== 1 ? "s" : ""} this semester</p>
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm mt-1">No grades recorded yet this semester</p>
                      )}
                    </div>
                    {gpa && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Distribution</div>
                        <div className="space-y-1">
                          {[["A", 90], ["B", 80], ["C", 70], ["D", 60], ["F", 0]].map(([letter, min], li) => {
                            const max = li === 0 ? 101 : [90,80,70,60,101][li-1];
                            const count = currentGrades.filter(g => g.value >= min && g.value < max).length;
                            return (
                              <div key={letter} className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400 w-4">{letter}:</span>
                                <div className="w-20 bg-slate-700 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${letter==="A"?"bg-emerald-500":letter==="B"?"bg-blue-500":letter==="C"?"bg-amber-500":letter==="D"?"bg-orange-500":"bg-red-500"}`}
                                    style={{ width: currentGrades.length > 0 ? `${(count/currentGrades.length)*100}%` : "0%" }} />
                                </div>
                                <span className="text-slate-500 w-4 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course list */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700">
                    <h2 className="text-sm font-semibold text-white">Current Courses</h2>
                  </div>
                  {courseEntries.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 text-sm">No courses enrolled.</div>
                  ) : (
                    <div className="divide-y divide-slate-700/60">
                      {courseEntries.map(c => {
                        const avg = c.grades.length > 0
                          ? c.grades.reduce((s,g) => s+g.value, 0) / c.grades.length
                          : null;
                        return (
                          <button
                            key={c.courseId}
                            onClick={() => setSelectedGradeCourse(c.courseId)}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">{c.code}</span>
                              <div>
                                <p className="text-white text-sm font-medium">{c.title}</p>
                                <p className="text-slate-500 text-xs">{c.grades.length} grade{c.grades.length !== 1 ? "s" : ""} recorded · {c.credits} cr</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {avg !== null ? (
                                <span className={`text-sm font-semibold ${avg >= 90 ? "text-emerald-400" : avg >= 70 ? "text-amber-400" : "text-rose-400"}`}>
                                  {avg.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">No grades yet</span>
                              )}
                              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      }

      case "attendance": {
        const courseGroups = attendance.reduce((acc, record) => {
          const cid = record.course_id;
          if (!acc[cid]) acc[cid] = {
            courseTitle: record.courses?.title || "Unknown Course",
            courseCode: record.courses?.code || "Unknown Code",
            records: [],
          };
          acc[cid].records.push(record);
          return acc;
        }, {});
        const courseEntries = Object.entries(courseGroups);
        const activeCourseId = attendSelectedCourse || (courseEntries[0]?.[0] ?? '');
        const activeCourse = courseGroups[activeCourseId];

        const records = activeCourse?.records || [];
        const hoursPresent = records.reduce((s, r) => s + r.hours_present, 0);
        const weeksRecorded = new Set(records.map(r => r.week_number)).size;
        const hoursScheduled = weeksRecorded * 4;
        const rate = hoursScheduled > 0 ? (hoursPresent / hoursScheduled) * 100 : 0;
        const isFinalized = weeksRecorded >= 14;
        const sorted = [...records].sort((a, b) => b.week_number - a.week_number);
        const filtered = attendStatusFilter ? sorted.filter(r => r.status === attendStatusFilter) : sorted;

        const statusCounts = {
          present: records.filter(r => r.status === 'present').length,
          late: records.filter(r => r.status === 'late').length,
          absent: records.filter(r => r.status === 'absent').length,
        };

        return (
          <div>
            <div className="mb-6">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em] mb-1">Attendance</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Course Attendance</h1>
            </div>
            {attendanceLoading ? (
              <div className="text-slate-400">Loading attendance...</div>
            ) : attendance.length === 0 ? (
              <div className="text-slate-400">No attendance records found.</div>
            ) : (
              <>
                {/* Course selector tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {courseEntries.map(([cid, c]) => (
                    <button
                      key={cid}
                      onClick={() => { setAttendSelectedCourse(cid); setAttendStatusFilter('') }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        cid === activeCourseId
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c.courseCode}
                    </button>
                  ))}
                </div>

                {activeCourse && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{activeCourse.courseCode}</h3>
                        <p className="text-slate-300 mb-3">{activeCourse.courseTitle}</p>
                        <div className="flex gap-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">{statusCounts.present} present</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">{statusCounts.late} late</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">{statusCounts.absent} absent</span>
                        </div>
                      </div>
                      <CircularProgressBar percentage={rate} isFinalized={isFinalized} />
                    </div>

                    {/* Status filter */}
                    <div className="flex gap-2 mb-4">
                      {[['', 'All'], ['present', 'Present'], ['late', 'Late'], ['absent', 'Absent']].map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setAttendStatusFilter(val)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            attendStatusFilter === val
                              ? val === '' ? 'bg-slate-600 border-slate-500 text-white'
                                : val === 'present' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                : val === 'late' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Records */}
                    <div className="space-y-3">
                      {filtered.length === 0 ? (
                        <p className="text-slate-500 text-sm py-4 text-center">No {attendStatusFilter} records.</p>
                      ) : filtered.map(record => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${record.status === 'present' ? 'bg-emerald-600' : record.status === 'late' ? 'bg-amber-600' : 'bg-rose-600'}`}>
                              {record.week_number}
                            </div>
                            <div>
                              <p className="text-white font-medium capitalize">{record.status} — Week {record.week_number}</p>
                              <span className="text-sm text-slate-400">
                                {(() => {
                                  const toMins = t => { const [h, m] = (t || '').split(':').map(Number); return h * 60 + (m || 0) }
                                  const dur = (toMins(record.session_end) - toMins(record.session_start)) / 60
                                  return `${record.hours_present}/${dur > 0 ? dur : '?'}h attended`
                                })()}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-slate-400">{new Date(record.date).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }

      case "assignments":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Assignments</h2>
            {assignmentsLoading ? (
              <div className="text-slate-400">Loading assignments...</div>
            ) : assignments.length === 0 ? (
              <div className="text-slate-400">No assignments found</div>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-slate-400 mb-4">
                      {assignment.description}
                    </p>
                    <p className="text-slate-400 mb-4">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const content = prompt("Enter assignment content:");
                          if (content) {
                            submitAssignment(assignment.id, { content });
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition text-sm"
                      >
                        Submit Text
                      </button>
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,.doc,.docx,.txt,.zip";
                          input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              submitAssignment(assignment.id, { file });
                            }
                          };
                          input.click();
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition text-sm"
                      >
                        Upload File
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "materials":
        if (selectedMaterialsCourse) {
          return (
            <div>
              <button
                onClick={() => { setSelectedMaterialsCourse(null); setCourseMaterials([]); }}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Course Materials
              </button>
              <div className="mb-8">
                <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">Course Materials</p>
                <h1 className="text-3xl font-semibold text-white tracking-tight">
                  {selectedMaterialsCourse.courses?.title || "Unknown Course"}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {selectedMaterialsCourse.courses?.code || "—"}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                {materialsLoading ? (
                  <p className="text-slate-500 text-sm px-6 py-8 text-center">Loading materials…</p>
                ) : courseMaterials.length === 0 ? (
                  <p className="text-slate-500 text-sm px-6 py-8 text-center">No materials uploaded yet</p>
                ) : (
                  <div className="divide-y divide-slate-700/60">
                    {courseMaterials.map((m) => (
                      <a
                        key={m.id}
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 px-6 py-3 hover:bg-slate-700/40 transition-colors"
                      >
                        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{m.title || m.file_name}</p>
                          {m.title && m.file_name && m.title !== m.file_name && (
                            <p className="text-xs text-slate-500 truncate">{m.file_name}</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div>
            <div className="mb-8">
              <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">Academic</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Course Materials</h1>
              <p className="text-slate-500 text-sm mt-1">Select a course to view its materials</p>
            </div>
            {coursesLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading courses…</div>
            ) : courses.length === 0 ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">No courses enrolled</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((enrollment) => (
                  <button
                    key={enrollment.id}
                    onClick={() => {
                      setSelectedMaterialsCourse(enrollment);
                      setCourseMaterials([]);
                      setMaterialsLoading(true);
                      studentService
                        .getCourseMaterials(enrollment.courses?.id)
                        .then((res) => setCourseMaterials(res.data))
                        .catch(() => setCourseMaterials([]))
                        .finally(() => setMaterialsLoading(false));
                    }}
                    className="text-left bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl p-6 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        {enrollment.courses?.code || "—"}
                      </span>
                      <span className="text-xs text-slate-500">{enrollment.courses?.credits || 0} credits</span>
                    </div>
                    <h3 className="text-white font-semibold">{enrollment.courses?.title || "Unknown Course"}</h3>
                    <p className="text-xs text-slate-500 mt-2">
                      {enrollment.courses?.professors?.users?.name || "No professor assigned"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case "transcript": {
        const txGrades = transcript?.grades || [];
        const overallAvg = txGrades.length > 0
          ? Math.round(txGrades.reduce((s, g) => s + (g.value || 0), 0) / txGrades.length)
          : null;

        // Group grades by semester → course
        const bySemester = {};
        txGrades.forEach(g => {
          const sem = g.semester || "Unknown";
          if (!bySemester[sem]) bySemester[sem] = {};
          if (!bySemester[sem][g.course_id]) {
            bySemester[sem][g.course_id] = { info: g.courses, grades: [] };
          }
          bySemester[sem][g.course_id].grades.push(g);
        });

        // Sort semesters newest first
        const termOrder = { Spring: 2, Summer: 1, Fall: 3, Winter: 0 };
        const sortedSemesters = Object.keys(bySemester).sort((a, b) => {
          const [termA, yearA] = [a.split(" ")[0], parseInt(a.split(" ")[1]) || 0];
          const [termB, yearB] = [b.split(" ")[0], parseInt(b.split(" ")[1]) || 0];
          if (yearB !== yearA) return yearB - yearA;
          return (termOrder[termB] ?? 0) - (termOrder[termA] ?? 0);
        });

        return (
          <div>
            <div className="mb-8">
              <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">Academic</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Transcript</h1>
            </div>
            {transcriptLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Loading transcript…</div>
            ) : !transcript ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">Transcript not found</div>
            ) : (
              <div className="space-y-6">
                {/* Student info */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Student</p>
                      <h2 className="text-xl font-semibold text-white">{transcript.student?.users?.name || "—"}</h2>
                      <p className="text-slate-400 text-sm mt-0.5">{transcript.student?.users?.email || "—"}</p>
                      {transcript.student?.major && (
                        <p className="text-slate-500 text-xs mt-1">{transcript.student.major}</p>
                      )}
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Grades</p>
                        <p className="text-2xl font-semibold text-white">{txGrades.length}</p>
                      </div>
                      {overallAvg !== null && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Cumulative Avg</p>
                          <p className={`text-2xl font-semibold ${overallAvg >= 90 ? "text-emerald-400" : overallAvg >= 70 ? "text-blue-400" : overallAvg >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                            {overallAvg}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Semesters */}
                {sortedSemesters.length === 0 ? (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-10 text-center text-slate-500 text-sm">No grade history yet</div>
                ) : sortedSemesters.map(sem => {
                  const coursesInSem = Object.values(bySemester[sem]);
                  const semGrades = coursesInSem.flatMap(c => c.grades);
                  const semAvg = semGrades.length > 0
                    ? Math.round(semGrades.reduce((s, g) => s + (g.value || 0), 0) / semGrades.length)
                    : null;
                  return (
                    <div key={sem} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                      {/* Semester header */}
                      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white">{sem}</h2>
                        {semAvg !== null && (
                          <span className={`text-sm font-semibold ${semAvg >= 90 ? "text-emerald-400" : semAvg >= 70 ? "text-blue-400" : semAvg >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                            Avg {semAvg}%
                          </span>
                        )}
                      </div>
                      {/* Courses in semester */}
                      <div className="divide-y divide-slate-700/60">
                        {coursesInSem.map((course, idx) => {
                          const courseAvg = course.grades.length > 0
                            ? Math.round(course.grades.reduce((s, g) => s + (g.value || 0), 0) / course.grades.length)
                            : null;
                          return (
                            <div key={course.info?.id || idx} className="px-6 py-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                    {course.info?.code || "—"}
                                  </span>
                                  <span className="text-sm font-semibold text-white">{course.info?.title || "Unknown Course"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                  {course.info?.credits && <span>{course.info.credits} cr</span>}
                                  {courseAvg !== null && (
                                    <span className={`font-semibold text-sm ${courseAvg >= 90 ? "text-emerald-400" : courseAvg >= 70 ? "text-blue-400" : courseAvg >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                                      {courseAvg}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {course.grades.map(g => (
                                  <span key={g.id} className="text-xs flex items-center gap-1.5 bg-slate-700/50 border border-slate-600/40 px-2.5 py-1 rounded-lg">
                                    <span className="text-slate-400 capitalize">{g.grade_type || "Assessment"}:</span>
                                    <span className={`font-semibold ${g.value >= 90 ? "text-emerald-400" : g.value >= 70 ? "text-amber-400" : "text-rose-400"}`}>{g.value}%</span>
                                    {g.weight != null && <span className="text-slate-600">· {g.weight}% wt</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case "finance": {
        const fee = finance?.fee;
        const installments = finance?.installments || [];
        const transactions = finance?.transactions || [];
        const status = fee?.status || "pending";
        const fmt = (n) =>
          Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        return (
          <div>
            <div className="mb-8">
              <p className="text-amber-500 text-xs font-medium uppercase tracking-[0.2em] mb-1">
                Financial
              </p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">Finance</h1>
            </div>

            {financeLoading ? (
              <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
                Loading finance…
              </div>
            ) : !fee ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 bg-slate-800 border border-slate-700 rounded-xl">
                <p className="text-slate-400 text-sm font-medium">No fee record assigned yet.</p>
                <p className="text-slate-600 text-xs">Contact administration to set up your payment plan.</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                {(() => {
                  const scholarship = Number(fee.scholarship_amount || 0)
                  const originalFee = Number(fee.agreed_amount) + scholarship
                  return (
                    <div className={`grid gap-4 mb-8 ${scholarship > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-5">
                        <p className="text-xs text-blue-300 uppercase tracking-widest mb-1">Total Fee</p>
                        <p className="text-3xl font-semibold text-white">{fmt(originalFee)}</p>
                        <p className="text-xs text-blue-400 mt-1">{fee.academic_year}</p>
                      </div>
                      {scholarship > 0 && (
                        <div className="bg-violet-600/20 border border-violet-500/30 rounded-xl p-5">
                          <p className="text-xs text-violet-300 uppercase tracking-widest mb-1">Scholarship</p>
                          <p className="text-3xl font-semibold text-white">− {fmt(scholarship)}</p>
                          {fee.scholarship_reason && (
                            <p className="text-xs text-violet-400 mt-1 truncate">{fee.scholarship_reason}</p>
                          )}
                        </div>
                      )}
                      <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-5">
                        <p className="text-xs text-emerald-300 uppercase tracking-widest mb-1">Paid</p>
                        <p className="text-3xl font-semibold text-white">{fmt(fee.paid_amount)}</p>
                        <p className="text-xs text-emerald-400 mt-1">
                          {fmt(Number(fee.agreed_amount) - Number(fee.paid_amount))} remaining
                        </p>
                      </div>
                      <div
                        className={`rounded-xl p-5 border ${
                          status === "settled"
                            ? "bg-emerald-600/20 border-emerald-500/30"
                            : status === "partial"
                              ? "bg-amber-600/20 border-amber-500/30"
                              : "bg-rose-600/20 border-rose-500/30"
                        }`}
                      >
                        <p
                          className={`text-xs uppercase tracking-widest mb-1 ${
                            status === "settled"
                              ? "text-emerald-300"
                              : status === "partial"
                                ? "text-amber-300"
                                : "text-rose-300"
                          }`}
                        >
                          Status
                        </p>
                        <p className="text-3xl font-semibold text-white capitalize">{status}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Sub-tabs */}
                <FinanceSubTabs
                  installments={installments}
                  transactions={transactions}
                  fmt={fmt}
                />
              </>
            )}
          </div>
        );
      }

      case "mia":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">M.I.A AI Adviser</h2>
            <div className="flex gap-4 h-[600px]">
              {/* Sidebar */}
              <div className="w-64 flex-shrink-0 bg-slate-900 border border-slate-800 rounded-lg flex flex-col">
                <div className="p-3 border-b border-slate-800">
                  <button
                    onClick={startNewChat}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition"
                  >
                    + New Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {sessionsLoading ? (
                    <p className="text-slate-500 text-xs px-2 py-1">Loading...</p>
                  ) : sessions.length === 0 ? (
                    <p className="text-slate-500 text-xs px-2 py-1">No previous chats</p>
                  ) : (
                    sessions.map((s) => {
                      const preview = sessionPreviews[s.id];
                      const ts = s.started_at ? new Date(s.started_at) : null;
                      const dateStr = ts
                        ? ts.toLocaleDateString(undefined, { day: "numeric", month: "short" })
                        : "";
                      const timeStr = ts
                        ? ts.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                        : "";
                      const isActive = selectedSessionId === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`group flex items-start gap-1 rounded-lg text-sm transition ${
                            isActive
                              ? "bg-blue-700 text-white"
                              : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <button
                            onClick={() => loadSession(s.id)}
                            className="flex-1 text-left px-3 py-2 min-w-0"
                          >
                            <p className={`font-medium truncate leading-snug ${preview ? "" : "text-slate-500 italic"}`}>
                              {preview
                                ? preview.length > 30
                                  ? preview.slice(0, 30) + "…"
                                  : preview
                                : "Empty chat"}
                            </p>
                            <p className={`text-xs mt-0.5 ${isActive ? "text-blue-200" : "text-slate-500"}`}>
                              {dateStr}{timeStr ? ` · ${timeStr}` : ""}
                            </p>
                          </button>
                          <button
                            onClick={(e) => deleteSession(e, s.id)}
                            title="Delete chat"
                            className={`opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 mt-1 rounded transition ${
                              isActive ? "hover:bg-blue-600 text-blue-200" : "hover:bg-slate-700 text-slate-500"
                            }`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat area */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg flex flex-col p-4">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-slate-400">
                      Start a conversation with M.I.A...
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-blue-900/30 text-blue-300 ml-auto max-w-md"
                            : "bg-slate-800 text-slate-300 max-w-md"
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {msg.role === "user" ? "You" : "M.I.A"}
                        </p>
                        <p>{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
                {chatError && <p className="text-rose-400 text-sm mb-2">{chatError}</p>}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask M.I.A anything about your academic journey..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-400"
                    disabled={chatLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-6 py-2 rounded-lg transition"
                  >
                    {chatLoading ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <DashboardNav
        role="student"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setSelectedCourse(null); setSelectedMaterialsCourse(null); }}
      />
      <main className="p-8 max-w-6xl mx-auto">{renderTabContent()}</main>
    </div>
  );
}

function StatCard({ label, value, color, subtitle }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <p className={`text-4xl font-semibold ${color} mb-1`}>{value}</p>
      <p className="text-slate-500 text-sm uppercase tracking-[0.1em]">
        {label}
      </p>
      {subtitle && (
        <p className="text-slate-600 text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function FinanceSubTabs({ installments, transactions, fmt }) {
  const [sub, setSub] = useState("installments");
  return (
    <div>
      <div className="flex gap-1 mb-6 bg-slate-800/60 p-1 rounded-lg border border-slate-700 w-fit">
        {[{ id: "installments", label: "Installments" }, { id: "transactions", label: "Transactions" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${sub === t.id ? "bg-amber-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "installments" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {installments.length === 0 ? (
            <p className="px-6 py-8 text-slate-500 text-sm text-center">No installments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {["Expiration Date", "Description", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, i) => (
                  <tr key={inst.id} className={`hover:bg-slate-900/40 transition-colors ${i < installments.length - 1 ? "border-b border-slate-700/60" : ""}`}>
                    <td className="px-4 py-3 text-slate-300 text-xs font-mono">{inst.due_date}</td>
                    <td className="px-4 py-3 text-white">{inst.description}</td>
                    <td className="px-4 py-3 text-white font-medium">{fmt(inst.amount)}</td>
                    <td className="px-4 py-3">
                      {inst.paid ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Paid</span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-700 text-slate-400 border border-slate-600">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td colSpan={2} className="px-4 py-3 text-slate-500 text-xs">Totals</td>
                  <td className="px-4 py-3 text-white font-semibold">{fmt(installments.reduce((s, i) => s + Number(i.amount), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {sub === "transactions" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {transactions.length === 0 ? (
            <p className="px-6 py-8 text-slate-500 text-sm text-center">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {["Issue Date", "Doc Type", "Doc No", "Explanation", "Amount"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className={`hover:bg-slate-900/40 transition-colors ${i < transactions.length - 1 ? "border-b border-slate-700/60" : ""}`}>
                    <td className="px-4 py-3 text-slate-300 text-xs font-mono">{tx.issue_date}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">{tx.doc_type}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{tx.doc_no || "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{tx.explanation || "—"}</td>
                    <td className="px-4 py-3 text-emerald-400 font-semibold">+{fmt(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td colSpan={4} className="px-4 py-3 text-slate-500 text-xs">Totals</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">+{fmt(transactions.reduce((s, t) => s + Number(t.amount), 0))}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function CircularProgressBar({
  percentage,
  size = 120,
  strokeWidth = 8,
  isFinalized = false,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10b981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-white">
          {percentage.toFixed(1)}%
        </p>
        {isFinalized && <p className="text-xs text-slate-400">finalized</p>}
      </div>
    </div>
  );
}
