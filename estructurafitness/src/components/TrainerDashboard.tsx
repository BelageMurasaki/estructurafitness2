import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Users, UserPlus, Apple, Dumbbell, Scale, DollarSign, Eye } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type DietPlan = Database['public']['Tables']['diet_plans']['Row'];
type MealLog = Database['public']['Tables']['meal_logs']['Row'];
type ExerciseLog = Database['public']['Tables']['exercise_logs']['Row'];
type WeightLog = Database['public']['Tables']['weight_logs']['Row'];
type TrainingPlan = Database['public']['Tables']['training_plans']['Row'];

interface ClientWithData extends Profile {
  mealLogs?: MealLog[];
  exerciseLogs?: ExerciseLog[];
  weightLogs?: WeightLog[];
  dietPlans?: DietPlan[];
  trainingPlans?: TrainingPlan[];
}

export function TrainerDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'add-client'>('clients');
  const [clients, setClients] = useState<ClientWithData[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientWithData | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'diet' | 'training'>('overview');

  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientName, setNewClientName] = useState('');

  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [recommendedTime, setRecommendedTime] = useState('');

  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');

  useEffect(() => {
    loadClients();
  }, [profile]);

  async function loadClients() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('trainer_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading clients:', error);
      return;
    }

    if (data) {
      const clientsWithData = await Promise.all(
        data.map(async (client) => {
          const [meals, exercises, weights, diets, training] = await Promise.all([
            supabase.from('meal_logs').select('*').eq('client_id', client.id).order('meal_time', { ascending: false }).limit(10),
            supabase.from('exercise_logs').select('*').eq('client_id', client.id).order('exercise_time', { ascending: false }).limit(10),
            supabase.from('weight_logs').select('*').eq('client_id', client.id).order('measured_at', { ascending: false }).limit(5),
            supabase.from('diet_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
            supabase.from('training_plans').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
          ]);

          return {
            ...client,
            mealLogs: meals.data || [],
            exerciseLogs: exercises.data || [],
            weightLogs: weights.data || [],
            dietPlans: diets.data || [],
            trainingPlans: training.data || [],
          };
        })
      );

      setClients(clientsWithData);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newClientEmail,
        password: newClientPassword,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: newClientName,
        role: 'client',
        trainer_id: profile.id,
        payment_status: true,
      });

      if (profileError) throw profileError;

      setNewClientEmail('');
      setNewClientPassword('');
      setNewClientName('');
      setActiveTab('clients');
      loadClients();
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Error al agregar cliente');
    }
  }

  async function togglePaymentStatus(clientId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ payment_status: !currentStatus })
      .eq('id', clientId);

    if (!error) {
      loadClients();
      if (selectedClient?.id === clientId) {
        setSelectedClient({ ...selectedClient, payment_status: !currentStatus });
      }
    }
  }

  async function handleAddDietPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedClient) return;

    const { error } = await supabase.from('diet_plans').insert({
      client_id: selectedClient.id,
      created_by: profile.id,
      meal_name: mealName,
      meal_description: mealDescription,
      recommended_time: recommendedTime || null,
    });

    if (!error) {
      setMealName('');
      setMealDescription('');
      setRecommendedTime('');
      loadClients();
    }
  }

  async function handleAddTrainingPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !selectedClient) return;

    const { error } = await supabase.from('training_plans').insert({
      client_id: selectedClient.id,
      created_by: profile.id,
      exercise_name: exerciseName,
      sets: parseInt(sets),
      reps: parseInt(reps),
      notes: exerciseNotes || null,
    });

    if (!error) {
      setExerciseName('');
      setSets('');
      setReps('');
      setExerciseNotes('');
      loadClients();
    }
  }

  const activeClients = clients.filter((c) => c.payment_status).length;
  const inactiveClients = clients.length - activeClients;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <nav className="bg-black/50 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Estructura Fitness</h1>
              <p className="text-cyan-400 text-sm">Panel de Entrenador - {profile?.full_name}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm">Total Clientes</p>
                <p className="text-3xl font-bold text-white mt-1">{clients.length}</p>
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-full">
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm">Clientes Activos</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{activeClients}</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-full">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm">Clientes Inactivos</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{inactiveClients}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-full">
                <DollarSign className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl overflow-hidden">
          <div className="flex border-b border-cyan-500/20">
            <button
              onClick={() => {
                setActiveTab('clients');
                setSelectedClient(null);
              }}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'clients'
                  ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-cyan-300'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Mis Clientes
            </button>
            <button
              onClick={() => setActiveTab('add-client')}
              className={`flex-1 px-6 py-4 font-medium transition ${
                activeTab === 'add-client'
                  ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-cyan-300'
              }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Agregar Cliente
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'clients' && !selectedClient && (
              <div className="space-y-4">
                {clients.map((client) => {
                  const totalCalories = client.exerciseLogs?.reduce((sum, log) => sum + log.calories_burned, 0) || 0;
                  const latestWeight = client.weightLogs?.[0]?.weight_kg;

                  return (
                    <div
                      key={client.id}
                      className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{client.full_name}</h3>
                          <p className="text-gray-400 text-sm mt-1">
                            Miembro desde {new Date(client.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePaymentStatus(client.id, client.payment_status)}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                              client.payment_status
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            }`}
                          >
                            {client.payment_status ? 'Al día' : 'Suspendido'}
                          </button>
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-black/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Apple className="w-4 h-4 text-cyan-400" />
                            <p className="text-cyan-400 text-sm">Comidas</p>
                          </div>
                          <p className="text-white font-semibold">{client.mealLogs?.length || 0}</p>
                        </div>
                        <div className="bg-black/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="w-4 h-4 text-cyan-400" />
                            <p className="text-cyan-400 text-sm">Calorías</p>
                          </div>
                          <p className="text-white font-semibold">{totalCalories}</p>
                        </div>
                        <div className="bg-black/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Scale className="w-4 h-4 text-cyan-400" />
                            <p className="text-cyan-400 text-sm">Peso</p>
                          </div>
                          <p className="text-white font-semibold">
                            {latestWeight ? `${latestWeight} kg` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {clients.length === 0 && (
                  <p className="text-gray-500 text-center py-12">
                    No tienes clientes registrados aún
                  </p>
                )}
              </div>
            )}

            {activeTab === 'clients' && selectedClient && (
              <div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="mb-6 text-cyan-400 hover:text-cyan-300 transition"
                >
                  ← Volver a la lista
                </button>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedClient.full_name}</h2>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setViewMode('overview')}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === 'overview'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-gray-400 hover:text-cyan-300'
                      }`}
                    >
                      Resumen
                    </button>
                    <button
                      onClick={() => setViewMode('diet')}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === 'diet'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-gray-400 hover:text-cyan-300'
                      }`}
                    >
                      Plan de Dieta
                    </button>
                    <button
                      onClick={() => setViewMode('training')}
                      className={`px-4 py-2 rounded-lg transition ${
                        viewMode === 'training'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-gray-400 hover:text-cyan-300'
                      }`}
                    >
                      Plan de Entrenamiento
                    </button>
                  </div>
                </div>

                {viewMode === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Últimas Comidas</h3>
                      <div className="space-y-2">
                        {selectedClient.mealLogs?.slice(0, 5).map((log) => (
                          <div key={log.id} className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/10">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-cyan-400 text-sm">
                                  {new Date(log.meal_time).toLocaleString('es-ES')}
                                </p>
                                <p className="text-white mt-1">{log.meal_description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!selectedClient.mealLogs || selectedClient.mealLogs.length === 0) && (
                          <p className="text-gray-500 text-center py-4">No hay comidas registradas</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Últimos Ejercicios</h3>
                      <div className="space-y-2">
                        {selectedClient.exerciseLogs?.slice(0, 5).map((log) => (
                          <div key={log.id} className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/10">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{log.exercise_name}</p>
                                <p className="text-cyan-400 text-sm">
                                  {new Date(log.exercise_time).toLocaleString('es-ES')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-white">{log.duration_minutes} min</p>
                                <p className="text-cyan-400 text-sm">{log.calories_burned} kcal</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!selectedClient.exerciseLogs || selectedClient.exerciseLogs.length === 0) && (
                          <p className="text-gray-500 text-center py-4">No hay ejercicios registrados</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Historial de Peso</h3>
                      <div className="space-y-2">
                        {selectedClient.weightLogs?.map((log, index) => {
                          const prevWeight = selectedClient.weightLogs?.[index + 1]?.weight_kg;
                          const change = prevWeight ? log.weight_kg - prevWeight : 0;
                          return (
                            <div key={log.id} className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/10">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-white font-medium">{log.weight_kg} kg</p>
                                  <p className="text-cyan-400 text-sm">
                                    {new Date(log.measured_at).toLocaleString('es-ES')}
                                  </p>
                                </div>
                                {prevWeight && (
                                  <div className={`text-right ${change < 0 ? 'text-green-400' : change > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                    <p className="font-medium">
                                      {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {(!selectedClient.weightLogs || selectedClient.weightLogs.length === 0) && (
                          <p className="text-gray-500 text-center py-4">No hay registros de peso</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'diet' && (
                  <div className="space-y-6">
                    <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Agregar Comida al Plan</h3>
                      <form onSubmit={handleAddDietPlan} className="space-y-4">
                        <div>
                          <label className="block text-sm text-cyan-300 mb-2">Nombre de la comida</label>
                          <input
                            type="text"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                            placeholder="Ej: Desayuno, Almuerzo, Cena"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-cyan-300 mb-2">Descripción</label>
                          <textarea
                            value={mealDescription}
                            onChange={(e) => setMealDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                            rows={3}
                            placeholder="Describe qué debe comer"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-cyan-300 mb-2">Hora recomendada (opcional)</label>
                          <input
                            type="time"
                            value={recommendedTime}
                            onChange={(e) => setRecommendedTime(e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold py-2 rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition"
                        >
                          Agregar al Plan
                        </button>
                      </form>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Plan de Dieta Actual</h3>
                      <div className="space-y-2">
                        {selectedClient.dietPlans?.map((plan) => (
                          <div key={plan.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/10">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-cyan-400 font-medium">{plan.meal_name}</p>
                              {plan.recommended_time && (
                                <p className="text-gray-400 text-sm">{plan.recommended_time}</p>
                              )}
                            </div>
                            <p className="text-white">{plan.meal_description}</p>
                          </div>
                        ))}
                        {(!selectedClient.dietPlans || selectedClient.dietPlans.length === 0) && (
                          <p className="text-gray-500 text-center py-4">
                            No hay plan de dieta configurado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'training' && (
                  <div className="space-y-6">
                    <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Agregar Ejercicio al Plan</h3>
                      <form onSubmit={handleAddTrainingPlan} className="space-y-4">
                        <div>
                          <label className="block text-sm text-cyan-300 mb-2">Nombre del ejercicio</label>
                          <input
                            type="text"
                            value={exerciseName}
                            onChange={(e) => setExerciseName(e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                            placeholder="Ej: Press de banca, Sentadilla"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-cyan-300 mb-2">Series</label>
                            <input
                              type="number"
                              value={sets}
                              onChange={(e) => setSets(e.target.value)}
                              className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-cyan-300 mb-2">Repeticiones</label>
                            <input
                              type="number"
                              value={reps}
                              onChange={(e) => setReps(e.target.value)}
                              className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-cyan-300 mb-2">Notas (opcional)</label>
                          <textarea
                            value={exerciseNotes}
                            onChange={(e) => setExerciseNotes(e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                            rows={2}
                            placeholder="Instrucciones adicionales"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold py-2 rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition"
                        >
                          Agregar al Plan
                        </button>
                      </form>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Plan de Entrenamiento Actual</h3>
                      <div className="space-y-2">
                        {selectedClient.trainingPlans?.map((plan) => (
                          <div key={plan.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/10">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-white font-medium">{plan.exercise_name}</p>
                              <p className="text-cyan-400 font-medium">
                                {plan.sets} x {plan.reps}
                              </p>
                            </div>
                            {plan.notes && <p className="text-gray-400 text-sm mt-2">{plan.notes}</p>}
                          </div>
                        ))}
                        {(!selectedClient.trainingPlans || selectedClient.trainingPlans.length === 0) && (
                          <p className="text-gray-500 text-center py-4">
                            No hay plan de entrenamiento configurado
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'add-client' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10">
                  <h3 className="text-xl font-semibold text-white mb-6">Registrar Nuevo Cliente</h3>
                  <form onSubmit={handleAddClient} className="space-y-4">
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Nombre completo</label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Contraseña inicial</label>
                      <input
                        type="password"
                        value={newClientPassword}
                        onChange={(e) => setNewClientPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold py-3 rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition"
                    >
                      Registrar Cliente
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
