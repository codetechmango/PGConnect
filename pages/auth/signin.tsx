import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/authContext';

export default function SignInPage() {
  const router = useRouter();
  const { role } = router.query;
  const { signIn } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'resident' | 'owner'>(
    role === 'owner' ? 'owner' : 'resident'
  );
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('password');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (authMode === 'otp') {
      if (!otpSent) {
        // Send OTP
        setTimeout(() => {
          setOtpSent(true);
          setLoading(false);
        }, 600);
        return;
      }
      // Verify OTP (simulate or sign in with mock email)
      const simulatedEmail = `${phone.replace(/\D/g, '')}@pgconnect.user`;
      const res = await signIn(simulatedEmail, 'Password123!');
      setLoading(false);
      if (res.error) {
        // If user not registered yet, direct to signup
        router.push(`/auth/signup?phone=${phone}&role=${selectedRole}`);
      } else {
        router.push(selectedRole === 'owner' ? '/owner/dashboard' : '/resident/dashboard');
      }
      return;
    }

    // Email & Password Mode
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setLoading(false);
      setErrorMessage('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    const res = await signIn(cleanEmail, password);
    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      const actualIsOwner =
        (res.profile?.role || '').toUpperCase() === 'OWNER' ||
        (selectedRole === 'owner' && res.profile?.role !== 'USER');
      const redirectUrl = router.query.redirect as string;
      if (redirectUrl) {
        if (redirectUrl.startsWith('/owner') && !actualIsOwner) {
          router.replace('/resident/dashboard');
        } else if (redirectUrl.startsWith('/resident') && actualIsOwner) {
          router.replace('/owner/dashboard');
        } else {
          router.replace(redirectUrl);
        }
      } else {
        router.replace(actualIsOwner ? '/owner/dashboard' : '/resident/dashboard');
      }
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md antialiased">
      <Head>
        <title>Sign In | PG Connect Portal</title>
      </Head>

      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-outline-variant/30 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Explore</span>
            </Link>
            <div className="h-4 w-px bg-outline-variant/40 hidden sm:block"></div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
              </div>
              <span className="font-bold text-lg text-primary tracking-tight font-headline-sm">
                PG CONNECT
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-primary flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/60 hidden sm:inline-flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Portal Login
            </span>
            <Link href="/auth/signup" className="text-secondary hover:underline">
              New here? Register →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 w-full pt-24 pb-12 flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* LEFT COLUMN: Brand Showcase & Institutional Trust (5 Cols) */}
            <div className="lg:col-span-5 relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1f4a] via-[#12285e] to-[#00236f] text-white p-8 lg:p-10 shadow-2xl">
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/25 blur-3xl pointer-events-none"></div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[15px]">verified_user</span>
                    Verified Sanctuary
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    48K+ Happy Residents
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight font-headline-lg">
                    Find a PG That Feels Like Home.
                  </h2>
                  <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
                    Seamless access to verified rooms, daily chef menus, biometric turnstile gate passes, and guaranteed escrow protection.
                  </p>
                </div>

                {/* 4 Value Pillars Bento Box */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                      <span className="text-xs font-bold">Escrow Guard</span>
                    </div>
                    <p className="text-[11px] text-blue-100/80 leading-snug">
                      100% deposit locked in ICICI Bank escrow until checkout.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1">
                      <span className="material-symbols-outlined text-[18px]">restaurant</span>
                      <span className="text-xs font-bold">FSSAI Certified</span>
                    </div>
                    <p className="text-[11px] text-blue-100/80 leading-snug">
                      3 daily meals with verified kitchen hygiene scorecards.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                      <span className="text-xs font-bold">6-Hr SLA</span>
                    </div>
                    <p className="text-[11px] text-blue-100/80 leading-snug">
                      Doorstep maintenance fixes with SLA delay rebate.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-300 mb-1">
                      <span className="material-symbols-outlined text-[18px]">passkey</span>
                      <span className="text-xs font-bold">Keyless Pass</span>
                    </div>
                    <p className="text-[11px] text-blue-100/80 leading-snug">
                      Dynamic OTP turnstile gate pass right on your phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Testimonial Card */}
              <div className="relative z-10 mt-8 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-400 text-slate-900 font-bold flex items-center justify-center text-sm shadow-md">
                    AS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Arjun Sharma</p>
                    <p className="text-[11px] text-emerald-300">Software Engineer • Koramangala, BLR</p>
                  </div>
                  <div className="ml-auto flex text-amber-300">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="material-symbols-outlined text-[16px]">star</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-blue-100 italic leading-relaxed">
                  &ldquo;Moving to Bangalore was effortless with PG Connect. Instant deposit escrow receipts, real food menu updates every morning, and zero broker fees!&rdquo;
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Authentication Hub & Role Switcher (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-outline-variant/40 shadow-xl flex flex-col justify-between">
              <div>
                {/* Role Switcher */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    Select Your Portal
                  </p>
                  <div className="grid grid-cols-2 p-1.5 bg-surface-container-low rounded-2xl gap-1.5 border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('resident')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${selectedRole === 'resident'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-on-surface-variant hover:text-primary'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span>Student &amp; Resident</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('owner')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${selectedRole === 'owner'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-on-surface-variant hover:text-primary'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">apartment</span>
                      <span>PG Owner / Partner</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-primary">
                        HUB
                      </span>
                    </button>
                  </div>
                </div>

                {/* Welcome Greeting */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mb-1 font-headline-md">
                    Sign in to your account
                  </h1>
                  <p className="text-xs sm:text-sm text-on-surface-variant">
                    {selectedRole === 'owner'
                      ? 'Access your property roster, bed matrix, and automated rent collection ledger.'
                      : 'Enter your credentials to access your room details, food menu, and service tickets.'}
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-red-600 text-lg mt-0.5 shrink-0">error</span>
                      <div className="flex-1 whitespace-pre-line leading-relaxed text-[13px]">{errorMessage}</div>
                    </div>
                    {errorMessage.includes('credentials') && (
                      <div className="pt-2 border-t border-red-200/60 flex items-center justify-between text-xs font-semibold">
                        <span className="text-red-700">Need a new account?</span>
                        <Link
                          href={`/auth/signup?role=${selectedRole}`}
                          className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Register here</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode Tabs: OTP vs Password */}
                <div className="flex items-center gap-6 border-b border-outline-variant/30 mb-6">
                  <button
                    type="button"
                    onClick={() => setAuthMode('password')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${authMode === 'password'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-on-surface-variant hover:text-primary'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                    <span>Email &amp; Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMode('otp')}
                    className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors ${authMode === 'otp'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-on-surface-variant hover:text-primary'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    <span>WhatsApp / SMS OTP</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {authMode === 'password' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-bold text-on-surface">Password</label>
                          <a href="#" className="text-xs text-primary hover:underline font-semibold">
                            Forgot Password?
                          </a>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-on-surface-variant hover:text-on-surface"
                          >
                            <span className="material-symbols-outlined text-lg">
                              {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Registered Mobile Number
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs text-on-surface-variant font-bold">+91</span>
                        <input
                          type="tel"
                          required
                          placeholder="9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-11 pl-12 pr-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {otpSent && (
                        <div className="mt-3">
                          <label className="block text-xs font-bold text-on-surface mb-1">
                            Enter 6-digit verification code
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-center tracking-widest text-lg font-bold border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">login</span>
                        <span>
                          {authMode === 'otp' && !otpSent
                            ? 'Send Verification OTP'
                            : `Sign In to ${selectedRole === 'owner' ? 'Owner Hub' : 'Resident Portal'}`}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switcher */}
                <div className="mt-6 text-center text-xs text-on-surface-variant">
                  <span>Don&apos;t have an account yet? </span>
                  <Link
                    href={`/auth/signup?role=${selectedRole}`}
                    className="text-primary font-bold hover:underline"
                  >
                    Create an account
                  </Link>
                </div>
              </div>

              {/* Bottom Security Note */}
              <div className="pt-6 border-t border-surface-container-low mt-8 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-sm">lock</span>
                  <span>256-Bit SSL Encrypted Session</span>
                </span>
                <span>Model Tenancy Act Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
