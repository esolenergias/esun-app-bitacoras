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
      className={`border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
      {...props}
    >
      <option value="" disabled>Seleccionar Marca</option>
      <option value="Huawei">Huawei</option>
      <option value="Growatt">Growatt</option>
      <option value="Hoymiles">Hoymiles</option>
    </select>
  );
};
