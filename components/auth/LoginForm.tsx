
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State for field-specific errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  // State for general API errors
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    
    // Validation
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Adresa de email este obligatorie.';
    if (!password) errors.password = 'Parola este obligatorie.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password });
    
    if (result) {
      setGeneralError(result);
      // We do not set fieldErrors here anymore, per request to only show the banner
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bine ai revenit</h1>
        <p className="text-gray-500 mt-2">Autentifică-te în contul USV Events</p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Fake hidden inputs to trick Chrome autofill */}
        <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex={-1} />

        <Input
          label="Email Instituțional"
          type="email"
          name="usv-email-login" 
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if(fieldErrors.email) setFieldErrors(prev => ({...prev, email: undefined}));
            if(generalError) setGeneralError(null);
          }}
          placeholder="student@usv.ro"
          error={fieldErrors.email}
          autoComplete="off"
        />
        
        <Input
          label="Parolă"
          type="password"
          name="usv-password-login"
          value={password}
          onChange={(e) => {
             setPassword(e.target.value);
             if(fieldErrors.password) setFieldErrors(prev => ({...prev, password: undefined}));
             if(generalError) setGeneralError(null);
          }}
          placeholder="••••••••"
          error={fieldErrors.password}
          autoComplete="new-password"
        />

        {generalError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
               {generalError}
            </div>
        )}

        <div className="flex justify-end mb-6">
          <button 
            type="button" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
            onClick={() => alert("Funcționalitatea de resetare parolă va fi implementată curând.")}
          >
            Ai uitat parola?
          </button>
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full py-3 text-lg shadow-lg shadow-indigo-500/30">
          Autentificare
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
        Nu ai un cont încă?{' '}
        <button 
          onClick={onSwitchToRegister} 
          className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1"
        >
          Creează cont
        </button>
      </div>
    </div>
  );
};
