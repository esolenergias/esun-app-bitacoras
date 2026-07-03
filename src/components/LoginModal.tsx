import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, User, Lock, Shield, CheckCircle, AlertTriangle, Check, Key, Mail, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const {
    currentUser,
    verificationPendingEmail,
    login,
    register,
    verifyCode,
    loginWithGoogle
  } = useApp();

  // Auth fields
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // If user somehow logs in, close modal
  useEffect(() => {
    if (currentUser) {
      onClose();
    }
  }, [currentUser, onClose]);

  if (!isOpen) return null;

  // Handle Login submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!emailInput) {
      setAuthError('Por favor introduce tu correo electrónico.');
      return;
    }

    if (isRegistering) {
      if (!nameInput) {
        setAuthError('Por favor introduce tu nombre.');
        return;
      }
      try {
        await register(emailInput, nameInput);
        setAuthSuccess(`Hemos enviado un código a tu correo. Por favor revísalo.`);
      } catch (err) {
        setAuthError('Error al registrar usuario.');
      }
    } else {
      try {
        await login(emailInput);
        setAuthSuccess('¡Sesión iniciada con éxito!');
      } catch (err) {
        setAuthError('Error al iniciar sesión.');
      }
    }
  };

  // Handle Verification Code verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!codeInput) {
      setAuthError('Por favor introduce el código.');
      return;
    }
    const success = await verifyCode(codeInput);
    if (success) {
      setAuthSuccess('¡Correo verificado con éxito! Bienvenido.');
      setCodeInput('');
    } else {
      setAuthError('Código incorrecto. Revisa de nuevo.');
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setAuthError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión con Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      {/* Ambient blurred solar background shapes inside modal view */}
      <div className="absolute top-1/4 left-1/4 w-[20vw] h-[20vw] rounded-full bg-gold/5 blur-[80px] pointer-events-none -z-10" />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-4xl bg-dark-2 border border-dark-4 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full border border-dark-4 bg-dark-1/80 hover:bg-dark-3 text-cream-dim hover:text-gold transition-all cursor-pointer z-50"
          aria-label="Cerrar portal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Brand Message & Quick Access */}
        <div className="w-full md:w-5/12 p-8 lg:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dark-4 bg-dark-1/45 backdrop-blur-sm select-none">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-gold/10 text-gold rounded-lg border border-gold/25 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 stroke-[1.8]" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gold">
                Ecosistema Digital eSol
              </span>
            </div>
            
            <h3 className="font-display font-bold text-2xl lg:text-3xl text-cream tracking-tight leading-tight">
              Portal de<br />
              <span className="shimmer-text font-black">Operaciones eSol</span>
            </h3>
            
            <p className="text-xs text-cream-muted leading-relaxed font-body">
              Ingresa para administrar los anteproyectos interactivos 3D, verificar el stock del catálogo B2B en tiempo real, lanzar simulaciones de agentes autónomos y afinar los motores de SEO.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-cream-muted">
                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 stroke-[2.5]" />
                <span>Monitoreo de proyectos.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-cream-muted">
                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 stroke-[2.5]" />
                <span>Lanzador de Agentes IA Pro.</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-cream-muted">
                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 stroke-[2.5]" />
                <span>Acceso exclusivo B2B.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Form */}
        <div className="w-full md:w-7/12 p-8 lg:p-12 flex items-center justify-center bg-dark-1">
          <div className="w-full max-w-sm relative">
            {/* Error & Success Alerts */}
            {authError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-[11px] text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 stroke-[2]" />
                <span className="font-body leading-normal">{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="mb-4 p-3 rounded-xl border border-green-500/20 bg-green-500/5 text-[11px] text-green-400 flex items-start gap-2">
                <Check className="w-4 h-4 flex-shrink-0 stroke-[2]" />
                <span className="font-body leading-normal">{authSuccess}</span>
              </div>
            )}

            {/* Verification Form */}
            {verificationPendingEmail ? (
              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <h4 className="font-display font-bold text-lg text-cream">
                    Verifica tu correo
                  </h4>
                  <p className="text-[11px] text-cream-muted leading-relaxed font-body">
                    Hemos enviado un código de acceso único a <strong>{verificationPendingEmail}</strong>.
                  </p>
                  
                  {/* Real OTP code check instruction */}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-verify-code" className="text-[9px] text-cream-muted uppercase font-bold tracking-widest">
                    Código de 6 dígitos
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-dim" />
                    <input
                      id="modal-verify-code"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-dark-2 border border-dark-4 focus:border-gold/50 rounded-xl text-cream text-center font-mono tracking-widest text-base focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-light hover:shadow-lg hover:shadow-gold/10 text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verificar y Entrar</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setEmailInput('')}
                  className="w-full text-center text-[10px] text-cream-muted hover:text-cream transition-colors font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cambiar Correo
                </button>
              </form>
            ) : (
              // Login/Register Form
              <form onSubmit={handleAuthSubmit} className="space-y-5">
                <div className="flex gap-4 border-b border-dark-4 pb-1.5 mb-3 select-none">
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setAuthError(''); }}
                    className={`text-xs font-black uppercase tracking-wider pb-1.5 relative transition-all cursor-pointer ${
                      !isRegistering ? 'text-gold' : 'text-cream-dim hover:text-cream-muted'
                    }`}
                  >
                    Iniciar Sesión
                    {!isRegistering && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(true); setAuthError(''); }}
                    className={`text-xs font-black uppercase tracking-wider pb-1.5 relative transition-all cursor-pointer ${
                      isRegistering ? 'text-gold' : 'text-cream-dim hover:text-cream-muted'
                    }`}
                  >
                    Registrarse
                    {isRegistering && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold" />}
                  </button>
                </div>

                <div className="space-y-3">
                  {isRegistering && (
                    <div className="space-y-1">
                      <label htmlFor="modal-reg-name" className="text-[9px] text-cream-muted uppercase font-bold tracking-widest">
                        Nombre Completo
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-dim" />
                        <input
                          id="modal-reg-name"
                          type="text"
                          placeholder="Ej. Juan Pérez"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 bg-dark-2 border border-dark-4 focus:border-gold/50 rounded-xl text-xs text-cream placeholder-cream-dim focus:outline-none transition-colors font-body"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="modal-auth-email" className="text-[9px] text-cream-muted uppercase font-bold tracking-widest">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-dim" />
                      <input
                        id="modal-auth-email"
                        type="email"
                        placeholder="ejemplo@esolenergias.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-dark-2 border border-dark-4 focus:border-gold/50 rounded-xl text-xs text-cream placeholder-cream-dim focus:outline-none transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[9px] text-cream-dim font-body leading-normal pt-0.5">
                      Nota: Emails con <strong>"master"</strong> o <strong>menyfre@gmail.com</strong> son Master. Emails con <strong>"admin"</strong> son Admin.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-gold to-gold-light hover:shadow-lg hover:shadow-gold/15 text-dark-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isRegistering ? 'Crear Cuenta' : 'Solicitar Código'}</span>
                </button>

                <div className="relative flex py-1 items-center select-none">
                  <div className="flex-grow border-t border-dark-4"></div>
                  <span className="flex-shrink mx-3 text-[8.5px] text-cream-dim uppercase font-bold tracking-wider">O también</span>
                  <div className="flex-grow border-t border-dark-4"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full py-2.5 bg-dark-2 hover:bg-dark-3 border border-dark-4 hover:border-cream/20 text-cream rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {googleLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.13 1.13 2.97 1.14.76 2.37 2.1 3.49 2.97 2.24-2.07 3.52-5.11 3.52-8.79z"/>
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.49-2.97c-.96.65-2.23 1.05-3.69 1.05-2.84 0-5.25-1.92-6.11-4.51H1.05v3.1A11.99 11.99 0 0012 24z"/>
                        <path fill="#FBBC05" d="M5.89 14.66a7.17 7.17 0 010-4.57V7.05H1.05a11.99 11.99 0 000 9.87l4.84-3.11z"/>
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.22 0 12 0 7.33 0 3.29 2.69 1.05 6.64l4.84 3.11c.86-2.59 3.27-4.51 6.11-4.51z"/>
                      </svg>
                      <span>Acceder con Google</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
