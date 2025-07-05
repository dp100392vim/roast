<template>
  <div v-if="toProfile">
    <div class="flex flex-wrap justify-center items-center gap-2 mt-5 mb-5">
      <div class="divider">
        <h1>Start a new profile</h1>
      </div>

      <select class="select w-40" v-model="store.basic.name">
        <option disabled :value="null">Pick a sort</option>
        <option v-for="name in names" :value="name">
          {{ name }}
        </option>
      </select>

      <svg @click="nameShow = !nameShow" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24">
        <path fill="orange" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
      </svg>
      <select class="select w-40" v-model="store.basic.roast">
        <option disabled :value="null">Pick a roast profile</option>
        <option value="light">Light</option>
        <option selected value="medium">Medium</option>
        <option value="dark">Dark</option>
      </select>
      <input v-if="nameShow" type="text" v-model="store.basic.name" placeholder="Type here sort" class="input w-max" />
      <input type="checkbox" v-model="store.basic.type" checked="checked" class="toggle toggle-info" />
      <div class="w-7">{{ store.basic.type ? 'espresso' : 'filter' }}</div>
    </div>
    <div class="flex flex-wrap justify-center items-center gap-2 mt-5 mb-5">
      <input type="number" pattern="[0-9]*" v-model="store.basic.weather" inputmode="decimal" step="1"
        class="input input-xl input-success w-25" />Weather
      <input type="number" pattern="[0-9]*" v-model="store.basic.weight" inputmode="decimal" step="1"
        class="input input-xl input-success w-25" />Weight
      <input type="number" pattern="[0-9]*" v-model="store.basic.batch" inputmode="decimal" step="1"
        class="input input-xl input-success w-25" />Batch No
    </div>

    <div class="flex justify-center m-5"><button @click="getRecommends()" class="btn btn-success w-60">Get
        recommends</button></div>


    <div class="flex gap-5 justify-center items-center bg-green-100 p-5"> new vlue 
      <input type="number" pattern="[0-9]*" v-model="store.start.exhaust" inputmode="decimal" step="any"
        class="input input-xl input-success w-25" /> {{ store.start.exhaust }}
      <div class="w-7">Exs</div>
      <input type="number" pattern="[0-9]*" v-model="store.start.environment" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Env</div>
    </div>
    <div class="divider">
      <h1>Set:</h1>
    </div>
    <div class="flex gap-5 m-5 justify-center items-center">
      <input type="number" pattern="[0-9]*" v-model="store.start.gas" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />Gas
      HZ {{ store.start.gas }}
      <div class="w-full max-w-xs">
        <input type="range" min="30" max="55" v-model="store.start.hz" class="range range-accent" step="5" />
        <div class="flex justify-between px-2.5 mt-2 text-xs">
          <span>30</span>
          <span>35</span>
          <span>40</span>
          <span>45</span>
          <span>50</span>
          <span>55</span>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap justify-center gap-5 bg-yellow-200 p-5 mt-2">
      <input type="number" pattern="[0-9]*" v-model="store.middle.time" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Trm</div>
      <input type="number" pattern="[0-9]*" v-model="store.middle.exhaust" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Exs</div>
      <input type="number" pattern="[0-9]*" v-model="store.middle.beans" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Cf</div>
      <input type="number" pattern="[0-9]*" v-model="store.middle.environment" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Env</div>
    </div>
    <div class="divider">
      <h1>Set:</h1>
    </div>
    <div class="flex flex-wrap gap-4 m-5 justify-center items-center">
      <input type="number" pattern="[0-9]*" v-model="store.middle.gas" inputmode="decimal" step="0.1"
        :disabled="store.middle.min || store.middle.off || store.middle.f_off"
        class="input input-xl input-success w-25" />Gas,
      HZ
      <div class="w-full max-w-xs">
        <input type="range" min="30" max="55" v-model="store.middle.hz" class="range range-accent" step="5" />
        <div class="flex justify-between px-2.5 mt-2 text-xs">
          <span>30</span>
          <span>35</span>
          <span>40</span>
          <span>45</span>
          <span>50</span>
          <span>55</span>
        </div>
      </div>
      <input type="checkbox" v-model="store.middle.min" class="checkbox checkbox-info" />min
      <input type="checkbox" v-model="store.middle.off" class="checkbox checkbox-info" />off
      <input type="checkbox" v-model="store.middle.f_off" class="checkbox checkbox-info" />f off
    </div>
    <div class="flex flex-wrap justify-center gap-5 bg-yellow-400 p-5 mt-2">
      <input type="number" pattern="[0-9]*" v-model="store.crack.time" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Trm</div>
      <input type="number" pattern="[0-9]*" v-model="store.crack.exhaust" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Exs</div>
      <input type="number" pattern="[0-9]*" v-model="store.crack.beans" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Cf</div>
      <input type="number" pattern="[0-9]*" v-model="store.crack.environment" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Env</div>
    </div>
    <div class="divider">
      <h1>Set:</h1>
    </div>
    <div class="flex flex-wrap gap-4 m-5 justify-center items-center">
      <input type="number" pattern="[0-9]*" v-model="store.crack.gas" inputmode="decimal" step="0.1"
        :disabled="store.crack.min || store.crack.off || store.crack.f_off"
        class="input input-xl input-success w-25" />Gas,
      HZ
      <div class="w-full max-w-xs">
        <input type="range" min="30" max="55" v-model="store.crack.hz" class="range range-accent" step="5" />
        <div class="flex justify-between px-2.5 mt-2 text-xs">
          <span>30</span>
          <span>35</span>
          <span>40</span>
          <span>45</span>
          <span>50</span>
          <span>55</span>
        </div>
      </div>
      <input type="checkbox" v-model="store.crack.min" class="checkbox checkbox-info" />min
      <input type="checkbox" v-model="store.crack.off" class="checkbox checkbox-info" />off
      <input type="checkbox" v-model="store.crack.f_off" class="checkbox checkbox-info" />f off
    </div>
    <div class="flex flex-wrap justify-center gap-5 bg-yellow-500 p-5 mt-2">
      <input type="number" pattern="[0-9]*" v-model="store.end.time" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Trm</div>
      <input type="number" pattern="[0-9]*" v-model="store.end.exhaust" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Exs</div>
      <input type="number" pattern="[0-9]*" v-model="store.end.beans" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Cf</div>
      <input type="number" pattern="[0-9]*" v-model="store.end.environment" inputmode="decimal" step="0.1"
        class="input input-xl input-success w-25" />
      <div class="w-7">Env</div>
    </div>
    <div @click="store.addProfile()" class="flex justify-center m-5"><button class="btn btn-success w-60">Add</button>
    </div>
  </div>
  <EpubReader v-if="toReader" />
  <div class="nav" @click="switchApp()">to Reader</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProfileStore } from '../stores/profile'
import EpubReader from './reader/EpubReader.vue'
const store = useProfileStore()

const toProfile = ref(true)
const toReader = ref(false)

const nameShow = ref(false)
const names = ref('')

const recommends = ref('')

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/entry/names`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    names.value = await response.json()

  } catch (err) {
    console.error(err)
  }
})

const getRecommends = async () => {
  try {
    let type = store.basic.type ? 'espresso' : 'filter'
    const response = await fetch(`${import.meta.env.VITE_API_URL}/entry/recommends?type=${type}&roast=${store.basic.roast}&weight=${store.basic.weight}&batch=${store.basic.batch}&name=${store.basic.name}&weather=${store.basic.weather}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response) recommends.value = await response.json()
    console.log(recommends.value)
  } catch (err) {
    console.error(err)
  }
}
const switchApp = async () => {
  if (toProfile.value) {
    toProfile.value = false
    toReader.value = true
    return
  }
  if (toReader.value) {
    toProfile.value = true
    toReader.value = false
    return
  }


}
</script>