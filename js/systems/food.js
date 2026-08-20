// Shared food-system facade.
// Core calculations remain behavior-compatible with v36; character overrides can move here incrementally.
window.GameSystems=window.GameSystems||{};
window.GameSystems.food={
 acceptance(c,offer){return typeof foodAcceptanceChance==='function'?foodAcceptanceChance(c,offer):50},
 offer(c,offer){return typeof resolveFoodOffer==='function'?resolveFoodOffer(offer):null}
};
