'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'users' | 'submissions' | 'stories' | 'invite-tokens'>('tasks');

  useEffect(() => {
    // Check if already authenticated
    if (adminApi.isAuthenticated()) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminApi.login(password);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminApi.logout();
    setIsAuthenticated(false);
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <div className="bg-white rounded-card shadow-card p-8 max-w-md w-full border border-border-soft">
          <h1 className="text-h1 font-decorative font-bold text-card-red mb-6 text-center">
            Админ-панель
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-body font-medium text-text-primary mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border-soft rounded-card focus:outline-none focus:ring-2 focus:ring-card-red"
                placeholder="Введите пароль"
                required
              />
            </div>
            {error && (
              <div className="text-small text-card-red">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-card-red text-white py-3 rounded-card font-medium hover:bg-card-red/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary pb-6">
      <div className="max-w-7xl mx-auto px-4 pt-4">
        {/* Header */}
        <div className="bg-white rounded-card shadow-card p-4 mb-4 border border-border-soft">
          <div className="flex items-center justify-between">
            <h1 className="text-h1 font-decorative font-bold text-card-red">
              Админ-панель
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-text-muted text-white rounded-card hover:bg-text-secondary transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-card shadow-card mb-4 border border-border-soft">
          <div className="flex border-b border-border-soft overflow-x-auto">
            {(['tasks', 'users', 'submissions', 'stories', 'invite-tokens'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-card-red border-b-2 border-card-red'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab === 'tasks' && 'Задания'}
                {tab === 'users' && 'Пользователи'}
                {tab === 'submissions' && 'Ответы'}
                {tab === 'stories' && 'Stories'}
                {tab === 'invite-tokens' && 'Приглашения'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-card shadow-card p-6 border border-border-soft">
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'submissions' && <SubmissionsTab />}
          {activeTab === 'stories' && <StoriesTab />}
          {activeTab === 'invite-tokens' && <InviteTokensTab />}
        </div>
      </div>
    </div>
  );
}

function TasksTab() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await adminApi.tasks.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-h2 font-decorative font-bold text-text-primary">Задания</h2>
        <button
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-card-green text-white rounded-card hover:bg-card-green/90 transition-colors"
        >
          + Добавить задание
        </button>
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={() => {
            loadTasks();
            setShowForm(false);
            setEditingTask(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 border border-border-soft rounded-card flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium text-text-primary">{task.title}</h3>
              <p className="text-small text-text-secondary">{task.description}</p>
              <div className="text-small text-text-muted mt-1">
                День {task.day_number} | {task.input_type} | {task.is_active ? 'Активно' : 'Неактивно'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (confirm('Удалить задание?')) {
                    try {
                      await adminApi.tasks.delete(task.id);
                      loadTasks();
                    } catch (error) {
                      alert('Ошибка удаления');
                    }
                  }
                }}
                className="px-3 py-1 bg-card-red text-white rounded-card text-small hover:bg-card-red/90"
              >
                Удалить
              </button>
              <button
                onClick={() => {
                  setEditingTask(task);
                  setShowForm(true);
                }}
                className="px-3 py-1 bg-accent-gold text-white rounded-card text-small hover:bg-accent-gold/90"
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskForm({ task, onSave, onCancel }: { task: any | null; onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    day_number: task?.day_number || 1,
    title: task?.title || '',
    description: task?.description || '',
    input_type: task?.input_type || 'text',
    order_number: task?.order_number || 1,
    text_prompt: task?.text_prompt || '',
    is_active: task?.is_active !== undefined ? task.is_active : true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (task) {
        await adminApi.tasks.update(task.id, formData);
      } else {
        await adminApi.tasks.create(formData);
      }
      onSave();
    } catch (error: any) {
      alert(error.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-border-soft rounded-card bg-accent-cream">
      <h3 className="font-bold mb-4">{task ? 'Редактирование' : 'Новое задание'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-small font-medium mb-1">День</label>
          <input
            type="number"
            value={formData.day_number}
            onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
            required
          />
        </div>
        <div>
          <label className="block text-small font-medium mb-1">Порядок</label>
          <input
            type="number"
            value={formData.order_number}
            onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-small font-medium mb-1">Название</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-small font-medium mb-1">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
            rows={3}
            required
          />
        </div>
        <div>
          <label className="block text-small font-medium mb-1">Тип ввода</label>
          <select
            value={formData.input_type}
            onChange={(e) => setFormData({ ...formData, input_type: e.target.value as any })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
          >
            <option value="text">Текст</option>
            <option value="photo">Фото</option>
            <option value="text+photo">Текст + Фото</option>
          </select>
        </div>
        {(formData.input_type === 'text' || formData.input_type === 'text+photo') && (
          <div className="col-span-2">
            <label className="block text-small font-medium mb-1">
              Текст подсказки для ввода {formData.input_type === 'text' ? '(например: "Дай ссылку на песню" или "Введи название фильма")' : '(например: "Расскажи о фильме")'}
            </label>
            <input
              type="text"
              value={formData.text_prompt}
              onChange={(e) => setFormData({ ...formData, text_prompt: e.target.value })}
              placeholder={formData.input_type === 'text' ? 'Дай ссылку на песню' : 'Расскажи о фильме'}
              className="w-full px-3 py-2 border border-border-soft rounded-card"
            />
          </div>
        )}
        <div>
          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            Активно
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-card-green text-white rounded-card hover:bg-card-green/90 disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-text-muted text-white rounded-card hover:bg-text-secondary"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminApi.users.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <h2 className="text-h2 font-decorative font-bold text-text-primary mb-4">Пользователи</h2>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 border border-border-soft rounded-card flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-text-primary">
                {user.name || 'Без имени'} {user.name && <span className="text-text-muted">({user.invite_token})</span>}
                {!user.name && <span className="text-text-muted text-small"> - Token: {user.invite_token}</span>}
              </div>
              <div className="text-small text-text-secondary">
                Заданий: {user.total_completed_tasks} | Вес рулетки: {user.roulette_weight}
              </div>
              <div className="text-small text-text-muted">
                Создан: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={user.roulette_weight}
                onChange={async (e) => {
                  const newWeight = parseInt(e.target.value);
                  try {
                    await adminApi.users.updateWeight(user.id, newWeight);
                    loadUsers();
                  } catch (error) {
                    alert('Ошибка обновления');
                  }
                }}
                className="px-3 py-2 border border-border-soft rounded-card w-24"
              />
              {user.name && (
                <button
                  onClick={async () => {
                    if (confirm(`Сбросить онбординг для пользователя "${user.name}"? Пользователю снова покажется форма онбординга.`)) {
                      try {
                        await adminApi.users.resetOnboarding(user.id);
                        loadUsers();
                      } catch (error) {
                        alert('Ошибка сброса онбординга');
                      }
                    }
                  }}
                  className="px-3 py-2 bg-text-muted text-white rounded-card text-small hover:bg-text-secondary transition-colors"
                  title="Сбросить онбординг (очистить имя)"
                >
                  Сбросить онбординг
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await adminApi.submissions.getAll();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <h2 className="text-h2 font-decorative font-bold text-text-primary mb-4">Ответы пользователей</h2>
      <div className="space-y-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="p-4 border border-border-soft rounded-card">
            <div className="flex justify-between mb-2">
              <div className="font-medium text-text-primary">{sub.task_title}</div>
              <div className="text-small text-text-muted">День {sub.day_number}</div>
            </div>
            <div className="text-small text-text-secondary mb-2">
              {sub.name || 'Без имени'} {sub.name && <span className="text-text-muted">({sub.invite_token})</span>}
              {!sub.name && <span> - Token: {sub.invite_token}</span>}
            </div>
            {sub.text_answer && (
              <div className="mb-2 p-2 bg-accent-cream rounded-card">{sub.text_answer}</div>
            )}
            {sub.media_url && (
              <img src={`${typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001'}${sub.media_url}`} alt="Submission" className="max-w-xs rounded-card" />
            )}
            <div className="text-small text-text-muted mt-2">
              {new Date(sub.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoriesTab() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await adminApi.stories.getAll();
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-h2 font-decorative font-bold text-text-primary">Stories</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-card-green text-white rounded-card hover:bg-card-green/90 transition-colors"
        >
          + Добавить story
        </button>
      </div>

      {showForm && (
        <StoryForm
          onSave={() => {
            loadStories();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-2">
        {stories.map((story) => (
          <div
            key={story.id}
            className="p-4 border border-border-soft rounded-card flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              {story.media_type === 'image' && (
                <img
                  src={`${typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001'}${story.media_url}`}
                  alt={story.title || 'Story'}
                  className="w-20 h-20 object-cover rounded-card"
                />
              )}
              <div>
                <div className="font-medium text-text-primary">{story.title || 'Без названия'}</div>
                <div className="text-small text-text-secondary">
                  {story.media_type} | {story.is_active ? 'Активно' : 'Неактивно'} | Порядок: {story.order_number}
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                if (confirm('Удалить story?')) {
                  try {
                    await adminApi.stories.delete(story.id);
                    loadStories();
                  } catch (error) {
                    alert('Ошибка удаления');
                  }
                }
              }}
              className="px-3 py-1 bg-card-red text-white rounded-card text-small hover:bg-card-red/90"
            >
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteTokensTab() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenUrl, setNewTokenUrl] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const data = await adminApi.inviteTokens.getAll();
      setTokens(data);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      const newToken = await adminApi.inviteTokens.create();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const tokenUrl = `${baseUrl}/join/${newToken.token}`;
      setNewTokenUrl(tokenUrl);
      loadTokens();
      
      // Copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(tokenUrl);
        alert('Ссылка скопирована в буфер обмена!');
      }
    } catch (error) {
      alert('Ошибка создания токена');
    }
  };

  const handleDeleteToken = async (id: number) => {
    if (!confirm('Удалить этот токен?')) return;
    
    try {
      await adminApi.inviteTokens.delete(id);
      loadTokens();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка удаления токена');
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Скопировано в буфер обмена!');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-h2 font-decorative font-bold text-text-primary">Пригласительные ссылки</h2>
        <button
          onClick={handleCreateToken}
          className="px-4 py-2 bg-card-green text-white rounded-card hover:bg-card-green/90 transition-colors"
        >
          + Создать ссылку
        </button>
      </div>

      {newTokenUrl && (
        <div className="mb-4 p-4 bg-accent-cream border-2 border-card-green rounded-card">
          <p className="font-bold text-card-green mb-2">Новая ссылка создана!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white rounded-card text-sm break-all">{newTokenUrl}</code>
            <button
              onClick={() => {
                setNewTokenUrl(null);
                copyToClipboard(newTokenUrl);
              }}
              className="px-3 py-2 bg-card-green text-white rounded-card text-sm hover:bg-card-green/90"
            >
              Копировать
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tokens.map((token) => {
          const tokenUrl = `${baseUrl}/join/${token.token}`;
          const isUsed = !!token.used_at;
          
          return (
            <div
              key={token.id}
              className={`p-4 border border-border-soft rounded-card ${isUsed ? 'bg-gray-50 opacity-75' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm break-all">{tokenUrl}</code>
                    <button
                      onClick={() => copyToClipboard(tokenUrl)}
                      className="px-2 py-1 bg-accent-gold text-white rounded text-xs hover:bg-accent-gold/90 whitespace-nowrap"
                    >
                      Копировать
                    </button>
                  </div>
                  <div className="text-small text-text-secondary">
                    Создано: {new Date(token.created_at).toLocaleString('ru-RU')}
                    {isUsed && (
                      <>
                        {' | '}
                        <span className="text-card-red font-medium">Использован</span>
                        {token.used_by_name && ` пользователем: ${token.used_by_name}`}
                        {' | '}
                        {new Date(token.used_at).toLocaleString('ru-RU')}
                      </>
                    )}
                  </div>
                </div>
                {!isUsed && (
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    className="px-3 py-1 bg-card-red text-white rounded-card text-small hover:bg-card-red/90 whitespace-nowrap"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          );
        })}
        
        {tokens.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            Нет созданных ссылок. Создайте первую!
          </div>
        )}
      </div>
    </div>
  );
}

function StoryForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    media_type: 'image' as 'image' | 'video',
    is_active: true,
    order_number: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Выберите файл');
      return;
    }
    setSaving(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('media_type', formData.media_type);
      uploadFormData.append('is_active', formData.is_active ? '1' : '0');
      uploadFormData.append('order_number', formData.order_number.toString());
      
      await adminApi.stories.create(uploadFormData);
      onSave();
    } catch (error: any) {
      alert(error.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-border-soft rounded-card bg-accent-cream">
      <h3 className="font-bold mb-4">Новая story</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-small font-medium mb-1">Название</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
          />
        </div>
        <div>
          <label className="block text-small font-medium mb-1">Тип медиа</label>
          <select
            value={formData.media_type}
            onChange={(e) => setFormData({ ...formData, media_type: e.target.value as any })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
          >
            <option value="image">Изображение</option>
            <option value="video">Видео</option>
          </select>
        </div>
        <div>
          <label className="block text-small font-medium mb-1">Файл</label>
          <input
            type="file"
            accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
            required
          />
        </div>
        <div>
          <label className="block text-small font-medium mb-1">Порядок</label>
          <input
            type="number"
            value={formData.order_number}
            onChange={(e) => setFormData({ ...formData, order_number: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-border-soft rounded-card"
          />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            Активно
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-card-green text-white rounded-card hover:bg-card-green/90 disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-text-muted text-white rounded-card hover:bg-text-secondary"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

