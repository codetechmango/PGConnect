import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase, getCurrentUser } from '../../lib/supabaseClient';
import { PG, FormData } from '../../types';
import { User } from '@supabase/supabase-js';
import OwnerForm from '../../components/OwnerForm';
import PGCard from '../../components/PGCard';
import {
  PlusIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPG, setEditingPG] = useState<PG | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPGs: 0,
    totalBookings: 0,
    totalRevenue: 0,
    occupancyRate: 0
  });

  const loadOwnerPGs = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pgs')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPgs(data || []);
    } catch (error) {
      console.error('Error loading PGs:', error);
    }
  }, []);

  const loadStats = useCallback(async (userId: string) => {
    try {
      // Get total PGs count
      const { count: totalPGs } = await supabase
        .from('pgs')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      // Get bookings for owner's PGs
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          pg:pgs!inner(owner_id)
        `)
        .eq('pg.owner_id', userId);

      if (bookingsError) throw bookingsError;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + booking.total_amount, 0) || 0;

      // Calculate occupancy rate (simplified)
      const totalRooms = pgs.reduce((sum, pg) => sum + pg.available_rooms, 0);
      const occupiedRooms = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      setStats({
        totalPGs: totalPGs || 0,
        totalBookings,
        totalRevenue,
        occupancyRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [pgs]);

  const checkUserAndLoadData = useCallback(async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin?redirect=/owner/dashboard');
        return;
      }

      // Check if user is an owner
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!profile?.is_owner) {
        router.push('/owner/register');
        return;
      }

      setUser(currentUser);
      await loadOwnerPGs(currentUser.id);
      await loadStats(currentUser.id);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [router, loadOwnerPGs, loadStats]);

  useEffect(() => {
    checkUserAndLoadData();
  }, [checkUserAndLoadData]);


  const handleCreatePG = async (formData: FormData) => {
    if (!user) return;

    setFormLoading(true);
    try {
      const { data, error } = await supabase
        .from('pgs')
        .insert([{
          ...formData,
          owner_id: user.id,
          rating: 0,
          total_reviews: 0,
          images: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setPgs(prev => [data, ...prev]);
      setShowCreateForm(false);
      alert('PG listing created successfully!');
    } catch (error) {
      console.error('Error creating PG:', error);
      alert(error instanceof Error ? error.message : 'Failed to create PG listing');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePG = async (formData: FormData) => {
    if (!editingPG) return;

    setFormLoading(true);
    try {
      const { data, error } = await supabase
        .from('pgs')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPG.id)
        .select()
        .single();

      if (error) throw error;

      setPgs(prev => prev.map(pg => pg.id === editingPG.id ? data : pg));
      setEditingPG(null);
      alert('PG listing updated successfully!');
    } catch (error) {
      console.error('Error updating PG:', error);
      alert(error instanceof Error ? error.message : 'Failed to update PG listing');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePG = async (pgId: string) => {
    if (!confirm('Are you sure you want to delete this PG listing?')) return;

    try {
      const { error } = await supabase
        .from('pgs')
        .delete()
        .eq('id', pgId);

      if (error) throw error;

      setPgs(prev => prev.filter(pg => pg.id !== pgId));
      alert('PG listing deleted successfully!');
    } catch (error) {
      console.error('Error deleting PG:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete PG listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Owner Dashboard - PG Finder</title>
        <meta name="description" content="Manage your PG listings and track bookings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Welcome back, {user?.email}!
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add New PG</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total PGs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPGs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CurrencyRupeeIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* PG Listings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your PG Listings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your properties and track their performance
              </p>
            </div>

            {pgs.length === 0 ? (
              <div className="p-12 text-center">
                <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No PG listings yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first PG listing to start receiving bookings from potential tenants.
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First PG
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pgs.map((pg) => (
                    <div key={pg.id} className="relative">
                      <PGCard pg={pg} variant="compact" />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Link
                          href={`/pg/${pg.id}`}
                          className="p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                        >
                          <EyeIcon className="h-4 w-4 text-gray-600" />
                        </Link>
                        <button
                          onClick={() => setEditingPG(pg)}
                          className="p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                        >
                          <PencilIcon className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePG(pg.id)}
                          className="p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-opacity-100 transition-all"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create PG Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Create New PG Listing</h3>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <OwnerForm
                    onSubmit={handleCreatePG}
                    loading={formLoading}
                    mode="create"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit PG Modal */}
        {editingPG && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit PG Listing</h3>
                    <button
                      onClick={() => setEditingPG(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <OwnerForm
                    initialData={editingPG}
                    onSubmit={handleUpdatePG}
                    loading={formLoading}
                    mode="edit"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}