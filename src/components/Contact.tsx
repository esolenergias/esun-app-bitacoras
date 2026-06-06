import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Mail, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  name: string;
  company: string;
  email: string;
  interest: string;
  message: string;
}

const INTERESTS_OPTIONS = [
  'Anteproyecto Solar 3D',
  'Paneles Solares',
  'Inversores / Microinversores',
  'Estructura de Aluminio',
  'Cable Solar y Accesorios',
  'Baterías',
  'Kit Solar Completo',
  'Otro'
];

export function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    email: '',
    interest: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.name.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!formData.interest) {
      setError('Por favor, selecciona un interés.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API request delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: '',
        company: '',
        email: '',
        interest: '',
        message: ''
      });
    }, 1200);
  };

  return (
    <section id="contacto" className="relative py-28 px-6 lg:px-12 bg-dark-2 topo-bg">
      {/* Backlight spots */}
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Side: Contact Information & Visuals (Spans 5 columns) */}
          <div className="lg:col-span-5 space-y-10">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-gold/25 bg-gold-muted text-gold-light mb-4">
                Canales de Atención
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-cream tracking-tight mb-6">
                Iniciemos tu
                <br />
                <span className="shimmer-text font-black italic">Proyecto Solar</span>
              </h2>
              <p className="font-body text-cream-muted text-sm md:text-base leading-relaxed tracking-wide">
                Cotiza un anteproyecto, solicita precios especiales de componentes o resuelve dudas de ingeniería. Respondemos en menos de 24 horas.
              </p>
            </div>

            {/* Quick coordinates */}
            <div className="space-y-6">
              {/* WhatsApp / Phone */}
              <a
                href="https://wa.me/5213300000000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-5 p-5 rounded-xl border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-1/80 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-dark-1 transition-all duration-300">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                    WhatsApp / Teléfono
                  </h4>
                  <p className="text-sm font-bold text-cream font-mono mt-0.5 group-hover:text-gold-light transition-colors">
                    +52 (33) 0000-0000
                  </p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:ventas@esolenergias.com"
                className="flex items-center gap-5 p-5 rounded-xl border border-dark-4 bg-dark-1 hover:border-gold/30 hover:bg-dark-1/80 group transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-dark-1 transition-all duration-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                    Correo Electrónico
                  </h4>
                  <p className="text-sm font-bold text-cream font-mono mt-0.5 group-hover:text-gold-light transition-colors">
                    ventas@esolenergias.com
                  </p>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-center gap-5 p-5 rounded-xl border border-dark-4 bg-dark-1">
                <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-mono tracking-widest text-cream-dim">
                    Ubicación Principal
                  </h4>
                  <p className="text-sm font-bold text-cream font-mono mt-0.5">
                    Guadalajara, Jalisco, México
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form (Spans 7 columns) */}
          <div className="lg:col-span-7 relative">
            <div className="rounded-2xl border border-dark-4 bg-dark-1 p-8 md:p-10 shadow-2xl relative overflow-hidden">
              
              {/* Form container grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(240,239,232,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(240,239,232,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="contact-form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative z-10 space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest text-cream-muted">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Tu nombre completo"
                          className="px-4 py-3 bg-dark-2 border border-dark-4 rounded-xl text-sm text-cream focus:outline-none focus:border-gold placeholder:text-cream-dim/60 transition-colors"
                        />
                      </div>

                      {/* Company */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="company" className="text-[10px] uppercase font-bold tracking-widest text-cream-muted">
                          Empresa
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Nombre de tu empresa (Opcional)"
                          className="px-4 py-3 bg-dark-2 border border-dark-4 rounded-xl text-sm text-cream focus:outline-none focus:border-gold placeholder:text-cream-dim/60 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-cream-muted">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="tucorreo@empresa.com"
                          className="px-4 py-3 bg-dark-2 border border-dark-4 rounded-xl text-sm text-cream focus:outline-none focus:border-gold placeholder:text-cream-dim/60 transition-colors"
                        />
                      </div>

                      {/* Interest dropdown */}
                      <div className="flex flex-col gap-2">
                        <label htmlFor="interest" className="text-[10px] uppercase font-bold tracking-widest text-cream-muted">
                          Interés Principal *
                        </label>
                        <div className="relative">
                          <select
                            id="interest"
                            name="interest"
                            value={formData.interest}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-dark-2 border border-dark-4 rounded-xl text-sm text-cream focus:outline-none focus:border-gold appearance-none transition-colors"
                          >
                            <option value="">Selecciona una opción</option>
                            {INTERESTS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-dark-1">
                                {opt}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cream-dim">
                            ▼
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-2">
                      <label htmlFor="message" className="text-[10px] uppercase font-bold tracking-widest text-cream-muted">
                        Mensaje
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe las especificaciones de tu proyecto o los componentes que requieres..."
                        className="px-4 py-3 bg-dark-2 border border-dark-4 rounded-xl text-sm text-cream focus:outline-none focus:border-gold placeholder:text-cream-dim/60 transition-colors resize-none"
                      />
                    </div>

                    {/* Feedback messages */}
                    {error && (
                      <div className="flex items-center gap-2 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-none" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center gap-2.5 py-4 rounded-xl bg-gradient-to-r from-gold to-gold-light text-dark-1 text-xs font-black uppercase tracking-widest hover:shadow-xl hover:shadow-gold/20 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 fill-dark-1" />
                      {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-message"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    className="relative z-10 py-16 text-center flex flex-col items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-2xl text-cream mb-4">
                      ¡Mensaje Enviado con Éxito!
                    </h3>
                    <p className="text-sm text-cream-muted max-w-md mx-auto leading-relaxed mb-8">
                      Agradecemos tu interés en eSol Energías. Un ingeniero de nuestro equipo revisará tus requerimientos y se pondrá en contacto contigo en menos de 24 horas.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cream/20 text-xs font-black uppercase tracking-widest text-cream hover:bg-cream/5 transition-colors"
                    >
                      Enviar otro mensaje
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
