// Shared CG/memory facade.
window.GameSystems=window.GameSystems||{};
window.GameSystems.memory={
 remember(entry){return typeof rememberCG==='function'?rememberCG(entry):undefined}
};
