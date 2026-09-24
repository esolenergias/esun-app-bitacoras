import React from 'react';
import type { InverterBrand } from '../../types/monitoreo.types';

interface SelectBrandProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: InverterBrand | '';
  onChange: (value: InverterBrand) => void;
  className?: string;
}

export const SelectBrand: React.FC<SelectBrandProps> = ({ value, onChange, className = '', ...props }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as InverterBrand)}
      className={`w-full bg-dark-1 border border-dark-4 rounded-xl px-4 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent text-sm transition-all shadow-sm ${className}`}
      {...props}
    >
      <option value="" disabled>Seleccionar Marca</option>
      <option value="Huawei">Huawei (FusionSolar)</option>
      <option value="Growatt">Growatt (OpenAPI)</option>
      <option value="Hoymiles">Hoymiles (Miles API)</option>
    </select>
  );
};
