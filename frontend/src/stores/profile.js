// src/stores/profile.js
import { defineStore } from 'pinia'

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
            const payload = {
                basic: this.basic,
                start: this.start,
                middle: {
                    ...this.middle,
                    gas: (this.middle.min || this.middle.off || this.middle.f_off) ? null : this.middle.gas
                },
                crack: {
                    ...this.crack,
                    gas: (this.crack.min || this.crack.off || this.crack.f_off) ? null : this.crack.gas
                },
                end: this.end
            }
            const res = await fetch('http://localhost:3000/entry/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || 'Failed to save profile')
            }
            // Optionally clear state on success:
            // this.$reset()
        }
    },
    persist: {
        // auto–persist *all* of our state to localStorage under "pinia"
        enabled: true,
        strategies: [
            { storage: localStorage }
        ]
    }
})
