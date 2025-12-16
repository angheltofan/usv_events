
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { facultyService } from '../../services/facultyService';
import { Faculty } from '../../types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    facultyId: '',
  });
  
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadFaculties = async () => {
        const res = await facultyService.getAllFaculties();
        if(res.success && res.data) setFaculties(res.data);
    };
    loadFaculties();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'Prenumele este obligatoriu.';
    if (!formData.lastName.trim()) errors.lastName = 'Numele este obligatoriu.';
    if (!formData.email.trim()) errors.email = 'Email-ul este obligatoriu.';
    if (!formData.password) errors.password = 'Parola este obligatorie.';
    if (!formData.confirmPassword) errors.confirmPassword = 'Confirmarea parolei este obligatorie.';
    
    if (formData.password && formData.password.length < 8) {
        errors.password = 'Parola trebuie să aibă minim 8 caractere.';
    }
    
    if (formData.password && !/[A-Z]/.test(formData.password)) {
        errors.password = 'Parola trebuie să conțină cel puțin o majusculă.';
    }

    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Parolele nu coincid.';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() ? formData.phone.trim() : undefined,
        facultyId: formData.facultyId ? formData.facultyId : undefined,
    };

    const result = await register(payload);
    if (result) {
      setGeneralError(result);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-lg bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20 my-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Creează Cont</h1>
        <p className="text-gray-500 mt-2">Alătură-te comunității USV Events</p>
      </div>

      {generalError && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-200 text-red-700 rounded-xl text-sm flex items-start shadow-sm">
           <span className="mr-2 text-lg">⚠️</span>
           <span className="mt-0.5 font-medium">{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-1" autoComplete="off">
        {/* Anti-autofill dummy inputs */}
        <input type="text" style={{display:'none'}} />
        <input type="password" style={{display:'none'}} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Prenume"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Ion"
              error={fieldErrors.firstName}
              autoComplete="off"
            />
            <Input
              label="Nume"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Popescu"
              error={fieldErrors.lastName}
              autoComplete="off"
            />
        </div>

        <Input
          label="Email Instituțional"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="student@usv.ro"
          error={fieldErrors.email}
          autoComplete="off"
        />

        <Input
          label="Telefon (Opțional)"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+40..."
          autoComplete="off"
        />
        
        <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Facultate (Opțional)</label>
            <select
                name="facultyId"
                value={formData.facultyId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
                <option value="">Alege facultatea...</option>
                {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-500">Selectează facultatea la care ești înscris.</p>
        </div>

        <div className="pt-2">
            <Input
              label="Parolă"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 8 caractere"
              error={fieldErrors.password}
              helperText="Minim 8 caractere și o literă mare."
              autoComplete="new-password"
            />
        </div>

        <Input
          label="Confirmă Parola"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Reintrodu parola"
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" isLoading={isSubmitting} className="mt-6 w-full py-3 text-lg shadow-lg shadow-indigo-500/30">
          Înregistrare
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
        Ai deja un cont?{' '}
        <button 
          onClick={onSwitchToLogin} 
          className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1"
        >
          Autentifică-te aici
        </button>
      </div>
    </div>
  );
};
