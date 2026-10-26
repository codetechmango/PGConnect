import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/authContext';

export default function SignUpPage() {
  const router = useRouter();
  const { role, phone: initialPhone } = router.query;
  const { signUp } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'resident' | 'owner'>(
    role === 'owner' ? 'owner' : 'resident'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState((initialPhone as string) || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g., name@gmail.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and retype.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service & Model Tenancy Compliance.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const isOwner = selectedRole === 'owner';
    const res = await signUp(cleanEmail, password, fullName.trim(), cleanPhone, isOwner);
    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.requiresEmailConfirmation) {
      setConfirmationSent(true);
    } else {
      router.replace(isOwner ? '/owner/dashboard' : '/resident/dashboard');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md antialiased">
      <Head>
        <title>Create Account | PG Connect</title>
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
            <span className="text-on-surface-variant">Already registered?</span>
            <Link href="/auth/signin" className="text-primary hover:underline font-bold">
              Sign In →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 w-full pt-24 pb-12 flex items-center justify-center">
        <div className="max-w-xl w-full mx-auto px-4 sm:px-6 py-4">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-outline-variant/40 shadow-xl space-y-6">
            {confirmationSent ? (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-on-surface font-headline-md">
                    Check Your Inbox
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
                    We&apos;ve sent a verification link to <strong className="text-on-surface">{email.trim().toLowerCase()}</strong>. Click the link in that email to activate your account.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-left text-xs space-y-2 text-on-surface-variant">
                  <p className="font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">tips_and_updates</span>
                    Tip for Instant Registration:
                  </p>
                  <p className="leading-relaxed">
                    To bypass email confirmation during testing, go to your <strong>Supabase Dashboard &gt; Authentication &gt; Providers &gt; Email</strong> and turn OFF <strong>Confirm email</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={`/auth/signin?role=${selectedRole}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">login</span>
                    <span>Proceed to Sign In</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmationSent(false)}
                    className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-outline-variant/50 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Edit Registration Details
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                    Verified Resident &amp; Owner Network
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface font-headline-md mt-1">
                    Create Your Account
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Zero brokerage, digital rent agreements, and escrow deposit safety.
                  </p>
                </div>

                {/* Role Switcher */}
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                    I am registering as:
                  </p>
                  <div className="grid grid-cols-2 p-1.5 bg-surface-container-low rounded-2xl gap-1.5 border border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('resident')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                        selectedRole === 'resident'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span>Student / Tenant</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('owner')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                        selectedRole === 'owner'
                          ? 'bg-white shadow-sm text-primary'
                          : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">apartment</span>
                      <span>PG Owner / Host</span>
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs font-medium space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-red-600 text-lg mt-0.5 shrink-0">error</span>
                      <div className="flex-1 whitespace-pre-line leading-relaxed text-[13px]">{errorMessage}</div>
                    </div>
                    {errorMessage.includes('already exists') && (
                      <div className="pt-2 border-t border-red-200/60 flex items-center justify-between text-xs font-semibold">
                        <span className="text-red-700">Already registered?</span>
                        <Link
                          href={`/auth/signin?role=${selectedRole}`}
                          className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>Sign In to your account</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Email Address</label>
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
                <label className="block text-xs font-bold text-on-surface mb-1">Mobile Number (WhatsApp)</label>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-primary cursor-pointer"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  I agree to PG Connect&apos;s Terms of Service, Privacy Policy, and Model Tenancy Act digital agreement protocol.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    <span>
                      {selectedRole === 'owner' ? 'Register as PG Owner' : 'Create Resident Account'}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-surface-container-low text-center text-xs text-on-surface-variant">
              <span>Already have an account? </span>
              <Link href="/auth/signin" className="text-primary font-bold hover:underline">
                Sign in here
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  </main>
</div>
  );
}
