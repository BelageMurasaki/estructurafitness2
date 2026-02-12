import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Apple, Dumbbell, Scale, TrendingUp } from 'lucide-react';
import type { Database } from '../lib/database.types';

type DietPlan = Database['public']['Tables']['diet_plans']['Row'];
type MealLog = Database['public']['Tables']['meal_logs']['Row'];
type ExerciseLog = Database['public']['Tables']['exercise_logs']['Row'];
type WeightLog = Database['public']['Tables']['weight_logs']['Row'];
type TrainingPlan = Database['public']['Tables']['training_plans']['Row'];

export function ClientDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'meals' | 'exercise' | 'weight' | 'progress'>('meals');
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);

  const [mealTime, setMealTime] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [selectedDietPlan, setSelectedDietPlan] = useState<string>('');

  const [exerciseName, setExerciseName] = useState('');
  const [exerciseTime, setExerciseTime] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const [weight, setWeight] = useState('');
  const [weightTime, setWeightTime] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!profile) return;

    const [diets, meals, exercises, weights, training] = await Promise.all([
      supabase.from('diet_plans').select('*').eq('client_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('meal_logs').select('*').eq('client_id', profile.id).order('meal_time', { ascending: false }),
      supabase.from('exercise_logs').select('*').eq('client_id', profile.id).order('exercise_time', { ascending: false }),
      supabase.from('weight_logs').select('*').eq('client_id', profile.id).order('measured_at', { ascending: false }),
      supabase.from('training_plans').select('*').eq('client_id', profile.id).order('created_at', { ascending: false }),
    ]);

    if (diets.data) setDietPlans(diets.data);
    if (meals.data) setMealLogs(meals.data);
    if (exercises.data) setExerciseLogs(exercises.data);
    if (weights.data) setWeightLogs(weights.data);
    if (training.data) setTrainingPlans(training.data);
  }

  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase.from('meal_logs').insert({
      client_id: profile.id,
      meal_time: mealTime,
      meal_description: mealDescription,
      diet_plan_id: selectedDietPlan || null,
    });

    if (!error) {
      setMealTime('');
      setMealDescription('');
      setSelectedDietPlan('');
      loadData();
    }
  }

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const caloriesBurned = calculateCalories(parseInt(duration));

    const { error } = await supabase.from('exercise_logs').insert({
      client_id: profile.id,
      exercise_name: exerciseName,
      exercise_time: exerciseTime,
      duration_minutes: parseInt(duration),
      calories_burned: caloriesBurned,
      notes: notes || null,
    });

    if (!error) {
      setExerciseName('');
      setExerciseTime('');
      setDuration('');
      setNotes('');
      loadData();
    }
  }

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase.from('weight_logs').insert({
      client_id: profile.id,
      weight_kg: parseFloat(weight),
      measured_at: weightTime,
    });

    if (!error) {
      setWeight('');
      setWeightTime('');
      loadData();
    }
  }

  function calculateCalories(minutes: number): number {
    return Math.round(minutes * 7);
  }

  const totalCaloriesBurned = exerciseLogs.reduce((sum, log) => sum + log.calories_burned, 0);
  const latestWeight = weightLogs.length > 0 ? weightLogs[0].weight_kg : null;
  const weightChange = weightLogs.length >= 2 ? (weightLogs[0].weight_kg - weightLogs[1].weight_kg) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <nav className="bg-black/50 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Estructura Fitness</h1>
              <p className="text-cyan-400 text-sm">Bienvenido, {profile?.full_name}</p>
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
        {!profile?.payment_status && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-6">
            Tu cuenta está suspendida. Por favor contacta a tu entrenador para renovar tu membresía.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm">Calorías Quemadas</p>
                <p className="text-3xl font-bold text-white mt-1">{totalCaloriesBurned}</p>
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm">Peso Actual</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {latestWeight ? `${latestWeight} kg` : '-'}
                </p>
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-full">
                <Scale className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-400 text-sm">Cambio de Peso</p>
                <p className={`text-3xl font-bold mt-1 ${weightChange < 0 ? 'text-green-400' : weightChange > 0 ? 'text-red-400' : 'text-white'}`}>
                  {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl overflow-hidden">
          <div className="flex border-b border-cyan-500/20">
            {[
              { id: 'meals', label: 'Comidas', icon: Apple },
              { id: 'exercise', label: 'Ejercicios', icon: Dumbbell },
              { id: 'weight', label: 'Peso', icon: Scale },
              { id: 'progress', label: 'Mi Plan', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 px-6 py-4 font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-cyan-300'
                  }`}
                >
                  <Icon className="w-5 h-5 inline mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'meals' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Registrar Comida</h3>
                  <form onSubmit={handleAddMeal} className="space-y-4">
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Hora de la comida</label>
                      <input
                        type="datetime-local"
                        value={mealTime}
                        onChange={(e) => setMealTime(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">¿Qué comiste?</label>
                      <textarea
                        value={mealDescription}
                        onChange={(e) => setMealDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        rows={3}
                        required
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    {dietPlans.length > 0 && (
                      <div>
                        <label className="block text-sm text-cyan-300 mb-2">Plan de dieta (opcional)</label>
                        <select
                          value={selectedDietPlan}
                          onChange={(e) => setSelectedDietPlan(e.target.value)}
                          className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                          disabled={!profile?.payment_status}
                        >
                          <option value="">Ninguno</option>
                          {dietPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.meal_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={!profile?.payment_status}
                      className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold py-2 rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Registrar Comida
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Historial de Comidas</h3>
                  <div className="space-y-3">
                    {mealLogs.map((log) => (
                      <div key={log.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/10">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-cyan-400 font-medium">
                            {new Date(log.meal_time).toLocaleString('es-ES')}
                          </p>
                        </div>
                        <p className="text-white">{log.meal_description}</p>
                      </div>
                    ))}
                    {mealLogs.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No hay comidas registradas</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'exercise' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Registrar Ejercicio</h3>
                  <form onSubmit={handleAddExercise} className="space-y-4">
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Nombre del ejercicio</label>
                      <input
                        type="text"
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Hora del ejercicio</label>
                      <input
                        type="datetime-local"
                        value={exerciseTime}
                        onChange={(e) => setExerciseTime(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Duración (minutos)</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                        min="1"
                        disabled={!profile?.payment_status}
                      />
                      {duration && (
                        <p className="text-cyan-400 text-sm mt-2">
                          Calorías aproximadas: {calculateCalories(parseInt(duration))} kcal
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Notas (opcional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        rows={2}
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!profile?.payment_status}
                      className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold py-2 rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Registrar Ejercicio
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Historial de Ejercicios</h3>
                  <div className="space-y-3">
                    {exerciseLogs.map((log) => (
                      <div key={log.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-white font-medium">{log.exercise_name}</p>
                            <p className="text-cyan-400 text-sm">
                              {new Date(log.exercise_time).toLocaleString('es-ES')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{log.duration_minutes} min</p>
                            <p className="text-cyan-400 text-sm">{log.calories_burned} kcal</p>
                          </div>
                        </div>
                        {log.notes && <p className="text-gray-400 text-sm mt-2">{log.notes}</p>}
                      </div>
                    ))}
                    {exerciseLogs.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No hay ejercicios registrados</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'weight' && (
              <div className="space-y-6">
                <div className="bg-gray-900/50 rounded-lg p-6 border border-cyan-500/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Registrar Peso</h3>
                  <form onSubmit={handleAddWeight} className="space-y-4">
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Peso (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-cyan-300 mb-2">Fecha y hora</label>
                      <input
                        type="datetime-local"
                        value={weightTime}
                        onChange={(e) => setWeightTime(e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                        required
                        disabled={!profile?.payment_status}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!profile?.payment_status}
                      className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-black font-semibold py-2 rounded-lg hover:from-cyan-500 hover:to-cyan-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Registrar Peso
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Historial de Peso</h3>
                  <div className="space-y-3">
                    {weightLogs.map((log, index) => {
                      const prevWeight = weightLogs[index + 1]?.weight_kg;
                      const change = prevWeight ? log.weight_kg - prevWeight : 0;
                      return (
                        <div key={log.id} className="bg-gray-900/50 rounded-lg p-4 border border-cyan-500/10">
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
                    {weightLogs.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No hay registros de peso</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Plan de Dieta</h3>
                  <div className="space-y-3">
                    {dietPlans.map((plan) => (
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
                    {dietPlans.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        No tienes un plan de dieta asignado aún
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Plan de Entrenamiento</h3>
                  <div className="space-y-3">
                    {trainingPlans.map((plan) => (
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
                    {trainingPlans.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        No tienes un plan de entrenamiento asignado aún
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
