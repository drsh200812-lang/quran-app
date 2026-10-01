import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import LoginScreen from './LoginScreen';

const SUPABASE_URL = 'https://lyqchmmrfwmbclarkzzz.supabase.co';
const SUPABASE_ANON_KEY = 'ضع_مفتاح_ANON_KEY_هنا';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [sessionData, setSessionData] = useState(null);
  const [activeTab, setActiveTab] = useState('progress');
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [newLesson, setNewLesson] = useState('');
  const [nearReview, setNearReview] = useState('');
  const [farReview, setFarReview] = useState('');
  const [score, setScore] = useState('ممتاز');
  const [points, setPoints] = useState(5);

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [examCycle, setExamCycle] = useState('امتحانات الربع الأول 2026');
  const [successRate, setSuccessRate] = useState('');
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    if (sessionData) {
      fetchBranches();
      fetchEmployees();
      if (sessionData.branchId) {
        setSelectedBranch(sessionData.branchId);
      }
    }
  }, [sessionData]);

  useEffect(() => {
    if (selectedBranch) {
      fetchStudentsByBranch(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('*');
    if (data) setBranches(data);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*');
    if (data) setEmployees(data);
  };

  const fetchStudentsByBranch = async (bId) => {
    const { data } = await supabase.from('students').select('*').eq('branch_id', bId);
    if (data) setStudents(data);
  };

  if (!sessionData) {
    return <LoginScreen onLoginSuccess={(data) => setSessionData(data)} />;
  }

  const handleSaveProgress = async () => {
    if (!selectedStudent) return alert('الرجاء اختيار الطالب أولاً');

    await supabase.from('student_attendance').insert([{
      student_id: selectedStudent.id,
      branch_id: selectedBranch || sessionData.branchId,
      status: attendanceStatus,
      attendance_date: new Date().toISOString().split('T')[0]
    }]);

    if (attendanceStatus === 'present') {
      await supabase.from('student_progress').insert([{
        student_id: selectedStudent.id,
        new_lesson: newLesson,
        near_review: nearReview,
        far_review: farReview,
        score: score,
        behavior_points: points,
        record_date: new Date().toISOString().split('T')[0]
      }]);
    }

    alert('تم حفظ المتابعة بنجاح!');

    if (selectedStudent.parent_mobile) {
      const msg = `السلام عليكم ورحمة الله وبركاته 🌹
تلميذنا العزيز: *${selectedStudent.full_name || selectedStudent.name}*
📅 تقرير اليوم:
- الحضور: ${attendanceStatus === 'present' ? 'حاضر ✅' : 'غائب ❌'}
${attendanceStatus === 'present' ? `- الحفظ الجديد: ${newLesson}
- المراجعة: ${nearReview}
- التقييم: ${score}
- النقاط التشجيعية: +${points} 🌟` : ''}`;

      window.open(`https://wa.me/${selectedStudent.parent_mobile}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const handleRecordExam = async () => {
    if (!selectedEmployee || !successRate) return alert('يرجى استكمال البيانات');

    const { data, error } = await supabase.rpc('record_exam_evaluation', {
      p_employee_id: parseInt(selectedEmployee),
      p_branch_id: parseInt(selectedBranch || sessionData.branchId || 1),
      p_exam_cycle_name: examCycle,
      p_success_percentage: parseFloat(successRate),
      p_is_supervisor: isSupervisor
    });

    if (!error) {
      alert(`تم تسجيل الامتحان بنجاح! المكافأة المترتبة حسب الشريحة: ${data} جنيه`);
      setSuccessRate('');
    } else {
      alert('حدث خطأ أثناء تسجيل الامتحان');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans" dir="rtl">
      <header className="bg-emerald-800 text-white p-4 shadow-lg flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg md:text-xl font-bold">📖 منصة إدارة المجمعات القرآنية</h1>
          <span className="bg-emerald-900 text-xs px-2.5 py-1 rounded-full border border-emerald-600">
            الصلاحية: {sessionData.role === 'super_admin' ? '👑 مشرف عام' : sessionData.role === 'branch_manager' ? '🏢 مدير فرع' : '📖 معلمة'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1 overflow-x-auto">
            <button onClick={() => setActiveTab('progress')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold ${activeTab === 'progress' ? 'bg-white text-emerald-800' : 'bg-emerald-900 text-white'}`}>المتابعة والواتساب</button>
            {sessionData.role !== 'teacher' && (
              <>
                <button onClick={() => setActiveTab('exams')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold ${activeTab === 'exams' ? 'bg-white text-emerald-800' : 'bg-emerald-900 text-white'}`}>الشرائح والامتحانات</button>
                <button onClick={() => setActiveTab('payroll')} className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold ${activeTab === 'payroll' ? 'bg-white text-emerald-800' : 'bg-emerald-900 text-white'}`}>التسوية والرواتب</button>
              </>
            )}
          </div>
          <button onClick={() => setSessionData(null)} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">خروج</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 md:p-6">
        {sessionData.role === 'super_admin' && (
          <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-slate-200">
            <label className="block text-xs font-bold text-slate-600 mb-1">اختر الفرع المستهدف:</label>
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50 font-bold">
              <option value="">-- كافة الفروع --</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-md font-bold text-emerald-800 border-b pb-2">📋 دفتر المتابعة اليومي للطلاب</h2>
            <div>
              <label className="block text-xs font-bold mb-1">اختر الطالب:</label>
              <select onChange={(e) => setSelectedStudent(students.find(s => s.id === parseInt(e.target.value)))} className="w-full p-2 border rounded-lg bg-slate-50">
                <option value="">-- اختر الطالب --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name || s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setAttendanceStatus('present')} className={`flex-1 py-2 rounded-lg font-bold border text-sm ${attendanceStatus === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>حاضر ✅</button>
              <button onClick={() => setAttendanceStatus('absent')} className={`flex-1 py-2 rounded-lg font-bold border text-sm ${attendanceStatus === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-100'}`}>غائب ❌</button>
            </div>

            {attendanceStatus === 'present' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                <input type="text" placeholder="الدرس الجديد" value={newLesson} onChange={e => setNewLesson(e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
                <input type="text" placeholder="المراجعة القريبة" value={nearReview} onChange={e => setNearReview(e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
                <input type="text" placeholder="المراجعة البعيدة" value={farReview} onChange={e => setFarReview(e.target.value)} className="w-full p-2 border rounded text-sm bg-white" />
                <div className="flex gap-2">
                  <select value={score} onChange={e => setScore(e.target.value)} className="flex-1 p-2 border rounded bg-white text-sm">
                    <option value="ممتاز مرتفع ⭐">ممتاز مرتفع ⭐</option>
                    <option value="ممتاز">ممتاز</option>
                    <option value="جيد جداً">جيد جداً</option>
                  </select>
                  <input type="number" value={points} onChange={e => setPoints(parseInt(e.target.value))} className="w-20 p-2 border rounded text-center font-bold text-sm bg-white" />
                </div>
              </div>
            )}

            <button onClick={handleSaveProgress} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow text-sm">
              💬 حفظ المتابعة وإرسال التقرير عبر الواتساب
            </button>
          </div>
        )}

        {activeTab === 'exams' && sessionData.role !== 'teacher' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-md font-bold text-emerald-800 border-b pb-2">🎯 رصد امتحانات الفصول وحساب الشرائح</h2>
            <div>
              <label className="block text-xs font-bold mb-1">اختر المعلمة / المشرفة:</label>
              <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full p-2 border rounded-lg bg-slate-50">
                <option value="">-- اختر من القائمة --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name || emp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">دورة الامتحان (كل 2 أو 3 أشهر):</label>
              <input type="text" value={examCycle} onChange={e => setExamCycle(e.target.value)} className="w-full p-2 border rounded text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">نسبة نجاح الفصل (%):</label>
              <input type="number" placeholder="مثال: 88.5" value={successRate} onChange={e => setSuccessRate(e.target.value)} className="w-full p-2 border rounded text-sm font-bold" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="supCheck" checked={isSupervisor} onChange={e => setIsSupervisor(e.target.checked)} />
              <label htmlFor="supCheck" className="text-xs font-bold">تطبيق شرائح مكافأة الإشراف</label>
            </div>

            <button onClick={handleRecordExam} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-lg shadow text-sm">
              🎯 اعتماد النسبة وحساب المكافأة تلقائياً
            </button>
          </div>
        )}

        {activeTab === 'payroll' && sessionData.role !== 'teacher' && (
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-md font-bold text-emerald-800 border-b pb-2">💳 كشف التسويات المالية والرواتب</h2>
            <p className="text-xs text-slate-600">تُحسب الرواتب بدمج: الراتب الأساسي + مكافأة شريحة الامتحانات - خصومات البصمة والغياب.</p>
            <button onClick={() => alert('تم اعتماد الكشف الشامل وإغلاق الشهر المالي بنجاح!')} className="w-full bg-emerald-800 text-white font-bold py-3 rounded-lg shadow text-sm">
              💾 اعتماد تسوية الرواتب وإصدار الكشوفات
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
