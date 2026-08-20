// Shared date-system facade.
window.GameSystems=window.GameSystems||{};
window.GameSystems.date={
 render(){return typeof renderDateEvent==='function'?renderDateEvent():undefined}
};
