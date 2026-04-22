/**
 * Groups flat events into location groups based on consecutive `locationGroup` values.
 * Returns an array of LocationGroup objects for use in DayView and MapView.
 */
export function groupEventsByLocation(events) {
  if (!events || events.length === 0) return []

  const groups = []
  let currentGroup = null

  events.forEach((event, index) => {
    const groupName = event.locationGroup || event.location || '未知地點'

    if (currentGroup && currentGroup.name === groupName) {
      // Same group — append event
      currentGroup.events.push({ ...event, _originalIndex: index })
    } else {
      // New group
      currentGroup = {
        name: groupName,
        lat: event.lat ?? null,
        lng: event.lng ?? null,
        events: [{ ...event, _originalIndex: index }],
      }
      groups.push(currentGroup)
    }
  })

  // Compute derived fields
  return groups.map((group, idx) => {
    const firstEvent = group.events[0]
    const lastEvent = group.events[group.events.length - 1]

    // Time range
    const startTime = firstEvent.time
    const endTime = lastEvent.time
    const timeRange = startTime === endTime ? startTime : `${startTime}~${endTime}`

    // Dominant category (most frequent)
    const categoryCounts = {}
    group.events.forEach(e => {
      const cat = e.category || 'other'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })
    const category = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0][0]

    // Transit to next group comes from the last event
    const transitToNext = lastEvent.transitToNext || null
    const distanceToNext = lastEvent.distanceToNext ?? null

    // Use first event with coords as representative point
    const coordEvent = group.events.find(e => e.lat != null && e.lng != null)

    return {
      id: `${group.name}-${idx}`,
      name: group.name,
      lat: coordEvent?.lat ?? null,
      lng: coordEvent?.lng ?? null,
      startTime,
      endTime,
      timeRange,
      events: group.events,
      category,
      transitToNext,
      distanceToNext,
      hasHighlight: group.events.some(e => e.highlight),
    }
  })
}
