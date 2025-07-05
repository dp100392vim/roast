// src/stores/profile.js
import { defineStore } from 'pinia'

// Helper function to convert comma-formatted strings to numbers
const convert = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  
  // Handle both comma and dot formats
  const numericString = String(value)
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '');
  
  const num = parseFloat(numericString);
  return isNaN(num) ? null : num;
};

export const useProfileStore = defineStore('profile', {
  state: () => ({
    basic: { type: '', weather: '', weight: '', batch: '', name: '', roast: '' },
    start: { exhaust: '', environment: '', gas: '', hz: '' },
    middle: { time: '', exhaust: '', beans: '', environment: '', gas: '', min: false, off: false, f_off: false, hz: '' },
    crack: { time: '', exhaust: '', beans: '', environment: '', gas: '', min: false, off: false, f_off: false, hz: '' },
    end: { time: '', exhaust: '', beans: '', environment: '' },
  }),
  actions: {
    async addProfile() {
      // Create a clean payload with converted numbers
      const payload = {
        basic: {...this.basic},
        start: {
          exhaust: convert(this.start.exhaust),
          environment: convert(this.start.environment),
          gas: convert(this.start.gas),
          hz: convert(this.start.hz),
        },
        middle: {
          time: this.middle.time,
          exhaust: convert(this.middle.exhaust),
          beans: convert(this.middle.beans),
          environment: convert(this.middle.environment),
          gas: (this.middle.min || this.middle.off || this.middle.f_off) 
                ? null 
                : convert(this.middle.gas),
          min: this.middle.min,
          off: this.middle.off,
          f_off: this.middle.f_off,
          hz: convert(this.middle.hz),
        },
        crack: {
          time: this.crack.time,
          exhaust: convert(this.crack.exhaust),
          beans: convert(this.crack.beans),
          environment: convert(this.crack.environment),
          gas: (this.crack.min || this.crack.off || this.crack.f_off) 
                ? null 
                : convert(this.crack.gas),
          min: this.crack.min,
          off: this.crack.off,
          f_off: this.crack.f_off,
          hz: convert(this.crack.hz),
        },
        end: {
          time: this.end.time,
          exhaust: convert(this.end.exhaust),
          beans: convert(this.end.beans),
          environment: convert(this.end.environment),
        }
      };

      console.log('API Payload:', payload);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/entry/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save profile');
      }
    }
  },
  persist: {
    enabled: true,
    strategies: [
      { storage: localStorage }
    ]
  }
});