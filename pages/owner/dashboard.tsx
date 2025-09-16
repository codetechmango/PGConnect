import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase, getCurrentUser } from '../../lib/supabaseClient';
import { PG, User, FormData } from '../../types';
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

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const { user } = await getCurrentUser();
      
      if (!user) {
        router.push('/auth/signin?redirect=/owner/dashboard');
        return;
      }

      // Check if user is an owner
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile?.is_owner) {
        router.push('/owner/register');
        return;
      }

      setUser(user);
      await loadOwnerPGs(user.id);
      await loadStats(user.id);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOwnerPGs = async (userId: string) => {
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
  };

  const loadStats = async (userId: string) => {
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
  };

  const handleCreatePG = async (formData: FormData & { images: string[] }) => {
    if (!user) return;

    setFormLoading(true);
    try {
      const { data, error } = await supabase
        .from('pgs')
        .insert({
          ...formData,
          owner_id: user.id,
          rating: 0,
          total_reviews: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setPgs(prev => [data, ...prev]);
      setShowCreateForm(false);
      alert('PG listing created successfully!');
      
      // Reload stats
      await loadStats(user.id);
    } catch (error: any) {
      console.error('Error creating PG:', error);
      alert(error.message || 'Failed to create PG listing');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePG = async (formData: FormData & { images: string[] }) => {
    if (!editingPG || !user) return;

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
    } catch (error: any) {
      console.error('Error updating PG:', error);
      alert(error.message || 'Failed to update PG listing');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePG = async (pgId: string) => {
    if (!confirm('Are you sure you want to delete this PG listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pgs')
        .delete()
        .eq('id', pgId);

      if (error) throw error;

      setPgs(prev => prev.filter(pg => pg.id !== pgId));
      alert('PG listing deleted successfully!');
      
      // Reload stats
      if (user) await loadStats(user.id);
    } catch (error: any) {
      console.error('Error deleting PG:', error);
      alert(error.message || 'Failed to delete PG listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <>
        <Head>
          <title>Create New PG Listing - Owner Dashboard</title>
        </Head>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create New PG Listing</h1>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
      </>
    );
  }

  if (editingPG) {
    return (
      <>
        <Head>
          <title>Edit PG Listing - Owner Dashboard</title>
        </Head>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Edit PG Listing</h1>
              <button
                onClick={() => setEditingPG(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <OwnerForm
              onSubmit={handleUpdatePG}
              initialData={editingPG}
              loading={formLoading}
              mode="edit"
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Owner Dashboard - PG Finder</title>
        <meta name="description" content="Manage your PG listings and bookings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back! Manage your PG listings and track your performance.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New PG</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-10 w-10 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stats.totalPGs}</h3>
                  <p className="text-sm text-gray-600">Total PGs</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <UsersIcon className="h-10 w-10 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stats.totalBookings}</h3>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <CurrencyRupeeIcon className="h-10 w-10 text-yellow-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    ₹{stats.totalRevenue.toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-10 w-10 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {stats.occupancyRate.toFixed(1)}%
                  </h3>
                  <p className="text-sm text-gray-600">Occupancy Rate</p>
                </div>
              </div>
            </div>
          </div>

          {/* PG Listings */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your PG Listings</h2>
            </div>

            {pgs.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No PG listings yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first PG listing to start receiving bookings
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First PG
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pgs.map((pg) => (
                    <div key={pg.id} className="relative">
                      <PGCard pg={pg} />
                      
                      {/* Action Buttons Overlay */}
                      <div className="absolute top-3 left-3 flex space-x-2">
                        <Link href={`/pg/${pg.id}`}>
                          <button className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
                            <EyeIcon className="h-4 w-4 text-gray-600" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setEditingPG(pg)}
                          className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                        >
                          <PencilIcon className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeletePG(pg.id)}
                          className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pg.available_rooms > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pg.available_rooms > 0 ? 'Available' : 'Full'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
