// Shared restraint-system facade.
window.GameSystems=window.GameSystems||{};
window.GameSystems.restraint={
 decay(){return typeof decayRestraintOverTime==='function'?decayRestraintOverTime():undefined},
 event(){return typeof startRestraintEvent==='function'?startRestraintEvent():undefined}
};
