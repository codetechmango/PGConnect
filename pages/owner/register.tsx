import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { supabase, getCurrentUser } from '../../lib/supabaseClient';
import { User } from '../../types';
import { 
  UserIcon, 
  PhoneIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface OwnerRegistrationForm {
  full_name: string;
  phone: string;
  agree_terms: boolean;
}

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<OwnerRegistrationForm>();

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  const checkUserAndRedirect = async () => {
    try {
      const { user } = await getCurrentUser();
      
      if (!user) {
        router.push('/auth/signin?redirect=/owner/register');
        return;
      }

      setUser(user);

      // Check if user is already an owner
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_owner')
        .eq('id', user.id)
        .single();

      if (profile?.is_owner) {
        router.push('/owner/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: OwnerRegistrationForm) => {
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      // Update user profile to include owner information
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formData.full_name,
          phone: formData.phone,
          is_owner: true,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register as owner');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to PG Finder! Redirecting to your dashboard...
          </p>
          <div className="animate-pulse bg-blue-100 text-blue-800 px-4 py-2 rounded-lg inline-block">
            Setting up your owner account...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Become a PG Owner - PG Finder</title>
        <meta name="description" content="Register as a PG owner and start listing your properties" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Become a PG Owner
            </h1>
            <p className="text-gray-600">
              Join thousands of property owners and start earning from your PG
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Why list with PG Finder?
            </h2>
            <div className="space-y-3">
              {[
                'Reach thousands of potential tenants',
                'Easy property management tools',
                'Secure booking and payment system',
                'Professional photography support',
                '24/7 customer support'
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is your registered email address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  {...register('full_name', { 
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('phone', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Please enter a valid 10-digit Indian phone number'
                      }
                    })}
                    type="tel"
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Tenants will use this number to contact you
                </p>
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    {...register('agree_terms', { 
                      required: 'You must agree to the terms and conditions' 
                    })}
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agree_terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.agree_terms.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Registering...' : 'Register as Owner'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Already registered as an owner?{' '}
              <a href="/owner/dashboard" className="text-blue-600 hover:underline">
                Go to Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
