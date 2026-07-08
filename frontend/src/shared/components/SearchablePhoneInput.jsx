import React, { useState, useRef, useEffect } from 'react';
import { FiPhone, FiChevronDown, FiSearch } from 'react-icons/fi';

export const COUNTRIES = [
  { name: 'US', code: '+1' },
  { name: 'CANADA', code: '+1' },
  { name: 'UK', code: '+44' },
  { name: 'AUSTRALIA', code: '+61' },
  { name: 'SINGAPORE', code: '+65' },
  { name: 'DUBAI', code: '+971' },
  { name: 'INDIA', code: '+91' },
];

const SearchablePhoneInput = ({ value, onChange, name, placeholder, className = "", required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value) {
      const match = COUNTRIES.find(c => value.startsWith(c.code));
      if (match) {
        setSelectedCountry(match);
        setPhoneNumber(value.substring(match.code.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    triggerChange(country.code, phoneNumber);
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value;
    setPhoneNumber(newPhone);
    triggerChange(selectedCountry.code, newPhone);
  };

  const triggerChange = (code, phone) => {
    if (onChange) {
      // Mock event object structure expected by most standard onChange handlers
      onChange({
        target: {
          name,
          value: `${code} ${phone}`
        }
      });
    }
  };

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.includes(search)
  );

  return (
    <div className={`relative flex items-center bg-white border-2 border-gray-200 rounded-xl focus-within:border-primary-500 transition-colors ${className}`}>
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 pl-4 pr-2 py-3 text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <FiPhone className="text-gray-400 mr-1" />
          <span className="font-medium text-sm">{selectedCountry.name} ({selectedCountry.code})</span>
          <FiChevronDown className="text-gray-400 text-sm" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search country or code..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredCountries.map((country, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-primary-50 rounded-lg flex justify-between items-center"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span className="font-medium">{country.name}</span>
                  <span className="text-gray-500">{country.code}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-3 py-4 text-sm text-center text-gray-500">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="h-6 w-px bg-gray-200 mx-2"></div>

      <input
        type="tel"
        name={name}
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder || "1234567890"}
        className="w-full pr-4 py-3 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
        required={required}
      />
    </div>
  );
};

export default SearchablePhoneInput;
