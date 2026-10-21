import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { AppHeader } from '../components/AppHeader';
import { BottomNav } from '../components/BottomNav';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    phone: user?.phone || '',
    max_messenger: user?.max_messenger || '',
    telegram: user?.telegram || '',
    whatsapp: user?.whatsapp || '',
    instagram: user?.instagram || '',
    facebook: user?.facebook || '',
    vk: user?.vk || '',
    about_me: user?.about_me || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToUpdate = { ...formData };
      if (dataToUpdate.age === '') {
        dataToUpdate.age = null;
      } else if (dataToUpdate.age) {
        dataToUpdate.age = parseInt(dataToUpdate.age);
      }
      
      await updateProfile(dataToUpdate);
      toast.success('Профиль обновлен!');
    } catch (error) {
      toast.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background pb-24">
      <AppHeader onTitleClick={() => navigate('/groups')} />

      <main className="container mx-auto px-4 py-5 sm:py-8 max-w-2xl">
        <h1 className="mb-5 text-2xl font-bold tracking-tight">Мой профиль</h1>
        <div className="bg-card rounded-xl shadow-lg p-5 sm:p-6 border border-border/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ваше имя"
                autoComplete="name"
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Возраст</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="25"
                  autoComplete="off"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Пол</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  autoComplete="sex"
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Не указывать</option>
                  <option value="Мужской">Мужской</option>
                  <option value="Женский">Женский</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                autoComplete="tel"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_messenger">Max</Label>
              <Input
                id="max_messenger"
                name="max_messenger"
                value={formData.max_messenger}
                onChange={handleChange}
                placeholder="Ссылка-приглашение Max"
                autoComplete="off"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                name="telegram"
                value={formData.telegram}
                onChange={handleChange}
                placeholder="@username"
                autoComplete="off"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
                autoComplete="tel"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@username или ссылка"
                autoComplete="off"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="Профиль или ссылка"
                autoComplete="off"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vk">ВК</Label>
              <Input
                id="vk"
                name="vk"
                value={formData.vk}
                onChange={handleChange}
                placeholder="Профиль или ссылка"
                autoComplete="off"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about_me">О себе</Label>
              <Textarea
                id="about_me"
                name="about_me"
                value={formData.about_me}
                onChange={handleChange}
                placeholder="Расскажите о себе..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
