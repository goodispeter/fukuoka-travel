import { computed } from 'vue'
import itinerary from '../data/itinerary.json'

export function useItinerary() {
  const trip = itinerary.trip
  const days = itinerary.days
  const packingList = itinerary.packingList
  const info = itinerary.info

  const marathonDate = trip.marathonDate

  function getDayByNum(dayNum) {
    return days.find(d => d.dayNum === Number(dayNum))
  }

  function isMarathonDay(dayNum) {
    const day = getDayByNum(dayNum)
    return day?.theme === 'marathon'
  }

  const daysUntilTrip = computed(() => {
    const now = new Date()
    const start = new Date(trip.startDate)
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  })

  const daysUntilMarathon = computed(() => {
    const now = new Date()
    const marathon = new Date(marathonDate)
    const diff = Math.ceil((marathon - now) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  })

  function getCategoryColor(category) {
    const map = {
      transport: 'var(--accent-transport)',
      food: 'var(--accent-food)',
      culture: 'var(--accent-culture)',
      rest: 'var(--accent-rest)',
      shopping: 'var(--accent-shopping)',
      marathon: 'var(--accent-primary)',
    }
    return map[category] || 'var(--text-secondary)'
  }

  function getCategorySoftColor(category) {
    const map = {
      transport: 'var(--accent-transport-soft)',
      food: 'var(--accent-food-soft)',
      culture: 'var(--accent-culture-soft)',
      rest: 'var(--accent-rest-soft)',
      shopping: 'var(--accent-shopping-soft)',
      marathon: 'var(--accent-primary-soft)',
    }
    return map[category] || 'var(--border-subtle)'
  }

  return {
    trip,
    days,
    packingList,
    info,
    marathonDate,
    getDayByNum,
    isMarathonDay,
    daysUntilTrip,
    daysUntilMarathon,
    getCategoryColor,
    getCategorySoftColor,
  }
}
