import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { supabase, getCurrentUser } from '../../lib/supabaseClient';
import { OwnerRegistrationForm } from '../../types';
import { User } from '@supabase/supabase-js';
import { 
  UserIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<OwnerRegistrationForm>();

  const checkUserStatus = useCallback(async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin?redirect=/owner/register');
        return;
      }

      setUser(currentUser);

      // Check if user is already an owner
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_owner')
        .eq('id', currentUser.id)
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
  }, [router]);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const onSubmit = async (data: OwnerRegistrationForm) => {
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      // Update profile to mark as owner
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: data.full_name,
          phone: data.phone,
          is_owner: true,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Failed to register as owner');
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
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Full Name</span>
                  </div>
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>Phone Number</span>
                  </div>
                </label>
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[6-9]\d{9}$/,
                      message: 'Please enter a valid 10-digit Indian mobile number'
                    }
                  })}
                  type="tel"
                  placeholder="Enter your mobile number"
                  className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  We&apos;ll use this to connect you with potential tenants
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Access to owner dashboard</li>
                  <li>• Add your first PG listing</li>
                  <li>• Start receiving booking requests</li>
                  <li>• Manage your properties easily</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Setting up your account...
                  </div>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By registering, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}