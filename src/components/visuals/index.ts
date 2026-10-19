// Shared with campnav-client/src/components/visuals — keep service-art, empty-art,
// request-journey, count-up, hooks and visuals.css in sync between the two apps.
export { ServiceArt, artForType, type ArtKind, type ArtTone, type ArtMotion } from "./service-art"
export { EmptyArt } from "./empty-art"
export { RequestJourney, JourneyBar, journeyStep, type JourneyTimes } from "./request-journey"
export { CountUp } from "./count-up"
export { useSpotlight, useReducedMotion, prefersReducedMotion } from "./hooks"
export { LivePulse } from "./live-pulse"
export { RingGauge } from "./ring-gauge"
