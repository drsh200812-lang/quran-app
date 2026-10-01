import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lyqchmmrfwmbclarkzzz.supabase.co';
const SUPABASE_ANON_KEY = 'ضع_مفتاح_ANON_KEY_هنا';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setErrorMessage('خطأ في البريد الإلكتروني أو كلمة المرور');
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role_name, branch_id, employee_id')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      setErrorMessage('لم يتم العثور على صلاحيات مرتبطة بهذا الحساب. يرجى مراجعة المشرف العام.');
      setLoading(false);
      return;
    }

    setLoading(false);
    
    onLoginSuccess({
      user: authData.user,
      role: roleData.role_name,
      branchId: roleData.branch_id,
      employeeId: roleData.employee_id
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-700 text-2xl font-bold">
            📖
          </div>
          <h1 className="text-2xl font-bold text-slate-800">تسجيل الدخول للمنصة</h1>
          <p className="text-xs text-slate-500 mt-1">منصة إدارة الفروع والمجمعات القرآنية والرواتب</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg text-center font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">البريد الإلكتروني:</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور:</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              dir="ltr"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-200 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'جاري التحقق من الصلاحيات...' : 'دخول إلى لوحة التحكم 🚀'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400 border-t pt-4">
          نظام محمي ببيانات مشفرة وصلاحيات إدارية دقيقة 🔒
        </div>
      </div>
    </div>
  );
}
